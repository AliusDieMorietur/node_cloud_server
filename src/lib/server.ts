import * as ws from 'ws';
import * as http from 'http';
import { threadId } from 'worker_threads';
import { serverConfig } from '../config/server';
import { Client } from './client';
import { Channel } from './channel';

const createServer = (application): http.Server => {
	const listener = (req: http.IncomingMessage, res) => {
		const [domen, command] = req.url.substring(1).split('/');
		if (domen === 'api') {
			//api[command](req, res);
		} else {
			const client = new Client(req, res, application);
			client.static();
		}
	};
	return http.createServer(listener);
};

export class Server {
  instance: http.Server;
  ws: ws.Server;

  constructor(private application) {
		this.instance = createServer(this.application);
		this.ws = new ws.Server({ server: this.instance });
		const { ports } = serverConfig;
    const port = ports[threadId - 1];
    this.ws.on('connection', (connection, req) => {
      const channel = new Channel(connection, req.socket.remoteAddress, application);
      connection.on('message', async data => {
        try {
          //console.log(data);
          // await channel.session.createUser({ login: 'Admin', password: 'Admin' }, req.socket.remoteAddress );
          // console.log('authUser: ', await channel.session.authUser({ login: 'Admin', password: 'Admin' }, req.socket.remoteAddress ));
          const user = await channel.session.getUser('Admin');
          console.log('getUser: ', user);
          channel.permanentStorage.setCurrentUser(user);
          channel.permanentStorage.saveBuffers(['1', '2']);
          console.log('upload: ', await channel.permanentStorage.upload({ 
            token: user.token, 
            currentPath: '/home', 
            action: 'replace',
            changes: [
              ['file1', 'file'],
              ['file2', 'file'],
              ['folder1', 'folder']
            ]
          }));
        } catch (error) {
          this.application.logger.error(error);
        }
        channel.message(data);
      })
    });

    this.instance.listen(port, () => {
      this.application.logger.log(`Listen port ${port}`);
    });
  }

  async close() {
    //TODO graceful shutdown
    this.application.logger.log('close');
  }
}
