import { contactModel } from "../models/contactModel.js";
import { roomModel } from "../models/roomModel.js";
import { userModel } from "../models/userModel.js";
import { env } from "../config/environment.js";
import AppError from "../utils/AppError.js";
import { createNotification } from "./notificationService.js";

export const contactService = {
  async create(roomId, customer, message) {
    const [room] = await roomModel.getById(roomId);
    if (!room || room.status !== "approved" || room.deleted_at)
      throw new AppError("Phòng không tồn tại hoặc không còn được đăng.", 404);
    if (String(room.user_id) === String(customer.id))
      throw new AppError(
        "Bạn không thể tự gửi yêu cầu liên hệ cho phòng của mình.",
        400,
      );
    const [active] = await contactModel.findActive(roomId, customer.id);
    if (active)
      throw new AppError(
        "Bạn đã có yêu cầu liên hệ đang xử lý cho phòng này.",
        409,
      );
    const [freshCustomer] = await userModel.findById(customer.id);
    if (!freshCustomer)
      throw new AppError("Không tìm thấy thông tin tài khoản người gửi.", 401);
    const result = await contactModel.create({
      room_id: roomId,
      customer_id: customer.id,
      customer_name: freshCustomer.full_name,
      customer_phone: freshCustomer.phone,
      customer_email: freshCustomer.email,
      message: message || null,
      ttl_hours: env.CONTACT_NEW_TTL_HOURS,
    });
    await createNotification(
      room.user_id,
      "contact_request_new",
      "Có người muốn liên hệ thuê phòng",
      `${freshCustomer.full_name} muốn liên hệ về phòng: ${room.title}.`,
      { contact_request_id: result.insertId, room_id: Number(roomId) },
    );
    return contactModel.getById(result.insertId);
  },
  sent(userId) {
    return contactModel.listSent(userId);
  },
  received(userId) {
    return contactModel.listReceived(userId);
  },
  async detail(id, user) {
    const [item] = await contactModel.getById(id);
    if (!item) throw new AppError("Không tìm thấy yêu cầu liên hệ.", 404);
    if (
      String(item.customer_id) !== String(user.id) &&
      String(item.owner_id) !== String(user.id) &&
      user.role !== "admin"
    ) {
      throw new AppError("Bạn không có quyền xem yêu cầu này.", 403);
    }
    // Thông tin người tìm chỉ được trả cho chính họ, chủ phòng hoặc admin.
    return item;
  },
  async markCalled(id, owner) {
    const [item] = await contactModel.getById(id);
    if (!item) throw new AppError("Không tìm thấy yêu cầu liên hệ.", 404);
    if (String(item.owner_id) !== String(owner.id))
      throw new AppError("Chỉ chủ phòng mới được xác nhận đã liên hệ.", 403);
    if (item.status !== "new")
      throw new AppError("Yêu cầu không còn ở trạng thái chờ liên hệ.", 409);
    const updateResult = await contactModel.markCalled(
      id,
      env.CONTACT_CALLED_TTL_HOURS,
    );
    if (!updateResult.affectedRows)
      throw new AppError(
        "Yêu cầu đã được xử lý ở nơi khác. Hãy tải lại danh sách.",
        409,
      );
    await createNotification(
      item.customer_id,
      "contact_owner_called",
      "Người đăng đã xác nhận liên hệ",
      "Người đăng cho biết họ đã liên hệ với bạn. Hãy xác nhận kết quả.",
      { contact_request_id: Number(id) },
    );
    return contactModel.getById(id);
  },
  async confirm(id, customer, reached) {
    const [item] = await contactModel.getById(id);
    if (!item) throw new AppError("Không tìm thấy yêu cầu liên hệ.", 404);
    if (String(item.customer_id) !== String(customer.id))
      throw new AppError("Chỉ người gửi yêu cầu mới được xác nhận.", 403);
    if (item.status !== "called")
      throw new AppError(
        "Người đăng chưa đánh dấu đã liên hệ hoặc yêu cầu đã đóng.",
        409,
      );
    const reason = reached ? "completed" : "not_reached";
    const updateResult = await contactModel.close(id, reason, "called");
    if (!updateResult.affectedRows)
      throw new AppError(
        "Yêu cầu đã được xử lý hoặc hết hạn. Hãy tải lại danh sách.",
        409,
      );
    await createNotification(
      item.owner_id,
      reached ? "contact_completed" : "contact_not_reached",
      reached
        ? "Yêu cầu liên hệ đã hoàn tất"
        : "Người tìm phòng chưa nhận được liên hệ",
      reached
        ? "Người tìm đã xác nhận được liên hệ."
        : "Người tìm cho biết họ chưa nhận được liên hệ.",
      { contact_request_id: Number(id) },
    );
    return contactModel.getById(id);
  },
  async cancel(id, customer) {
    const [item] = await contactModel.getById(id);
    if (!item) throw new AppError("Không tìm thấy yêu cầu liên hệ.", 404);
    if (String(item.customer_id) !== String(customer.id))
      throw new AppError("Chỉ người gửi yêu cầu mới được hủy.", 403);
    if (item.status !== "new")
      throw new AppError(
        "Chỉ có thể hủy yêu cầu đang chờ người đăng liên hệ.",
        409,
      );
    const updateResult = await contactModel.close(id, "cancelled", "new");
    if (!updateResult.affectedRows)
      throw new AppError(
        "Yêu cầu đã được xử lý ở nơi khác. Hãy tải lại danh sách.",
        409,
      );
    return contactModel.getById(id);
  },
};
