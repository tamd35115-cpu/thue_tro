import { favoriteModel } from "../models/favoriteModel.js";
import { roomModel } from "../models/roomModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/response.js";
import AppError from "../utils/AppError.js";

export const list = asyncHandler(async (req, res) => {
  const rooms = await favoriteModel.list(req.user.id);
  const images = await roomModel.getImagesByRoomIds(
    rooms.map((room) => room.id),
  );
  const data = rooms.map((room) => ({
    ...room,
    images: images.filter((image) => String(image.room_id) === String(room.id)),
  }));
  success(res, data);
});
export const add = asyncHandler(async (req, res) => {
  const [room] = await roomModel.getById(req.params.roomId);
  if (!room || room.status !== "approved" || room.deleted_at)
    throw new AppError("Không tìm thấy phòng đang được đăng.", 404);
  await favoriteModel.add(req.user.id, req.params.roomId);
  success(res, null, "Đã thêm phòng vào danh sách yêu thích.", 201);
});
export const remove = asyncHandler(async (req, res) => {
  await favoriteModel.remove(req.user.id, req.params.roomId);
  success(res, null, "Đã bỏ yêu thích.");
});
export const check = asyncHandler(async (req, res) => {
  const rows = await favoriteModel.check(req.user.id, req.params.roomId);
  success(res, { is_favorite: rows.length > 0 });
});
