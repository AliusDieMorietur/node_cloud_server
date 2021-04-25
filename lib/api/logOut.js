({
  auth: false,
  liveReload: false,
  method: async channel => {
    await channel.session.deleteSession(channel.user.token);
    return 'ok'
  },
});
