import * as path from 'path';
import { Storage } from './storage';
import { generateToken, Session } from './auth';
import { validate, CustomError } from './utils';
import { serverConfig } from '../config/server';
import { promises as fsp } from 'fs';
import * as EventEmitter from 'events';
import { App } from './app';

const { tokenLifeTime } = serverConfig; 
const TOKEN_LIFETIME: number = tokenLifeTime;

export class Channel extends EventEmitter {
  private index = -1;
  private user = null;
  private session: Session;
  private commands = {
    upload: async ({ fileList, storage }) => {
      this.namesCheck(fileList);

      const token = storage === 'tmp' ? generateToken() : this.user.token;

      await this.tokenCheck(token, false);

      const dirPath = path.join(Storage.storagePath, token);

      if (storage === 'tmp') {
        await App.db.insert('StorageInfo', {
          token,
          expire: Date.now() + TOKEN_LIFETIME
        });
        await fsp.mkdir(dirPath);
      } 
      const existingNames = [];
      const fileInfo = await App.db.select('FileInfo', ['*'], `token = '${token}'`);

      const names = fileList.map(name => {
        const alreadyExists = fileInfo.find(item => item.name === name);
        const fakeName = alreadyExists 
          ? alreadyExists.fakename
          : generateToken();

        if (alreadyExists) existingNames.push(name);

        return [name, fakeName];
      });

      const gen = (async function*() {
        const nextBuffer = buf => gen.next(buf);
        this.on('bufferUpload', nextBuffer);

        try {
          for (const [name, fakeName] of names) {
            const buf = yield;
            const size = Buffer.byteLength(buf);
            
            if (!existingNames.includes(name))
              await App.db.insert('FileInfo', { token, name, fakeName, size });
            Storage.upload(dirPath, fakeName, buf);
          }
          
          if (storage === 'pmt') this.sendStructure();
          else setTimeout(async () => {
              await App.db.delete('StorageInfo', `token = '${token}'`);
              await Storage.delete(dirPath, names.map(name => name[1]));
              await Storage.deleteFolder(dirPath);
            }, TOKEN_LIFETIME);
        } catch (error) { App.logger.error(error); }
          
        this.removeListener('bufferUpload', nextBuffer);
      }).bind(this)(); gen.next();

      if (storage === 'tmp') return token;
    },
    download: async args => {
      const token = args.token || this.user.token;
      const { fileList } = args;

      await this.tokenCheck(token, true);
      this.namesCheck(fileList);

      const dirPath = path.join(Storage.storagePath, token);
      const fileInfo = await App.db.select('FileInfo', ['*'], `token = '${token}'`);
      const existingNames = fileInfo.map(item => item.name); 
      const fakeNames = fileList
        .map(item => fileInfo[existingNames.indexOf(item)].fakename);

      await Storage.download(dirPath, fakeNames, this.connection);
    },
    availableFiles: async args => {
      const token = args.token || this.user.token;

      await this.tokenCheck(token, true);

      const fileInfo = await App.db.select('FileInfo', ['*'], `token = '${token}'`);

      return args.token
        ? fileInfo.map(item => item.name)
        : Storage.buildStructure(fileInfo);
    },
    newFolder: async ({ name }) => {
      const { token } = this.user;

      await this.tokenCheck(token, true);

      if (!validate.name(name)) 
      throw CustomError.InvalidName;

      const fileInfo = await App.db.select('FileInfo', ['*'], `token = '${token}'`);
      const existingNames = fileInfo.map(item => item.name); 
      if (!existingNames.includes(name)) 
        await App.db.insert('FileInfo', { 
          token, 
          name, 
          fakeName: 'folder', 
          size: 0
        });
    },
    rename: async ({ name, newName }) => {
      const { token } = this.user;

      await this.tokenCheck(token, true);

      if (!validate.name(newName)) 
        throw CustomError.InvalidName;

      if (name[name.length - 1] === '/') {
        const fileInfo = await App.db.select('FileInfo', ['*'], `token = '${token}'`);

        for (const item of fileInfo) {
          if (item.name.includes(name) && item.name !== name) {
            const dirs = item.name[item.name.length - 1] === '/'
              ? item.name.substring(item.name.length - 1, 0).split('/')
              : item.name.split('/');

            dirs[dirs.indexOf(name.substring(name.length - 1, 0))] = 
              newName.substring(newName.length - 1, 0);

            const newItemName = dirs.join('/');
            await App.db.update('FileInfo', `name = '${newItemName}'`, `name = '${item.name}' AND token = '${token}'`);
          }
        }
      }
      await App.db.update('FileInfo', `name = '${newName}'`, `name = '${name}' AND token = '${token}'`);
    },
    delete: async ({ fileList }) => {
      const { token } = this.user;

      await this.tokenCheck(token, true);
      this.namesCheck(fileList);

      const fileInfo = await App.db.select('FileInfo', ['*'], `token = '${token}'`);
      const existingNames = fileInfo.map(item => item.name); 

      for (const item of fileList) {
        const { id } = fileInfo[existingNames.indexOf(item)];
        const links = await App.db.select('Link', ['*'], `FileId = '${id}'`);

        for (const item of links) 
          this.application.deleteLink(item.token);
        await App.db.delete('FileInfo', `name = '${item}'`);
        
        if (item[item.length - 1] !== '/') {
          const dirPath = path.join(Storage.storagePath, token);
          const { fakename } = fileInfo[existingNames.indexOf(item)];

          await Storage.delete(dirPath, [fakename]);
        }
      }

    },
    restoreSession: async ({ token }) => { 
      await this.tokenCheck(token, false);

      const session = await this.session.restoreSession(token);

      if (!session) throw CustomError.SessionNotRestored;

      const user = await this.session.getUser('id', `${session.userid}`);

      this.user = user;
      this.index = this.application.saveConnection(user.login, this.connection);
      return session.token;
    },
    createLink: async ({ name }) => {
      if (!validate.name(name)) 
        throw CustomError.InvalidName;

      await this.tokenCheck(this.user.token, true);

      return await this.application.createLink(
        name, 
        this.user.token
      );
    },
    authUser: async args => { 
      const { login, password } = args.user;

      if (!validate.login(login)) 
        throw CustomError.IncorrectLoginPassword;

      if (!validate.password(password)) 
        throw CustomError.IncorrectLoginPassword;

      const user = await this.session.getUser('login', login);

      if (user.password !== password) 
        throw CustomError.IncorrectLoginPassword;

      const token =  generateToken()
      await this.session.createSession({ userId: user.id, token, ip: this.ip });

      this.user = user;
      this.index = this.application.saveConnection(login, this.connection);
      return token;
    },
    logOut: async args => await this.session.deleteSession(this.user.token)
  };

  constructor(private connection, private ip: string, private application) {
    super();
    this.session = new Session();
    App.logger.log('IP: ', ip);
  }

  async tokenCheck (token, checkExistanse) {
    if (!validate.token(token)) 
      throw CustomError.InvalidToken;
      
    if (checkExistanse) {
      const storages = await App.db.select('StorageInfo', ['*'], `token = '${token}'`);
      if (storages.length === 0) throw CustomError.NoSuchToken;
    }
  
  }
  
  namesCheck (fileList) {
    if (fileList.length === 0) CustomError.EmptyFileList;
  
    for (const name of fileList) 
      if (!validate.name(name)) 
        throw CustomError.InvalidName;
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
    const fileInfo = await App.db.select('FileInfo', ['*'], `token = '${this.user.token}'`);
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
            App.logger.error(error);
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
      App.logger.error(err);
    }
  }

  send(data) {
    try {
      this.connection.send(data);
    } catch (err) {
      App.logger.error(err);
    }
  }
}