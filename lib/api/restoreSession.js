({
  auth: false,
  liveReload: false,
  method: async (channel, { token }) => {
    const session = await channel.session.restoreSession(token);
    const user = await channel.session.getUser('id', `${session.userid}`);
    channel.user = user;
    application.channels.setGroup(user.login, channel.id);
    return session.token;
  },
})