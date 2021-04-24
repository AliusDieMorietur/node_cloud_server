({
  auth: false,
  liveReload: false,
  method: async (channel, { token, fileList }) => {
    const storages = await application.db.select(
      'StorageInfo',
      ['*'],
      `token = '${token}'`
    );
    if (storages.length === 0) throw new utils.ServerError(504);
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
})