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

(async () => {
  try {
    const pool = new Pool({
      user: 'admin',
      host: 'localhost',
      database: 'cloud_storage',
      password: 'admin',
      port: 5432,
    });
    
    const [ login, password ] = ['Admin', 'Admin'];
    const userToken = generateToken();
    await pool.query(`INSERT INTO SystemUser(Token, Login, Password) VALUES ('${userToken}', '${login}', '${password}')`);
    const query = await pool.query(`SELECT * FROM SystemUser WHERE login = '${login}'`);
    await pool.query(`INSERT INTO Session(UserId, Token) VALUES (${query.rows[0].id}, '${generateToken()}')`);
    await fsp.mkdir(path.join('./target/storage', userToken));
    await fsp.writeFile(
      path.join('./target/storage', userToken + '_info.json'), 
      JSON.stringify({ savedNames: {}, structure: [] })
    );
  } catch (error) {
    console.log(error);
  }
})();