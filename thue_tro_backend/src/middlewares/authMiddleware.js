import jwt from "jsonwebtoken";
import { env } from "../config/environment.js";
import { query } from "../utils/sql.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token)
    throw new AppError("Bạn cần đăng nhập để thực hiện thao tác này.", 401);

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch {
    throw new AppError("Access token không hợp lệ hoặc đã hết hạn.", 401);
  }

  const rows = await query(
    `SELECT id, full_name, email, phone, role, account_status, avatar_url
     FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [payload.sub],
  );
  const user = rows[0];
  if (!user || user.account_status !== "active")
    throw new AppError("Tài khoản không tồn tại hoặc đã bị khóa.", 401);
  req.user = user;
  next();
});

// Chỉ đọc token nếu có; khách vãng lai vẫn xem được tin công khai.
export const optionalAuthenticate = asyncHandler(async (req, _res, next) => {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) return next();
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const rows = await query(
      `SELECT id, full_name, email, phone, role, account_status, avatar_url
       FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [payload.sub],
    );
    if (rows[0]?.account_status === "active") req.user = rows[0];
  } catch {
    // Bỏ qua token không hợp lệ trên route công khai, không chặn khách xem tin đã duyệt.
  }
  next();
});
