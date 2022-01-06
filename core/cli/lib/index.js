'use strict';
const path = require("path");

const colors = require("colors/safe"); // 控制台输出有颜色
const semver = require("semver"); // semver 版本控制比较
const userHome = require('user-home');
const pathExists = require('path-exists').sync;
const commander = require('commander');

const pkg = require("../package.json");
const { LOWEST_NODE_VERSION, DEFAULT_CLI_HOME } = require("./consts");

const log = require("@lion-x/log");
const init = require("@lion-x/init");

const program = new commander.Command();

async function core() {
    try{
        await prepare();
        registerCommand();
    }catch (e){
        log.error(e.message);
    }
}

async function prepare() {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
    checkUserHome();
    checkEnv();
    await checkGlobalUpdate();
}

function registerCommand(){
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .version(pkg.version)
        .option('-d, --debug', '是否开启调试模式', false)
        .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '');
    program
        .command('init [projectName]')
        .option('-f,--force','是否强制更新项目')
        .action(init)

    // 开启debug模式
    program.on('option:debug',function(){
        if(program.opts().debug){
            process.env.LOG_LEVEL='verbose'
        }else{
            process.env.LOG_LEVEL='info'
        }
        log.level = process.env.LOG_LEVEL
    })

    // 指定targetPath
    program.on('option:targetPath', function() {
        process.env.CLI_TARGET_PATH = program.targetPath;
    });

    // 对未知命令监听
    program.on('command:*',function(obj){
        const availableCommands = program.commands.map(cmd => cmd.name())
        console.log(colors.red('未知的命令：'+obj[0]))
        if(availableCommands.length > 0){
            console.log(colors.red('可用命令为：'+availableCommands.join(',')))
        }
    })

    program.parse(program.argv)

    if(program.args && program.args.length < 1) {
        program.outputHelp();
        console.log()
    }
}

async function checkGlobalUpdate() {
    const currentVersion = pkg.version;
    const npmName = pkg.name;
    const { getNpmSemverVersion } = require('@lion-x/get-npm-info');
    const lastVersion = await getNpmSemverVersion(currentVersion, npmName);
    if (lastVersion && semver.gt(lastVersion, currentVersion)) {
        log.warn(colors.yellow(`请手动更新 ${npmName}，当前版本：${currentVersion}，最新版本：${lastVersion}
                更新命令： npm install -g ${npmName}`));
    }
}

function checkEnv() {
    const dotenv = require('dotenv');
    const dotenvPath = path.resolve(userHome, '.env'); // dotenvPath = /Users/shiyou/.env
    // 如果文件存在，dotenv会去读取.env文件，之后可以通过process.env直接访问
    if (pathExists(dotenvPath)) {
        dotenv.config({
            path: dotenvPath,
        });
    }
    createDefaultConfig();
}

function createDefaultConfig() {
    const cliConfig = {
        home: userHome,
    };
    if (process.env.CLI_HOME) {
        cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME);
    } else {
        cliConfig['cliHome'] = path.join(userHome, DEFAULT_CLI_HOME);
    }
    process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

function checkUserHome() {
    if (!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前登录用户主目录不存在！'));
    }
}

function checkPkgVersion(){
    log.info("cli",pkg.version);
}

function checkNodeVersion(){
    const currentVersion = process.version;
    const lowestVersion = LOWEST_NODE_VERSION;
    if(!semver.gte(currentVersion,lowestVersion)){
        throw new Error(colors.red(`lion-x 需要安装v${lowestVersion}以上版本的Node.js`))
    }
}

function checkRoot() {
    const rootCheck = require('root-check');
    rootCheck();
}

module.exports = core;