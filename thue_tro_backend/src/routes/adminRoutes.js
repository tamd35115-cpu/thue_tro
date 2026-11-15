import { Router } from "express";
import * as controller from "../controllers/adminController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorize.js";
import { z } from "zod";
import { validate } from "../middlewares/validate.js";
const noteSchema = z.object({
  note: z.string().trim().max(500).optional().nullable(),
});
const router = Router();
router.use(authenticate, authorize("admin"));
router.get("/dashboard", controller.dashboard);
router.get("/users", controller.listUsers);
router.patch("/users/:id/lock", controller.lockUser);
router.patch("/users/:id/unlock", controller.unlockUser);
router.delete("/users/:id", controller.deleteUser);
router.get("/rooms", controller.listRooms);
router.patch(
  "/rooms/:id/approve",
  validate(noteSchema),
  controller.moderateRoom("approved", "approved"),
);
router.patch(
  "/rooms/:id/reject",
  validate(noteSchema),
  controller.moderateRoom("rejected", "rejected"),
);
router.patch(
  "/rooms/:id/hide",
  validate(noteSchema),
  controller.moderateRoom("hidden", "hidden"),
);
router.patch(
  "/rooms/:id/restore",
  validate(noteSchema),
  controller.moderateRoom("approved", "restored"),
);
export default router;
