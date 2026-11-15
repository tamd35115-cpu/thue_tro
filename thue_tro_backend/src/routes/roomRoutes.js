import { Router } from "express";
import * as controller from "../controllers/roomController.js";
import {
  authenticate,
  optionalAuthenticate,
} from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { uploadRoomImages } from "../middlewares/uploadMiddleware.js";
import {
  createRoomSchema,
  updateRoomSchema,
} from "../validations/roomValidation.js";

const router = Router();
router.get("/", controller.list);
router.get("/mine", authenticate, controller.mine);
router.get("/mine/:id", authenticate, controller.mineDetail);
router.post("/", authenticate, validate(createRoomSchema), controller.create);
router.post(
  "/:id/images",
  authenticate,
  uploadRoomImages,
  controller.uploadImages,
);
router.delete("/:id/images/:imageId", authenticate, controller.deleteImage);
router.patch("/:id/images/:imageId/cover", authenticate, controller.setCover);
router.get("/:id", optionalAuthenticate, controller.detail);
router.patch(
  "/:id",
  authenticate,
  validate(updateRoomSchema),
  controller.update,
);
router.delete("/:id", authenticate, controller.remove);
export default router;
