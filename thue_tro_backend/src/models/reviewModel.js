import { query, execute } from "../utils/sql.js";

export const reviewModel = {
  listByRoom(roomId) {
    return query(
      `SELECT rr.*, u.full_name, u.avatar_url FROM room_reviews rr
       JOIN users u ON u.id = rr.user_id WHERE rr.room_id = ? ORDER BY rr.created_at DESC`,
      [roomId],
    );
  },
  findById(id) {
    return query("SELECT * FROM room_reviews WHERE id = ? LIMIT 1", [id]);
  },
  create(roomId, userId, data) {
    return execute(
      "INSERT INTO room_reviews (room_id, user_id, rating, comment) VALUES (?, ?, ?, ?)",
      [roomId, userId, data.rating, data.comment || null],
    );
  },
  update(id, data) {
    return execute(
      "UPDATE room_reviews SET rating = ?, comment = ? WHERE id = ?",
      [data.rating, data.comment || null, id],
    );
  },
  remove(id) {
    return execute("DELETE FROM room_reviews WHERE id = ?", [id]);
  },
};
