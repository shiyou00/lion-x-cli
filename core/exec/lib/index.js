'use strict';

const Package = require("@lion-x/package");
const log = require('@lion-x/log');
const path = require("path");

const SETTINGS = {
    init: '@imooc-cli/init',
    publish: '@imooc-cli/publish',
};

const CACHE_DIR = 'dependencies';

async function exec(...args) {
    let targetPath = process.env.CLI_TARGET_PATH;
    const homePath = process.env.CLI_HOME_PATH;
    let storeDir = '';
    let pkg;

    const cmdObj = args[args.length - 1];
    const cmdName = cmdObj.name();
    const packageName = SETTINGS[cmdName];
    const packageVersion = 'latest';
    log.verbose('targetPath', targetPath);
    log.verbose('homePath', homePath);
    log.verbose('packageName', packageName);
    log.verbose('packageVersion', packageVersion);

    if(!targetPath){
        targetPath = path.resolve(homePath, CACHE_DIR); // 生成缓存路径
        storeDir = path.resolve(targetPath, 'node_modules');
        log.verbose('targetPath', targetPath);
        log.verbose('storeDir', storeDir);
        pkg = new Package({
            targetPath,
            storeDir,
            packageName,
            packageVersion,
        });
        if (await pkg.exists()) {
            // 更新package
            await pkg.update();
        } else {
            // 安装package
            await pkg.install();
        }
    }else{
        pkg = new Package({
            targetPath,
            packageName,
            packageVersion,
        });
    }
    const rootFile = pkg.getRootFilePath();
    if (rootFile) {
        // require(rootFile).call(null, Array.from(arguments));
        const args = Array.from(arguments);
        const cmd = args[args.length - 1];
        const o = Object.create(null);
        Object.keys(cmd).forEach(key => {
            if (cmd.hasOwnProperty(key) &&
                !key.startsWith('_') &&
                key !== 'parent') {
                o[key] = cmd[key];
            }
        });
        args[args.length - 1] = o;
        const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;
        const child = spawn('node', ['-e', code], {
            cwd: process.cwd(),
            stdio: 'inherit',
        });
        child.on('error', e => {
            log.error(e.message);
            process.exit(1);
        });
        child.on('exit', e => {
            log.verbose('命令执行成功:' + e);
            process.exit(e);
        });
    }
}

module.exports = exec;