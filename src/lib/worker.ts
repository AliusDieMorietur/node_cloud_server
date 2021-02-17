import { parentPort } from 'worker_threads';
import { App } from './app';
import { Server } from './server';

(async () => {

	const application = new App();
	await application.start();
	const server = new Server(application);

	parentPort.on('message', async message => {
		if (message.name === 'stop') {
			server.close();
			process.exit(0);
		}
	});
    
})();

