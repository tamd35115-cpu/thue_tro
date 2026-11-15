import AppError from "../utils/AppError.js";

export function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Lỗi máy chủ.";
  let details = error.details || undefined;

  if (error.code === "ER_DUP_ENTRY") {
    statusCode = 409;
    message =
      "Dữ liệu đã tồn tại (email, số điện thoại hoặc bản ghi bị trùng).";
  } else if (error.code === "ER_NO_REFERENCED_ROW_2") {
    statusCode = 400;
    message = "Dữ liệu tham chiếu không tồn tại.";
  } else if (error.name === "MulterError") {
    statusCode = 400;
    message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Mỗi ảnh tối đa 5MB."
        : "Dữ liệu ảnh tải lên không hợp lệ.";
  }

  if (!(error instanceof AppError) && statusCode === 500) {
    console.error(error);
    message = process.env.NODE_ENV === "production" ? "Lỗi máy chủ." : message;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    ...(details ? { details } : {}),
  });
}
