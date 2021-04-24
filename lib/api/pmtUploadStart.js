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
    const names = fileList.map(name => {
      const alreadyExists = fileInfo.find(item => item.name === name);
      return alreadyExists
        ? [name, alreadyExists.fakename, true]
        : [name, utils.generateToken(), false];
    });
    for (const [name, fakename, changed] of names) {
      channel.promises.push(async (buffer) => {
        const size = Buffer.byteLength(buffer);
        if (changed) {
          await application.db.update(
            'FileInfo',
            `size = '${size}'`,
            `name = '${name}' AND token = '${token}'`
          );
        } else {
          await application.db.insert('FileInfo', {
            token,
            name,
            fakename,
            size,
          });
        }
        application.storage.upload(dirPath, fakename, buffer);
      });
    }
  },
})