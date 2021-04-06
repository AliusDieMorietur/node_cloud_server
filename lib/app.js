'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const Logger = require('./logger');
const Database = require('./db');
const Storage = require('./storage');
const serverConfig = require('../config/server');
const dbConfig = require('../config/db');
const { generateToken } = require('./auth');
const { Validator } = require('./utils');

const TOKEN_LIFETIME = serverConfig.tokenLifeTime;
const STORAGE_PATH = path.join(process.cwd(), serverConfig.storagePath);
const STATIC_PATH = path.join(process.cwd(), './static');

const toUnix = filePath =>
  process.platform === 'win32'
    ? filePath.split(path.sep).join(path.posix.sep)
    : filePath;

class App {
  constructor() {
    this.staticFiles = new Map();
    this.link = new Map();
    this.connections = new Map();
    this.logger = new Logger();
    this.storage = new Storage(STORAGE_PATH, TOKEN_LIFETIME);
    this.db = new Database(dbConfig);
    this.validator = new Validator(this.db);
  }

  saveConnection(login, connection) {
    const connections = this.connections.has(login)
      ? this.connections.get(login)
      : this.connections.set(login, []).get(login);
    return connections.push(connection) - 1;
  }

  deleteConnection(login, index) {
    if (this.connections.has(login)) this.connections.get(login)[index] = null;
  }

  getStatic(filePath) {
    return this.staticFiles.get(filePath);
  }

  async createLink(name, userToken) {
    const fileInfo = await this.db.select(
      'FileInfo',
      ['*'],
      `token = '${userToken}' AND name = '${name}'`
    );
    const file = fileInfo[0];

    if (!userToken || !file) throw new Error('No such file');

    const token = generateToken();
    const link = `${userToken}:${file.fakename}:${name}`;

    this.links.set(token, link);
    await this.db.insert('Link', { fileid: file.id, token, link });
    return token;
  }

  getLink(token) {
    return this.links.get(token);
  }

  deleteLink(token) {
    this.links.delete(token);
  }

  async loadLinks() {
    const links = await this.db.select('Link');
    for (const row of links) this.links.set(row.token, row.link);
  }

  async loadFile(filePath, storage) {
    try {
      const file = await fsp.readFile(filePath);
      storage.set(toUnix(filePath.slice(STATIC_PATH.length)), file);
    } catch (err) {
      this.logger.error(err);
    }
  }

  async loadDirectory(dirPath, place) {
    try {
      const files = await fsp.readdir(dirPath, { withFileTypes: true });
      for (const file of files) {
        if (file.name.startsWith('.')) continue;
        const filePath = path.join(dirPath, file.name);
        if (file.isDirectory()) await this.loadDirectory(filePath, place);
        else await this.loadFile(filePath, place);
      }
    } catch (err) {
      this.logger.error(err);
    }
  }

  async clearExpired() {
    let tokenCounter = 0;
    let fileCounter = 0;
    try {
      const storageInfo = await this.db.select('StorageInfo', ['*']);

      for (const item of storageInfo) {
        const expire = Number(item.expire);
        if (expire !== 0 && Date.now() > expire) {
          const { token } = item;
          const fileInfo = await this.db.select(
            'FileInfo',
            ['*'],
            `token = '${token}'`
          );
          const fakeNames = fileInfo.map(item => item.fakename);
          const dirPath = path.join(this.storage.storagePath, token);

          await this.db.delete('StorageInfo', `token = '${token}'`);
          await this.storage.delete(dirPath, fakeNames);
          await this.storage.deleteFolder(dirPath);
          fileCounter += fakeNames.length;
          tokenCounter++;
        }
      }

      this.logger.log(
        `Files deleted: ${fileCounter} Tokens expired: ${tokenCounter}`
      );
    } catch (err) {
      this.logger.error(err);
    }
  }

  sendAllDevices(login, data) {
    const connections = this.connections.get(login);
    for (const connection of connections.filter(el => el !== null)) {
      connection.send(data);
    }
  }

  async sendStructure(login, token) {
    const fileInfo = await this.db.select(
      'FileInfo',
      ['*'],
      `token = '${token}'`
    );
    const structure = this.storage.buildStructure(fileInfo);
    this.sendAllDevices(login, JSON.stringify({ structure }));
  }

  async start() {
    try {
      await this.loadLinks();
      this.logger.success('Links loaded');
      await this.loadDirectory(STATIC_PATH, this.staticFiles);
      this.logger.success('Static loaded');
    } catch (error) {
      this.logger.error(error);
    }
  }
}

module.exports = App;
