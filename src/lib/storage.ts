import * as path from 'path';
import { promises as fsp } from 'fs';
import { App } from './app';
import { serverConfig } from '../config/server';

const { storagePath } = serverConfig; 

type Structure = {
  name: string, 
  childs?: Structure[],
  capacity: number
} 

type FileInfo = {
  id: number,
  token: string,
  name: string,
  fakename: string,
  size: number;
}

const comparator = (a, b) => {
  const is_a_folder = a.childs !== null;
  const is_b_folder = b.childs !== null;

  if(is_a_folder) a.childs.sort(comparator);
  if(is_b_folder) b.childs.sort(comparator);

  if (is_a_folder === is_b_folder) {
    if (a.name < b.name) return -1;
    else if (a.name === b.name) return 0;
    else return 1;
  } else {
    if (is_a_folder) return -1;
    else return 1;
  }
};

export class Storage {
  static storagePath = path.join(process.cwd(), storagePath);

  static async clearExpired() {
    try {
      let tokenCounter = 0;
      let fileCounter = 0;
      const storageInfo = await App.db.select('StorageInfo', ['*']);
      
      for (const item of storageInfo) {
        const expire = Number(item.expire);
        if (expire !== 0 && Date.now() > expire) {
          const { token } = item;
          const fileInfo = await App.db.select('FileInfo', ['*'], `token = '${token}'`);
          const fakeNames = fileInfo.map(item => item.fakename);
          const dirPath = path.join(this.storagePath, token);

          await App.db.delete('StorageInfo', `token = '${token}'`);
          await Storage.delete(dirPath, fakeNames);
          await Storage.deleteFolder(dirPath);
          fileCounter += fakeNames.length;
          tokenCounter++;
        }
      }

      App.logger.log(`Files deleted: ${fileCounter} Tokens expired: ${tokenCounter}`);
    } catch (err) {
      App.logger.error(err);
    }
  }

  static recalculate(currentFolder: Structure): number {
    if (currentFolder.childs) 
      currentFolder.capacity = currentFolder.childs.reduce((acc, cur) => acc + this.recalculate(cur), 0);
    return currentFolder.capacity;
  }

  static findPlace(departureFolder: Structure[], currentPath: string): Structure[] {
    if (currentPath.indexOf('/') === -1) return departureFolder;
    const dirs = currentPath.split('/');
    let childs = departureFolder;

    for (const folder of dirs) 
      for (const item of childs) 
        if (item.name === folder) childs = item.childs;
    return childs;
  } 


  static buildStructure(rows: FileInfo[]): Structure[] {
    const structure: Structure[] = [];
    for (const row of rows) {
      let currentFolder = structure;
      const { name } = row;
      const isFile = name[name.length - 1] !== '/';
      const file = {
        name: name.slice(name.lastIndexOf('/') + 1),
        childs: null,
        capacity: row.size
      };  
      const dirs = name.split('/');

      for (const currentPath of dirs) {
        if (dirs.indexOf(currentPath) === dirs.length - 1) continue;
        const names = currentFolder.map(item => item.name);

        if (!names.includes(currentPath)) currentFolder.push({
          name: currentPath,
          childs: [],
          capacity: 0
        })

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

  // static buildStructure(rows: FileInfo[]): Structure[] {
  //   const structure = [];
  //   const folders = [];

  //   for (const { name } of rows) 
  //     if (name[name.length - 1] === '/') 
  //       folders.push(name.substring(name.length - 1, 0));

  //   const dirs = folders.map(item => item.split('/'));

  //   for (const item of dirs) {
  //     let currentFolder = structure;

  //     for (const folder of item) {
  //       const newFolder = {
  //         name: folder, 
  //         childs: [],
  //         capacity: 0 
  //       };
  //       const names = currentFolder.map(item => item.name);
  //       let index = names.indexOf(folder);

  //       if (!names.includes(folder)) index = currentFolder.push(newFolder) - 1;

  //       currentFolder = currentFolder[index].childs;
  //     }
  //   } 

  //   for (const row of rows) {
  //     if (row.name[row.name.length - 1] === '/') continue;

  //     const currentFolder = this.findPlace(structure, row.name);
  //     const splitted = row.name.split('/');
  //     const name = splitted[splitted.length - 1];
  //     const file = {
  //       name,
  //       childs: null,
  //       capacity: row.size
  //     };

  //     currentFolder.push(file);
  //   }

  //   for (const item of structure) this.recalculate(item);

  //   structure.sort(comparator);

  //   return structure;
  // } 

  static async upload(dirPath: string, filename: string, buffer: Buffer) {
    await fsp.writeFile(path.join(dirPath, filename), buffer);
  }

  static async download(dirPath: string, fileNames: string[], connection) {
    for (const name of fileNames) {
      const filePath = path.join(dirPath, name);
      const buffer = await fsp.readFile(filePath);
      console.log(buffer);
      connection.send(buffer);
    }
  }

  static async deleteFolder(dirPath: string) {
    await fsp.rmdir(dirPath);
  }

  static async delete(dirPath: string, fileNames: string[]) {
    for (const name of fileNames) 
      await fsp.unlink(path.join(dirPath, name));
  }
}

