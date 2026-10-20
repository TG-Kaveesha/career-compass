import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { SKILL_STATUSES, UserSkill } from "../models/UserSkill";
import { logActivity } from "../utils/activity";
import { asyncHandler } from "../utils/asyncHandler";
import { buildAssessment } from "../utils/assessment";
import { HttpError } from "../utils/HttpError";
import { objectId } from "../utils/schemas";

const router = Router();
router.use(requireAuth);

const statusSchema = z.object({
  status: z.enum(SKILL_STATUSES, { errorMap: () => ({ message: "Choose a valid status" }) }),
});

const ACTIVITY_TEXT = {
  not_started: "reset to Not started",
  in_progress: "moved to In progress",
  mastered: "marked Mastered",
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await buildAssessment(req.auth!.userId));
  })
);

router.put(
  "/:skillId",
  validate(statusSchema),
  asyncHandler(async (req, res) => {
    const userId = req.auth!.userId;
    const skillId = objectId().safeParse(req.params.skillId);
    if (!skillId.success) throw new HttpError(400, "Invalid skill id");

    const current = await buildAssessment(userId);
    const item = current.items.find((i) => i.skillId === skillId.data);
    if (!item) throw new HttpError(404, "That skill is not part of your target role");

    const { status } = req.body as { status: keyof typeof ACTIVITY_TEXT };
    await UserSkill.findOneAndUpdate(
      { user: userId, skill: skillId.data },
      { status },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await logActivity(userId, `${item.name} ${ACTIVITY_TEXT[status]}`);
    res.json(await buildAssessment(userId));
  })
);

export default router;