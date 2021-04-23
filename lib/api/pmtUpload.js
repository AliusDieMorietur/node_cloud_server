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
    const iter = names[Symbol.iterator]();
    const last = names[names.length - 1][0];
    const upload = async buffer => {
      const [name, fakename, changed] = iter.next().value;
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
      if (name === last) {
        channel.removeListener('bufferUpload', upload);
        await channel.liveReload();
      }
    };
    channel.on('bufferUpload', upload);
  },

})