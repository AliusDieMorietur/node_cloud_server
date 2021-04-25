'use strict';
const crypto = require('crypto');
const path = require('path');

const BYTE = 256;
const TOKEN_LENGTH = 32;
const LOGIN_PASSWORD_MIN_LENGTH = 5;
const LOGIN_PASSWORD_MAX_LENGTH = 16;
const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 1024;
const CYRILLIC =
  'АаБбВвГгДдЕеЁёЖжЗзИиЙйКкЛлМмНнОоПпРрСсТтУуФфХхЦцЧчШшЩщЪъЫыЬьЭэЮюЯя';
const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const ALPHA = ALPHA_UPPER + ALPHA_LOWER;
const DIGIT = '0123456789';
const ALPHA_DIGIT = ALPHA + DIGIT;
const SPECIAL_SYMBOLS_A = '-_.';
const SPECIAL_SYMBOLS_B = ',– ⁄&/«»[]()';
const SPECIAL_SYMBOLS = SPECIAL_SYMBOLS_A + SPECIAL_SYMBOLS_B;
const ALL_SYMBOLS = ALPHA_DIGIT + SPECIAL_SYMBOLS + CYRILLIC;
const errors = {
  501: 'Invallid name',
  502: 'Username and/or password is incorrect',
  503: 'Invalid token',
  504: 'No such token',
  505: 'Session was not restored',
  506: 'File list is empty',
  507: 'User doesn\'t exist',
  508: 'Corrupted args',
  509: 'Not authed',
  510: 'Files lost',
  511: 'File load timeout',
};

// Example: copyFolder('./lib/react_cloud_client_web/build', './static', ['less', 'jsx_src']);
const copyFolder = (from, to, excludeFolders = [], excludeFiles = []) => {
  fs.readdir(from, { withFileTypes: true }, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      const concatFrom = path.join(from, file.name);
      const concatTo = path.join(to, file.name);

      if (file.isDirectory() && !excludeFolders.includes(file.name)) {
        copy(concatFrom, concatTo);
      }

      if (!file.isDirectory() && !excludeFiles.includes(file.name)) {
        fs.mkdirSync(to, { recursive: true });
        fs.copyFileSync(concatFrom, concatTo);
      }
    }
  });
};

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

const toUnix = filePath =>
  process.platform === 'win32'
    ? filePath.split(path.sep).join(path.posix.sep)
    : filePath;

const zip = (arr1, arr2) =>
  (arr1.length < arr2.length ? arr2 : arr1).map((item, index) => [
    arr1[index] !== undefined ? arr1[index] : null,
    arr2[index] !== undefined ? arr2[index] : null,
  ]);

class ServerError extends Error {
  constructor(code) {
    super(errors[code]);
    this.code = code;
  }
}

const checkSymbols = (str, allowedSymbols) => {
  for (const symbol of str) if (!allowedSymbols.includes(symbol)) return false;
  return true;
};

const argsCheck = {
  user: ({ login, password }) => {
    argsCheck['login'](login);
    argsCheck['password'](password);
  },
  login: str => {
    if (!checkSymbols(str, ALPHA_DIGIT + SPECIAL_SYMBOLS_A))
      throw new ServerError(502);
    if (str.length > LOGIN_PASSWORD_MAX_LENGTH) throw new ServerError(502);
    if (str.length < LOGIN_PASSWORD_MIN_LENGTH) throw new ServerError(502);
  },
  password: str => {
    if (!checkSymbols(str, ALPHA_DIGIT)) throw new ServerError(502);
    if (str.length > LOGIN_PASSWORD_MAX_LENGTH) throw new ServerError(502);
    if (str.length < LOGIN_PASSWORD_MIN_LENGTH) throw new ServerError(502);
  },
  name: str => {
    if (!checkSymbols(str, ALL_SYMBOLS)) throw new ServerError(501);
    if (str[0] === '/') throw new ServerError(501);
    if (str.includes('//')) throw new ServerError(501);
    if (str.length > NAME_MAX_LENGTH) throw new ServerError(501);
    if (str.length < NAME_MIN_LENGTH) throw new ServerError(501);
  },
  newName: str => {
    argsCheck['name'](str);
  },
  fileList: fileList => {
    if (fileList.length === 0) throw new ServerError(506);
    for (const name of fileList) argsCheck['name'](name);
  },
  token: str => {
    if (!checkSymbols(str, ALPHA_DIGIT)) throw new ServerError(503);
    if (str.length !== TOKEN_LENGTH) throw new ServerError(503);
  },
};

const validateArgs = args => {
  for (const key in args) {
    if (argsCheck[key]) argsCheck[key](args[key]);
    else throw new ServerError(508);
  }
};

module.exports = { generateToken, validateArgs, ServerError, zip, toUnix };
