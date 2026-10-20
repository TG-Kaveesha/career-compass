import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { RESOURCE_TYPES, Resource } from "../models/Resource";
import { logActivity } from "../utils/activity";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/HttpError";
import { objectId } from "../utils/schemas";

const router = Router();
router.use(requireAuth);

const resourceSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(140, "Title is too long"),
  url: z
    .string()
    .trim()
    .url("Enter a full link, e.g. https://example.com")
    .refine((v) => /^https?:\/\//i.test(v), "Link must start with http:// or https://"),
  type: z.enum(RESOURCE_TYPES, { errorMap: () => ({ message: "Choose a resource type" }) }),
  skillTag: z.string().trim().max(40, "Tag is too long").optional().default(""),
});

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  type: z.enum(["all", ...RESOURCE_TYPES] as const).optional().default("all"),
  sort: z.enum(["newest", "oldest", "title"]).optional().default("newest"),
});
type ResourceQuery = z.infer<typeof querySchema>;

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  title: { title: 1 },
} as const;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function checkId(id: string) {
  const parsed = objectId("Invalid resource id").safeParse(id);
  if (!parsed.success) throw new HttpError(400, "Invalid resource id");
  return parsed.data;
}
router.get(
  "/",
  validate(querySchema, "query"),
  asyncHandler(async (req, res) => {
    const { q, type, sort } = req.query as unknown as ResourceQuery;
    const filter: Record<string, unknown> = { user: req.auth!.userId };
    if (type !== "all") filter.type = type;
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ title: rx }, { skillTag: rx }, { url: rx }];
    }
    const items = await Resource.find(filter).sort(SORTS[sort]).collation({ locale: "en" });
    res.json(items);
  })
);
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const item = await Resource.findOne({ _id: checkId(req.params.id), user: req.auth!.userId });
    if (!item) throw new HttpError(404, "Resource not found");
    res.json(item);
  })
);
router.post(
  "/",
  validate(resourceSchema),
  asyncHandler(async (req, res) => {
    const item = await Resource.create({ ...req.body, user: req.auth!.userId });
    await logActivity(req.auth!.userId, `Added resource "${item.title}"`);
    res.status(201).json(item);
  })
);
router.put(
  "/:id",
  validate(resourceSchema),
  asyncHandler(async (req, res) => {
    const item = await Resource.findOneAndUpdate(
      { _id: checkId(req.params.id), user: req.auth!.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) throw new HttpError(404, "Resource not found");
    res.json(item);
  })
);
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const item = await Resource.findOneAndDelete({ _id: checkId(req.params.id), user: req.auth!.userId });
    if (!item) throw new HttpError(404, "Resource not found");
    res.status(204).end();
  })
);

export default router;