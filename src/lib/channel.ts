import * as path from 'path';
import Database from './db';
import { dbConfig } from '../config/db';
import { TemporaryStorage } from './temporaryStorage';
import { serverConfig } from '../config/server';
import { PermanentStorage } from './permanentStorage';
import { Session } from './session'; 

const { storagePath, tmpStoragePath, tokenLifeTime } = serverConfig; 
const STORAGE_PATH: string = path.join(process.cwd(), storagePath);
const TMP_STORAGE_PATH: string = path.join(process.cwd(), tmpStoragePath);
const TOKEN_LIFETIME: number = tokenLifeTime;

export class Channel {
  private index = -1;
  private buffers: Buffer[] = [];
  private db = new Database(dbConfig);
  session: Session;
  permanentStorage: PermanentStorage = new PermanentStorage(STORAGE_PATH, this.connection); 
  private tmpStorage: TemporaryStorage = new TemporaryStorage(
    TMP_STORAGE_PATH,
    TOKEN_LIFETIME,
    this.connection
  );
  private commands = {
    'tmpUpload': async args => {
      this.tmpStorage.saveBuffers(this.buffers);
      this.buffers = [];
      return await this.tmpStorage.upload(args);
    },
    'tmpDownload': async args => await this.tmpStorage.download(args),
    'availableFiles': async args => await this.tmpStorage.availableFiles(args),
    'pmtUpload': async args => {
      this.permanentStorage.saveBuffers(this.buffers);
      this.buffers = [];
      return await this.permanentStorage.upload(args);
    },
    'pmtDownload': async args => await this.permanentStorage.download(args),
    'rename': async args => await this.permanentStorage.rename(args),
    'delete': async args => await this.permanentStorage.delete(args),
    'getStorageStructure': async () => await this.permanentStorage.getStructure(),
    'restoreSession': async args => { 
      const session = await this.session.restoreSession(args.token);
      const user = await this.session.getUser('id', `${session.userid}`);
      this.permanentStorage.setCurrentUser(user);
      this.index = this.application.saveConnection(user.login, this.connection);
      return session.token;
    },
    // 'createLink': async (args: Args) => await this.permanentStorage.createLink(args.filePath),
    'createLink': async args => 
      await this.application.createLink(
        args.filePath, 
        this.permanentStorage.getCurrentUser().token),
    'authUser': async args => { 
      const token = await this.session.authUser(args.user, this.ip);
      const { login } = args.user;
      const user = await this.session.getUser('login', login);
      this.permanentStorage.setCurrentUser(user);
      this.index = this.application.saveConnection(login, this.connection);
      return token;
    },
    'logOut': async args => {
      const { token } = this.permanentStorage.user;
      return await this.session.deleteSession(token);
    }
  };

  constructor(private connection, private ip: string, private application) {
    const { db } = this.application;
    this.session = new Session(db);
    this.application.logger.log('IP: ', ip);
  }

  sendAllDevices(data) {
    const { login } = this.permanentStorage.user;
    const connections = this.application.connections.get(login);
    for (const connection of connections.filter(el => el !== null)) {
      connection.send(data);
    }
  }

  deleteConnection() {
    const authed = 
      this.index !== -1 &&
      this.permanentStorage.user
    if (authed) {
      const { login } = this.permanentStorage.user;
      this.application.deleteConnection(login, this.index);
    }
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
            const liveReload = ['pmtUpload', 'rename', 'delete'];
            if (liveReload.includes(msg)) {
              const structure = await this.permanentStorage.getStructure();
              this.sendAllDevices(JSON.stringify({ structure }));
            }
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