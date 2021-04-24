({
  auth: false,
  liveReload: false,
  method: async (channel, {}) => {
    const uploadEnd = channel.promises.shift();
    const token = await uploadEnd();
    return token;
  },
})