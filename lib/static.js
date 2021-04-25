const Loader = require('./loader');
const fs = require('fs');
const fsp = fs.promises;
const { toUnix } = require('./utils');

class Static extends Loader {
  constructor(dirPath, application) {
    super(dirPath, application);
  }

  async load(filePath) {
    const file = await fsp.readFile(filePath);
    this.collection.set(toUnix(filePath.slice(this.dirPath.length)), file);
  }
}

module.exports = Static;
