import AppError from "../utils/AppError.js";

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError("Bạn không có quyền thực hiện thao tác này.", 403),
      );
    }
    next();
  };
}
