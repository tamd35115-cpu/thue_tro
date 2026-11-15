import multer from "multer";
import AppError from "../utils/AppError.js";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(
        new AppError("Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.", 400),
      );
    }
    callback(null, true);
  },
});

export const uploadRoomImages = upload.array("images", 10);
