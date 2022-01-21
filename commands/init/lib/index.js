'use strict';
const log = require("@lion-x/log");
const Command = require("@lion-x/command")

class initCommand extends Command{
    init(){
        this.projectName = this._argv[0] || '';
        this.force = !!this._cmd.force;
        log.verbose('projectName', this.projectName);
        log.verbose('force', this.force);
    }
    exec() {

    }
}
function init(argv){
    new initCommand(argv);
}

module.exports = init;
module.exports.initCommand=initCommand;