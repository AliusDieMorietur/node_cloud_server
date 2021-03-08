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
          //console.log(data);
          // await channel.session.createUser({ login: 'Admin', password: 'Admin' }, req.socket.remoteAddress );
          // console.log('authUser: ', await channel.session.authUser({ login: 'Admin', password: 'Admin' }, req.socket.remoteAddress ));
          // const user = await channel.session.getUser('login', 'Admin');
          // console.log('getUser: ', user);
          // channel.permanentStorage.setCurrentUser(user);

          // DELETE
          // await channel.permanentStorage.delete({ 
          //   currentPath: '/home', 
          //   changes: [ 
          //     ['file1', 'file'],
          //     ['folder1', 'folder'],
          //   ]
          // });

          // RENAME
          // channel.permanentStorage.setCurrentUser(user);
          // await channel.permanentStorage.rename({ 
          //     currentPath: '/home/folder1', 
          //     changes: [ 
          //       ['file3', 'file105']
          //     ]
          //   });

          // UPLOAD
          // channel.permanentStorage.saveBuffers(['1', '2']);
          // console.log('upload: ', await channel.permanentStorage.upload({ 
          //   currentPath: '/home', 
          //   changes: [ 
          //     ['folder1', 'folder'],
          //     ['file1', 'file'],
          //     ['file2', 'file']
          //   ]
          // }));
          // channel.permanentStorage.saveBuffers(['1', '2', '3', '4']);
          // console.log('upload: ', await channel.permanentStorage.upload({ 
          //   currentPath: '/home/folder1', 
          //   changes: [ 
          //     ['folder2', 'folder'],
          //     ['file1', 'file'],
          //     ['file2', 'file'],
          //     ['file3', 'file'],
          //     ['file4', 'file']
          //   ]
          // }));
        } catch (error) {
          this.application.logger.error(error);
        }
      })
    });

    this.instance.listen(port, '192.168.0.121', () => {
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
