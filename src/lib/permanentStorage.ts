import * as path from 'path';
import { promises as fsp } from 'fs';
import { generateToken } from './auth';
// import { upload, download } from './storageAPI';

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

type Info = { 
  savedNames: { [key: string]: string }, 
  structure: Structure[] 
};

export class PermanentStorage { 
  private buffers: Buffer[] = [];
  user: User;

  constructor(
    private storagePath: string, 
    private connection
  ) {}

  async getInfo(token: string): Promise<Info> {
    const info = await fsp.readFile(path.join(this.storagePath, token + '_info.json'), 'utf-8');
    return JSON.parse(info);
  }

  setCurrentUser(user: User) { this.user = user; }

  getCurrentUser(): User { return this.user; }

  saveBuffers(buffers) {
    for (const buffer of buffers) this.buffers.push(buffer);
  }

  recalculate(currentFolder: Structure): number {
    if (currentFolder.childs) 
      currentFolder.capacity = currentFolder.childs.reduce((acc, cur) => acc + this.recalculate(cur), 0);
    return currentFolder.capacity;
  }
  
  findPlace(departureFolder: Structure[], currentPath: string): Structure[] {
    const dirs = currentPath.substring(1).split('/');
    let childs = departureFolder;

    for (const folder of dirs) 
      for (const item of childs) 
        if (item.name === folder) childs = item.childs;
    return childs;
  }  

  // async createLink(filePath: string): Promise<string> {
  //   const linksPath = path.join(this.storagePath, 'magnet_links.json');
  //   const links = JSON.parse(
  //     await fsp.readFile(linksPath, 'utf-8')
  //   );
  //   const { savedNames: list } = await this.getInfo(this.user.token);
  //   const fileName = filePath.split('/').filter((e, i, a) => i === a.length - 1);
  //   const token = generateToken();
  //   links[token] = `${this.user.token}:${list[filePath]}:${fileName}`;
  //   await fsp.writeFile(linksPath, JSON.stringify(links, null, 2));
  //   return token;
  // }

  async rename(args): Promise<void> {
    const { currentPath, changes } = args;
    const { token } = this.user;
    let parsed = await this.getInfo(token);
    const childs = this.findPlace(parsed.structure, currentPath);
    const childsNames = childs.map(el => el.name);

    for (const item of changes) {
      if (childsNames.includes(item[0])) {
        const fileName = parsed.savedNames[`${currentPath}/${item[0]}`];

        delete parsed.savedNames[`${currentPath}/${item[0]}`];
        parsed.savedNames[`${currentPath}/${item[1]}`] = fileName;

        const index = childsNames.indexOf(item[0]);

        childs[index].name = item[1]
      }
    }

    await fsp.writeFile(
      path.join(this.storagePath, token + '_info.json'), 
      JSON.stringify(parsed, null, 2)
    );
  }

  async delete(args) {
    const { currentPath, changes } = args;
    const { token } = this.user;
    let parsed = await this.getInfo(token);
    const childs = this.findPlace(parsed.structure, currentPath);
    const childsNames = childs.map(el => el.name);

    for (const item of changes) {
      if (childsNames.includes(item[0])) {
        const index = childsNames.indexOf(item[0]);
        childs.splice(index, 1);
        const name = parsed.savedNames[`${currentPath}/${item[0]}`];
        if (item[1] === 'file') {
          await fsp.unlink(path.join(this.storagePath, token, name));
          delete parsed.savedNames[`${currentPath}/${item[0]}`];
        }
        else 
          for (const key in parsed.savedNames) 
            if (key.includes(item[0])) {
              await fsp.unlink(path.join(this.storagePath, token, parsed.savedNames[key]));
              delete parsed.savedNames[key];
            }
      }
    }

    await fsp.writeFile(
      path.join(this.storagePath, token + '_info.json'), 
      JSON.stringify(parsed, null, 2)
    );
  }

  async upload(args): Promise<string> {
    const { currentPath, changes } = args;
    const { token } = this.user;
    const dirPath = path.join(this.storagePath, token);
    const fileNames = changes
      .filter(item => item[1] === 'file')
      .map(item => item[0]);
    let parsed = await this.getInfo(token);
    const childs = this.findPlace(parsed.structure, currentPath);
    const childsNames = childs.map(el => el.name);

    for (const item of changes) {
      if (childsNames.includes(item[0])) {
        const fileList = parsed.savedNames;
        const name = fileList[`${currentPath}/${item[0]}`];

        if (item[1] === 'file') 
          await fsp.unlink(path.join(this.storagePath, token, name));
          
        const index = childsNames.indexOf(name);
        childs.splice(index, 1);
      }

      childs.push({ 
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

    // await upload(dirPath, Object.values(savedNames), this.buffers);

    for (const folder of parsed.structure) 
      folder.capacity = this.recalculate(folder);

    await fsp.writeFile(
      path.join(this.storagePath, token + '_info.json'), 
      JSON.stringify(parsed, null, 2)
    );

    this.buffers = [];

    return token;
  }

  async download(args): Promise<string[]> {
    const { currentPath, fileList } = args;
    const { token } = this.user;
    const { savedNames: list } = await this.getInfo(token);
    for (const file of fileList) {
      const buffer = await fsp.readFile(path.join(this.storagePath, token, list[`${currentPath}/${file}`]));
      this.connection.send(buffer);
    }
    return fileList;
  }

  async getStructure(): Promise<Structure[]> {
    const { token } = this.user;
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