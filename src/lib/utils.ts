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

const TOKEN_LENGTH = 32;
const LOGIN_PASSWORD_MIN_LENGTH = 5;
const LOGIN_PASSWORD_MAX_LENGTH = 16;
const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 1024;

export const validate = {
  login: str => 
    new RegExp('^[A-Za-z0-9_.]+$').test(str) &&
    str.length <= LOGIN_PASSWORD_MAX_LENGTH &&
    str.length >= LOGIN_PASSWORD_MIN_LENGTH,
  password: str =>     
    new RegExp('^[A-Za-z0-9]+$').test(str) &&
    str.length <= LOGIN_PASSWORD_MAX_LENGTH &&
    str.length >= LOGIN_PASSWORD_MIN_LENGTH,
  token: str =>     
    new RegExp('^[A-Za-z0-9]+$').test(str) &&
    str.length === TOKEN_LENGTH,
  name: str => 
    new RegExp('^[A-Za-z0-9\-/_.() ]+$').test(str) &&
    str[0] !== '/' &&
    !str.includes('//') &&
    str.length <= NAME_MAX_LENGTH &&
    str.length >= NAME_MIN_LENGTH,
};


