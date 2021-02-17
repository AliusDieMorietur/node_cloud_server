import { Worker } from 'worker_threads'; 
import * as path from 'path';
import { Logger } from './logger';
import { serverConfig } from '../config/server';
import { TemporaryStorage } from './storage';

const STORAGE_PATH = path.join(process.cwd(), './storage/');

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
    const logger = new Logger();
    try {
      let expired = await TemporaryStorage.clearExpired(STORAGE_PATH);
      for (const file of expired) { logger.log(`Expired: ${file}`); };
      logger.log(`Total expired: ${expired.length}`)
    } catch (err) {
      logger.error(err);
    }
    for (let id = 0; id < this.count; id++) this.startWorker(id);

    process.on('SIGINT', this.stop);
    process.on('SIGTERM', this.stop);
  } 
}