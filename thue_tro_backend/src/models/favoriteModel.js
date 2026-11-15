import { query, execute } from "../utils/sql.js";

export const favoriteModel = {
  list(userId) {
    return query(
      `SELECT r.*, f.created_at AS favorited_at FROM favorites f
       JOIN rooms r ON r.id = f.room_id
       JOIN users owner ON owner.id = r.user_id
       WHERE f.user_id = ? AND r.status = 'approved' AND r.deleted_at IS NULL
       AND owner.deleted_at IS NULL AND owner.account_status = 'active'
       ORDER BY f.created_at DESC`,
      [userId],
    );
  },
  add(userId, roomId) {
    return execute(
      "INSERT IGNORE INTO favorites (user_id, room_id) VALUES (?, ?)",
      [userId, roomId],
    );
  },
  remove(userId, roomId) {
    return execute("DELETE FROM favorites WHERE user_id = ? AND room_id = ?", [
      userId,
      roomId,
    ]);
  },
  check(userId, roomId) {
    return query(
      "SELECT 1 AS is_favorite FROM favorites WHERE user_id = ? AND room_id = ? LIMIT 1",
      [userId, roomId],
    );
  },
};
