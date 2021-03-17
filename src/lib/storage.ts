import * as path from 'path';
import { promises as fsp } from 'fs';
import { generateToken } from './auth';

// type User = {
//   id: number, 
//   token: string,
//   login: string, 
//   password: string 
// }

type Structure = {
  name: string, 
  childs?: Structure[],
  capacity: number
} 

// type Info = { 
//   savedNames: { [key: string]: string }, 
//   structure: Structure[] 
// };

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
    const structure = [];
    const folders = [];
    for (const row of rows) {
      if (row.name[row.name.length - 1] === '/') {
        folders.push(row.name.substring(row.name.length - 1, 0));
      }
    }
    const dirs = folders.map(item => item.split('/'));
    for (const item of dirs) {
      let currentFolder = structure;
      for (const folder of item) {
        const newFolder = {
          name: folder, 
          childs: [],
          capacity: 0 
        };
        const names = currentFolder.map(item => item.name);
        let index = names.indexOf(folder);
        if (!names.includes(folder)) index = currentFolder.push(newFolder) - 1;
        currentFolder = currentFolder[index].childs;
      }
    } 
    for (const row of rows) {
      if (row.name[row.name.length - 1] === '/') continue;
      const currentFolder = this.findPlace(structure, row.name);
      const splitted = row.name.split('/');
      const name = splitted[splitted.length - 1];
      const file = {
        name,
        childs: null,
        capacity: row.size
      };
      currentFolder.push(file);
    }
    for (const item of structure) this.recalculate(item);
    structure.sort(comparator);
    return structure
  }

  static async upload(dirPath: string, fileList: string[], buffers: Buffer[]): Promise<string> {
    if (buffers.length !== fileList.length) 
      throw new Error('Buffers or it`s names corrupted');

    for (let i = 0; i < fileList.length; i++) {
      const name = fileList[i];
      const fileName = path.join(dirPath, name);
      const buffer = buffers[i];

      await fsp.writeFile(fileName, buffer);
    }
    return 'ok';
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

