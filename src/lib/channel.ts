import * as path from 'path';
import { Storage } from './storage';
import { generateToken, Session } from './auth';
import { serverConfig } from '../config/server';
import { promises as fsp } from 'fs';
import * as EventEmitter from 'events';

const { storagePath, tokenLifeTime } = serverConfig; 
const STORAGE_PATH: string = path.join(process.cwd(), storagePath);
const TOKEN_LIFETIME: number = tokenLifeTime;

export class Channel extends EventEmitter {
  private index = -1;
  private db;
  private user;
  private session: Session;
  private commands = {
    upload: async ({ fileList, storage }) => {
      const token = storage === 'tmp' ? generateToken() : this.user.token;
      const dirPath = path.join(STORAGE_PATH, token);
      let names = fileList.map(name => [name, generateToken()]);

      if (storage === 'tmp') {
        await this.db.insert('StorageInfo', {
          token,
          expire: Date.now() + TOKEN_LIFETIME
        });
        await fsp.mkdir(dirPath);
      } else {
        const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${token}'`);

        names = names.map(name => {
          const alreadyExists = fileInfo.find(item => item.name == name[0]); 

          return alreadyExists ? [name[0], alreadyExists.fakeName] : name;
        });
      }

      const gen = (async function*() {
        const nextBuffer = buf => gen.next(buf);
        this.on('bufferUpload', nextBuffer);

        try {
          for (const [name, fakeName] of names) {
            const buf = yield;
            const size = Buffer.byteLength(buf);
            
            await this.db.insert('FileInfo', { token, name, fakeName, size });
            Storage.upload(dirPath, fakeName, buf);
          }
          
          if (storage === 'pmt') this.sendStructure();
          else setTimeout(async () => {
              await this.db.delete('StorageInfo', `token = '${token}'`);
              await Storage.delete(dirPath, names.map(name => name[1]));
              await Storage.deleteFolder(dirPath);
            }, TOKEN_LIFETIME);
        } catch (e) { this.application.logger.error(e); }
          
        this.removeListener('bufferUpload', nextBuffer);
      }).bind(this)(); gen.next();

      if (storage === 'tmp') return token;
    },
    download: async args => {
      const token = args.token || this.user.token;
      const { fileList } = args;
      const dirPath = path.join(STORAGE_PATH, token);
      const fakeNames = (await this.db.select('FileInfo', ['*'], `token = '${token}'`))
        .filter(file => fileList.includes(file.name))
        .map(file => file.fakeName);

      await Storage.download(dirPath, fakeNames, this.connection);
    },
    availableFiles: async args => {
      const token = args.token || this.user.token;
      const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${token}'`);

      return args.token
        ? fileInfo.map(item => item.name)
        : Storage.buildStructure(fileInfo);
    },
    newFolder: async ({ name }) => {
      const { token } = this.user;
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
    rename: async ({ name, newName }) => {
      const { token } = this.user;

      if (name[name.length - 1] === '/') {
        const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${token}'`);

        for (const item of fileInfo) {
          if (item.name.includes(name) && item.name !== name) {
            const dirs = item.name[item.name.length - 1] === '/'
              ? item.name.substring(item.name.length - 1, 0).split('/')
              : item.name.split('/');

            dirs[dirs.indexOf(name.substring(name.length - 1, 0))] = 
              newName.substring(newName.length - 1, 0);

            const newItemName = dirs.join('/');
            await this.db.update('FileInfo', `name = '${newItemName}'`, `name = '${item.name}' AND token = '${token}'`);
          }
        }
      }
      await this.db.update('FileInfo', `name = '${newName}'`, `name = '${name}' AND token = '${token}'`);
    },
    delete: async ({ fileList }) => {
      const { token } = this.user;
      const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${token}'`);
      const existingNames = fileInfo.map(item => item.name); 

      for (const item of fileList) {
        const { id } = fileInfo[existingNames.indexOf(item)];
        const links = await this.db.select('Link', ['*'], `FileId = '${id}'`);

        for (const item of links) 
          this.application.deleteLink(item.token);
        await this.db.delete('FileInfo', `name = '${item}'`);
        
        if (item[item.length - 1] !== '/') {
          const dirPath = path.join(STORAGE_PATH, token);
          const { fakename } = fileInfo[existingNames.indexOf(item)];

          await Storage.delete(dirPath, [fakename]);
        }
      }

    },
    restoreSession: async args => { 
      const session = await this.session.restoreSession(args.token);

      if (!session) throw new Error(`Session not found on: ${args.token}`);

      const user = await this.session.getUser('id', `${session.userid}`);

      this.user = user;
      this.index = this.application.saveConnection(user.login, this.connection);
      return session.token;
    },
    createLink: async args => 
      await this.application.createLink(
        args.name, 
        this.user.token
      ),
    authUser: async args => { 
      const token = await this.session.authUser(args.user, this.ip);
      const { login, password } = args.user;
      const user = await this.session.getUser('login', login);
      this.user = user;
      this.index = this.application.saveConnection(login, this.connection);
      return token;
    },
    logOut: async args => await this.session.deleteSession(this.user.token)
  };

  constructor(private connection, private ip: string, private application) {
    super();
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

  async sendStructure() {
    const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${this.user.token}'`);
    const structure = Storage.buildStructure(fileInfo);
    this.sendAllDevices(JSON.stringify({ structure }));
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
            const liveReload = ['newFolder', 'rename', 'delete'];
            if (liveReload.includes(msg)) 
              this.sendStructure();
          } catch (error) {
            this.application.logger.error(error);
            this.send(JSON.stringify({ 
              callId, 
              error: { message: error.message, code: error.code } 
            }));
          }
        }
      } else {
        console.log(data);
        this.emit('bufferUpload', data);
      }
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