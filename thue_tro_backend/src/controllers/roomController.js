//roomController

import { roomService } from "../services/roomService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/response.js";

export const list = asyncHandler(async (req, res) =>
  success(res, await roomService.list(req.query)),
);
export const detail = asyncHandler(async (req, res) =>
  success(res, await roomService.detail(req.params.id, req.user || null)),
);
export const mine = asyncHandler(async (req, res) =>
  success(res, await roomService.mine(req.user.id)),
);
export const mineDetail = asyncHandler(async (req, res) =>
  success(res, await roomService.mineDetail(req.params.id, req.user.id)),
);
export const create = asyncHandler(async (req, res) =>
  success(
    res,
    await roomService.create(req.user.id, req.body),
    "Tạo tin phòng thành công. Tin đang chờ admin duyệt.",
    201,
  ),
);
export const update = asyncHandler(async (req, res) =>
  success(
    res,
    await roomService.update(req.params.id, req.user.id, req.body),
    "Cập nhật tin thành công. Tin được chuyển về trạng thái chờ duyệt.",
  ),
);
export const remove = asyncHandler(async (req, res) => {
  await roomService.remove(req.params.id, req.user.id);
  success(res, null, "Đã xóa tin phòng.");
});
export const uploadImages = asyncHandler(async (req, res) =>
  success(
    res,
    await roomService.uploadImages(req.params.id, req.user.id, req.files),
    "Tải ảnh lên thành công.",
    201,
  ),
);
export const deleteImage = asyncHandler(async (req, res) =>
  success(
    res,
    await roomService.deleteImage(
      req.params.id,
      req.params.imageId,
      req.user.id,
    ),
    "Đã xóa ảnh.",
  ),
);
export const setCover = asyncHandler(async (req, res) =>
  success(
    res,
    await roomService.setCover(req.params.id, req.params.imageId, req.user.id),
    "Đã cập nhật ảnh đại diện.",
  ),
);
