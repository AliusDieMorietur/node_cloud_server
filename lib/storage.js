'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const comparator = (a, b) => {
  const aIsFolder = a.childs !== null;
  const bIsFolder = b.childs !== null;

  if (aIsFolder) a.childs.sort(comparator);
  if (bIsFolder) b.childs.sort(comparator);

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
  constructor(storagePath, tokenLifeTime) {
    this.storagePath = storagePath;
    this.tokenLifeTime = tokenLifeTime;
  }

  recalculate(currentFolder) {
    if (currentFolder.childs) {
      currentFolder.capacity = currentFolder.childs.reduce(
        (acc, cur) => acc + this.recalculate(cur),
        0
      );
    }
    return currentFolder.capacity;
  }

  findPlace(departureFolder, currentPath) {
    if (currentPath.indexOf('/') === -1) return departureFolder;
    const dirs = currentPath.split('/');
    let childs = departureFolder;

    for (const folder of dirs) {
      for (const item of childs) if (item.name === folder) childs = item.childs;
    }
    return childs;
  }

  buildStructure(rows) {
    const structure = [];
    for (const row of rows) {
      let currentFolder = structure;
      const { name } = row;
      const isFile = name[name.length - 1] !== '/';
      const file = {
        name: name.slice(name.lastIndexOf('/') + 1),
        childs: null,
        capacity: row.size,
      };
      const dirs = name.split('/');

      for (const currentPath of dirs) {
        if (dirs.indexOf(currentPath) === dirs.length - 1) continue;
        const names = currentFolder.map(item => item.name);

        if (!names.includes(currentPath)) {
          currentFolder.push({
            name: currentPath,
            childs: [],
            capacity: 0,
          });
        }

        for (const item of currentFolder) {
          if (item.name === currentPath) {
            currentFolder = item.childs;
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

  async deleteFolder(dirPath) {
    await fsp.rmdir(dirPath);
  }

  async delete(dirPath, fileNames) {
    for (const name of fileNames) await fsp.unlink(path.join(dirPath, name));
  }
}

module.exports = Storage;