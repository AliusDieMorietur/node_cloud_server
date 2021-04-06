'use strict';

const { Worker } = require('worker_threads');
const serverConfig = require('../config/server');
const App = require('./app');

class Launcher {
  constructor() {
    this.count = serverConfig.ports.length;
    this.workers = [];
  }

  stop() {
    if (this.workers) {
      for (const worker of this.workers) {
        worker.postMessage({ name: 'stop' });
      }
    }
    process.exit(0);
  }

  startWorker(id) {
    const worker = new Worker('./lib/worker.js');
    this.workers[id] = worker;
    worker.on('exit', code => {
      if (code !== 0) this.startWorker(id);
    });
  }

  async start() {
    new App().clearExpired();

    for (let id = 0; id < this.count; id++) this.startWorker(id);

    process.on('SIGINT', this.stop);
    process.on('SIGTERM', this.stop);
  }
}

module.exports = Launcher;
