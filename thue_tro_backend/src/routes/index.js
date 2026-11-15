import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import roomRoutes from "./roomRoutes.js";
import favoriteRoutes from "./favoriteRoutes.js";
import reviewRoutes from "./reviewRoutes.js";
import contactRoutes from "./contactRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import adminRoutes from "./adminRoutes.js";
import { success } from "../utils/response.js";
import { checkDatabaseConnection } from "../config/database.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.get(
  "/health",
  asyncHandler(async (_req, res) => {
    await checkDatabaseConnection();
    success(
      res,
      { api: "ok", database: "connected" },
      "API hoạt động bình thường.",
    );
  }),
);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/rooms", roomRoutes);
router.use("/favorites", favoriteRoutes);
router.use("/", reviewRoutes);
router.use("/contact-requests", contactRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);
export default router;
