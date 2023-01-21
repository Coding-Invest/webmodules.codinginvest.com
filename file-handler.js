const fs = require('fs');

function FileHandler() {
  this.read = async function(fileName) {
    return new Promise((resolve, reject) => {
      fs.readFile(fileName, 'utf8', (error, data) => {
        if (error) {
          reject(error);
        }
        resolve(data);
      });
    });
  };

  this.write = async function(fileName, content) {
    return new Promise((resolve, reject) => {
      fs.writeFile(fileName, content, (error) => {
        if (error) {
          reject(error);
        }
        resolve(true);
      });
    });
  };

  this.dir = async function(folderPath) {
    return new Promise((resolve, reject) => {
      const pathNames = [];
      fs.readdir(folderPath, (error, files) => {
        if (error) {
          reject(error);
        }
        files.forEach((file) => {
          pathNames.push(file);
        });
        resolve(pathNames);
      });
    });
  };

  this.makeDirIfNotExists = async function(folderPath){
    return new Promise(async (resolve,reject)=>{
      if(!await fs.existsSync()){
        fs.mkdir(folderPath,()=>{
          resolve(true);
        });
      }
      resolve(false);
    });
  }

  this.deleteDir = async function(folderPath){
    return new Promise(async (resolve,reject)=>{
      fs.rm(folderPath, { recursive: true, force: true },()=>{
        resolve(true);
      }) ;
    });
  }
}

exports.FileHandler = FileHandler;
