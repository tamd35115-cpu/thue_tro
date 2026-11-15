export function success(
  res,
  data = null,
  message = "Thành công",
  statusCode = 200,
) {
  return res.status(statusCode).json({ success: true, message, data });
}
