import AppError from "../utils/AppError.js";

export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        new AppError(
          "Dữ liệu không hợp lệ.",
          422,
          result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        ),
      );
    }
    req[source] = result.data;
    next();
  };
}
