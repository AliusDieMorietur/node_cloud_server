'use strict';

const path = require('path');
const { threadId } = require('worker_threads');
const Api = require('./api');
const Channels = require('./channels');
const Database = require('./db');
const Logger = require('./logger');
const Static = require('./static');
const Storage = require('./storage');
const dbConfig = require('../config/db');
const serverConfig = require('../config/server');
const API_PATH = path.join(process.cwd(), './lib/api');
const TOKEN_LIFETIME = serverConfig.tokenLifeTime;
const STATIC_PATH = path.join(process.cwd(), './react_cloud_client_web/build');
// const STATIC_PATH = path.join(process.cwd(), '../vue_test/dist');
const STORAGE_PATH = path.join(process.cwd(), './storage/');

class App {
  constructor() {
    this.api = new Api(API_PATH, this);
    this.staticFiles = new Static(STATIC_PATH, this);
    this.channels = new Channels();
    this.logger = new Logger();
    this.storage = new Storage(STORAGE_PATH, TOKEN_LIFETIME, this);
    this.db = new Database(dbConfig);
  }

  async start() {
    try {
      if (threadId === 1) await this.storage.clearExpired();
      await this.staticFiles.loadDirectory();
      this.logger.success('Static loaded');
      await this.api.loadDirectory();
      this.logger.success('Api loaded');
    } catch (error) {
      this.logger.error(error);
      process.exit(0);
    }
  }
}

module.exports = App;
