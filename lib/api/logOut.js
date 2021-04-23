({
  auth: false,
  liveReload: false,
  method: async (channel) => channel.session.deleteSession(channel.user.token)
})