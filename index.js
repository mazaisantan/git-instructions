#!/usr/bin/env node
const { exec } = require('child_process');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

gitInstructions(async answers => {
  switch(answers.git_cmd){
    case 'git init':
      await git.init();
      await git.add();
      await git.configEmail();
      await git.configUserName();
      await git.configSSL();
      await git.commit();
      await git.remotePath();
      await git.push();
      break;
    case 'git push':
      await git.envInit();
      await git.add();
      await git.configSSL();
      await git.commit();
      await git.push();
      break;
    case 'git clone':
      await git.configSSL();
      await git.clone();
      break;
    default:break;
  }
});


async function gitInstructions(cmdSeries){
  await inquirer
    .prompt([
      {
        type: 'list',
        name: 'git_cmd',
        message: 'What do you want to do?press enter to select.',
        choices: [
          'git init',
          'git push',
          'git clone'
        ]
      }
    ])
    .then(cmdSeries);
}


const git = {
  //envInit,删除index.lock,防止更新失败
  envInit:()=>{
    return new Promise((resolve,reject) => {
      let absolutePath = path.resolve(__dirname,'./.git/index.lock')
      exec('del '+absolutePath, (error, stdout, stderr) => {
        if (error) {
          // console.error(`exec error: ${error}`);
          // reject();
          return;
        } 
        resolve();
        console.log(`stdout: ${stdout}`);
      });
    });
  },
  //1.执行git init命令
  init:() => {
    return new Promise((resolve,reject) => {
      exec('git init', (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          reject();
          //return;
        } 
        resolve();
        console.log(`stdout: ${stdout}`);
      });
    });
  },

  //2.执行git add命令
  add:() => {
    return new Promise((resolve,reject) => {
    //读取当前目录有什么文件，便于上传到git上
    fs.readdir('.',(err,files) => {
      UpdateFiles(files);
    });
    function UpdateFiles(files){
      files = files.map(file => {
        return {
          name: file,
          //如果包含node_modules文件夹，则不进行update
          checked:(file  == 'node_modules') ? false : true
        }
      });
  
      inquirer
        .prompt([
          {
            type: 'checkbox',
            message: 'press space bar to unselect the files those you will not update to github\n',
            name: 'updateFiles',
            choices:files,
/*             validate: function(answer) {
              if (answer.length < 1) {
                return 'You must choose at least one name.';
              }
              return true;
            } */
          }
        ])
        .then(answers => {
          //将要Update文件格式化为：文件1 文件2 文件3的格式
          let filesToUpdateStr = '';
          answers.updateFiles.map((item) =>{
            filesToUpdateStr += (' ' + item);
          })
          // console.log(filesToUpdateStr);
          exec('git add' + filesToUpdateStr, (error, stdout, stderr) => {
            if (error) {
              console.error(`exec error: ${error}`);
              reject();
              //return;
            } 
            resolve();
          });
        });
    }
    });
  },

  //3.执行git config命令
  configEmail:() => {
    return new Promise((resolve,reject) => {
      var questions = [
        {
          type: 'input',
          name: 'userNameMessage',
          message: "type your e-mail:"
        }
      ];
      inquirer.prompt(questions).then(answers => {
        exec('git config --global user.email ' + '"' + answers.userNameMessage + '"', (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          } 
          // console.log(`stdout: ${stdout}`);
          resolve();
        });
      });
    });
  },


  configUserName:() => {
    return new Promise((resolve,reject) => {
      var questions = [
        {
          type: 'input',
          name: 'userNameMessage',
          message: "type your username:"
        }
      ];
      inquirer.prompt(questions).then(answers => {
        exec('git config --global user.name ' + '"' + answers.userNameMessage + '"', (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          } 
          // console.log(`stdout: ${stdout}`);
          resolve();
        });
      });
    });
  },
  //直接不管ssl证书的验证
  configSSL:() => {
    return new Promise((resolve,reject) => {
      exec('git config --global http.sslVerify false', (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          reject();
          //return;
        } 
        resolve();
        // console.log(`stdout: ${stdout}`);
      });
    });
  },

  //4.执行git commit命令
  commit:() => {
    return new Promise((resolve,reject) => {
      var questions = [
        {
          type: 'input',
          name: 'commitMessage',
          message: "type your commit message:"
        }
      ];
      inquirer.prompt(questions).then(answers => {
        exec('git commit -m ' + '"' + answers.commitMessage + '"', (error, stdout, stderr) => {
          if (error) {
            // console.error(`exec error: ${error}`);
            // return;
          } 
          // console.log(`stdout: ${stdout}`);
          resolve();
        });
      });
    });
  },

  //5.执行git remote add origin命令
  remotePath:() => {
    return new Promise((resolve,reject) => {
      var questions = [
        {
          type: 'input',
          name: 'remotePath',
          message: "type your remote path:"
        }
      ];
      //输入远程repository地址
      inquirer
        .prompt(questions)
        .then(answers => {
          let remotePathArray = answers.remotePath.split('/');
          return remotePathArray;//必须用return，否则将调用rmotePath函数的resolve
          })
        .then(remotePathArray => {
          const requireLetterAndNumber = value => {
            if (/\w/.test(value) && /\d/.test(value)) {
              return true;
            }
            return 'Password need to have at least a letter and a number';
          };
          inquirer
            .prompt([
              {
                type: 'password',
                message: 'Enter a password:',
                name: 'password',
                validate: requireLetterAndNumber
              }
            ])
            //输入密码
            .then(answers => {
              exec('git remote add origin '+ remotePathArray[0] +'//' + remotePathArray[3] +':' + answers.password +'@' + remotePathArray[2]+'/'+remotePathArray[3]+'/'+remotePathArray[4], (error, stdout, stderr) => {
              if (error) {
                console.error(`exec error: ${error}`);
                return;
              } 
              //console.log(`stdout: ${stdout}`);
              resolve();
              });
            });
      })
    });
  },

  //6.执行git push命令
  push:() => {
    return new Promise((resolve,reject) => {
      exec('git push -u origin master', (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          console.log('you can try:1.$git credential-manager uninstall; 2.$git credential-manager install')
          return;
        } 
        // console.log(`stdout: ${stdout}`);
        resolve();
      });
    });
  },

  //7.clone远程项目
  clone:() => {
    return new Promise((resolve,reject) => {
      var questions = [
        {
          type: 'input',
          name: 'remotePath',
          message: "type your remote path:"
        }
      ];
      //输入远程repository地址
      inquirer
        .prompt(questions)
        .then(answers => { 
          exec('git clone ' + answers.remotePath, (error, stdout, stderr) => {
            if (error) {
              console.error(`exec error: ${error}`);
              return;
            } 
            // console.log(`stdout: ${stdout}`);
            resolve();
          });
        })
    });
  }
}


