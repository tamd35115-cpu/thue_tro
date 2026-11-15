import cron from "node-cron";
import { contactModel } from "../models/contactModel.js";
import { createNotification } from "../services/notificationService.js";
import { query } from "../utils/sql.js";

export function startExpireContactRequestsJob() {
  return cron.schedule(
    "*/5 * * * *",
    async () => {
      try {
        const expired = await query(
          `SELECT id, customer_id, room_id, status FROM contact_requests
         WHERE status IN ('new', 'called') AND expires_at IS NOT NULL AND expires_at <= NOW()`,
        );
        if (!expired.length) return;
        await contactModel.expire();
        for (const item of expired) {
          await createNotification(
            item.customer_id,
            "contact_expired",
            "Yêu cầu liên hệ đã hết hạn",
            "Yêu cầu liên hệ đã tự động đóng do hết thời hạn xử lý.",
            { contact_request_id: item.id, room_id: item.room_id },
          );
          const [room] = await query("SELECT user_id FROM rooms WHERE id = ?", [
            item.room_id,
          ]);
          if (room)
            await createNotification(
              room.user_id,
              "contact_expired",
              "Yêu cầu liên hệ đã hết hạn",
              "Một yêu cầu liên hệ đã tự động đóng do hết thời hạn xử lý.",
              { contact_request_id: item.id, room_id: item.room_id },
            );
        }
      } catch (error) {
        console.error("Expire contact requests job:", error);
      }
    },
    { timezone: "Asia/Ho_Chi_Minh" },
  );
}
