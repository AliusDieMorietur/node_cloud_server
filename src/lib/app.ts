import { promises as fsp, Dirent } from 'fs';
import * as path from 'path';
import { Logger } from './logger';

const STATIC_PATH = path.join(process.cwd(), './static');

const toUnix = (filePath: string): string => 
  process.platform === 'win32' 
    ? filePath
      .split(path.sep)
      .join(path.posix.sep)
    : filePath;

export class App {
  logger = new Logger();
  static = new Map<string, Buffer>();

  getStatic(filePath: string): Buffer {
    return this.static.get(filePath);
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
    await this.loadDirectory(STATIC_PATH, this.static);
    this.logger.success('Static loaded');
  }
}
