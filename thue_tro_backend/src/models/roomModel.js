//roomModel

import { query, execute } from "../utils/sql.js";

export const roomModel = {
  async listApproved(filters) {
    const where = ["r.status = 'approved'", "r.deleted_at IS NULL"];
    const params = [];
    if (filters.keyword?.trim()) {
      const value = `%${filters.keyword.trim()}%`;

      where.push(`(
    r.title LIKE ?
    OR r.description LIKE ?
    OR r.address_detail LIKE ?
    OR r.province_name LIKE ?
    OR r.commune_name LIKE ?
    OR u.full_name LIKE ?
  )`);

      params.push(value, value, value, value, value, value);
    }
    if (filters.province_name) {
      where.push("r.province_name = ?");
      params.push(filters.province_name);
    }
    if (filters.commune_name) {
      where.push("r.commune_name = ?");
      params.push(filters.commune_name);
    }
    if (filters.min_price !== undefined) {
      where.push("r.price >= ?");
      params.push(filters.min_price);
    }
    if (filters.max_price !== undefined) {
      where.push("r.price <= ?");
      params.push(filters.max_price);
    }
    if (filters.min_area !== undefined) {
      where.push("r.area >= ?");
      params.push(filters.min_area);
    }
    if (filters.max_area !== undefined) {
      where.push("r.area <= ?");
      params.push(filters.max_area);
    }
    const sortMap = {
      newest: "r.created_at DESC",
      price_asc: "r.price ASC",
      price_desc: "r.price DESC",
      area_desc: "r.area DESC",
    };
    const orderBy = sortMap[filters.sort] || sortMap.newest;
    const whereSql = where.join(" AND ");
    const rows = await query(
      `SELECT r.*, u.full_name AS owner_name,
              (SELECT ROUND(AVG(rv.rating), 1) FROM room_reviews rv WHERE rv.room_id = r.id) AS rating,
              (SELECT COUNT(*) FROM room_reviews rv WHERE rv.room_id = r.id) AS review_count
       FROM rooms r JOIN users u ON u.id = r.user_id
       WHERE ${whereSql} AND u.deleted_at IS NULL AND u.account_status = 'active'
       ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, filters.limit, filters.offset],
    );
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM rooms r JOIN users u ON u.id = r.user_id
       WHERE ${whereSql} AND u.deleted_at IS NULL AND u.account_status = 'active'`,
      params,
    );
    return { rows, total: Number(countRows[0].total) };
  },
  getById(id) {
    return query(
      `SELECT r.*, u.full_name AS owner_name, u.phone AS owner_phone, u.email AS owner_email,
              u.zalo_link AS owner_zalo_link,
              (SELECT ROUND(AVG(rv.rating), 1) FROM room_reviews rv WHERE rv.room_id = r.id) AS rating,
              (SELECT COUNT(*) FROM room_reviews rv WHERE rv.room_id = r.id) AS review_count
       FROM rooms r JOIN users u ON u.id = r.user_id
       WHERE r.id = ? AND r.deleted_at IS NULL LIMIT 1`,
      [id],
    );
  },
  listMine(userId) {
    return query(
      "SELECT * FROM rooms WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC",
      [userId],
    );
  },
  create(userId, data) {
    return execute(
      `INSERT INTO rooms (user_id, title, description, price, area, address_detail, province_name, commune_name, deposit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.title,
        data.description || null,
        data.price,
        data.area,
        data.address_detail,
        data.province_name,
        data.commune_name,
        data.deposit ?? null,
      ],
    );
  },
  async update(id, data) {
    const fields = Object.keys(data);
    const assignments = fields.map((field) => `${field} = ?`).join(", ");
    return execute(
      `UPDATE rooms SET ${assignments}, status = 'pending', moderated_by = NULL, moderated_at = NULL, moderation_note = NULL
       WHERE id = ? AND deleted_at IS NULL`,
      [...fields.map((field) => data[field]), id],
    );
  },
  softDelete(id) {
    return execute(
      "UPDATE rooms SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL",
      [id],
    );
  },
  async listAdmin(status, limit, offset) {
    const params = [];
    let where = "r.deleted_at IS NULL";
    if (status) {
      where += " AND r.status = ?";
      params.push(status);
    }
    const rows = await query(
      `SELECT r.*, u.full_name AS owner_name, u.phone AS owner_phone
       FROM rooms r JOIN users u ON u.id = r.user_id
       WHERE ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    const [count] = await query(
      `SELECT COUNT(*) AS total FROM rooms r WHERE ${where}`,
      params,
    );
    return { rows, total: Number(count.total) };
  },
  moderate(id, adminId, status, note) {
    return execute(
      `UPDATE rooms SET status = ?, moderated_by = ?, moderated_at = NOW(), moderation_note = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [status, adminId, note || null, id],
    );
  },
  getImages(roomId) {
    return query(
      "SELECT id, room_id, cloudinary_public_id, image_url, is_cover, sort_order, created_at FROM room_images WHERE room_id = ? ORDER BY is_cover DESC, sort_order ASC, id ASC",
      [roomId],
    );
  },
  getImagesByRoomIds(roomIds) {
    if (!roomIds.length) return Promise.resolve([]);
    return query(
      `SELECT id, room_id, image_url, is_cover, sort_order FROM room_images
       WHERE room_id IN (${roomIds.map(() => "?").join(",")}) ORDER BY is_cover DESC, sort_order ASC`,
      roomIds,
    );
  },
  addImage(data) {
    return execute(
      "INSERT INTO room_images (room_id, cloudinary_public_id, image_url, is_cover, sort_order) VALUES (?, ?, ?, ?, ?)",
      [
        data.room_id,
        data.cloudinary_public_id,
        data.image_url,
        data.is_cover,
        data.sort_order,
      ],
    );
  },
  getImageById(imageId, roomId) {
    return query(
      "SELECT * FROM room_images WHERE id = ? AND room_id = ? LIMIT 1",
      [imageId, roomId],
    );
  },
  deleteImage(imageId, roomId) {
    return execute("DELETE FROM room_images WHERE id = ? AND room_id = ?", [
      imageId,
      roomId,
    ]);
  },
  deleteImageByPublicId(publicId) {
    return execute("DELETE FROM room_images WHERE cloudinary_public_id = ?", [
      publicId,
    ]);
  },
  async setCover(imageId, roomId) {
    const connection = await (
      await import("../config/database.js")
    ).pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        "UPDATE room_images SET is_cover = FALSE WHERE room_id = ?",
        [roomId],
      );
      const [result] = await connection.execute(
        "UPDATE room_images SET is_cover = TRUE WHERE id = ? AND room_id = ?",
        [imageId, roomId],
      );
      if (!result.affectedRows)
        throw new Error("Không tìm thấy ảnh để đặt làm ảnh đại diện.");
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};
