'use strict';
const colors = require("colors/safe"); // 控制台输出有颜色
const semver = require("semver"); // semver 版本控制比较
const { LOWEST_NODE_VERSION, DEFAULT_CLI_HOME } = require("./consts");
const userHome = require('user-home');
const pathExists = require('path-exists').sync;

const pkg = require("../package.json");
const log = require("@lion-x/log")
const path = require("path");
let args;

async function core() {
    try{
        checkPkgVersion();
        checkNodeVersion();
        checkRoot();
        checkUserHome();
        checkIsDebug();
        checkEnv();
        await checkGlobalUpdate();
    }catch (e){
        log.error(e.message);
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

function checkIsDebug(){
    const minimist = require("minimist");
    args = minimist(process.argv.slice(2));
    if (args.debug) {
        process.env.LOG_LEVEL = 'verbose';
    } else {
        process.env.LOG_LEVEL = 'info';
    }
    log.level = process.env.LOG_LEVEL;
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