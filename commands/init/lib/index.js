'use strict';
const log = require("@lion-x/log");

module.exports = init;

function init(...argv) {
    log.verbose('argv', argv);
}
