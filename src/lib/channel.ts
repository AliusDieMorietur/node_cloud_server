import * as path from 'path';
import { Storage } from './storage';
import { generateToken, Session } from './auth';
import { serverConfig } from '../config/server';

const { storagePath, tmpStoragePath, tokenLifeTime } = serverConfig; 
const STORAGE_PATH: string = path.join(process.cwd(), storagePath);
const TMP_STORAGE_PATH: string = path.join(process.cwd(), tmpStoragePath);
const TOKEN_LIFETIME: number = tokenLifeTime;

export class Channel {
  private index = -1;
  buffers: Buffer[] = [];
  private db;
   user;
  session: Session;
  // private tmpStorage = new Storage(TMP_STORAGE_PATH);
  commands = {
    // 'tmpUpload': async args => {
    //   this.tmpStorage.saveBuffers(this.buffers);
    //   this.buffers = [];
    //   return await this.tmpStorage.upload(args);
    // },
    // 'tmpDownload': async args => await this.tmpStorage.download(args),
    'availableFiles': async args => {
      const token = args.token 
        ? args.token 
        : this.user.token;
      const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${token}'`);
      return Storage.buildStructure(fileInfo);
    },
    'pmtUpload': async args => {
      const { token } = this.user;
      const dirPath = path.join(STORAGE_PATH, token);
      const { changes, currentPath } = args;
      const fakeNames = changes.map(() => generateToken()); 
      const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${token}'`);
      const existingNames = fileInfo.map(item => item.name); 

      for (let i = 0; i < changes.length; i++) {
        const name = `${currentPath}${changes[i]}`;

        if (!existingNames.includes(name)) 
          await this.db.insert('FileInfo', { 
            token, 
            name, 
            fakeName: fakeNames[i], 
            size: Buffer.byteLength(this.buffers[i], 'utf-8') 
          });
        else fakeNames[i] = fileInfo[existingNames.indexOf(name)].fakename;
      }
      
      const result = await Storage.upload(dirPath, fakeNames, this.buffers);
      this.buffers = [];
      return result;
    },
    'pmtDownload': async args => {
      const fileList = args.fileList.map(item => `${args.currentPath}${item}`);
      const { token } = this.user;
      const dirPath = path.join(STORAGE_PATH, token);
      const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${token}'`);
      const existingNames = fileInfo.map(item => item.name); 

      const fakeNames = fileList
        .map(item => fileInfo[existingNames.indexOf(item)].fakename);

      await Storage.download(dirPath, fakeNames, this.connection);
      return args.fileList;
    },
    'newFolder': async args => {
      const { token } = this.user;
      const { currentPath, folderName } = args;
      const name = `${currentPath}${folderName}/`;
      const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${token}'`);
      const existingNames = fileInfo.map(item => item.name); 
      if (!existingNames.includes(name)) 
        await this.db.insert('FileInfo', { 
          token, 
          name, 
          fakeName: 'folder', 
          size: 0
        });
    },
    // 'rename': async args => await this.permanentStorage.rename(args),
    'delete': async args => {
      const { currentPath, changes } = args;
      const { token } = this.user;

    },
    // 'getStorageStructure': async () => await this.permanentStorage.getStructure(),
    'restoreSession': async args => { 
      const session = await this.session.restoreSession(args.token);
      const user = await this.session.getUser('id', `${session.userid}`);
      this.user = user;
      this.index = this.application.saveConnection(user.login, this.connection);
      return session.token;
    },
    // 'createLink': async (args: Args) => await this.permanentStorage.createLink(args.filePath),
    // 'createLink': async args => 
    //   await this.application.createLink(
    //     args.filePath, 
        // this.permanentStorage.getCurrentUser().token),
    'authUser': async args => { 
      const token = await this.session.authUser(args.user, this.ip);
      const { login } = args.user;
      const user = await this.session.getUser('login', login);
      this.user = user;
      this.index = this.application.saveConnection(login, this.connection);
      return token;
    },
    'logOut': async args => await this.session.deleteSession(this.user.token)
  };

  constructor(private connection, private ip: string, private application) {
    this.db = this.application.db;
    this.session = new Session(this.db);
    this.application.logger.log('IP: ', ip);
  }

  sendAllDevices(data) {
    const { login } = this.user;
    const connections = this.application.connections.get(login);
    for (const connection of connections.filter(el => el !== null)) {
      connection.send(data);
    }
  }

  deleteConnection() {
    const authed = 
      this.index !== -1 &&
      this.user
    if (authed) {
      const { login } = this.user;
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
            const liveReload = ['newFolder', 'pmtUpload', 'rename', 'delete'];
            if (liveReload.includes(msg)) {
              const token = args.token 
                ? args.token 
                : this.user.token;
              const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${token}'`);
              const structure = Storage.buildStructure(fileInfo);
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