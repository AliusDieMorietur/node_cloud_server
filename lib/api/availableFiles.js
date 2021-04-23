({
  auth: false,
  liveReload: false,
  method: async (channel, { token }) => {
    const storages = await application.db.select(
      'StorageInfo',
      ['*'],
      `token = '${token}'`
    );
    if (storages.length === 0) throw new utils.ServerError(504);
    const fileInfo = await application.db.select(
      'FileInfo',
      ['*'],
      `token = '${token}'`
    );
    return fileInfo.map(item => item.name);
  }
})