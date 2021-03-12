import { promises as fsp, Dirent } from 'fs';
import * as path from 'path';
import { Logger } from './logger';
import Database from './db';
import { dbConfig } from '../config/db';
import { serverConfig } from '../config/server'; 
import { generateToken } from './auth';

const STATIC_PATH = path.join(process.cwd(), './static');
const STORAGE_PATH: string = path.join(process.cwd(), serverConfig .storagePath);

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
  logger = new Logger();
  db: Database;

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
  
  // async getInfo(token: string): Promise<{ [key: string]: string }> {
  //   const info = await fsp.readFile(path.join(STORAGE_PATH, token + '_info.json'));
  //   return JSON.parse(info.toString()).savedNames;
  // }

  // async createLink(filePath: string, userToken: string): Promise<string> {
  //   // const fileName = filePath.split('/').filter((e, i, a) => i === a.length - 1);
  //   // const list = await this.getInfo(userToken);
  //   const token = generateToken();
  //   if (!userToken || !list[filePath] || !fileName) throw new Error('No such file')
  //   const link = `${userToken}:${list[filePath]}:${fileName}`;
  //   this.links.set(token, link);
  //   await this.db.insert('Link', { token, link });
  //   return token;
  // }

  // getLink(token: string): string {
  //   return this.links.get(token);
  // } 

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

  async start() {
    try {
      this.db = new Database(dbConfig);
      this.logger.success('Db connected');
      // await this.loadLinks();
      // this.logger.success('Links loaded');
      await this.loadDirectory(STATIC_PATH, this.static);
      this.logger.success('Static loaded');
    } catch (error) {
      this.logger.error(error);
    }
  }
}
