import { notificationModel } from "../models/notificationModel.js";
import { getPagination, paginationMeta } from "../utils/pagination.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/response.js";

export const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const result = await notificationModel.list(req.user.id, limit, offset);
  const [count] = await notificationModel.countUnread(req.user.id);
  success(res, {
    notifications: result.rows,
    unread_count: Number(count.total),
    pagination: paginationMeta(page, limit, result.total),
  });
});
export const unreadCount = asyncHandler(async (req, res) => {
  const [count] = await notificationModel.countUnread(req.user.id);
  success(res, { unread_count: Number(count.total) });
});
export const markRead = asyncHandler(async (req, res) => {
  await notificationModel.markRead(req.params.id, req.user.id);
  success(res, null, "Đã đánh dấu đã đọc.");
});
export const markAllRead = asyncHandler(async (req, res) => {
  await notificationModel.markAllRead(req.user.id);
  success(res, null, "Đã đánh dấu tất cả đã đọc.");
});
