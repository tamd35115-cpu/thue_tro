import { authService } from "../services/authService.js";
import { userModel } from "../models/userModel.js";
import { refreshCookieOptions } from "../utils/cookieOptions.js";
import { env } from "../config/environment.js";
import { success } from "../utils/response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

function metadata(req) {
  return { userAgent: req.get("user-agent"), ipAddress: req.ip };
}
function setRefreshCookie(res, token) {
  res.cookie(env.REFRESH_COOKIE_NAME, token, refreshCookieOptions());
}
function clearRefreshCookie(res) {
  res.clearCookie(env.REFRESH_COOKIE_NAME, refreshCookieOptions());
}

export const register = asyncHandler(async (req, res) => {
  const session = await authService.register(req.body, metadata(req));
  setRefreshCookie(res, session.refreshToken);
  success(
    res,
    { accessToken: session.accessToken, user: session.user },
    "Đăng ký thành công.",
    201,
  );
});

export const login = asyncHandler(async (req, res) => {
  const session = await authService.login(req.body, metadata(req));
  setRefreshCookie(res, session.refreshToken);
  success(
    res,
    { accessToken: session.accessToken, user: session.user },
    "Đăng nhập thành công.",
  );
});

export const refresh = asyncHandler(async (req, res) => {
  const session = await authService.refresh(
    req.cookies[env.REFRESH_COOKIE_NAME],
    metadata(req),
  );
  setRefreshCookie(res, session.refreshToken);
  success(
    res,
    { accessToken: session.accessToken, user: session.user },
    "Làm mới phiên đăng nhập thành công.",
  );
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies[env.REFRESH_COOKIE_NAME]);
  clearRefreshCookie(res);
  success(res, null, "Đăng xuất thành công.");
});

export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  clearRefreshCookie(res);
  success(res, null, "Đã đăng xuất khỏi tất cả thiết bị.");
});

export const me = asyncHandler(async (req, res) => {
  const [user] = await userModel.findById(req.user.id);
  if (!user) throw new AppError("Không tìm thấy người dùng.", 404);
  success(res, user);
});
