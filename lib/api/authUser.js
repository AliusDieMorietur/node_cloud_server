({
  auth: false,
  liveReload: false,
  method: async (channel, args) => {
    const { login, password } = args.user;
    const user = await channel.session.getUser('login', login);
    if (user.password !== password) throw new utils.ServerError(502);
    const token = utils.generateToken();
    await channel.session.createSession({
      userId: user.id,
      token,
      ip: channel.ip,
    });
    channel.user = user;
    application.channels.setGroup(user.login, channel.id);
    return token;
  },
});
