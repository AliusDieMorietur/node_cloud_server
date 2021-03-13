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
    console.log(dirs);
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

  static async upload(dirPath: string, changes: string[], buffers: Buffer[]): Promise<string> {
    if (buffers.length !== changes.length) {
      let error = 'Buffers or it`s names corrupted';
      throw new Error(error);
    }

    for (let i = 0; i < changes.length; i++) {
      const name = changes[i];
      const fileName = path.join(dirPath, name);
      const buffer = buffers[i];

      await fsp.writeFile(fileName, buffer);
    }
    return 'ok';
  }

  static async download(dirPath: string, fileNames: string[], connection): Promise<void>  {
    for (const name of fileNames) {
      const filePath = path.join(dirPath, name);
      const buffer = await fsp.readFile(filePath);
      console.log(buffer);
      connection.send(buffer);
    }
  }

  static async delete(filePath: string): Promise<void> {
    await fsp.unlink(filePath);
  }
}

// export class PermanentStorage extends Storage {
//   user: User;

//   constructor(
//     private connection,
//     storagePath: string 
//   ) { 
//     super(); 
//     this.storagePath = storagePath; 
//   }

//   recalculate(currentFolder: Structure): number {
//     if (currentFolder.childs) 
//       currentFolder.capacity = currentFolder.childs.reduce((acc, cur) => acc + this.recalculate(cur), 0);
//     return currentFolder.capacity;
//   }
  
//   findPlace(departureFolder: Structure[], currentPath: string): Structure[] {
//     const dirs = currentPath.substring(1).split('/');
//     let childs = departureFolder;

//     for (const folder of dirs) 
//       for (const item of childs) 
//         if (item.name === folder) childs = item.childs;
//     return childs;
//   }  

//   async rename(args): Promise<void> {
//     const { currentPath, changes } = args;
//     const { token } = this.user;

//     this.application.db.insert();
//     // let parsed = await this.getInfo(token);
//     // const childs = this.findPlace(parsed.structure, currentPath);
//     // const childsNames = childs.map(el => el.name);

//     // for (const item of changes) {
//     //   if (childsNames.includes(item[0])) {
//     //     const fileName = parsed.savedNames[`${currentPath}/${item[0]}`];

//     //     delete parsed.savedNames[`${currentPath}/${item[0]}`];
//     //     parsed.savedNames[`${currentPath}/${item[1]}`] = fileName;

//     //     const index = childsNames.indexOf(item[0]);

//     //     childs[index].name = item[1]
//     //   }
//     // }

//     // await fsp.writeFile(
//     //   path.join(this.storagePath, token + '_info.json'), 
//     //   JSON.stringify(parsed, null, 2)
//     // );
//   }

//   async delete(args) {
//     const { currentPath, changes } = args;
//     const { token } = this.user;
//     let parsed = await this.getInfo(token);
//     const childs = this.findPlace(parsed.structure, currentPath);
//     const childsNames = childs.map(el => el.name);

//     for (const item of changes) {
//       if (childsNames.includes(item[0])) {
//         const index = childsNames.indexOf(item[0]);
//         childs.splice(index, 1);
//         const name = parsed.savedNames[`${currentPath}/${item[0]}`];
//         if (item[1] === 'file') {
//           await fsp.unlink(path.join(this.storagePath, token, name));
//           delete parsed.savedNames[`${currentPath}/${item[0]}`];
//         }
//         else 
//           for (const key in parsed.savedNames) 
//             if (key.includes(item[0])) {
//               await fsp.unlink(path.join(this.storagePath, token, parsed.savedNames[key]));
//               delete parsed.savedNames[key];
//             }
//       }
//     }

//     await fsp.writeFile(
//       path.join(this.storagePath, token + '_info.json'), 
//       JSON.stringify(parsed, null, 2)
//     );
//   }


//   async download(args): Promise<string[]> {
//     const { currentPath, fileList } = args;
//     const { token } = this.user;
//     const { savedNames: list } = await this.getInfo(token);
//     for (const file of fileList) {
//       const buffer = await fsp.readFile(path.join(this.storagePath, token, list[`${currentPath}/${file}`]));
//       this.connection.send(buffer);
//     }
//     return fileList;
//   }

