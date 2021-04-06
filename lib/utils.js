'use strict';

const zip = (arr1, arr2) =>
  (arr1.length < arr2.length ? arr2 : arr1).map((item, index) => [
    arr1[index] !== undefined ? arr1[index] : null,
    arr2[index] !== undefined ? arr2[index] : null,
  ]);

const errors = {
  501: 'Invallid name',
  502: 'Username and/or password is incorrect',
  503: 'Invalid token',
  504: 'No such token',
  505: 'Session was not restored',
  506: 'File list is empty',
  507: 'User doesn`t exist',
};

class ServerError extends Error {
  constructor(code) {
    super(errors[code]);
    this.code = code;
  }
}

const CYRILLIC =
  'АаБбВвГгДдЕеЁёЖжЗзИиЙйКкЛлМмНнОоПпРрСсТтУуФфХхЦцЧчШшЩщЪъЫыЬьЭэЮюЯя';
const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const ALPHA = ALPHA_UPPER + ALPHA_LOWER;
const DIGIT = '0123456789';
const ALPHA_DIGIT = ALPHA + DIGIT;
const SPECIAL_SYMBOLS_A = '-_.';
const SPECIAL_SYMBOLS_B = ' ⁄&/«»[]()';
const SPECIAL_SYMBOLS = SPECIAL_SYMBOLS_A + SPECIAL_SYMBOLS_B;
const ALL_SYMBOLS = ALPHA_DIGIT + SPECIAL_SYMBOLS + CYRILLIC;

const checkSymbols = (str, allowedSymbols) => {
  for (const symbol of str) if (!allowedSymbols.includes(symbol)) return false;
  return true;
};

const TOKEN_LENGTH = 32;
const LOGIN_PASSWORD_MIN_LENGTH = 5;
const LOGIN_PASSWORD_MAX_LENGTH = 16;
const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 1024;

class Validator {
  constructor(db) {
    this.db = db;
  }

  login(str) {
    if (!checkSymbols(str, ALPHA_DIGIT + SPECIAL_SYMBOLS_A))
      throw new ServerError(502);
    if (str.length > LOGIN_PASSWORD_MAX_LENGTH) throw new ServerError(502);
    if (str.length < LOGIN_PASSWORD_MIN_LENGTH) throw new ServerError(502);
  }

  password(str) {
    if (!checkSymbols(str, ALPHA_DIGIT)) throw new ServerError(502);
    if (str.length > LOGIN_PASSWORD_MAX_LENGTH) throw new ServerError(502);
    if (str.length < LOGIN_PASSWORD_MIN_LENGTH) throw new ServerError(502);
  }

  passwordMatch(expectedPassword, password) {
    if (expectedPassword !== password) throw new ServerError(502);
  }

  name(str) {
    if (!checkSymbols(str, ALL_SYMBOLS)) throw new ServerError(501);
    if (str[0] === '/') throw new ServerError(501);
    if (str.includes('//')) throw new ServerError(501);
    if (str.length > NAME_MAX_LENGTH) throw new ServerError(501);
    if (str.length < NAME_MIN_LENGTH) throw new ServerError(501);
  }

  token(str) {
    if (!checkSymbols(str, ALPHA_DIGIT)) throw new ServerError(503);
    if (str.length !== TOKEN_LENGTH) throw new ServerError(503);
  }

  async tokenExistance(token) {
    const storages = await this.db.select(
      'StorageInfo',
      ['*'],
      `token = '${token}'`
    );
    if (storages.length === 0) throw new ServerError(504);
  }

  names(fileList) {
    if (fileList.length === 0) throw new ServerError(506);
    for (const name of fileList) this.name(name);
  }
}

module.exports = { Validator, ServerError, zip };
