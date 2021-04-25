'use strict';

const ws = require('ws');
const http = require('http');
const { threadId } = require('worker_threads');
const serverConfig = require('../config/server');
const Client = require('./client');
const Channel = require('./channel');

class Server {
  constructor(application) {
    this.application = application;
    const { ports, host, maxPayload } = serverConfig;
    this.instance = http.createServer(this.listener.bind(this));
    this.ws = new ws.Server({ server: this.instance, maxPayload });
    const port = ports[threadId - 1];
    this.ws.on('connection', (connection, req) => {
      const channel = new Channel(
        connection,
        req.socket.remoteAddress,
        application
      );
      const id = this.application.channels.set(connection);
      channel.id = id;
      connection.on('close', async () => {
        channel.destroy();
        this.application.channels.delete(id);
        if (channel.user)
          this.application.channels.deleteFromGroup(channel.user.login, id);
      });
      connection.on('message', async data => {
        try {
          if (typeof data === 'string') channel.message(data);
          else channel.buffer(data);
        } catch (error) {
          this.application.logger.error(error);
        }
      });
    });

    this.instance.listen(port, host || '127.0.0.1', () => {
      this.application.logger.log(
        `Listen on http://${host || '127.0.0.1'}:${port}`
      );
    });
  }

  listener(req, res) {
    const client = new Client(req, res, this.application);
    const [domen, link] = req.url.substring(1).split('/');
    if (domen === 'link') {
      try {
        client.loadFilebyLink(link, this.application.storage.storagePath);
      } catch (error) {
        this.application.logger.error(error);
      }
    } else {
      client.static();
    }
  }

  async close() {
    this.application.channels.closeAll();
    this.application.logger.log('close');
  }
}

module.exports = Server;
