import * as path from 'path';
import Database from './db';
import { generateToken } from './auth';
import { serverConfig } from '../config/server';
import { promises as fsp } from 'fs';

const STORAGE_PATH: string = path.join(process.cwd(), serverConfig.storagePath);

export class Session {
  constructor(private db: Database) {}

  async createUser({ login, password }, ip: string): Promise<void> {
    const userToken = generateToken();
    await this.db.insert('SystemUser', { token: userToken, login, password });
    const user = await this.getUser(login);
    console.log(user);
    await this.db.insert('Session', { userid: user.id, ip, token: generateToken() });
    await fsp.mkdir(path.join(STORAGE_PATH, userToken));
    await fsp.writeFile(
      path.join(STORAGE_PATH, userToken + '_info.json'), 
      JSON.stringify({ savedNames: {}, structure: [] })
    );
  }

  async authUser({ login, password }, ip: string): Promise<string> {
    const user = await this.getUser(login);
    const token = password === password
      ? generateToken()
      : '';
    if (token.length === 0) throw new Error(`Wrong password`);
    const userId = user.id;
    await this.deleteSessions(ip);
    await this.createSession({ userId, token, ip });
    return token;
  }

  async getUser(login: string): Promise<any> {
    const query = await this.db.select('SystemUser', ['*'], `login = '${login}'`);
    const userExists = !!query.rows[0];
    console.log('userExists: ', userExists);
    if (!userExists) throw new Error(`User with name <${login}> doesn't exist`);
    return query.rows[0];
  }

  async createSession(args): Promise<void> {
    await this.db.insert('Session', args);
  }

  async deleteSession(token: string): Promise<void> {
    this.db.delete('Session', `token = '${token}'`);
  }

  async deleteSessions(ip: string): Promise<void> {
    this.db.delete('Session', `ip = '${ip}'`);
  }

  async restoreSession(token: string): Promise<any> {
    const query = await this.db.select('Session', ['*'], `token = '${token}'`)
    return query.rows[0] ? query.rows[0] : null;
  }
}