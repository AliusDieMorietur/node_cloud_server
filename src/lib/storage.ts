import * as path from 'path';
import { promises as fsp } from 'fs';
import { generateToken } from './auth';

export class TemporaryStorage { 
  private storagePath: string;
  private tokenLifeTime: number;
  private connection;
  private token: string = '';
  private buffers: Buffer[] = [];

  constructor(
    storagePath: string, 
    tokenLifeTime: number, 
    connection
  ) {
    this.storagePath = storagePath;
    this.tokenLifeTime = tokenLifeTime;
    this.connection = connection;
  }

  saveBuffer(buffer) {
    this.buffers.push(buffer);
  }

  async upload(args): Promise<string> {
    const { list } = args;
    this.token = generateToken();
    const dirPath = path.join(this.storagePath, this.token);
    await fsp.mkdir(dirPath);
    
    const savedNames = {};
    const expire = Date.now() + this.tokenLifeTime;
    for (const fileName of list) savedNames[fileName] = generateToken();
    const infoPath = path.join(this.storagePath, this.token + '_info.json');
    await fsp.writeFile(infoPath, JSON.stringify({ expire, savedNames }));
    
    if (this.buffers.length !== list.length) {
      let error = 'Buffers or it`s names corrupted';
      throw new Error(error);
    }

    for (let i = 0; i < list.length; i++) {
      const generatedNames: string[] = Object.values(savedNames);
      const fileName = path.join(this.storagePath, this.token, generatedNames[i]);
      const buffer = this.buffers[i];
      await fsp.writeFile(fileName, buffer);
    }
    
    this.folderTimeout(path.join(this.storagePath, this.token), this.tokenLifeTime);
    this.buffers = [];
    return this.token;
  }

  async download(args): Promise<any> {
    const { files, token } = args;
    const list = await this.getInfo(token);
    for (const file of files) {
      const buffer = await fsp.readFile(path.join(this.storagePath, token, list[file]));
      this.connection.send(buffer);
    }
    return files;
  }

  async availableFiles(args): Promise<string[]> {
    const { token } = args;
    try {
      const info = await this.getInfo(token);
      const list = Object.keys(info);
      return list;
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