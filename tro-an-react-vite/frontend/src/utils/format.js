export function money(value) {
  const number = Number(value || 0);
  if (number >= 1_000_000) {
    const million = number / 1_000_000;
    return `${Number.isInteger(million) ? million : million.toFixed(1).replace(".", ",")} triệu`;
  }
  return new Intl.NumberFormat("vi-VN").format(number) + " đ";
}

export function fullMoney(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function dateText(value) {
  if (!value) return "Mới đăng";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Mới đăng";
  return date.toLocaleDateString("vi-VN");
}

export function initials(value = "") {
  return (
    String(value)
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase() || "TA"
  );
}
