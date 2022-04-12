module.exports = function() {
  return new Promise((resolve, reject)=>{
    const dataSource = [{
      name:"react 标准模板",
      npmName:"lion-x-cli-template-react",
      version: "1.0.0",
      type: "normal",
      installCommand: "npm install",
      startCommand: "npm run start"
    }];
    resolve(dataSource);
  })
};
