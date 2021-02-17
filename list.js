const fs = require('fs');
const path = require('path');

const readRec = dir => {
  console.log(dir);
  const list = fs.readdirSync(dir, {withFileTypes: true});
  for (const item of list) {
    if (item.name === 'node_modules') continue;
    if (item.isDirectory()) 
      readRec(path.join(dir, item.name));
  }
};

readRec(__dirname);
