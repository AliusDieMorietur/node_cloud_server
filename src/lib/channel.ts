import * as path from 'path';
import { generateToken, Session } from './auth';
import * as EventEmitter from 'events';
import { CustomError } from './utils';

export class Channel extends EventEmitter {
  private index = -1;
  private user = null;
  private session: Session;
  private commands = {
    upload: async ({ fileList, storage }) => {
      this.application.validator.names(fileList);

      const token = storage === 'tmp' ? generateToken() : this.user.token;
      const dirPath = path.join(this.application.storage.storagePath, token);

      if (storage === 'tmp') {
        await this.application.db.insert('StorageInfo', {
          token,
          expire: Date.now() + this.application.storage.tokenLifeTime
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

      const gen = (async function* () {
        try {
          const nextBuffer = buffer => gen.next(buffer);

          this.on('bufferUpload', nextBuffer);

          for (const [name, fakename, changed] of names) {
            const buffer = yield;
            const size = Buffer.byteLength(buffer);
            if (changed)
              await this.application.db
                .update('FileInfo', `size = '${size}'`, `name = '${name}' AND token = '${token}'`);
            else
              await this.application.db
                .insert('FileInfo', { token, name, fakename, size });

            this.application.storage.upload(dirPath, fakename, buffer);
          }

          if (storage === 'pmt') this.sendStructure();

          else setTimeout(async () => {
            await this.application.db.delete('StorageInfo', `token = '${token}'`);
            await this.application.storage.delete(dirPath, names.map(name => name[1]));
            await this.application.storage.deleteFolder(dirPath);
          }, this.application.storage.tokenLifeTime);

          this.removeListener('bufferUpload', nextBuffer)
        } catch (error) {
          this.application.logger.error(error);
        }
      }).bind(this)();

      gen.next();

      if (storage === 'tmp') return token;
    },
    download: async args => {
      const token = args.token || this.user.token;
      const { fileList } = args;

      this.application.validator.token(token);
      await this.application.validator.tokenExistance(token);
      this.application.validator.names(fileList);

      const dirPath = path.join(this.application.storage.storagePath, token);
      const fileInfo = await this.application.db.select('FileInfo', ['*'], `token = '${token}'`);
      const existingNames = fileInfo.map(item => item.name);
      const fakeNames = fileList
        .map(item => fileInfo[existingNames.indexOf(item)].fakename);

      await this.application.storage.download(dirPath, fakeNames, this.connection);
    },
    availableFiles: async args => {
      const token = args.token || this.user.token;

      this.application.validator.token(token);
      await this.application.validator.tokenExistance(token);

      const fileInfo = await this.application.db.select('FileInfo', ['*'], `token = '${token}'`);

      return args.token
        ? fileInfo.map(item => item.name)
        : this.application.storage.buildStructure(fileInfo);
    },
    newFolder: async ({ name }) => {
      const { token } = this.user;

      this.application.validator.name(name);

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

      this.application.validator.name(name);

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

      this.application.validator.names(fileList);

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
      await this.application.validator.token(token);

      const session = await this.session.restoreSession(token);
      const user = await this.session.getUser('id', `${session.userid}`);
      this.user = user;
      this.index = this.application.saveConnection(user.login, this.connection);
      return session.token;
    },
    createLink: async ({ name }) => {
      this.application.validator.name(name);

      await this.application.validator.token(this.user.token);
      await this.application.validator.tokenExistance(this.user.token)

      return await this.application.createLink(
        name,
        this.user.token
      );
    },
    authUser: async args => {
      const { login, password } = args.user;

      this.application.validator.login(login);
      this.application.validator.password(password);

      const user = await this.session.getUser('login', login);

      this.application.validator.passwordMatch(user.password, password);

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
    const { callId, msg, args } = JSON.parse(data);
    try {
      if (callId === undefined || msg === undefined || args === undefined)
        throw CustomError.WrongMessageStructure();

      if (this.commands[msg]) {
        const result = await this.commands[msg](args);

        this.send(JSON.stringify({ callId, result }));

        const liveReload = ['newFolder', 'rename', 'delete'];

        if (liveReload.includes(msg))
          this.sendStructure();

      } else throw CustomError.NoSuchCommand(msg);
    } catch (error) {
      this.application.logger.error(error);
      this.send(JSON.stringify({ callId, error }));
    }
  }

  async buffer(data) {
    console.log(data);
    this.emit('bufferUpload', data);
  }

  send(data) {
    try {
      this.connection.send(data);
    } catch (err) {
      this.application.logger.error(err);
    }
  }
}