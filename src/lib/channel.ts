import * as path from 'path';
import { generateToken, Session } from './auth';
import { validate, CustomError } from './utils';
import { serverConfig } from '../config/server';
import * as EventEmitter from 'events';

const TOKEN_LIFETIME: number = serverConfig.tokenLifeTime;

export class Channel extends EventEmitter {
  private index = -1;
  private user = null;
  private session: Session;
  private commands = {
    upload: async ({ fileList, storage }) => {
      this.namesCheck(fileList);

      const token = storage === 'tmp' ? generateToken() : this.user.token;

      await this.tokenCheck(token, false);
      const dirPath = path.join(this.application.storage.storagePath, token);
      
      if (storage === 'tmp') {
        await this.application.db.insert('StorageInfo', {
          token,
          expire: Date.now() + TOKEN_LIFETIME
        });
        await this.application.storage.createFolder(dirPath);
      } 
      
      const fileInfo = await this.application.db.select('FileInfo', ['*'], `token = '${token}'`);

      const names = fileList.map(name => {
        const alreadyExists = fileInfo.find(item => item.name === name);
        return alreadyExists 
          ? [name, alreadyExists.fakename, true]
          : [name, generateToken(), false];
      });

      let counter = 0;

      const upload = async buffer => {
        const [name, fakename, changed] = names[counter];

        try {
          const size = Buffer.byteLength(buffer);

          if (changed)
            await this.application.db
              .update('FileInfo', `size = '${size}'`, `name = '${name}' AND token = '${token}'`);
          else
            await this.application.db
              .insert('FileInfo', { token, name, fakename, size });

          this.application.storage.upload(dirPath, fakename, buffer);

          const last = counter === names.length - 1;
          if (last) {
            if (storage === 'pmt') this.sendStructure();
            else setTimeout(async () => {
              await this.application.db.delete('StorageInfo', `token = '${token}'`);
              await this.application.storage.delete(dirPath, names.map(name => name[1]));
              await this.application.storage.deleteFolder(dirPath);
            }, TOKEN_LIFETIME);
            this.removeListener('bufferUpload', upload)
          };
          counter++;
        } catch (error) {
          this.application.logger.error(error);
        }
      }

      this.on('bufferUpload', upload);

      if (storage === 'tmp') return token;
    },
    download: async args => {
      const token = args.token || this.user.token;
      const { fileList } = args;

      await this.tokenCheck(token, true);
      this.namesCheck(fileList);

      const dirPath = path.join(this.application.storage.storagePath, token);
      const fileInfo = await this.application.db.select('FileInfo', ['*'], `token = '${token}'`);
      const existingNames = fileInfo.map(item => item.name); 
      const fakeNames = fileList
        .map(item => fileInfo[existingNames.indexOf(item)].fakename);

      await this.application.storage.download(dirPath, fakeNames, this.connection);
    },
    availableFiles: async args => {
      const token = args.token || this.user.token;

      await this.tokenCheck(token, true);

      const fileInfo = await this.application.db.select('FileInfo', ['*'], `token = '${token}'`);

      return args.token
        ? fileInfo.map(item => item.name)
        : this.application.storage.buildStructure(fileInfo);
    },
    newFolder: async ({ name }) => {
      const { token } = this.user;

      await this.tokenCheck(token, true);

      if (!validate.name(name)) 
      throw CustomError.InvalidName;

      const fileInfo = await this.application.db.select('FileInfo', ['*'], `token = '${token}'`);
      const existingNames = fileInfo.map(item => item.name); 
      if (!existingNames.includes(name)) 
        await this.application.db.insert('FileInfo', { 
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
        const fileInfo = await this.application.db.select('FileInfo', ['*'], `token = '${token}'`);

        for (const item of fileInfo) {
          if (item.name.includes(name) && item.name !== name) {
            const dirs = item.name[item.name.length - 1] === '/'
              ? item.name.substring(item.name.length - 1, 0).split('/')
              : item.name.split('/');

            dirs[dirs.indexOf(name.substring(name.length - 1, 0))] = 
              newName.substring(newName.length - 1, 0);

            const newItemName = dirs.join('/');
            await this.application.db.update('FileInfo', `name = '${newItemName}'`, `name = '${item.name}' AND token = '${token}'`);
          }
        }
      }
      await this.application.db.update('FileInfo', `name = '${newName}'`, `name = '${name}' AND token = '${token}'`);
    },
    delete: async ({ fileList }) => {
      const { token } = this.user;

      await this.tokenCheck(token, true);
      this.namesCheck(fileList);

      const fileInfo = await this.application.db.select('FileInfo', ['*'], `token = '${token}'`);
      const existingNames = fileInfo.map(item => item.name); 

      for (const item of fileList) {
        const { id } = fileInfo[existingNames.indexOf(item)];
        const links = await this.application.db.select('Link', ['*'], `FileId = '${id}'`);

        for (const item of links) 
          this.application.deleteLink(item.token);
        await this.application.db.delete('FileInfo', `name = '${item}'`);
        
        if (item[item.length - 1] !== '/') {
          const dirPath = path.join(this.application.storage.storagePath, token);
          const { fakename } = fileInfo[existingNames.indexOf(item)];

          await this.application.storage.delete(dirPath, [fakename]);
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
    this.session = new Session(this.application.db);
    this.application.logger.log('Connected ', ip);
  }

  async tokenCheck (token, checkExistanse) {
    if (!validate.token(token)) 
      throw CustomError.InvalidToken;
      
    if (checkExistanse) {
      const storages = await this.application.db.select('StorageInfo', ['*'], `token = '${token}'`);
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
    const fileInfo = await this.application.db.select('FileInfo', ['*'], `token = '${this.user.token}'`);
    const structure = this.application.storage.buildStructure(fileInfo);
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