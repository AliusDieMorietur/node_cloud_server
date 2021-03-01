import * as fs from 'fs';
import { format } from 'util';
import { threadId } from 'worker_threads';

type LogLevel = 'info' | 'error' | 'warning' | 'success' | 'ext'

const TEXTCOLORS: { [k in LogLevel]: string } = {
  info: '\u001b[37m',
  error: '\u001b[31m',
  warning: '\u001b[33m',
  success: '\u001b[32m',
  ext: '\u001b[46m'
};

const TAGCOLORS = {
  info: '\u001b[47m',
  error: '\u001b[31m',
  warning: '\u001b[43m',
  success: '\u001b[42m',
  ext: '\u001b[34m'
}

const DATETIME_LENGTH = 19;

export class Logger {
  private stream;
  constructor(private logPath: string = './logs/log.txt') {
    this.stream = fs.createWriteStream(this.logPath, { flags: 'a' })
  }

  private write(level: LogLevel, ...args: string[]) {
    const s = format('', ...args);
    const now = new Date().toISOString();
    const date = now.substring(0, DATETIME_LENGTH);
    const tagColor = `${TAGCOLORS[level]}${level === 'info' ? '\u001b[30m': '\u001b[37m'}`;
    const color = `${TEXTCOLORS[level]}\u001b[40;1m`;
    const info = `${date} W${threadId} `;
    const tag = ` ${level.toUpperCase()} `;
    const line = `${s}\n`;

    console.log(color + info + tagColor + tag + color + line + '\x1b[0m');
    this.stream.write(info + tag.trim() + line);
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