//   async getStructure(): Promise<Structure[]> {
//     const { token } = this.user;
//     try {
//       const info = await this.getInfo(token);
//       return info.structure;
//     } catch (err) {
//       const error = err.code === 'ENOENT' 
//         ? 'No such token' 
//         : err;
//       throw new Error(error);
//     }
//   }


// }

// export class TemporaryStorage extends Storage { 
//   private token: string = '';

//   constructor(
//     private connection,
//     private tokenLifeTime: number, 
//     storagePath: string 
//   ) { 
//     super(); 
//     this.storagePath = storagePath; 
//   }

//   saveBuffers(buffers) {
//     for (const buffer of buffers) this.buffers.push(buffer);
//   }

//   async upload(args): Promise<string> {
//     const { fileList } = args;
//     this.token = generateToken();
//     const dirPath = path.join(this.storagePath, this.token);
    
//     const savedNames = {};
//     const expire = Date.now() + this.tokenLifeTime;
//     for (const fileName of fileList) savedNames[fileName] = generateToken();
//     const infoPath = path.join(this.storagePath, this.token + '_info.json');
//     await fsp.writeFile(infoPath, JSON.stringify({ expire, savedNames }));
//     await fsp.mkdir(dirPath);


//     await upload(dirPath, fileList.map(i => savedNames[i]), this.buffers);

//     this.folderTimeout(dirPath, this.tokenLifeTime);
//     this.buffers = [];
//     return this.token;
//   }

//   async download(args): Promise<any> {
//     const { fileList, token } = args;
//     const list = await this.getInfo(token);
//     for (const file of fileList) {
//       await download(path.join(this.storagePath, token, list[file]), this.connection);
//     }
//     return fileList;
//   }

//   async availableFiles(args): Promise<string[]> {
//     const { token } = args;
//     try {
//       const info = await this.getInfo(token);
//       const fileList = Object.keys(info);
//       return fileList;
//     } catch (err) {
//       const error = err.code === 'ENOENT' 
//         ? 'No such token' 
//         : err;
//       throw new Error(error);
//     }
//   }

//   async getInfo(token: string): Promise<object> {
//     const info = await fsp.readFile(path.join(this.storagePath, token + '_info.json'));
//     return JSON.parse(info.toString()).savedNames;
//   }

//   async folderTimeout(folderPath: string, time: number) {
//     setTimeout(async () => {
//       await fsp.unlink(folderPath + '_info.json');
//       await fsp.rmdir(folderPath, { recursive: true });
//     }, time);
//   }

//   static async clearExpired(storagePath: string): Promise<string[]> {
//     const list = await fsp.readdir(storagePath, { withFileTypes: true });
//     const expiredList = [];
//     for (const item of list) {
//       if (item.isFile()) {
//         const filePath = path.join(storagePath, item.name);
//         const dirPath = filePath.replace('_info.json','');
//         const buffer = await fsp.readFile(filePath);
//         const expired = JSON.parse(buffer.toString()).expire < Date.now();
//         if (expired) {
//           await fsp.unlink(filePath);
//           await fsp.rmdir(dirPath, { recursive: true });
//           expiredList.push(filePath)
//         }
//       }
//     }
//     return expiredList;
//   }
// }






// export const upload = async (dirPath: string, names: string[], buffers: Buffer[]): Promise<void> => {
//   if (buffers.length !== names.length) {
//     let error = 'Buffers or it`s names corrupted';
//     throw new Error(error);
//   }

//   for (let i = 0; i < names.length; i++) {
//     const fileName = path.join(dirPath, names[i]);
//     const buffer = buffers[i];
//     await fsp.writeFile(fileName, buffer);
//   }
// }

// export const download = async (path: string, connection): Promise<any> => {
//   const buffer = await fsp.readFile(path);
//   console.log(buffer);
//   connection.send(buffer);
// }

