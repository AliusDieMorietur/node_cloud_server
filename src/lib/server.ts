import * as ws from 'ws';
import * as http from 'http';
import { threadId } from 'worker_threads';
import { serverConfig } from '../config/server';
import { Client } from './client';
import { Channel } from './channel';
export class Server {
  instance: http.Server;
  ws: ws.Server;

  constructor(private application) {
		const { ports, host, maxPayload } = serverConfig;
		this.instance = http.createServer(this.listener.bind(this));
		this.ws = new ws.Server({ server: this.instance, maxPayload });
    const port = ports[threadId - 1];
    this.ws.on('connection', (connection, req) => {
      const channel = new Channel(connection, req.socket.remoteAddress, application);
      connection.on('close', async () => channel.deleteConnection());
      connection.on('message', async data => {
        try {
          if (typeof data === 'string') channel.message(data);
          else channel.buffer(data); 
        } catch (error) {
          this.application.logger.error(error);
        }
      })
    });

    this.instance.listen(port, host || '127.0.0.1', () => {
      this.application.logger.log(`Listen on http://${host || '127.0.0.1'}:${port}`);
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
    //TODO graceful shutdown
    this.application.logger.log('close');
  }
}
