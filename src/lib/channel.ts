import * as path from 'path';
import Database from './db';
import { dbConfig } from '../config/db';
import { TemporaryStorage } from './temporaryStorage';
import { serverConfig } from '../config/server';
import { PermanentStorage } from './permanentStorage';
import { Session } from './session'; 
import { throws } from 'node:assert';

const { storagePath, tmpStoragePath, tokenLifeTime } = serverConfig; 
const STORAGE_PATH: string = path.join(process.cwd(), storagePath);
const TMP_STORAGE_PATH: string = path.join(process.cwd(), tmpStoragePath);
const TOKEN_LIFETIME: number = tokenLifeTime;

type Args = {
  token?: string,
  storageName? : string,
  fileList?: string[],
  currentPath?: string, 
  changes?: [ [string, string] ], 
  action?: string,
  user?: { login: string, password: string }
}

export class Channel {
  private buffers: Buffer[] = [];
  private db = new Database(dbConfig);
  session: Session = new Session(this.db);
  permanentStorage: PermanentStorage = new PermanentStorage(STORAGE_PATH, this.connection); 
  private tmpStorage: TemporaryStorage = new TemporaryStorage(
    TMP_STORAGE_PATH,
    TOKEN_LIFETIME,
    this.connection
  );
  private commands: object = {
    'upload': async (args: Args) => {
      const storage = this.chooseStorage(args.storageName);
      storage.saveBuffers(this.buffers);
      this.buffers = [];
      return await storage.upload(args);
    },
    'download': async (args: Args) => {
      const storage = this.chooseStorage(args.storageName);
      storage.saveBuffers(this.buffers);
      this.buffers = [];
      return await storage.download(args);
    },
    'availableFiles': async (args: Args) => {
      const storage = this.chooseStorage(args.storageName);
      return await this.tmpStorage.availableFiles(args);
    },
    'restoreSession': async (args: Args) => await this.session.restoreSession(args.token),
    'authUser': async (args: Args) => { 
      const token = await this.session.authUser(args.user, this.ip);
      const { login } = args.user;
      const user = await this.session.getUser(login);
      this.permanentStorage.setCurrentUser(user);
      return token;
    },
    'logOut': async (args: Args) => await this.session.deleteSessions(this.ip) 
  };

  constructor(private connection, private ip, private application) {
    this.application.logger.log('IP: ', ip);
  }

  chooseStorage(storageName) {
    return storageName === 'pmt'
      ? this.permanentStorage
      : this.tmpStorage;
  }

  async message(data) {
    try {
      if (typeof data === 'string') {
        const packet = JSON.parse(data);
        const { callId, msg, args } = packet;
        if (this.commands[msg]) {
          try {
            const result = await this.commands[msg](args);
            this.send(JSON.stringify({ callId, result }));
          } catch (error) {
            this.application.logger.error(error);
            this.send(JSON.stringify({ 
              callId, 
              error: { message: error.message, code: error.code } 
            }));
          }
        }
      } else {
        this.buffers.push(data);
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