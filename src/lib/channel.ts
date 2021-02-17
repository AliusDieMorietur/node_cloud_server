import * as path from 'path';
import { TemporaryStorage } from './storage';
import { serverConfig } from '../config/server';

const STORAGE_PATH: string = path.join(process.cwd(), './storage/');
const TOKEN_LIFETIME: number = serverConfig.tokenLifeTime;

export class Channel {
  private application;
  private connection;
  private storage: TemporaryStorage;
  private actions: object;

  constructor(connection, application) {
    this.connection = connection;
    this.application = application;
    this.storage = new TemporaryStorage(
      STORAGE_PATH,
      TOKEN_LIFETIME,
      connection
    );
    this.actions = {
      'upload': async args => await this.storage.upload(args),
      'available-files': async args => await this.storage.availableFiles(args),
      'download': async args => await this.storage.download(args)
    };
  }

  async message(data) {
    try {
      if (typeof data === 'string') {
        const packet = JSON.parse(data);
        const { callId, msg, args } = packet;
        if (this.actions[msg]) {
          try {
            const result = await this.actions[msg](args);
            this.send(JSON.stringify({ callId, result }));
          } catch (error) {
            this.application.logger.error(error);
            this.send(JSON.stringify({ callId, error }));
          }
        }
      } else {
        this.storage.saveBuffer(data);
      };
    } catch (err) {
      this.application.logger.error(err);
    }
  }

  send(data) {
    try {
      this.connection.send(data);
    } catch (err) {
      this.application.logger.error(err);
    }
  }
}