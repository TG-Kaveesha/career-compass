import { Request, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { z } from "zod";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { Role } from "../models/Role";
import { Session } from "../models/Session";
import { ACADEMIC_YEARS, User } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/HttpError";
import { objectId, passwordRule } from "../utils/schemas";
import { getUserDto } from "../utils/UserDto";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name is too long"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: passwordRule,
  targetRole: objectId("Choose a target role"),
  academicYear: z.enum(ACADEMIC_YEARS, { errorMap: () => ({ message: "Choose your academic year" }) }),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean().optional().default(false),
});

function deviceLabel(ua = ""): string {
  if (/edg/i.test(ua)) return "Edge";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return "Browser";
}
async function issueToken(userId: Types.ObjectId, req: Request, remember: boolean) {
  const days = remember ? 30 : 1;
  const session = await Session.create({
    user: userId,
    device: deviceLabel(req.headers["user-agent"]),
    location: req.ip || "Unknown",
    expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  });
  return jwt.sign({ userId: String(userId), sessionId: String(session._id) }, env.jwtSecret, {
    expiresIn: days * 24 * 60 * 60,
  });
}

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, targetRole, academicYear } = req.body;
    if (await User.exists({ email })) {
      throw new HttpError(409, "That email is already registered", { email: "Email already registered" });
    }
    if (!(await Role.exists({ _id: targetRole }))) {
      throw new HttpError(400, "Please fix the highlighted fields", { targetRole: "Choose a valid role" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, targetRole, academicYear });
    const token = await issueToken(user._id, req, false);
    res.status(201).json({ token, user: await getUserDto(user._id) });
  })
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password, remember } = req.body;
    const user = await User.findOne({ email });
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid) throw new HttpError(401, "Incorrect email or password");
    const token = await issueToken(user._id, req, remember);
    res.json({ token, user: await getUserDto(user._id) });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await getUserDto(req.auth!.userId));
  })
);

router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    await Session.findByIdAndDelete(req.auth!.sessionId);
    res.status(204).end();
  })
);

export default router;