import { Worker } from 'worker_threads';

export class WorkerPool {
  callId: number = 0;
  calls = new Map();
  queue = [];
  workers: Worker[] = [];

  constructor(quantity: number) {
    for (let i = 0; i < quantity; i++) {
      const worker = new Worker('./lib/worker.js');
      worker.on('message', packet => {
        const { callId } = packet;
        const [resolve, reject] = this.calls.get(callId);
        if (packet.err) {
          reject(packet.err);
          return;
        }; 
        resolve();
        if (this.queue.length !== 0) {
          const data = this.queue.shift();
          this.forceWorker(data, worker);
          return;
        }
        this.workers.push(worker);
      });
      this.workers[i] = worker;
    };
  }

  async message(data): Promise<any> {
    if (this.workers.length !== 0) {
      const worker = this.workers.pop();
      return this.forceWorker(data, worker);
    }
    this.queue.push(data);
  }
    
  async forceWorker(data, worker): Promise<any> {
    return new Promise((resolve, reject) => {
      this.callId += 1;
      this.calls.set(this.callId, [resolve, reject]);
      worker.postMessage({ data, callId: this.callId });
    })
  };
}
