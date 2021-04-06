'use strict';

const { parentPort } = require('worker_threads');
const App = require('./app');
const Server = require('./server');

(async () => {
  const application = new App();
  application.start();
  const server = new Server(application);

  parentPort.on('message', async message => {
    if (message.name === 'stop') {
      server.close();
      process.exit(0);
    }
  });
})();
