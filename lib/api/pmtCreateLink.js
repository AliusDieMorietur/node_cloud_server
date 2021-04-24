({
  auth: true,
  liveReload: false,
  method: async (channel, { name }) => await application.storage.createLink(name, channel.user.token)
})