({
  auth: true,
  liveReload: false,
  method: async channel => {
    const { token } = channel.user;
    const fileInfo = await application.db.select(
      'FileInfo',
      ['*'],
      `token = '${token}'`
    );
    return application.storage.buildStructure(fileInfo);
  },
});
