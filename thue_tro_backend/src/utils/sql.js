import { pool } from "../config/database.js";

export async function query(sql, params = [], executor = pool) {
  const [rows] = await executor.execute(sql, params);
  return rows;
}

export async function execute(sql, params = [], executor = pool) {
  const [result] = await executor.execute(sql, params);
  return result;
}
