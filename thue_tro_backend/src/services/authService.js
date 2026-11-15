import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import { userModel } from "../models/userModel.js";
import { refreshTokenModel } from "../models/refreshTokenModel.js";
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  getTokenExpiry,
} from "../utils/token.js";
import { env } from "../config/environment.js";
import { pool } from "../config/database.js";
import { createZaloLink } from "../utils/zalo.js";

function publicUser(user) {
  const { password_hash, deleted_at, ...safeUser } = user;
  return safeUser;
}

async function issueSession(user, metadata = {}) {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  await refreshTokenModel.create({
    user_id: user.id,
    token_hash: hashToken(refreshToken),
    expires_at: getTokenExpiry(refreshToken),
    user_agent: metadata.userAgent || null,
    ip_address: metadata.ipAddress || null,
  });
  return { accessToken, refreshToken, user: publicUser(user) };
}

export const authService = {
  async register(data, metadata) {
    const [existingEmail] = await userModel.findByEmail(data.email);
    if (existingEmail) throw new AppError("Email đã được sử dụng.", 409);
    const password_hash = await bcrypt.hash(data.password, 12);
    const zalo_link = createZaloLink(data.phone);
    const result = await userModel.create({ ...data, password_hash, zalo_link });
    const user = {
      id: result.insertId,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      zalo_link,
      role: "user",
      account_status: "active",
      avatar_url: null,
    };
    return issueSession(user, metadata);
  },
  async login(data, metadata) {
    const [user] = await userModel.findByEmail(data.email);
    if (!user || !(await bcrypt.compare(data.password, user.password_hash))) {
      throw new AppError("Email hoặc mật khẩu không chính xác.", 401);
    }
    if (user.account_status !== "active" || user.deleted_at)
      throw new AppError("Tài khoản đã bị khóa hoặc vô hiệu hóa.", 403);
    return issueSession(user, metadata);
  },
  async refresh(rawToken, metadata) {
    if (!rawToken) throw new AppError("Không tìm thấy refresh token.", 401);
    let payload;
    try {
      payload = jwt.verify(rawToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError("Refresh token không hợp lệ hoặc đã hết hạn.", 401);
    }
    if (payload.type !== "refresh")
      throw new AppError("Loại token không hợp lệ.", 401);

    const tokenHash = hashToken(rawToken);
    const [stored] = await refreshTokenModel.findByHash(tokenHash);
    if (
      !stored ||
      stored.revoked_at ||
      new Date(stored.expires_at) <= new Date() ||
      stored.account_status !== "active" ||
      stored.deleted_at
    ) {
      throw new AppError("Phiên đăng nhập đã hết hạn hoặc bị thu hồi.", 401);
    }
    if (String(stored.user_id) !== String(payload.sub))
      throw new AppError("Refresh token không khớp người dùng.", 401);

    const [user] = await userModel.findById(stored.user_id);
    if (!user) throw new AppError("Không tìm thấy người dùng.", 401);
    const connection = await pool.getConnection();
    const nextRefresh = createRefreshToken(user);
    try {
      await connection.beginTransaction();
      const [updateResult] = await connection.execute(
        "UPDATE refresh_tokens SET revoked_at = NOW(), last_used_at = NOW() WHERE id = ? AND revoked_at IS NULL",
        [stored.id],
      );
      if (updateResult.affectedRows !== 1)
        throw new AppError(
          "Refresh token đã được sử dụng hoặc bị thu hồi.",
          401,
        );
      await connection.execute(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
         VALUES (?, ?, ?, ?, ?)`,
        [
          user.id,
          hashToken(nextRefresh),
          getTokenExpiry(nextRefresh),
          metadata.userAgent || null,
          metadata.ipAddress || null,
        ],
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    return {
      accessToken: createAccessToken(user),
      refreshToken: nextRefresh,
      user,
    };
  },
  async logout(rawToken) {
    if (rawToken) await refreshTokenModel.revokeByHash(hashToken(rawToken));
  },
  async logoutAll(userId) {
    await refreshTokenModel.revokeAll(userId);
  },
};
