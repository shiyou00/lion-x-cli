'use strict';
const log = require("@lion-x/log");
const Command = require("@lion-x/command");
const fs = require("fs");
const inquirer = require("inquirer");
const fse = require('fs-extra');

class initCommand extends Command{
    init(){
        this.projectName = this._argv[0] || '';
        this.force = !!this._cmd.force;
        log.verbose('projectName', this.projectName);
        log.verbose('force', this.force);
    }
    async exec() {
        try {
            await this.prepare();
        }catch (e) {
            log.error(e.message);
        }
    }
    async prepare(){
        const localPath = process.cwd();
        if(!this.isDirEmpty(localPath)){
            // 文件不为空时进入，判断是否强制更新逻辑
            let ifContinue = false;
            if (!this.force) {
                // 询问是否继续创建
                ifContinue = (await inquirer.prompt({
                    type: 'confirm',
                    name: 'ifContinue',
                    default: false,
                    message: '当前文件夹不为空，是否继续创建项目？',
                })).ifContinue;
                if (!ifContinue) {
                    return;
                }
            }
            // 2. 是否启动强制更新
            if (ifContinue || this.force) {
                // 给用户做二次确认
                const { confirmDelete } = await inquirer.prompt({
                    type: 'confirm',
                    name: 'confirmDelete',
                    default: false,
                    message: '是否确认清空当前目录下的文件？',
                });
                if (confirmDelete) {
                    // 清空当前目录
                    fse.emptyDirSync(localPath);
                }
            }
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