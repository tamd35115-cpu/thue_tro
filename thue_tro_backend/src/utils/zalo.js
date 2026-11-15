/**
 * Tạo link chat Zalo cá nhân từ số điện thoại.
 * Link theo chuẩn: https://zalo.me/0xxxxxxxxx
 */
export function createZaloLink(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (!digits) return null;

  // Chuẩn hóa mã quốc gia Việt Nam về số nội địa để tạo link Zalo.
  let zaloPhone = digits;
  if (digits.startsWith("0084") && digits.length > 11) {
    zaloPhone = `0${digits.slice(4)}`;
  } else if (digits.startsWith("84") && digits.length === 11) {
    zaloPhone = `0${digits.slice(2)}`;
  }

  return `https://zalo.me/${zaloPhone}`;
}
