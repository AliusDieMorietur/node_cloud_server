'use strict';

const zip = (arr1, arr2) =>
  (arr1.length < arr2.length ? arr2 : arr1).map((item, index) => [
    arr1[index] !== undefined ? arr1[index] : null,
    arr2[index] !== undefined ? arr2[index] : null,
  ]);
/*eslint-disable */
// export class CustomError extends Error {
//   static InvalidName = new CustomError(501, 'Invallid name');
//   static IncorrectLoginPassword = new CustomError(502, 'Username and/or password is incorrect');
//   static InvalidToken = new CustomError(503, 'Invalid token');
//   static NoSuchToken = new CustomError(504, 'No such token');
//   static SessionNotRestored = new CustomError(505, 'Session was not restored');
//   static EmptyFileList = new CustomError(506, 'File list is empty');
//   static NoSuchUser = new CustomError(507, 'User doesn`t exist');

//   constructor(readonly code, readonly message) {
//     this.code = code;
//     super();
//   }
// }

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
    if (
      !(
        checkSymbols(str, ALPHA_DIGIT + SPECIAL_SYMBOLS_A) &&
        str.length <= LOGIN_PASSWORD_MAX_LENGTH &&
        str.length >= LOGIN_PASSWORD_MIN_LENGTH
      )
    ) {
      // throw CustomError.IncorrectLoginPassword;
    }
  }

  password(str) {
    if (
      !(
        checkSymbols(str, ALPHA_DIGIT) &&
        str.length <= LOGIN_PASSWORD_MAX_LENGTH &&
        str.length >= LOGIN_PASSWORD_MIN_LENGTH
      )
    ) {
      // throw CustomError.IncorrectLoginPassword;
    }
  }

  passwordMatch(expectedPassword, password) {
    if (expectedPassword !== password) throw CustomError.IncorrectLoginPassword;
  }

  name(str) {
    if (
      !(
        checkSymbols(str, ALL_SYMBOLS) &&
        str[0] !== '/' &&
        !str.includes('//') &&
        str.length <= NAME_MAX_LENGTH &&
        str.length >= NAME_MIN_LENGTH
      )
    ) {
      // throw CustomError.InvalidName;
    }
  }

  token(str) {
    if (!(checkSymbols(str, ALPHA_DIGIT) && str.length === TOKEN_LENGTH)) {
      // throw CustomError.InvalidToken;
    }
  }

  async tokenExistance(token) {
    const storages = await this.db.select(
      'StorageInfo',
      ['*'],
      `token = '${token}'`
    );
    // if (storages.length === 0) throw CustomError.NoSuchToken;
  }

  names(fileList) {
    // if (fileList.length === 0) CustomError.EmptyFileList;

    for (const name of fileList) this.name(name);
  }
}

/*eslint-enable */

module.exports = { Validator, zip };
