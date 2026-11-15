import { reviewModel } from "../models/reviewModel.js";
import { roomModel } from "../models/roomModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/response.js";
import AppError from "../utils/AppError.js";

export const list = asyncHandler(async (req, res) =>
  success(res, await reviewModel.listByRoom(req.params.roomId)),
);
export const create = asyncHandler(async (req, res) => {
  const [room] = await roomModel.getById(req.params.roomId);
  if (!room || room.status !== "approved")
    throw new AppError("Không tìm thấy phòng.", 404);
  if (String(room.user_id) === String(req.user.id))
    throw new AppError("Bạn không thể tự đánh giá phòng của mình.", 400);
  const result = await reviewModel.create(
    req.params.roomId,
    req.user.id,
    req.body,
  );
  const [review] = await reviewModel.findById(result.insertId);
  success(res, review, "Đánh giá thành công.", 201);
});
export const update = asyncHandler(async (req, res) => {
  const [review] = await reviewModel.findById(req.params.id);
  if (!review) throw new AppError("Không tìm thấy đánh giá.", 404);
  if (
    String(review.user_id) !== String(req.user.id) &&
    req.user.role !== "admin"
  )
    throw new AppError("Bạn không có quyền sửa đánh giá này.", 403);
  await reviewModel.update(req.params.id, req.body);
  const [updated] = await reviewModel.findById(req.params.id);
  success(res, updated, "Cập nhật đánh giá thành công.");
});
export const remove = asyncHandler(async (req, res) => {
  const [review] = await reviewModel.findById(req.params.id);
  if (!review) throw new AppError("Không tìm thấy đánh giá.", 404);
  if (
    String(review.user_id) !== String(req.user.id) &&
    req.user.role !== "admin"
  )
    throw new AppError("Bạn không có quyền xóa đánh giá này.", 403);
  await reviewModel.remove(req.params.id);
  success(res, null, "Đã xóa đánh giá.");
});
