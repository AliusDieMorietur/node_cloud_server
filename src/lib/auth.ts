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

export class Session {
  static async createUser({ login, password }, ip: string) {
    const userToken = generateToken();
    await App.db.insert('SystemUser', { token: userToken, login, password });
    const user = await this.getUser('login', login);
    await App.db.insert('Session', { userid: user.id, ip, token: generateToken() });
    await App.db.insert('StorageInfo', { token: userToken, expire: 0 });
  }

  static async getUser(field: string, data: string) {
    const res = await App.db.select('SystemUser', ['*'], `${field} = '${data}'`);
    const userExists = !!res[0];
    if (!userExists) throw new Error(`User with ${field} <${data}> doesn't exist`);
    return res[0];
  }

  static async createSession(args) {
    await App.db.insert('Session', args);
  }

  static async deleteSession(token: string){
    App.db.delete('Session', `token = '${token}'`);
  }

  static async restoreSession(token: string) {
    const res = await App.db.select('Session', ['*'], `token = '${token}'`)
    return res[0] ? res[0] : null;
  }
}