import { Router } from "express";
import {
  updateProfile,
  updatePassword,
} from "../controllers/userController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  updateProfileSchema,
  updatePasswordSchema,
} from "../validations/authValidation.js";

const router = Router();
router.use(authenticate);
router.patch("/me", validate(updateProfileSchema), updateProfile);
router.patch("/me/password", validate(updatePasswordSchema), updatePassword);
export default router;
