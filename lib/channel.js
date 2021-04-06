'use strict';

const { Session } = require('./auth');
const generateCommands = require('./commands');
const EventEmitter = require('events');

class Channel extends EventEmitter {
  constructor(connection, ip, application) {
    super();
    this.ip = ip;
    this.connection = connection;
    this.application = application;
    this.index = -1;
    this.user = null;
    this.iter = null;
    this.last = null;
    this.session = new Session(this.application.db);
    this.application.logger.log('Connected ', this.ip);
    this.commands = generateCommands(this.application, this);
  }

  async message(data) {
    const packet = JSON.parse(data);
    const { callId, msg, args } = packet;
    if (this.commands[msg]) {
      try {
        const result = await this.commands[msg](args);
        this.send(JSON.stringify({ callId, result }));
        const liveReload = ['newFolder', 'rename', 'delete'];
        if (liveReload.includes(msg))
          this.application.sendStructure(this.user.login, this.user.token);
      } catch (error) {
        this.application.logger.error(error);
        this.send(
          JSON.stringify({
            callId,
            error: { message: error.message, code: error.code },
          })
        );
      }
    }
  }

  async buffer(buffer) {
    this.emit('bufferUpload', buffer);
  }

  send(data) {
    try {
      this.connection.send(data);
    } catch (err) {
      this.application.logger.error(err);
    }
  }
}

module.exports = Channel;
