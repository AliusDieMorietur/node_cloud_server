import * as fs from 'fs';
import { format } from 'util';
import { threadId } from 'worker_threads';

type LogLevel = 'info' | 'error' | 'warning' | 'success' | 'ext'

const COLORS: { [k in LogLevel]: string } = {
  info: '\u001b[37m',
  error: '\u001b[31m',
  warning: '\u001b[33m',
  success: '\u001b[32m',
  ext: '\u001b[34m'
};

const DATETIME_LENGTH = 19;

export class Logger { 
  private stream = fs.createWriteStream('./logs/log.txt', { flags: 'a' })

  private write(level: LogLevel, ...args: string[]) {
    const s = format('', ...args);
    const now = new Date().toISOString();
    const date = now.substring(0, DATETIME_LENGTH);
    const color = COLORS[level];
    const line = `${date} W${threadId} [${level}]${s}\n`;

    console.log(color + line + '\x1b[0m');
    this.stream.write(line);
  }

  log(...args: string[]) {
    this.write('info', ...args);
  }

  error(...args: string[]) {
    this.write('error', ...args);
  }

  success(...args: string[]) {
    this.write('success', ...args);
  }

  ext(...args: string[]) {
    this.write('ext', ...args);
  }
}

