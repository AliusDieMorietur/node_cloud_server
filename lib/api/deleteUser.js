({
  auth: true,
  liveReload: false,
  method: async (channel, {}) => {
    const { token } = channel.user;
    const folderPath = path.join(application.storage.storagePath, token);
    await application.storage.deleteFolder(folderPath);
    await application.db.delete('SystemUser', `token = '${token}'`);
    await application.db.delete('StorageInfo', `token = '${token}'`);
  },
});
