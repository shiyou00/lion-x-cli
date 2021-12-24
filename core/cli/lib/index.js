'use strict';
const colors = require("colors/safe"); // 控制台输出有颜色
const semver = require("semver"); // semver 版本控制比较
const { LOWEST_NODE_VERSION } = require("./consts");

const pkg = require("../package.json");
const log = require("@lion-x/log")

function core() {
    try{
        checkPkgVersion();
        checkNodeVersion();
    }catch (e){
        log.error(e.message);
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

module.exports = core;