'use strict';
const fs = require('fs');
fs.mkdirSync('./storage', { recursive: true });
fs.mkdirSync('./logs', { recursive: true });
fs.appendFileSync('./logs/log.txt', '');
console.log();
