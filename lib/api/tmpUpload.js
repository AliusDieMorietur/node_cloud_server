({
  auth: false,
  liveReload: false,
  method: async (channel, { fileList }) => {
    const token = utils.generateToken();
    const dirPath = path.join(application.storage.storagePath, token);
    await application.db.insert('StorageInfo', {
      token,
      expire: Date.now() + application.storage.tokenLifeTime,
    });
    await application.storage.createFolder(dirPath);
    const names = fileList.map(name => [name, utils.generateToken()]);
    const iter = names[Symbol.iterator]();
    const last = names[names.length - 1][0];
    const upload = async buffer => {
      const [name, fakename] = iter.next().value;
      const size = Buffer.byteLength(buffer);
      await application.db.insert('FileInfo', {
        token,
        name,
        fakename,
        size,
      });
      application.storage.upload(dirPath, fakename, buffer);
      if (name === last)
        channel.removeListener('bufferUpload', upload);
        setTimeout(async () => {
          await application.db.delete('StorageInfo', `token = '${token}'`);
          await application.storage.delete(
            dirPath,
            names.map(name => name[1])
          );
          await application.storage.deleteFolder(dirPath);
        }, application.storage.tokenLifeTime);
    };
    channel.on('bufferUpload', upload);
    return token;
  },

})