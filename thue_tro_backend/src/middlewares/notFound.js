import AppError from "../utils/AppError.js";

export function notFound(req, _res, next) {
  next(
    new AppError(`Không tìm thấy API: ${req.method} ${req.originalUrl}`, 404),
  );
}
