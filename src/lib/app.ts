import { promises as fsp, Dirent } from 'fs';
import * as path from 'path';
import { Logger } from './logger';
import Database from './db';
import { Storage } from './storage';
import { serverConfig } from '../config/server';
import { dbConfig } from '../config/db';
import { generateToken } from './auth';
import { Validator } from './utils';
 
const TOKEN_LIFETIME: number = serverConfig.tokenLifeTime;
const STORAGE_PATH: string = path.join(process.cwd(), serverConfig.storagePath);
const STATIC_PATH = path.join(process.cwd(), './static');

const toUnix = (filePath: string): string => 
  process.platform === 'win32' 
    ? filePath
      .split(path.sep)
      .join(path.posix.sep)
    : filePath;

export class App {
  private static = new Map<string, Buffer>();
  private links = new Map<string, string>();
  private connections = new Map<string, any>();
  private logger = new Logger();
  private storage = new Storage(STORAGE_PATH, TOKEN_LIFETIME);
  private db = new Database(dbConfig);
  private validator = new Validator(this.db);

  saveConnection(login: string, connection): number {
    const connections = this.connections.has(login)
      ? this.connections.get(login)
      : this.connections.set(login, []).get(login);
    return connections.push(connection);
  }
  
  deleteConnection(login: string, index: number) {
    this.connections.get(login)[index] = null;
  }

  getStatic(filePath: string): Buffer {
    return this.static.get(filePath);
  }
  
  async createLink(name: string, userToken: string): Promise<string> {
    const fileInfo = await this.db.select(
      'FileInfo', ['*'], `token = '${userToken}' AND name = '${name}'`
    );
    const file = fileInfo[0];
  
    if (!userToken || !file) throw new Error('No such file')

    const token = generateToken();
    const link = `${userToken}:${file.fakename}:${name}`;

    this.links.set(token, link);
    await this.db.insert('Link', { fileid: file.id, token, link });
    return token;
  }

  getLink(token: string): string {
    return this.links.get(token);
  }

  deleteLink(token: string) {
    this.links.delete(token);
  }

  async loadLinks(): Promise<void> { 
    const links = await this.db.select('Link');
    for (const row of links) 
      this.links.set(row.token, row.link);
  }

  async loadFile(filePath: string, storage: Map<String, Buffer>) {
    try {
      const file = await fsp.readFile(filePath);
      storage.set(
        toUnix(filePath.slice(STATIC_PATH.length)),
        file
      );
    } catch (err) {
      this.logger.error(err);
    }
  }

  async loadDirectory(dirPath: string, place: Map<string, Buffer>) {
    try {
      const files: Dirent[] = await fsp.readdir(dirPath, { withFileTypes: true });
      for (const file of files) {
        if (file.name.startsWith('.')) continue;
        const filePath = path.join(dirPath, file.name);
        if (file.isDirectory()) await this.loadDirectory(filePath, place);
        else await this.loadFile(filePath, place);
      }
    } catch (err) {
      this.logger.error(err);
    }
  }

  async clearExpired() {
    let tokenCounter = 0;
    let fileCounter = 0;
    try {
      const storageInfo = await this.db.select('StorageInfo', ['*']);
      
      for (const item of storageInfo) {
        const expire = Number(item.expire);
        if (expire !== 0 && Date.now() > expire) {
          const { token } = item;
          const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${token}'`);
          const fakeNames = fileInfo.map(item => item.fakename);
          const dirPath = path.join(this.storage.storagePath, token);

          await this.db.delete('StorageInfo', `token = '${token}'`);
          await this.storage.delete(dirPath, fakeNames);
          await this.storage.deleteFolder(dirPath);
          fileCounter += fakeNames.length;
          tokenCounter++;
        }
      }

      this.logger.log(`Files deleted: ${fileCounter} Tokens expired: ${tokenCounter}`);
    } catch (err) {
      this.logger.error(err);
    }
  }

  async start() {
    try {
      await this.loadLinks();
      this.logger.success('Links loaded');
      await this.loadDirectory(STATIC_PATH, this.static);
      this.logger.success('Static loaded');
    } catch (error) {
      this.logger.error(error);
    }
  }
}
