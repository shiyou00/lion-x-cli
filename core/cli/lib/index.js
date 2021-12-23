'use strict';
// require 支持加载.js .json .node
const pkg = require("../package.json");

function core() {
    console.log("checkPkgVersion",checkPkgVersion())
}

function checkPkgVersion(){
    return pkg.version;
}

module.exports = core;