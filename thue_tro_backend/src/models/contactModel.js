import { query, execute } from "../utils/sql.js";

export const contactModel = {
  findActive(roomId, customerId) {
    return query(
      `SELECT * FROM contact_requests WHERE room_id = ? AND customer_id = ?
       AND status IN ('new', 'called') AND expires_at > NOW() LIMIT 1`,
      [roomId, customerId],
    );
  },
  create(data) {
    return execute(
      `INSERT INTO contact_requests (room_id, customer_id, customer_name, customer_phone, customer_email, message, status, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, 'new', DATE_ADD(NOW(), INTERVAL ? HOUR))`,
      [
        data.room_id,
        data.customer_id,
        data.customer_name,
        data.customer_phone,
        data.customer_email,
        data.message,
        data.ttl_hours,
      ],
    );
  },
  listSent(userId) {
    return query(
      `SELECT cr.*, r.title AS room_title, r.user_id AS owner_id, owner.full_name AS owner_name
       FROM contact_requests cr JOIN rooms r ON r.id = cr.room_id
       JOIN users owner ON owner.id = r.user_id
       WHERE cr.customer_id = ? ORDER BY cr.last_requested_at DESC`,
      [userId],
    );
  },
  listReceived(ownerId) {
    return query(
      `SELECT cr.*, r.title AS room_title, customer.email AS customer_email_live
       FROM contact_requests cr JOIN rooms r ON r.id = cr.room_id
       JOIN users customer ON customer.id = cr.customer_id
       WHERE r.user_id = ? ORDER BY cr.last_requested_at DESC`,
      [ownerId],
    );
  },
  getById(id) {
    return query(
      `SELECT cr.*, r.title AS room_title, r.user_id AS owner_id, r.status AS room_status,
       customer.email AS customer_email_live, owner.full_name AS owner_name
       FROM contact_requests cr JOIN rooms r ON r.id = cr.room_id
       JOIN users customer ON customer.id = cr.customer_id
       JOIN users owner ON owner.id = r.user_id WHERE cr.id = ? LIMIT 1`,
      [id],
    );
  },
  markCalled(id, ttlHours) {
    return execute(
      `UPDATE contact_requests SET status = 'called', owner_contacted_at = NOW(),
       expires_at = DATE_ADD(NOW(), INTERVAL ? HOUR) WHERE id = ? AND status = 'new' AND expires_at > NOW()`,
      [ttlHours, id],
    );
  },
  close(id, reason, expectedStatus = null) {
    const statusClause = expectedStatus ? " AND status = ?" : "";
    return execute(
      `UPDATE contact_requests SET status = 'closed', close_reason = ?, closed_at = NOW(),
       customer_confirmed_at = CASE WHEN ? = 'called' THEN NOW() ELSE customer_confirmed_at END
       WHERE id = ? AND status IN ('new', 'called') AND expires_at > NOW()${statusClause}`,
      [reason, expectedStatus, id, ...(expectedStatus ? [expectedStatus] : [])],
    );
  },
  expire() {
    return execute(
      `UPDATE contact_requests SET status = 'closed', close_reason = 'expired', closed_at = NOW()
       WHERE status IN ('new', 'called') AND expires_at IS NOT NULL AND expires_at <= NOW()`,
    );
  },
};
