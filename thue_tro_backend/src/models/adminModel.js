// adminModel

import { query, execute } from "../utils/sql.js";

export const adminModel = {
  async dashboard() {
    const [users] = await query(
      "SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL",
    );
    const [rooms] = await query(
      "SELECT COUNT(*) AS total FROM rooms WHERE deleted_at IS NULL",
    );
    const [pending] = await query(
      "SELECT COUNT(*) AS total FROM rooms WHERE status = 'pending' AND deleted_at IS NULL",
    );
    const [contacts] = await query(
      "SELECT COUNT(*) AS total FROM contact_requests WHERE status IN ('new', 'called')",
    );
    return {
      users: Number(users.total),
      rooms: Number(rooms.total),
      pending_rooms: Number(pending.total),
      active_contact_requests: Number(contacts.total),
    };
  },
  async listUsers(limit, offset) {
    const rows = await query(
      `SELECT id, full_name, email, phone, role, account_status, created_at
       FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset],
    );
    const [count] = await query(
      "SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL",
    );
    return { rows, total: Number(count.total) };
  },
  lockUser(id) {
    return execute(
      "UPDATE users SET account_status = 'locked' WHERE id = ? AND role <> 'admin' AND deleted_at IS NULL",
      [id],
    );
  },
  unlockUser(id) {
    return execute(
      "UPDATE users SET account_status = 'active' WHERE id = ? AND deleted_at IS NULL",
      [id],
    );
  },
  softDeleteUser(id) {
    return execute(
      "UPDATE users SET deleted_at = NOW(), account_status = 'locked' WHERE id = ? AND role <> 'admin' AND deleted_at IS NULL",
      [id],
    );
  },
};
