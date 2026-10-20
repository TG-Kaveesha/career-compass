import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { MILESTONE_STATUSES, Milestone } from "../models/Milestone";
import { logActivity } from "../utils/activity";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/HttpError";
import { objectId, optionalDate } from "../utils/schemas";

const router = Router();
router.use(requireAuth);

const statusEnum = z.enum(MILESTONE_STATUSES, { errorMap: () => ({ message: "Choose a valid status" }) });

const milestoneSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120, "Title is too long"),
  skillTag: z.string().trim().max(40, "Tag is too long").optional().default(""),
  dueDate: optionalDate,
  status: statusEnum.optional().default("todo"),
});

const STATUS_LABEL = { todo: "To do", in_progress: "In progress", completed: "Completed" };

function checkId(id: string) {
  const parsed = objectId("Invalid milestone id").safeParse(id);
  if (!parsed.success) throw new HttpError(400, "Invalid milestone id");
  return parsed.data;
}
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await Milestone.find({ user: req.auth!.userId }).sort({ createdAt: -1 });
    res.json(items);
  })
);
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const item = await Milestone.findOne({ _id: checkId(req.params.id), user: req.auth!.userId });
    if (!item) throw new HttpError(404, "Milestone not found");
    res.json(item);
  })
);
router.post(
  "/",
  validate(milestoneSchema),
  asyncHandler(async (req, res) => {
    const item = await Milestone.create({ ...req.body, user: req.auth!.userId });
    await logActivity(req.auth!.userId, `Added milestone "${item.title}"`);
    res.status(201).json(item);
  })
);
router.put(
  "/:id",
  validate(milestoneSchema),
  asyncHandler(async (req, res) => {
    const item = await Milestone.findOneAndUpdate(
      { _id: checkId(req.params.id), user: req.auth!.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) throw new HttpError(404, "Milestone not found");
    res.json(item);
  })
);
router.patch(
  "/:id/status",
  validate(z.object({ status: statusEnum })),
  asyncHandler(async (req, res) => {
    const item = await Milestone.findOneAndUpdate(
      { _id: checkId(req.params.id), user: req.auth!.userId },
      { status: req.body.status },
      { new: true }
    );
    if (!item) throw new HttpError(404, "Milestone not found");
    await logActivity(req.auth!.userId, `"${item.title}" moved to ${STATUS_LABEL[item.status]}`);
    res.json(item);
  })
);
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const item = await Milestone.findOneAndDelete({ _id: checkId(req.params.id), user: req.auth!.userId });
    if (!item) throw new HttpError(404, "Milestone not found");
    res.status(204).end();
  })
);

export default router;