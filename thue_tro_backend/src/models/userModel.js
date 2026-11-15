import { query, execute } from "../utils/sql.js";

export const userModel = {
  findByEmail(email) {
    return query(
      "SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1",
      [email],
    );
  },
  findById(id) {
    return query(
      `SELECT id, full_name, email, phone, zalo_link, role, account_status, avatar_url, created_at, updated_at
       FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id],
    );
  },
  create(data) {
    return execute(
      "INSERT INTO users (full_name, email, phone, zalo_link, password_hash) VALUES (?, ?, ?, ?, ?)",
      [data.full_name, data.email, data.phone, data.zalo_link, data.password_hash],
    );
  },
  updateProfile(id, data) {
    const fields = Object.keys(data);
    const assignments = fields.map((field) => `${field} = ?`).join(", ");
    return execute(
      `UPDATE users SET ${assignments} WHERE id = ? AND deleted_at IS NULL`,
      [...fields.map((f) => data[f]), id],
    );
  },
  updatePassword(id, passwordHash) {
    return execute("UPDATE users SET password_hash = ? WHERE id = ?", [
      passwordHash,
      id,
    ]);
  },
  updateAvatar(id, avatarUrl) {
    return execute("UPDATE users SET avatar_url = ? WHERE id = ?", [
      avatarUrl,
      id,
    ]);
  },
};
