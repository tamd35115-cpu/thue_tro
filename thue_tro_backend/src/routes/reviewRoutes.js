import { Router } from "express";
import * as controller from "../controllers/reviewController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { reviewSchema } from "../validations/reviewValidation.js";
const router = Router();
router.get("/rooms/:roomId/reviews", controller.list);
router.post(
  "/rooms/:roomId/reviews",
  authenticate,
  validate(reviewSchema),
  controller.create,
);
router.patch("/:id", authenticate, validate(reviewSchema), controller.update);
router.delete("/:id", authenticate, controller.remove);
export default router;
