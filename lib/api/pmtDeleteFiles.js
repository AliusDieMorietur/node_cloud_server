({
  auth: true,
  liveReload: true,
  method: async (channel, { fileList }) => {
    const { token } = channel.user;
    const fileInfo = await application.db.select(
      'FileInfo',
      ['*'],
      `token = '${token}'`
    );
    const existingNames = fileInfo.map(item => item.name);
    for (const item of fileList) {
      const { id } = fileInfo[existingNames.indexOf(item)];
      await application.db.delete('FileInfo', `name = '${item}'`);
      if (item[item.length - 1] !== '/') {
        const dirPath = path.join(application.storage.storagePath, token);
        const { fakename } = fileInfo[existingNames.indexOf(item)];
        await application.storage.delete(dirPath, [fakename]);
      }
    }
  },
});
