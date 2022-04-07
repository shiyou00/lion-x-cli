'use strict';
const log = require("@lion-x/log");
const Command = require("@lion-x/command");
const fs = require("fs");

class initCommand extends Command{
    init(){
        this.projectName = this._argv[0] || '';
        this.force = !!this._cmd.force;
        log.verbose('projectName', this.projectName);
        log.verbose('force', this.force);
    }
    exec() {
        try {
            this.prepare();
        }catch (e) {
            log.error(e.message);
        }
    }
    prepare(){
        const localPath = process.cwd();
        if(!this.isDirEmpty(localPath)){
            // 文件不为空时进入，判断是否强制更新逻辑
            console.log(localPath,"不为空");
        }
    }
    isDirEmpty(localPath){
        let fileList = fs.readdirSync(localPath);
        // 文件过滤的逻辑
        fileList = fileList.filter(file => (
            !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
        ));
        return !fileList || fileList.length <= 0;
    }
}
function init(argv){
    new initCommand(argv);
}

module.exports = init;
module.exports.initCommand=initCommand;