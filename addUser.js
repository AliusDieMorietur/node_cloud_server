const readline = require("readline");
const fs = require('fs');
const fsp = fs.promises;
const path = require('path')
const pg = require('pg');
const { Pool } = pg;
const crypto = require('crypto');

const BYTE = 256;
const TOKEN_LENGTH = 32;
const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const ALPHA = ALPHA_UPPER + ALPHA_LOWER;
const DIGIT = '0123456789';
const ALPHA_DIGIT = ALPHA + DIGIT;

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async () => {
  try {
    const pool = new Pool({
      user: 'admin',
      host: 'localhost',
      database: 'cloud_storage',
      password: 'admin',
      port: 5432,
    });

    let login = '';
    let password = '';
    rl.question('Login: ', loginInput => {
      rl.question('Password:  ', async passwordInput => {
          if (loginInput.length < 5 && passwordInput.length < 5) 
            throw new Error('Too short password or login');
          login = loginInput;
          password = passwordInput; 
          const userToken = generateToken();
          await pool.query(`INSERT INTO SystemUser(Token, Login, Password) VALUES ('${userToken}', '${login}', '${password}')`);
          console.log(`User <${login}> created`);
          await pool.query(`INSERT INTO  StorageInfo(Token, Expire) VALUES ('${userToken}', 0)`);
          await fsp.mkdir(path.join('./target/storage', userToken));
          console.log(`Storage <${userToken}> for <${login}> created`);
          rl.close();
      });
    });
  } catch (error) {
    console.error(error);
  }

})();