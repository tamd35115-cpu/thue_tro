import { adminModel } from "../models/adminModel.js";
import { roomService } from "../services/roomService.js";
import { getPagination, paginationMeta } from "../utils/pagination.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/response.js";
import { refreshTokenModel } from "../models/refreshTokenModel.js";
import AppError from "../utils/AppError.js";

export const dashboard = asyncHandler(async (_req, res) =>
  success(res, await adminModel.dashboard()),
);
export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const result = await adminModel.listUsers(limit, offset);
  success(res, {
    users: result.rows,
    pagination: paginationMeta(page, limit, result.total),
  });
});
export const lockUser = asyncHandler(async (req, res) => {
  const result = await adminModel.lockUser(req.params.id);
  if (!result.affectedRows)
    throw new AppError(
      "Không thể khóa người dùng này hoặc người dùng không tồn tại.",
      404,
    );
  await refreshTokenModel.revokeAll(req.params.id);
  success(res, null, "Đã khóa tài khoản và thu hồi các phiên đăng nhập.");
});
export const unlockUser = asyncHandler(async (req, res) => {
  const result = await adminModel.unlockUser(req.params.id);
  if (!result.affectedRows)
    throw new AppError("Không tìm thấy người dùng.", 404);
  success(res, null, "Đã mở khóa tài khoản.");
});
export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user.id))
    throw new AppError("Không thể tự xóa tài khoản admin đang đăng nhập.", 400);
  const result = await adminModel.softDeleteUser(req.params.id);
  if (!result.affectedRows)
    throw new AppError(
      "Không thể xóa người dùng này hoặc người dùng không tồn tại.",
      404,
    );
  await refreshTokenModel.revokeAll(req.params.id);
  success(res, null, "Đã vô hiệu hóa tài khoản người dùng.");
});
export const listRooms = asyncHandler(async (req, res) =>
  success(res, await roomService.adminList(req.query)),
);
export const moderateRoom = (status, action) =>
  asyncHandler(async (req, res) => {
    const [room] = await roomService.moderate(
      req.params.id,
      req.user,
      status,
      req.body.note,
    );
    success(res, room, `Đã cập nhật trạng thái phòng thành ${status}.`);
  });
