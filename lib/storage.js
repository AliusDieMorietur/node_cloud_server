'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { generateToken } = require('./utils');

const comparator = (a, b) => {
  const aIsFolder = a.children !== null;
  const bIsFolder = b.children !== null;
  if (aIsFolder) a.children.sort(comparator);
  if (bIsFolder) b.children.sort(comparator);
  if (aIsFolder === bIsFolder) {
    if (a.name < b.name) return -1;
    else if (a.name === b.name) return 0;
    else return 1;
  } else if (aIsFolder) {
    return -1;
  } else {
    return 1;
  }
};

class Storage {
  constructor(storagePath, tokenLifeTime, application) {
    this.storagePath = storagePath;
    this.tokenLifeTime = tokenLifeTime;
    this.application = application;
  }

  recalculate(currentFolder) {
    if (currentFolder.children) {
      currentFolder.capacity = currentFolder.children.reduce(
        (acc, cur) => acc + this.recalculate(cur),
        0
      );
    }
    return currentFolder.capacity;
  }

  findPlace(departureFolder, currentPath) {
    if (currentPath.indexOf('/') === -1) return departureFolder;
    const dirs = currentPath.split('/');
    let children = departureFolder;
    for (const folder of dirs) {
      for (const item of children) if (item.name === folder) children = item.children;
    }
    return children;
  }

  buildStructure(rows) {
    const structure = [];
    for (const row of rows) {
      let currentFolder = structure;
      const { name } = row;
      const isFile = name[name.length - 1] !== '/';
      const file = {
        name: name.slice(name.lastIndexOf('/') + 1),
        children: null,
        capacity: row.size,
      };
      const dirs = name.split('/');
      for (const currentPath of dirs) {
        if (dirs.indexOf(currentPath) === dirs.length - 1) continue;
        const names = currentFolder.map(item => item.name);
        if (!names.includes(currentPath)) {
          currentFolder.push({
            name: currentPath,
            children: [],
            capacity: 0,
          });
        }
        for (const item of currentFolder) {
          if (item.name === currentPath) {
            currentFolder = item.children;
          }
        }
      }
      if (isFile) currentFolder.push(file);
    }
    for (const item of structure) this.recalculate(item);
    structure.sort(comparator);
    return structure;
  }

  async upload(dirPath, filename, buffer) {
    await fsp.writeFile(path.join(dirPath, filename), buffer);
  }

  async download(dirPath, fileNames, connection) {
    for (const name of fileNames) {
      const filePath = path.join(dirPath, name);
      const buffer = await fsp.readFile(filePath);
      console.log(buffer);
      connection.send(buffer);
    }
  }

  async createFolder(dirPath) {
    await fsp.mkdir(dirPath);
  }

  async deleteFolder(dirPath, recursive = true) {
    await fsp.rmdir(dirPath, { recursive });
  }

  async delete(dirPath, fileNames) {
    for (const name of fileNames) await fsp.unlink(path.join(dirPath, name));
  }

  async createLink(name, userToken) {
    const fileInfo = await this.application.db.select(
      'FileInfo',
      ['*'],
      `token = '${userToken}' AND name = '${name}'`
    );
    const file = fileInfo[0];
    if (!userToken || !file) throw new Error('No such file');
    const token = generateToken();
    const link = `${userToken}:${file.fakename}:${name}`;
    await this.application.db.insert('Link', { fileid: file.id, token, link });
    return token;
  }

  async getLink(token) {
    const link = await this.application.db.select('Link', ['*'], `token = '${token}'`);
    return link[0].link;
  }

  async clearExpired() {
    let tokenCounter = 0;
    let fileCounter = 0;
    const storageInfo = await this.application.db.select('StorageInfo', ['*']);
    for (const item of storageInfo) {
      const expire = Number(item.expire);
      if (expire !== 0 && Date.now() > expire) {
        const { token } = item;
        const fileInfo = await this.application.db.select(
          'FileInfo',
          ['*'],
          `token = '${token}'`
        );
        const fakeNames = fileInfo.map(item => item.fakename);
        const dirPath = path.join(this.storagePath, token);
        await this.application.db.delete('StorageInfo', `token = '${token}'`);
        await this.delete(dirPath, fakeNames);
        await this.deleteFolder(dirPath);
        fileCounter += fakeNames.length;
        tokenCounter++;
      }
    }
    this.application.logger.log(
      `Files deleted: ${fileCounter} Tokens expired: ${tokenCounter}`
    );
  }
}

module.exports = Storage;
