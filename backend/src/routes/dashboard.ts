import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { Activity } from "../models/Activity";
import { Milestone } from "../models/Milestone";
import { asyncHandler } from "../utils/asyncHandler";
import { buildAssessment } from "../utils/assessment";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.auth!.userId;
    const [assessment, open, activity] = await Promise.all([
      buildAssessment(userId),
      Milestone.find({ user: userId, status: { $ne: "completed" } }).limit(30),
      Activity.find({ user: userId }).sort({ createdAt: -1 }).limit(5),
    ]);

    const upcoming = open
      .sort((a, b) => (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity))
      .slice(0, 3);

    res.json({
      targetRole: assessment.role.name,
      readiness: assessment.readiness,
      mastered: assessment.mastered,
      total: assessment.total,
      criticalGaps: assessment.criticalGaps,
      upcoming,
      activity,
    });
  })
);

export default router;
