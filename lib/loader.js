const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

class Loader {
  constructor(dirPath, application) {
    this.dirPath = dirPath;
    this.application = application;
    this.collection = new Map();
  }

  has(key) {
    return this.collection.has(key);
  }

  get(key) {
    return this.collection.get(key);
  }

  async loadDirectory(dirPath = this.dirPath) {
    const files = await fsp.readdir(dirPath, { withFileTypes: true });
    for (const file of files) {
      if (file.name.startsWith('.')) continue;
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) await this.loadDirectory(filePath);
      else await this.load(filePath);
    }
  }
}

module.exports = Loader;
