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
    for (const [name, fakename] of names) {
      channel.promises.push(async buffer => {
        const size = Buffer.byteLength(buffer);
        await application.db.insert('FileInfo', {
          token,
          name,
          fakename,
          size,
        });
        application.storage.upload(dirPath, fakename, buffer);
      });
    }
    channel.promises.push(async () => {
      setTimeout(async () => {
        await application.db.delete('StorageInfo', `token = '${token}'`);
        await application.storage.delete(
          dirPath,
          names.map(name => name[1])
        );
        await application.storage.deleteFolder(dirPath);
      }, application.storage.tokenLifeTime);
      return token;
    });
    return 'ok';
  },
});
