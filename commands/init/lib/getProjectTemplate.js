module.exports = function() {
  return new Promise((resolve, reject)=>{
    const dataSource = [{
      name:"react 标准模板",
      npmName:"lion-x-cli-template-react",
      version: "1.0.0",
      type: "normal",
      installCommand: "npm install",
      startCommand: "npm run start",
      tag: ["project"],
      ignore: ["**/public/**"]
    },
      {
        name:"react 自定义模板",
        npmName:"lion-x-cli-template-react2",
        version: "1.0.0",
        type: "custom",
        installCommand: "npm install",
        startCommand: "npm run start",
        tag: ["project"],
        ignore: ["**/public/**"]
      }];
    resolve(dataSource);
  })
};
