'use strict';

const { Pool } = require('pg');

class Database {
  constructor(config) {
    this.pool = new Pool(config);
  }

  query(sql, values) {
    console.log(`\x1b[38;2;255;100;255mSQL: [ ${sql} ]\x1b[0m\n`);
    return this.pool.query(sql, values);
  }

  async insert(table, record) {
    const keys = Object.keys(record);
    const values = Object.values(record).map(el => {
      if (el instanceof Array) return `'{${el}}'`;
      else return `'${el}'`;
    });
    const fields = keys.join(',');
    const params = values.join(',');
    const sql = `INSERT INTO ${table} (${fields}) VALUES (${params})`;
    return this.query(sql);
  }

  // refactor required
  async select(table, fields = ['*'], condition, limit, offset) {
    let sql = `SELECT ${fields} FROM ${table}`;
    if (condition) sql += ` WHERE ${condition}`;
    if (limit) sql += ` LIMIT ${limit}`;
    if (offset) sql += ` OFFSET ${offset}`;
    const res = await this.query(sql);
    return res.rows;
  }

  async exists(condition) {
    return this.query(`SELECT EXISTS(${condition})`);
  }

  delete(table, condition = null) {
    const sql = `DELETE FROM ${table} WHERE ${condition}`;
    return this.query(sql);
  }

  update(table, delta = null, condition = null) {
    const sql = `UPDATE ${table} SET ${delta} WHERE ${condition}`;
    return this.query(sql);
  }

  close() {
    this.pool.end();
  }
}

module.exports = Database;
