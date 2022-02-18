'use strict';

const path = require("path");

function isObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]';
}

function formatPath(p) {
    if (p && typeof p === 'string') {
        const sep = path.sep;
        if (sep === '/') {
            return p;
        } else {
            return p.replace(/\\/g, '/');
        }
    }
    return p;
}


function exec(command, args, options) {
    const win32 = process.platform === 'win32';

    const cmd = win32 ? 'cmd' : command;
    const cmdArgs = win32 ? ['/c'].concat(command, args) : args;

    return require('child_process').spawn(cmd, cmdArgs, options || {});
}

module.exports = {
    isObject,
    formatPath,
    exec
};


