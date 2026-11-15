import { contactService } from "../services/contactService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/response.js";

export const create = asyncHandler(async (req, res) =>
  success(
    res,
    await contactService.create(req.params.roomId, req.user, req.body.message),
    "Đã gửi yêu cầu liên hệ.",
    201,
  ),
);
export const sent = asyncHandler(async (req, res) =>
  success(res, await contactService.sent(req.user.id)),
);
export const received = asyncHandler(async (req, res) =>
  success(res, await contactService.received(req.user.id)),
);
export const detail = asyncHandler(async (req, res) =>
  success(res, await contactService.detail(req.params.id, req.user)),
);
export const called = asyncHandler(async (req, res) =>
  success(
    res,
    await contactService.markCalled(req.params.id, req.user),
    "Đã xác nhận đã liên hệ.",
  ),
);
export const confirmReached = asyncHandler(async (req, res) =>
  success(
    res,
    await contactService.confirm(req.params.id, req.user, true),
    "Đã xác nhận liên hệ thành công.",
  ),
);
export const confirmNotReached = asyncHandler(async (req, res) =>
  success(
    res,
    await contactService.confirm(req.params.id, req.user, false),
    "Đã ghi nhận bạn chưa nhận được liên hệ.",
  ),
);
export const cancel = asyncHandler(async (req, res) =>
  success(
    res,
    await contactService.cancel(req.params.id, req.user),
    "Đã hủy yêu cầu liên hệ.",
  ),
);
