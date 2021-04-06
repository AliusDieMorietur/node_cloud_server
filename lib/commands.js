const path = require('path');
const { generateToken } = require('./auth');

const generateCommands = (application, channel) => ({
  upload: async ({ fileList, storage }) => {
    application.validator.names(fileList);

    const token = storage === 'tmp' ? generateToken() : channel.user.token;
    const dirPath = path.join(application.storage.storagePath, token);

    if (storage === 'tmp') {
      await application.db.insert('StorageInfo', {
        token,
        expire: Date.now() + application.storage.tokenLifeTime,
      });
      await application.storage.createFolder(dirPath);
    }

    const fileInfo = await application.db.select(
      'FileInfo',
      ['*'],
      `token = '${token}'`
    );
    const names = fileList.map(name => {
      const alreadyExists = fileInfo.find(item => item.name === name);
      return alreadyExists
        ? [name, alreadyExists.fakename, true]
        : [name, generateToken(), false];
    });

    const gen = async function* () {
      try {
        const nextBuffer = buffer => gen.next(buffer);

        channel.on('bufferUpload', nextBuffer);

        for (const [name, fakename, changed] of names) {
          const buffer = yield;
          const size = Buffer.byteLength(buffer);
          if (changed) {
            await application.db.update(
              'FileInfo',
              `size = '${size}'`,
              `name = '${name}' AND token = '${token}'`
            );
          } else {
            await application.db.insert('FileInfo', {
              token,
              name,
              fakename,
              size,
            });
          }

          application.storage.upload(dirPath, fakename, buffer);
        }

        if (storage === 'pmt') {
          application.sendStructure(channel.user.login, channel.user.token);
        } else {
          setTimeout(async () => {
            await application.db.delete('StorageInfo', `token = '${token}'`);
            await application.storage.delete(
              dirPath,
              names.map(name => name[1])
            );
            await application.storage.deleteFolder(dirPath);
          }, application.storage.tokenLifeTime);
        }

        channel.removeListener('bufferUpload', nextBuffer);
      } catch (error) {
        application.logger.error(error);
      }
    }.bind(channel)();

    gen.next();

    if (storage === 'tmp') return token;
  },
  download: async args => {
    const token = args.token || channel.user.token;
    const { fileList } = args;

    application.validator.token(token);
    await application.validator.tokenExistance(token);
    application.validator.names(fileList);

    const dirPath = path.join(application.storage.storagePath, token);
    const fileInfo = await application.db.select(
      'FileInfo',
      ['*'],
      `token = '${token}'`
    );
    const existingNames = fileInfo.map(item => item.name);
    const fakeNames = fileList.map(
      item => fileInfo[existingNames.indexOf(item)].fakename
    );

    await application.storage.download(dirPath, fakeNames, channel.connection);
  },
  availableFiles: async args => {
    const token = args.token || channel.user.token;

    application.validator.token(token);
    await application.validator.tokenExistance(token);

    const fileInfo = await application.db.select(
      'FileInfo',
      ['*'],
      `token = '${token}'`
    );

    return args.token
      ? fileInfo.map(item => item.name)
      : application.storage.buildStructure(fileInfo);
  },
  newFolder: async ({ name }) => {
    const { token } = channel.user;

    application.validator.name(name);

    const fileInfo = await application.db.select(
      'FileInfo',
      ['*'],
      `token = '${token}'`
    );
    const existingNames = fileInfo.map(item => item.name);
    if (!existingNames.includes(name)) {
      await application.db.insert('FileInfo', {
        token,
        name,
        fakeName: 'folder',
        size: 0,
      });
    }
  },
  rename: async ({ name, newName }) => {
    const { token } = channel.user;

    application.validator.name(name);

    if (name[name.length - 1] === '/') {
      const fileInfo = await application.db.select(
        'FileInfo',
        ['*'],
        `token = '${token}'`
      );

      for (const item of fileInfo) {
        if (item.name.includes(name) && item.name !== name) {
          const dirs =
            item.name[item.name.length - 1] === '/'
              ? item.name.substring(item.name.length - 1, 0).split('/')
              : item.name.split('/');

          dirs[
            dirs.indexOf(name.substring(name.length - 1, 0))
          ] = newName.substring(newName.length - 1, 0);

          const newItemName = dirs.join('/');
          await application.db.update(
            'FileInfo',
            `name = '${newItemName}'`,
            `name = '${item.name}' AND token = '${token}'`
          );
        }
      }
    }
    await application.db.update(
      'FileInfo',
      `name = '${newName}'`,
      `name = '${name}' AND token = '${token}'`
    );
  },
  delete: async ({ fileList }) => {
    const { token } = channel.user;

    application.validator.names(fileList);

    const fileInfo = await application.db.select(
      'FileInfo',
      ['*'],
      `token = '${token}'`
    );
    const existingNames = fileInfo.map(item => item.name);

    for (const item of fileList) {
      const { id } = fileInfo[existingNames.indexOf(item)];
      const links = await application.db.select(
        'Link',
        ['*'],
        `FileId = '${id}'`
      );

      for (const item of links) application.deleteLink(item.token);
      await application.db.delete('FileInfo', `name = '${item}'`);

      if (item[item.length - 1] !== '/') {
        const dirPath = path.join(application.storage.storagePath, token);
        const { fakename } = fileInfo[existingNames.indexOf(item)];

        await application.storage.delete(dirPath, [fakename]);
      }
    }
  },
  restoreSession: async ({ token }) => {
    await application.validator.token(token);

    const session = await channel.session.restoreSession(token);
    const user = await channel.session.getUser('id', `${session.userid}`);
    channel.user = user;
    channel.index = application.saveConnection(user.login, channel.connection);
    return session.token;
  },
  createLink: async ({ name }) => {
    application.validator.name(name);

    await application.validator.token(channel.user.token);
    await application.validator.tokenExistance(channel.user.token);

    return application.createLink(name, channel.user.token);
  },
  authUser: async args => {
    const { login, password } = args.user;

    application.validator.login(login);
    application.validator.password(password);

    const user = await channel.session.getUser('login', login);

    application.validator.passwordMatch(user.password, password);

    const token = generateToken();
    await channel.session.createSession({
      userId: user.id,
      token,
      ip: channel.ip,
    });

    channel.user = user;
    channel.index = application.saveConnection(login, channel.connection);
    return token;
  },
  logOut: async () => channel.session.deleteSession(channel.user.token),
});

module.exports = generateCommands;
