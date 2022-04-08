module.exports = function() {
  return new Promise((resolve, reject)=>{
    const dataSource = [{
      name:"react 标准模板",
      npmName:"lion-x-cli-template-react",
      version: "1.0.0"
    }];
    resolve(dataSource);
  })
};
