import { Worker } from 'worker_threads'; 
import * as path from 'path';
import { Logger } from './logger';
import { serverConfig } from '../config/server';
import Database from './db';
import { dbConfig } from '../config/db';
import { Storage } from './storage';

const { tmpStoragePath } = serverConfig; 
const TMP_STORAGE_PATH = path.join(process.cwd(), tmpStoragePath);

export class Launcher {
  count = serverConfig.ports.length
  workers: Worker[] = []
  
  private stop() {
    if (this.workers) {
      for (const worker of this.workers) {
        worker.postMessage({ name: 'stop' });
      }
    }
    process.exit(0);
  };

  private startWorker(id: number) {
    const worker = new Worker('./lib/worker.js');
    this.workers[id] = worker;
    worker.on('exit', code => {
      if (code !== 0) this.startWorker(id);
    });
  };

  async start() {
    let tokenCounter = 0;
    let fileCounter = 0;
    const logger = new Logger();
    try {
      const db = new Database(dbConfig);
      const storageInfo = await db.select('StorageInfo', ['*']);
      
      for (const item of storageInfo) {
        const expire = Number(item.expire);
        if (expire !== 0 && Date.now() > expire) {
          const { token } = item;
          const fileInfo = await db.select('FileInfo', ['*'], `token = '${token}'`);
          const fakeNames = fileInfo.map(item => item.fakename);
          const dirPath = path.join(TMP_STORAGE_PATH, token);

          await db.delete('StorageInfo', `token = '${token}'`);
          await Storage.delete(dirPath, fakeNames);
          await Storage.deleteFolder(dirPath);
          fileCounter += fakeNames.length;
          tokenCounter++;
        }
      }

      logger.log(`Files deleted: ${fileCounter} Tokens expired: ${tokenCounter}`);
    } catch (err) {
      logger.error(err);
    }
    for (let id = 0; id < this.count; id++) this.startWorker(id);

    process.on('SIGINT', this.stop);
    process.on('SIGTERM', this.stop);
  } 
}