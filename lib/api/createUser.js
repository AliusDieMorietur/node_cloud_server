({
  auth: false,
  liveReload: false,
  method: async (channel, args) => {
    const { login, password } = args.user;
    const token = utils.generateToken();
    await application.db.insert('SystemUser', { token, login, password });
    application.logger.success(`User <${login}> created`);
    await application.db.insert('StorageInfo', { token, expire: 0 });
    const folderPath = path.join(application.storage.storagePath, token);
    await application.storage.createFolder(folderPath);
    application.logger.success(`Storage <${token}> for <${login}> created`);
  },
});
