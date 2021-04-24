({
  auth: true,
  liveReload: false,
  method: async (channel, { fileList }) => {
    const { token } = channel.user;
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