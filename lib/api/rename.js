({
  auth: false,
  liveReload: true,
  method: async (channel, { name, newName }) => {
    const { token } = channel.user;
    if (name[name.length - 1] === '/') {
      const fileInfo = await application.db.select(
        'FileInfo',
        ['*'],
        `token = '${token}'`
      );
      for (const item of fileInfo) {
        if (item.name.includes(name) && item.name !== name) {
          const dirs =
            item.name[item.name.length - 1] === '/'
              ? item.name.substring(item.name.length - 1, 0).split('/')
              : item.name.split('/');
          dirs[
            dirs.indexOf(name.substring(name.length - 1, 0))
          ] = newName.substring(newName.length - 1, 0);
          const newItemName = dirs.join('/');
          await application.db.update(
            'FileInfo',
            `name = '${newItemName}'`,
            `name = '${item.name}' AND token = '${token}'`
          );
        }
      }
    }
    await application.db.update(
      'FileInfo',
      `name = '${newName}'`,
      `name = '${name}' AND token = '${token}'`
    );
  }
})