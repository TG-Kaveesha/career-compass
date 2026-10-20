import { Router } from "express";
import { Role } from "../models/Role";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const roles = await Role.find().sort({ isCustom: 1, name: 1 }).select("name description isCustom");
    res.json(roles);
  })
);

export default router;