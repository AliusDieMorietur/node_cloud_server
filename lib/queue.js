'use strict';

class AsyncQueue {
  constructor(concurrency, application) {
    this.concurrency = concurrency;
    this.application = application;
    this.counter = 0;
    this.waiting = [];
  }

  async add(task) {
    this.waiting.push(task);
    const hasChannel = this.counter < this.concurrency;
    if (hasChannel) {
      await this.next();
      return;
    }
  }

  async next() {
    this.counter++;
    const task = this.waiting.shift();
    try {
      await task();
      if (this.waiting.length !== 0) {
        await this.next();
      }
    } catch (error) {
      this.application.logger.error(error);
      this.counter--;
      throw error;
    }
    this.counter--;
  }
}

module.exports = AsyncQueue;
