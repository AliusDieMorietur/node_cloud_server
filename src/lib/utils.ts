export const zip = (arr1, arr2) => {
  const [longest, shortest] = arr1.length < arr2.length
  ? [arr2, arr1]
  : [arr1, arr2];
  
  return longest.map((item, index) => [
    item, 
    shortest[index] ? shortest[index] : null  
  ]);
}

const TOKEN_LENGTH = 32;
const LOGIN_PASSWORD_LENGTH = 16;
const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const ALPHA = ALPHA_UPPER + ALPHA_LOWER;
const DIGIT = '0123456789';
const ALPHA_DIGIT = ALPHA + DIGIT;


const inputs = {
  login: str => {
    return  new RegExp('/\W/').test(str);
  },
  password: str => {

  },
  token: str => {

  },
  name: str => {

  }
};

export const validate = (input, str) => {
  return inputs[input](str);
};
