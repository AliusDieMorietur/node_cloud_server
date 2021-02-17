import { Pool } from 'pg';

class Database {
  private pool: Pool;

  constructor(config) {
    this.pool = new Pool(config);
  }

  query(sql: string, values?) {
    return this.pool.query(sql, values);
  }

  insert(table, record) {
    const keys = Object.keys(record);
    const values = Object.values(record).map(el => {
      if (el instanceof Array) return `'{${el}}'`;
      else return `'${el}'`;
    });
    const fields = keys.join(',');
    const params = values.join(',');
    const sql = `INSERT INTO ${table} (${fields}) VALUES (${params})`;
    this.query(sql);
  }

  // refactor required
  async select(table, fields = ['*'], condition = null, limit, offset) {
    let sql = `SELECT ${fields} FROM ${table}`;
    if (condition) sql += ` WHERE ${condition}`;
    if (limit) sql += ` LIMIT ${limit}`;
    if (offset) sql += ` OFFSET ${offset}`;
    return await this.query(sql);
  }

  async exist(condition) {
    return await this.query(`SELECT EXISTS(${condition})`);
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
