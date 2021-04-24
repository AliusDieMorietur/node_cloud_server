class Channels {  
  constructor() {
    this.channelCounter = 0;
    this.channels = new Map();
    this.groups = new Map();
  }

  get(id) {
    return this.channels.get(id);
  }

  set(connection) {
    this.channels.set(this.channelCounter, connection);
    this.channelCounter++;
    return --this.channelCounter;
  }

  delete(id) {
    this.channels.delete(id);
  }

  setGroup(login, id) {
    const channel = this.channels.get(id);
    if (this.groups.has(login)) {
      const group = this.groups.get(login);
      group[id] = channel;
    } else {
      const group = { [id]: channel };
      this.groups.set(login, group);
    }
  }

  getGroup(login) {
    return this.groups.get(login);
  }

  deleteGroup(login) {
    this.groups.delete(login);
  }

  deleteFromGroup(login, id) {
    const group = this.groups.get(login);
    delete group[id];
  }

  sendGroup(login, data) {
    const group = this.groups.get(login);
    for (const id in group) {
      const channel = group[id];
      channel.send(data);
    }
  }

  closeAll() {
    for (const channel of this.channels) {
      channel.destroy();
    }
  }
}

module.exports = Channels;