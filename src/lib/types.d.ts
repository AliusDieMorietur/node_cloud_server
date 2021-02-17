/// <reference types="node" />
import * as ws from 'ws';
import { Pool } from 'pg';
import { Worker } from 'worker_threads';

type LogLevel = 'info' | 'error' | 'warning' | 'success' | 'ext'

export class Logger {
  private stream;
  private write;
  log(...args: string[]): void;
  error(...args: string[]): void;
  success(...args: string[]): void;
  ext(...args: string[]): void;
}

export class App {
  logger: Logger;
  static: Map<string, Buffer>;
  getStatic(filePath: string): Buffer;
  getInfo(token: string): Promise<object>;
  folderTimeout(folderPath: string, time: number): Promise<void>
  clearExpired(): Promise<void>
  loadFile(filePath: string, storage: Map<String, Buffer>): Promise<void>
  loadDirectory(dirPath: string): Promise<void>
  start(): Promise<void>
}
  
export const generateToken: () => string;

export class Channel {
  private application: App;
  private connection: ws;
  private token: string;
  private buffers: Buffer[];
  private actions;
  constructor(connection: ws, application: App);
  message(data: any): Promise<void>;
  send(data: any): void;
}

export class Client {
  private req;
  private res;
  private application;
  constructor(req, res, application: App);
  static(): void;
}

export class Launcher {
  count: number;
  workers: Worker[];
  private stop;
  private startWorker;
  start(): Promise<void>;
}

export class Server {
  application: App;
  instance: any;
  ws: ws;
  constructor(application: App);
  close(): Promise<void>;
}

export class Database {
  private pool: Pool;
  query(sql: string, values?) 
  insert(table, record)
  select(table, fields: string[], condition: string, limit: number, offset: number): Promise<any>
  exist(condition): Promise<any>
  delete(table, condition: string)
  update(table, delta, condition: string)
  close()
}

