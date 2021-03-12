import * as path from 'path';
import { promises as fsp } from 'fs';
import { generateToken } from './auth';
// import { upload, download } from './storageAPI';

export class TemporaryStorage { 
  private token: string = '';
  private buffers: Buffer[] = [];

  constructor(
    private storagePath: string, 
    private tokenLifeTime: number, 
    private connection
  ) {}

  saveBuffers(buffers) {
    for (const buffer of buffers) this.buffers.push(buffer);
  }

  async upload(args): Promise<string> {
    const { fileList } = args;
    this.token = generateToken();
    const dirPath = path.join(this.storagePath, this.token);
    
    const savedNames = {};
    const expire = Date.now() + this.tokenLifeTime;
    for (const fileName of fileList) savedNames[fileName] = generateToken();
    const infoPath = path.join(this.storagePath, this.token + '_info.json');
    await fsp.writeFile(infoPath, JSON.stringify({ expire, savedNames }));
    await fsp.mkdir(dirPath);


    // await upload(dirPath, fileList.map(i => savedNames[i]), this.buffers);

    this.folderTimeout(dirPath, this.tokenLifeTime);
    this.buffers = [];
    return this.token;
  }

  async download(args): Promise<any> {
    const { fileList, token } = args;
    const list = await this.getInfo(token);
    for (const file of fileList) {
      // await download(path.join(this.storagePath, token, list[file]), this.connection);
    }
    return fileList;
  }

  async availableFiles(args): Promise<string[]> {
    const { token } = args;
    try {
      const info = await this.getInfo(token);
      const fileList = Object.keys(info);
      return fileList;
    } catch (err) {
      const error = err.code === 'ENOENT' 
        ? 'No such token' 
        : err;
      throw new Error(error);
    }
  }

  async getInfo(token: string): Promise<object> {
    const info = await fsp.readFile(path.join(this.storagePath, token + '_info.json'));
    return JSON.parse(info.toString()).savedNames;
  }

  async folderTimeout(folderPath: string, time: number) {
    setTimeout(async () => {
      await fsp.unlink(folderPath + '_info.json');
      await fsp.rmdir(folderPath, { recursive: true });
    }, time);
  }

  static async clearExpired(storagePath: string): Promise<string[]> {
    const list = await fsp.readdir(storagePath, { withFileTypes: true });
    const expiredList = [];
    for (const item of list) {
      if (item.isFile()) {
        const filePath = path.join(storagePath, item.name);
        const dirPath = filePath.replace('_info.json','');
        const buffer = await fsp.readFile(filePath);
        const expired = JSON.parse(buffer.toString()).expire < Date.now();
        if (expired) {
          await fsp.unlink(filePath);
          await fsp.rmdir(dirPath, { recursive: true });
          expiredList.push(filePath)
        }
      }
    }
    return expiredList;
  }
}




