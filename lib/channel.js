'use strict';

const { Session } = require('./auth');
const { validateArgs, ServerError } = require('./utils');
const EventEmitter = require('events');

class Channel extends EventEmitter {
  constructor(connection, ip, application) {
    super();
    this.ip = ip;
    this.connection = connection;
    this.application = application;
    this.id = -1;
    this.user = null;
    this.session = new Session(this.application.db);
    this.application.logger.log('Connected ', this.ip);
  }

  isAuthed() {
    return this.user !== null ? true : false;
  }
  
  async liveReload() {
    const fileInfo = await this.application.db.select(
      'FileInfo',
      ['*'],
      `token = '${this.user.token}'`
    );
    const structure = this.application.storage.buildStructure(fileInfo);
    this.application.channels.sendGroup(this.user.login, JSON.stringify({ structure }));
  }

  async message(data) {
    const packet = JSON.parse(data);
    const { callId, msg, args } = packet;
    if (this.application.api.has(msg)) {
      try {
        validateArgs(args);
        const { auth, liveReload, method } = this.application.api.get(msg);
        if (auth === true && this.isAuthed() === false) throw new ServerError(509);
        const result = await method(this, args);
        this.send(JSON.stringify({ callId, result }));
        if (liveReload && this.isAuthed() === true) await this.liveReload();
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

  destroy() {
    this.connection.close();
  }
}

module.exports = Channel;
