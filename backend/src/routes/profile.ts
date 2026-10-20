import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { Role } from "../models/Role";
import { Session } from "../models/Session";
import { Skill } from "../models/Skill";
import { ACADEMIC_YEARS, User } from "../models/User";
import { UserSkill } from "../models/UserSkill";
import { logActivity } from "../utils/activity";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/HttpError";
import { objectId, passwordRule } from "../utils/schemas";
import { getUserDto } from "../utils/UserDto";

const router = Router();
router.use(requireAuth);

const updateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name is too long").optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").optional(),
  targetRole: objectId("Choose a target role").optional(),
  academicYear: z.enum(ACADEMIC_YEARS, { errorMap: () => ({ message: "Choose your academic year" }) }).optional(),
});

const skillSchema = z.object({
  name: z.string().trim().min(2, "Skill must be at least 2 characters").max(60, "Skill name is too long"),
});

async function customSkillList(userId: string) {
  const user = await User.findById(userId).populate("customSkills", "name");
  return ((user?.customSkills ?? []) as any[]).map((s) => ({ id: String(s._id), name: s.name as string }));
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.auth!.userId;
    res.json({ user: await getUserDto(userId), customSkills: await customSkillList(userId) });
  })
);
router.patch(
  "/",
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const userId = req.auth!.userId;
    const { email, targetRole } = req.body;
    if (email && (await User.exists({ email, _id: { $ne: userId } }))) {
      throw new HttpError(409, "That email is already registered", { email: "Email already registered" });
    }
    if (targetRole && !(await Role.exists({ _id: targetRole }))) {
      throw new HttpError(400, "Please fix the highlighted fields", { targetRole: "Choose a valid role" });
    }
    await User.findByIdAndUpdate(userId, req.body, { runValidators: true });
    if (targetRole) await logActivity(userId, "Changed target role");
    res.json(await getUserDto(userId));
  })
);

router.post(
  "/custom-skills",
  validate(skillSchema),
  asyncHandler(async (req, res) => {
    const userId = req.auth!.userId;
    const name: string = req.body.name;
    const exists = await Skill.exists({ owner: userId, name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    if (exists) throw new HttpError(409, "You already added that skill", { name: "Skill already added" });
    const skill = await Skill.create({ name, category: "Custom", owner: userId });
    await User.findByIdAndUpdate(userId, { $push: { customSkills: skill._id } });
    res.status(201).json({ customSkills: await customSkillList(userId) });
  })
);
router.delete(
  "/custom-skills/:id",
  asyncHandler(async (req, res) => {
    const userId = req.auth!.userId;
    const id = objectId().safeParse(req.params.id);
    if (!id.success) throw new HttpError(400, "Invalid skill id");
    const skill = await Skill.findOneAndDelete({ _id: id.data, owner: userId });
    if (!skill) throw new HttpError(404, "Skill not found");
    await User.findByIdAndUpdate(userId, { $pull: { customSkills: skill._id } });
    await UserSkill.deleteMany({ user: userId, skill: skill._id });
    res.json({ customSkills: await customSkillList(userId) });
  })
);

router.put(
  "/password",
  validate(z.object({ newPassword: passwordRule })),
  asyncHandler(async (req, res) => {
    const passwordHash = await bcrypt.hash(req.body.newPassword, 10);
    await User.findByIdAndUpdate(req.auth!.userId, { passwordHash });
    // Sign out every other device after a password change.
    await Session.deleteMany({ user: req.auth!.userId, _id: { $ne: req.auth!.sessionId } });
    res.status(204).end();
  })
);

router.get(
  "/sessions",
  asyncHandler(async (req, res) => {
    const sessions = await Session.find({ user: req.auth!.userId }).sort({ createdAt: -1 });
    res.json(sessions.map((s) => ({ ...s.toJSON(), current: String(s._id) === req.auth!.sessionId })));
  })
);

router.delete(
  "/sessions/:id",
  asyncHandler(async (req, res) => {
    const id = objectId().safeParse(req.params.id);
    if (!id.success) throw new HttpError(400, "Invalid session id");
    if (id.data === req.auth!.sessionId) throw new HttpError(400, "Use Log out to end this device's session");
    const removed = await Session.findOneAndDelete({ _id: id.data, user: req.auth!.userId });
    if (!removed) throw new HttpError(404, "Session not found");
    res.status(204).end();
  })
);

export default router;
