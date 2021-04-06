'use strict';

const fs = require('fs');
const { format } = require('util');
const { threadId } = require('worker_threads');

const CLEAR = '\x1b[0m';

const TEXTCOLORS = {
  info: '\u001b[37m',
  error: '\u001b[31m',
  warning: '\u001b[33m',
  success: '\u001b[32m',
  ext: '\u001b[46m',
};

const TAGCOLORS = {
  info: '\u001b[47m',
  error: '\u001b[31m',
  warning: '\u001b[43m',
  success: '\u001b[42m',
  ext: '\u001b[34m',
};

const DATETIME_LENGTH = 19;

class Logger {
  constructor() {
    this.logPath = './logs/log.txt';
    this.stream = fs.createWriteStream(this.logPath, { flags: 'a' });
  }

  write(level, ...args) {
    const s = format('', ...args);
    const now = new Date().toISOString();
    const date = now.substring(0, DATETIME_LENGTH);
    const tagColor = `${TAGCOLORS[level]}${
      level === 'info' ? '\u001b[30m' : '\u001b[37m'
    }`;
    const color = `${TEXTCOLORS[level]}`;
    const info = `${date} W${threadId} `;
    const tag = ` ${level.toUpperCase()} `;
    const line = `${s}\n`;

    console.log(color + info + tagColor + tag + CLEAR + color + line + CLEAR);
    this.stream.write(info + tag.trim() + line);
  }

  log(...args) {
    this.write('info', ...args);
  }

  error(...args) {
    this.write('error', ...args);
  }

  success(...args) {
    this.write('success', ...args);
  }

  ext(...args) {
    this.write('ext', ...args);
  }
}

module.exports = Logger;
