import { promises as fsp, Dirent } from 'fs';
import * as path from 'path';
import { Logger } from './logger';
import Database from './db';
import { dbConfig } from '../config/db';
import { generateToken } from './auth';

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
  static logger = new Logger();
  static db = new Database(dbConfig);
  
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
    const fileInfo = await App.db.select(
      'FileInfo', ['*'], `token = '${userToken}' AND name = '${name}'`
    );
    const file = fileInfo[0];
  
    if (!userToken || !file) throw new Error('No such file')

    const token = generateToken();
    const link = `${userToken}:${file.fakename}:${name}`;

    this.links.set(token, link);
    await App.db.insert('Link', { fileid: file.id, token, link });
    return token;
  }

  getLink(token: string): string {
    return this.links.get(token);
  }

  deleteLink(token: string) {
    this.links.delete(token);
  }

  async loadLinks(): Promise<void> { 
    const links = await App.db.select('Link');
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
      App.logger.error(err);
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
      App.logger.error(err);
    }
  }

  async start() {
    try {
      await this.loadLinks();
      App.logger.success('Links loaded');
      
      await this.loadDirectory(STATIC_PATH, this.static);
      App.logger.success('Static loaded');
    } catch (error) {
      App.logger.error(error);
    }
  }
}
