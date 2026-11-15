import bcrypt from "bcryptjs";
import { userModel } from "../models/userModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/response.js";
import AppError from "../utils/AppError.js";
import { createZaloLink } from "../utils/zalo.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const profileData = { ...req.body };
  if (profileData.phone) {
    profileData.zalo_link = createZaloLink(profileData.phone);
  }
  await userModel.updateProfile(req.user.id, profileData);
  const [user] = await userModel.findById(req.user.id);
  success(res, user, "Cập nhật thông tin thành công.");
});

export const updatePassword = asyncHandler(async (req, res) => {
  const [user] = await userModel.findByEmail(req.user.email);
  if (
    !user ||
    !(await bcrypt.compare(req.body.current_password, user.password_hash))
  ) {
    throw new AppError("Mật khẩu hiện tại không chính xác.", 400);
  }
  const hash = await bcrypt.hash(req.body.new_password, 12);
  await userModel.updatePassword(req.user.id, hash);
  success(res, null, "Đổi mật khẩu thành công.");
});
