import * as path from 'path';
import { Storage } from './storage';
import { generateToken, Session } from './auth';
import { serverConfig } from '../config/server';
import { promises as fsp } from 'fs';

const { storagePath, tmpStoragePath, tokenLifeTime } = serverConfig; 
const STORAGE_PATH: string = path.join(process.cwd(), storagePath);
const TMP_STORAGE_PATH: string = path.join(process.cwd(), tmpStoragePath);
const TOKEN_LIFETIME: number = tokenLifeTime;

export class Channel {
  private index = -1;
  private buffers: Buffer[] = [];
  private db;
  private user;
  private session: Session;
  private commands = {
    'tmpUpload': async args => {
      const { fileList } = args;
      const fakeNames = fileList.map(() => generateToken()); 
      const token = generateToken();
      const dirPath = path.join(TMP_STORAGE_PATH, token);

      await fsp.mkdir(dirPath);
      await this.db.insert('StorageInfo', {
        token,
        expire: Date.now() + TOKEN_LIFETIME
      });

      for (let i = 0; i < fileList.length; i++) {
        const name = fileList[i];
        
        await this.db.insert('FileInfo', { 
          token, 
          name, 
          fakeName: fakeNames[i], 
          size: Buffer.byteLength(this.buffers[i], 'utf-8') 
        });
      }

      await Storage.upload(dirPath, fakeNames, this.buffers);
      this.buffers = [];
      return token;
    },
    'tmpDownload': async args => {
      const { token, fileList } = args;
      const dirPath = path.join(TMP_STORAGE_PATH, token);
      const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${token}'`);
      const existingNames = fileInfo.map(item => item.name); 
      const fakeNames = fileList
        .map(item => fileInfo[existingNames.indexOf(item)].fakename);

      await Storage.download(dirPath, fakeNames, this.connection);
      return fileList.map(item => item.split('/')[item.split('/').length - 1]);
    },
    'availableFiles': async args => {
      const token = args.token 
        ? args.token 
        : this.user.token;
      const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${token}'`);

      return args.token
        ? fileInfo.map(item => item.name)
        : Storage.buildStructure(fileInfo);
    },
    'pmtUpload': async args => {
      const { token } = this.user;
      const { fileList } = args;
      const dirPath = path.join(STORAGE_PATH, token);
      const fakeNames = fileList.map(() => generateToken()); 
      const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${token}'`);
      const existingNames = fileInfo.map(item => item.name); 

      for (let i = 0; i < fileList.length; i++) {
        const name = fileList[i];
        
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
      const { token } = this.user;
      const { fileList } = args;
      const dirPath = path.join(STORAGE_PATH, token);
      const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${token}'`);
      const existingNames = fileInfo.map(item => item.name); 

      const fakeNames = fileList
        .map(item => fileInfo[existingNames.indexOf(item)].fakename);

      await Storage.download(dirPath, fakeNames, this.connection);
      return fileList.map(item => item.split('/')[item.split('/').length - 1]);
    },
    'newFolder': async args => {
      const { token } = this.user;
      const { folderName } = args;
      const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${token}'`);
      const existingNames = fileInfo.map(item => item.name); 
      if (!existingNames.includes(folderName)) 
        await this.db.insert('FileInfo', { 
          token, 
          name: folderName, 
          fakeName: 'folder', 
          size: 0
        });
    },
    'rename': async args => {
      const { token } = this.user;
      const { name, newName } = args;
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
    'delete': async args => {
      const { token } = this.user;
      const { fileList } = args;
      const fileInfo = await this.db.select('FileInfo', ['*'], `token = '${token}'`);
      const existingNames = fileInfo.map(item => item.name); 
      for (const item of fileList) {
        await this.db.delete('FileInfo', `name = '${item}'`);
        console.log(item);
        if (item[item.length - 1] !== '/') {
          const filePath = path.join(
            STORAGE_PATH, 
            token, 
            fileInfo[existingNames.indexOf(item)].fakename
          );
          await Storage.delete(filePath);
        }
      }

    },
    'restoreSession': async args => { 
      const session = await this.session.restoreSession(args.token);
      const user = await this.session.getUser('id', `${session.userid}`);
      this.user = user;
      this.index = this.application.saveConnection(user.login, this.connection);
      return session.token;
    },
    'createLink': async args => 
      await this.application.createLink(
        args.filePath, 
        this.user.token
      ),
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