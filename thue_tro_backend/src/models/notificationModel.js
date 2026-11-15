import { query, execute } from "../utils/sql.js";

export const notificationModel = {
  create(data) {
    return execute(
      "INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)",
      [
        data.user_id,
        data.type,
        data.title,
        data.message,
        data.data ? JSON.stringify(data.data) : null,
      ],
    );
  },
  async list(userId, limit, offset) {
    const rows = await query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [userId, limit, offset],
    );
    const [count] = await query(
      "SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?",
      [userId],
    );
    return { rows, total: Number(count.total) };
  },
  countUnread(userId) {
    return query(
      "SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND read_at IS NULL",
      [userId],
    );
  },
  markRead(id, userId) {
    return execute(
      "UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ? AND read_at IS NULL",
      [id, userId],
    );
  },
  markAllRead(userId) {
    return execute(
      "UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL",
      [userId],
    );
  },
};
