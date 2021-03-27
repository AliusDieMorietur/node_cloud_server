import { Worker } from 'worker_threads'; 
import { serverConfig } from '../config/server';
import { Storage } from './storage';

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
    Storage.clearExpired();

    for (let id = 0; id < this.count; id++) this.startWorker(id);

    process.on('SIGINT', this.stop);
    process.on('SIGTERM', this.stop);
  } 
}