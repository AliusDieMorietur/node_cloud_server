// export const zip = (arr1, arr2) => {
//   const [longest, shortest] = arr1.length < arr2.length
//   ? [arr2, arr1]
//   : [arr1, arr2];
  
//   return longest.map((item, index) => [
//     item, 
//     shortest[index] ? shortest[index] : null  
//   ]);
// }

export const zip = (arr1, arr2) => 
  (arr1.length < arr2.length ? arr2 : arr1)
    .map((item, index) => [
      arr1[index] !== undefined ? arr1[index] : null, 
      arr2[index] !== undefined ? arr2[index] : null  
    ]);

const CYRILLIC = 'АаБбВвГгДдЕеЁёЖжЗзИиЙйКкЛлМмНнОоПпРрСсТтУуФфХхЦцЧчШшЩщЪъЫыЬьЭэЮюЯя';
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
  for (const symbol of str) 
    if (!allowedSymbols.includes(symbol)) 
      return false;

  return true;
};

const TOKEN_LENGTH = 32;
const LOGIN_PASSWORD_MIN_LENGTH = 5;
const LOGIN_PASSWORD_MAX_LENGTH = 16;
const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 1024;

export const validate = {
  login: str => 
    checkSymbols(str, ALPHA_DIGIT + SPECIAL_SYMBOLS_A) &&
    str.length <= LOGIN_PASSWORD_MAX_LENGTH &&
    str.length >= LOGIN_PASSWORD_MIN_LENGTH,
  password: str =>     
    checkSymbols(str, ALPHA_DIGIT) &&
    str.length <= LOGIN_PASSWORD_MAX_LENGTH &&
    str.length >= LOGIN_PASSWORD_MIN_LENGTH,
  token: str =>     
    checkSymbols(str, ALPHA_DIGIT) &&
    str.length === TOKEN_LENGTH,
  name: str => 
    checkSymbols(str, ALL_SYMBOLS) &&
    str[0] !== '/' &&
    !str.includes('//') &&
    str.length <= NAME_MAX_LENGTH &&
    str.length >= NAME_MIN_LENGTH,
};


