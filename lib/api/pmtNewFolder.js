({
  auth: true,
  liveReload: false,
  method: async (channel, { name }) => {
    const { token } = channel.user;
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
});
