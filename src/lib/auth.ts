import { App } from './app';
import * as crypto from 'crypto';

const BYTE = 256;
const TOKEN_LENGTH = 32;
const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const ALPHA = ALPHA_UPPER + ALPHA_LOWER;
const DIGIT = '0123456789';
const ALPHA_DIGIT = ALPHA + DIGIT;

export const generateToken = (): string => {
  const base = ALPHA_DIGIT.length;
  const bytes = crypto.randomBytes(base);
  let key = '';
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    const index = ((bytes[i] * base) / BYTE) | 0;
    key += ALPHA_DIGIT[index];
  }
  return key;
};

type SessionColumn = {
  id: number,
  userid: number,
  ip: string,
  token: string
}

export class Session {
  constructor() {}

  async createUser({ login, password }, ip: string): Promise<void> {
    const userToken = generateToken();
    await App.db.insert('SystemUser', { token: userToken, login, password });
    const user = await this.getUser('login', login);
    console.log(user);
    await App.db.insert('Session', { userid: user.id, ip, token: generateToken() });
    await App.db.insert('StorageInfo', { token: userToken, expire: 0 });
  }

  async getUser(field: string, data: string): Promise<any> {
    const res = await App.db.select('SystemUser', ['*'], `${field} = '${data}'`);
    const userExists = !!res[0];
    console.log('userExists: ', userExists);
    if (!userExists) throw new Error(`User with ${field} <${data}> doesn't exist`);
    return res[0];
  }

  async createSession(args): Promise<void> {
    await App.db.insert('Session', args);
  }

  async deleteSession(token: string): Promise<void> {
    App.db.delete('Session', `token = '${token}'`);
  }

  async restoreSession(token: string): Promise<SessionColumn> {
    const res = await App.db.select('Session', ['*'], `token = '${token}'`)
    return res[0] ? res[0] : null;
  }
}