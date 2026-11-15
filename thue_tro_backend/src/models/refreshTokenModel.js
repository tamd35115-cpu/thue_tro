import { query, execute } from "../utils/sql.js";

export const refreshTokenModel = {
  create(data, executor) {
    return execute(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.token_hash,
        data.expires_at,
        data.user_agent,
        data.ip_address,
      ],
      executor,
    );
  },
  findByHash(tokenHash) {
    return query(
      `SELECT rt.*, u.account_status, u.deleted_at
       FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = ? LIMIT 1`,
      [tokenHash],
    );
  },
  revokeByHash(tokenHash, executor) {
    return execute(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL",
      [tokenHash],
      executor,
    );
  },
  revokeAll(userId) {
    return execute(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL",
      [userId],
    );
  },
};
