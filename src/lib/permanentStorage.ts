import * as path from 'path';
import * as fs from 'fs';
const fsp = fs.promises;
import { generateToken } from './auth';
import { upload, download } from './storageAPI';

type User = {
  id: number, 
  token: string,
  login: string, 
  password: string 
}

type Structure = {
  name: string, 
  childs?: Structure[],
  capacity: number
} 

type Info = { savedNames: { [key: string]: string }, structure: Structure[] };

const removeDir = (folderPath: string) =>  {
  const files = fs.readdirSync(folderPath)
  if (files.length > 0) {
    files.forEach(function(filename) {
      if (fs.statSync(path.join(folderPath, filename)).isDirectory()) 
        removeDir(path.join(folderPath, filename));
      else 
        fs.unlinkSync(path.join(folderPath, filename));
    })
    fs.rmdirSync(folderPath)
  } else fs.rmdirSync(folderPath)  
}

export class PermanentStorage { 
  private buffers: Buffer[] = [];
  user: User;

  constructor(
    private storagePath: string, 
    private connection
  ) {}

  async getInfo(token: string): Promise<Info> {
    const info = await fsp.readFile(path.join(this.storagePath, token + '_info.json'));
    return JSON.parse(info.toString());
  }

  setCurrentUser(user) { this.user = user; }

  saveBuffers(buffers) {
    for (const buffer of buffers) this.buffers.push(buffer);
  }

  recalculate(currentFolder: Structure): number {
    if (currentFolder.childs) 
      currentFolder.capacity = currentFolder.childs.reduce((acc, cur) => acc + this.recalculate(cur), 0);
    return currentFolder.capacity;
  }
  
  findPlace(departureFolder: Structure[], dirs: string[]): Structure[] {
    let currentFolder = departureFolder;

    for (const folder of dirs) 
      for (const item of currentFolder) 
        if (item.name === folder) currentFolder = item.childs;
    return currentFolder;
  }  

  async delete(args): Promise<void> {
    const { fileList, currentPath, item, currentFolder } = args;
    const name = fileList[`${currentPath}/${item[0]}`];
    if (item[1] === 'file') 
      await fsp.unlink(path.join(this.storagePath, this.user.token, name));
    const index = currentFolder.indexOf(name);
    currentFolder.splice(index, 1);
  } 

  async upload(args): Promise<string> {
    const { token, currentPath, changes, action } = args;
    const dirPath = path.join(this.storagePath, token);
    const dirs = currentPath.substring(1).split('/');
    const fileNames = changes
      .filter(item => item[1] === 'file')
      .map(item => item[0]);

    const infoPath = path.join(this.storagePath, token + '_info.json');
    let info = await fsp.readFile(infoPath, 'utf-8');
    let parsed = JSON.parse(info);

    let currentFolder = this.findPlace(parsed.structure, dirs);

    for (const item of changes) {
      if (action === 'replace') 
        await this.delete({ 
          fileList: parsed.savedNames, 
          currentPath, 
          item, 
          currentFolder 
        });

      currentFolder.push({ 
        name: item[0], 
        childs: item[1] === 'folder' ? [] : null,
        capacity : item[1] === 'folder' 
          ? 0 
          : Buffer.byteLength(this.buffers[fileNames.indexOf(item[0])], 'utf-8')
      });
    }

    const savedNames = {};
    for (const fileName of fileNames) {
      const token = generateToken() 
      savedNames[fileName] = token;
      parsed.savedNames[`${currentPath}/${fileName}`] = token;
    }

    await upload(dirPath, Object.values(savedNames), this.buffers);

    for (const folder of parsed.structure) 
      folder.capacity = this.recalculate(folder);

    await fsp.writeFile(infoPath, JSON.stringify(parsed, null, 2));

    this.buffers = [];
    return parsed;
  }

  async download(args): Promise<string[]> {
    const { files, token } = args;
    const { savedNames: list } = await this.getInfo(token);
    for (const file of files) {
      const buffer = await fsp.readFile(path.join(this.storagePath, token, list[file]));
      this.connection.send(buffer);
    }
    return files;
  }

  async availableFiles(args): Promise<Structure[]> {
    const { token } = args;
    try {
      const info = await this.getInfo(token);
      return info.structure;
    } catch (err) {
      const error = err.code === 'ENOENT' 
        ? 'No such token' 
        : err;
      throw new Error(error);
    }
  }

}