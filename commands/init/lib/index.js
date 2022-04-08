'use strict';
// 系统包
const fs = require("fs");
const path = require('path');
// 第三方安装包
const inquirer = require("inquirer");
const fse = require('fs-extra');
const semver = require('semver');
const userHome = require('user-home');
// lerna 包
const log = require("@lion-x/log");
const Command = require("@lion-x/command");
const Package = require('@lion-x/package');
const { spinnerStart, sleep } = require('@lion-x/utils');
// 相对路径包
const getProjectTemplate = require('./getProjectTemplate');
// 常量
const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';
const TEMPLATE_TYPE_NORMAL = 'normal';
const TEMPLATE_TYPE_CUSTOM = 'custom';
const WHITE_COMMAND = ['npm', 'cnpm'];
const COMPONENT_FILE = '.componentrc';

class initCommand extends Command{
    init(){
        this.projectName = this._argv[0] || '';
        this.force = !!this._cmd.force;
        log.verbose('projectName', this.projectName);
        log.verbose('force', this.force);
    }
    async exec() {
        try {
            const projectInfo = await this.prepare();
            if(projectInfo){
                // 下载模板
                log.verbose('projectInfo', projectInfo);
                this.projectInfo = projectInfo;
                await this.downloadTemplate();
            }
        }catch (e) {
            log.error(e.message);
        }
    }
    async downloadTemplate() {
        const { projectTemplate } = this.projectInfo;
        const templateInfo = this.template.find(item => item.npmName === projectTemplate);
        const targetPath = path.resolve(userHome, '.lion-x-cli', 'template');
        const storeDir = path.resolve(userHome, '.lion-x-cli', 'template', 'node_modules');
        const { npmName, version } = templateInfo;
        this.templateInfo = templateInfo;
        const templateNpm = new Package({
            targetPath,
            storeDir,
            packageName: npmName,
            packageVersion: version,
        });
        if (!await templateNpm.exists()) {
            const spinner = spinnerStart('正在下载模板...');
            await sleep();
            try {
                await templateNpm.install();
            } catch (e) {
                throw e;
            } finally {
                spinner.stop(true);
                if (await templateNpm.exists()) {
                    log.success('下载模板成功');
                    this.templateNpm = templateNpm;
                }
            }
        } else {
            const spinner = spinnerStart('正在更新模板...');
            await sleep();
            try {
                await templateNpm.update();
            } catch (e) {
                throw e;
            } finally {
                spinner.stop(true);
                if (await templateNpm.exists()) {
                    log.success('更新模板成功');
                    this.templateNpm = templateNpm;
                }
            }
        }
    }
    async prepare(){
        // 0. 判断项目模板是否存在
        const template = await getProjectTemplate();
        if (!template || template.length === 0) {
            throw new Error('项目模板不存在');
        }
        this.template = template;
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
        return this.getProjectInfo();
    }
    async getProjectInfo() {
        // 校验输入的项目名称是否正确
        function isValidName(v) {
            return /^(@[a-zA-Z0-9-_]+\/)?[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v);
        }

        let projectInfo = {};
        let isProjectNameValid = false;
        if (isValidName(this.projectName)) {
            isProjectNameValid = true;
            projectInfo.projectName = this.projectName;
        }
        // 1. 选择创建项目或组件
        const { type } = await inquirer.prompt({
            type: 'list',
            name: 'type',
            message: '请选择初始化类型',
            default: TYPE_PROJECT,
            choices: [{
                name: '项目',
                value: TYPE_PROJECT,
            }, {
                name: '组件',
                value: TYPE_COMPONENT,
            }],
        });
        log.verbose('type', type);
        // this.template = this.template.filter(template =>
        //     template.tag.includes(type));
        const title = type === TYPE_PROJECT ? '项目' : '组件';
        const projectNamePrompt = {
            type: 'input',
            name: 'projectName',
            message: `请输入${title}名称`,
            default: '',
            validate: function(v) {
                const done = this.async();
                setTimeout(function() {
                    // 1.首字符必须为英文字符
                    // 2.尾字符必须为英文或数字，不能为字符
                    // 3.字符仅允许"-_"
                    if (!isValidName(v)) {
                        done(`请输入合法的${title}名称`);
                        return;
                    }
                    done(null, true);
                }, 0);
            },
            filter: function(v) {
                return v;
            },
        };
        const projectPrompt = [];
        if (!isProjectNameValid) {
            projectPrompt.push(projectNamePrompt);
        }
        projectPrompt.push({
                type: 'input',
                name: 'projectVersion',
                message: `请输入${title}版本号`,
                default: '1.0.0',
                validate: function(v) {
                    const done = this.async();
                    setTimeout(function() {
                        if (!(!!semver.valid(v))) {
                            done('请输入合法的版本号');
                            return;
                        }
                        done(null, true);
                    }, 0);
                },
                filter: function(v) {
                    if (!!semver.valid(v)) {
                        return semver.valid(v);
                    } else {
                        return v;
                    }
                },
            },
            {
                type: 'list',
                name: 'projectTemplate',
                message: `请选择${title}模板`,
                choices: this.createTemplateChoice(),
            });
        if (type === TYPE_PROJECT) {
            // 2. 获取项目的基本信息
            const project = await inquirer.prompt(projectPrompt);
            projectInfo = {
                ...projectInfo,
                type,
                ...project,
            };
        } else if (type === TYPE_COMPONENT) {
            const descriptionPrompt = {
                type: 'input',
                name: 'componentDescription',
                message: '请输入组件描述信息',
                default: '',
                validate: function(v) {
                    const done = this.async();
                    setTimeout(function() {
                        if (!v) {
                            done('请输入组件描述信息');
                            return;
                        }
                        done(null, true);
                    }, 0);
                },
            };
            projectPrompt.push(descriptionPrompt);
            // 2. 获取组件的基本信息
            const component = await inquirer.prompt(projectPrompt);
            projectInfo = {
                ...projectInfo,
                type,
                ...component,
            };
        }
        // 生成classname
        if (projectInfo.projectName) {
            projectInfo.name = projectInfo.projectName;
            projectInfo.className = require('kebab-case')(projectInfo.projectName).replace(/^-/, '');
        }
        if (projectInfo.projectVersion) {
            projectInfo.version = projectInfo.projectVersion;
        }
        if (projectInfo.componentDescription) {
            projectInfo.description = projectInfo.componentDescription;
        }
        return projectInfo;
    }
    isDirEmpty(localPath){
        let fileList = fs.readdirSync(localPath);
        // 文件过滤的逻辑
        fileList = fileList.filter(file => (
            !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
        ));
        return !fileList || fileList.length <= 0;
    }
    createTemplateChoice() {
        return this.template.map(item => ({
            value: item.npmName,
            name: item.name,
        }));
    }
}
function init(argv){
    new initCommand(argv);
}

module.exports = init;
module.exports.initCommand=initCommand;