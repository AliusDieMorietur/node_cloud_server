'use strict';
const readline = require('readline');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const pg = require('pg');
const { Pool } = pg;
const dbConfig = require('../config/db');
const { generateToken } = require('../lib/utils');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = str =>
  new Promise((resolve) => {
    rl.question(str, input => {
      resolve(input);
    });
  });

(async () => {
  try {
    const pool = new Pool(dbConfig);
    let login = process.argv[2] ? process.argv[2] : await ask('Login: ');
    let password = process.argv[3] ? process.argv[3] : await ask('Password: ');
    rl.close();
    if (login.length < 5 && password.length < 5) {
      throw new Error('Too short password or login');
    }
    const userToken = generateToken();
    await pool.query(
      `INSERT INTO SystemUser(Token, Login, Password) ` +
        `VALUES ('${userToken}', '${login}', '${password}')`
    );
    console.log(`User <${login}> created`);
    await pool.query(
      `INSERT INTO  StorageInfo(Token, Expire) VALUES ('${userToken}', 0)`
    );
    await fsp.mkdir(path.join('./storage', userToken));
    console.log(`Storage <${userToken}> for <${login}> created`);
  } catch (error) {
    console.error(error);
  }
})();
