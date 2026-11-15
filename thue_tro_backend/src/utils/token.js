import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/environment.js";

export function createAccessToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_TTL,
    },
  );
}

export function createRefreshToken(user) {
  return jwt.sign(
    { sub: String(user.id), type: "refresh" },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.REFRESH_TOKEN_TTL,
    },
  );
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getTokenExpiry(token) {
  const payload = jwt.decode(token);
  if (!payload?.exp) throw new Error("Refresh token không có thời hạn hợp lệ.");
  return new Date(payload.exp * 1000);
}
