import { notificationModel } from "../models/notificationModel.js";

export async function createNotification(
  userId,
  type,
  title,
  message,
  data = null,
) {
  try {
    await notificationModel.create({
      user_id: userId,
      type,
      title,
      message,
      data,
    });
  } catch (error) {
    // Notification không nên làm hỏng nghiệp vụ chính; log để theo dõi lỗi lưu thông báo.
    console.error("Không thể tạo notification:", error.message);
  }
}
