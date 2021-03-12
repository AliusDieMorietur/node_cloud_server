import * as ws from 'ws';
import * as http from 'http';
import { threadId } from 'worker_threads';
import { serverConfig } from '../config/server';
import { Client } from './client';
import { Channel } from './channel';
import * as path from 'path';

const STORAGE_PATH: string = path.join(process.cwd(), serverConfig.storagePath);

export class Server {
  instance: http.Server;
  ws: ws.Server;

  constructor(private application) {
		this.instance = http.createServer(this.listener.bind(this));
		this.ws = new ws.Server({ server: this.instance });
		const { ports } = serverConfig;
    const port = ports[threadId - 1];
    this.ws.on('connection', (connection, req) => {
      const channel = new Channel(connection, req.socket.remoteAddress, application);
      connection.on('close', async () => channel.deleteConnection());
      connection.on('message', async data => {
        channel.message(data);
        try {
          // channel.user = { id: 4, token: 'uLAyXdVENAlXEWp8kWII9QGQJ2V2cblD', login: 'Admin', password: 'Admin' }; 
          // channel.buffers = [Buffer.from('3'), Buffer.from('4')];
          // channel.commands['pmtUpload']({ changes: ['1', '2'], currentPath: '/kekw' });
        } catch (error) {
          this.application.logger.error(error);
        }
      })
    });

    this.instance.listen(port, '192.168.0.136', () => {
      this.application.logger.log(`Listen port ${port}`);
    });
  }

  listener(req, res) {
    const client = new Client(req, res, this.application);
		const [domen, link] = req.url.substring(1).split('/');
		if (domen === 'link') {
      try {
        client.loadFilebyLink(link, STORAGE_PATH);
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
