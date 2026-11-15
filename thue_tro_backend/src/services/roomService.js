//roomService

import { roomModel } from "../models/roomModel.js";
import AppError from "../utils/AppError.js";
import { getPagination, paginationMeta } from "../utils/pagination.js";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
import { createNotification } from "./notificationService.js";
import { createZaloLink } from "../utils/zalo.js";

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(buffer);
  });
}

async function requireOwner(roomId, userId) {
  const [room] = await roomModel.getById(roomId);
  if (!room || room.deleted_at)
    throw new AppError("Không tìm thấy phòng.", 404);
  if (String(room.user_id) !== String(userId))
    throw new AppError("Bạn không phải chủ phòng này.", 403);
  return room;
}

export const roomService = {
  async list(queryParams) {
    const { page, limit, offset } = getPagination(queryParams);
    const filters = {
      ...queryParams,
      page,
      limit,
      offset,
      min_price:
        queryParams.min_price === undefined
          ? undefined
          : Number(queryParams.min_price),
      max_price:
        queryParams.max_price === undefined
          ? undefined
          : Number(queryParams.max_price),
      min_area:
        queryParams.min_area === undefined
          ? undefined
          : Number(queryParams.min_area),
      max_area:
        queryParams.max_area === undefined
          ? undefined
          : Number(queryParams.max_area),
    };
    const { rows, total } = await roomModel.listApproved(filters);
    const images = await roomModel.getImagesByRoomIds(
      rows.map((row) => row.id),
    );
    const data = rows.map((room) => ({
      ...room,
      images: images.filter(
        (image) => String(image.room_id) === String(room.id),
      ),
    }));
    return { data, pagination: paginationMeta(page, limit, total) };
  },
  async detail(roomId, viewer) {
    const [room] = await roomModel.getById(roomId);
    if (!room || room.deleted_at)
      throw new AppError("Không tìm thấy phòng.", 404);
    const isOwner = viewer && String(viewer.id) === String(room.user_id);
    const isAdmin = viewer?.role === "admin";
    if (room.status !== "approved" && !isOwner && !isAdmin)
      throw new AppError("Tin phòng chưa được công khai.", 404);
    const images = await roomModel.getImages(roomId);
    const { owner_phone, owner_email, ...safeRoom } = room;
    const ownerZaloLink = room.owner_zalo_link || createZaloLink(owner_phone);
    return {
      ...safeRoom,
      owner_zalo_link: ownerZaloLink,
      images,
      ...(isOwner || isAdmin
        ? { owner_contact: { phone: owner_phone, email: owner_email } }
        : {}),
    };
  },
  async mine(userId) {
    const rooms = await roomModel.listMine(userId);
    const images = await roomModel.getImagesByRoomIds(
      rooms.map((room) => room.id),
    );
    return rooms.map((room) => ({
      ...room,
      images: images.filter(
        (image) => String(image.room_id) === String(room.id),
      ),
    }));
  },
  async mineDetail(roomId, userId) {
    const room = await requireOwner(roomId, userId);
    const images = await roomModel.getImages(roomId);
    return { ...room, images };
  },
  async create(userId, data) {
    const result = await roomModel.create(userId, data);
    return this.detail(result.insertId, { id: userId, role: "user" }).catch(
      async () => {
        const [room] = await roomModel.getById(result.insertId);
        return room;
      },
    );
  },
  async update(roomId, userId, data) {
    await requireOwner(roomId, userId);
    await roomModel.update(roomId, data);
    return this.detail(roomId, { id: userId, role: "user" }).catch(async () => {
      const [room] = await roomModel.getById(roomId);
      return room;
    });
  },
  async remove(roomId, userId) {
    await requireOwner(roomId, userId);
    await roomModel.softDelete(roomId);
  },
  async uploadImages(roomId, userId, files) {
    await requireOwner(roomId, userId);
    if (!files?.length) throw new AppError("Bạn chưa chọn ảnh.", 400);
    if (!isCloudinaryConfigured)
      throw new AppError("Chưa cấu hình Cloudinary trong file .env.", 503);
    const existing = await roomModel.getImages(roomId);
    if (existing.length + files.length > 10)
      throw new AppError("Mỗi phòng tối đa 10 ảnh.", 400);
    const uploaded = [];
    try {
      for (const [index, file] of files.entries()) {
        const result = await uploadBuffer(file.buffer, {
          folder: `${process.env.CLOUDINARY_FOLDER || "thue-tro"}/rooms/${roomId}`,
          resource_type: "image",
        });
        uploaded.push(result);
        await roomModel.addImage({
          room_id: roomId,
          cloudinary_public_id: result.public_id,
          image_url: result.secure_url,
          is_cover: existing.length === 0 && index === 0,
          sort_order: existing.length + index,
        });
      }
    } catch (error) {
      await Promise.allSettled(
        uploaded.map(async (item) => {
          await roomModel.deleteImageByPublicId(item.public_id);
          await cloudinary.uploader.destroy(item.public_id);
        }),
      );
      throw error;
    }
    return roomModel.getImages(roomId);
  },
  async deleteImage(roomId, imageId, userId) {
    await requireOwner(roomId, userId);
    const [image] = await roomModel.getImageById(imageId, roomId);
    if (!image) throw new AppError("Không tìm thấy ảnh.", 404);
    await roomModel.deleteImage(imageId, roomId);
    if (isCloudinaryConfigured)
      await cloudinary.uploader
        .destroy(image.cloudinary_public_id)
        .catch((error) => console.error("Cloudinary destroy:", error.message));
    const remaining = await roomModel.getImages(roomId);
    if (image.is_cover && remaining.length)
      await roomModel.setCover(remaining[0].id, roomId);
    return remaining;
  },
  async setCover(roomId, imageId, userId) {
    await requireOwner(roomId, userId);
    const [image] = await roomModel.getImageById(imageId, roomId);
    if (!image) throw new AppError("Không tìm thấy ảnh.", 404);
    await roomModel.setCover(imageId, roomId);
    return roomModel.getImages(roomId);
  },
  async adminList(queryParams) {
    const { page, limit, offset } = getPagination(queryParams);
    const result = await roomModel.listAdmin(queryParams.status, limit, offset);
    const images = await roomModel.getImagesByRoomIds(
      result.rows.map((room) => room.id),
    );
    const data = result.rows.map((room) => ({
      ...room,
      images: images.filter(
        (image) => String(image.room_id) === String(room.id),
      ),
    }));
    return { data, pagination: paginationMeta(page, limit, result.total) };
  },
  async moderate(roomId, admin, status, note) {
    const [room] = await roomModel.getById(roomId);
    if (!room || room.deleted_at)
      throw new AppError("Không tìm thấy phòng.", 404);
    await roomModel.moderate(roomId, admin.id, status, note);
    await createNotification(
      room.user_id,
      `room_${status}`,
      "Cập nhật trạng thái tin phòng",
      status === "approved"
        ? "Tin phòng của bạn đã được duyệt."
        : `Tin phòng của bạn đã được cập nhật: ${status}.`,
      { room_id: Number(roomId), status },
    );
    return roomModel.getById(roomId);
  },
};
