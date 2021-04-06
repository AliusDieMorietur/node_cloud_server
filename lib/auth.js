'use strict';

const crypto = require('crypto');
const { ServerError } = require('./utils');

const BYTE = 256;
const TOKEN_LENGTH = 32;
const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const ALPHA = ALPHA_UPPER + ALPHA_LOWER;
const DIGIT = '0123456789';
const ALPHA_DIGIT = ALPHA + DIGIT;

const generateToken = () => {
  const base = ALPHA_DIGIT.length;
  const bytes = crypto.randomBytes(base);
  let key = '';
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    const index = ((bytes[i] * base) / BYTE) | 0;
    key += ALPHA_DIGIT[index];
  }
  return key;
};

class Session {
  constructor(db) {
    this.db = db;
  }

  async createUser({ login, password }, ip) {
    const userToken = generateToken();
    await this.db.insert('SystemUser', { token: userToken, login, password });
    const user = await this.getUser('login', login);
    await this.db.insert('Session', {
      userid: user.id,
      ip,
      token: generateToken(),
    });
    await this.db.insert('StorageInfo', { token: userToken, expire: 0 });
  }

  async getUser(field, data) {
    const res = await this.db.select(
      'SystemUser',
      ['*'],
      `${field} = '${data}'`
    );
    if (!res[0]) throw new ServerError(507);
    return res[0];
  }

  async createSession(args) {
    await this.db.insert('Session', args);
  }

  async deleteSession(token) {
    this.db.delete('Session', `token = '${token}'`);
  }

  async restoreSession(token) {
    const res = await this.db.select('Session', ['*'], `token = '${token}'`);
    if (!res[0]) throw new ServerError(505);
    return res[0];
  }
}

module.exports = { generateToken, Session };
