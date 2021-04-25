({
  auth: true,
  liveReload: true,
  method: async (channel, { fileList }) => {
    let names = await application.db.select('FileInfo', ['name']);
    names = names.map(item => item.name);
    for (const name of fileList) {
      if (!names.includes(name)) throw new utils.ServerError(510);
    }
    return `Files loaded: ${fileList.length}`;
  },
});
