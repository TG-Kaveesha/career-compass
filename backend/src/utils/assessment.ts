import { Role } from "../models/Role";
import { Skill } from "../models/Skill";
import { User } from "../models/User";
import { SkillStatus, UserSkill } from "../models/UserSkill";
import { HttpError } from "./HttpError";

export interface AssessmentItem {
  skillId: string;
  name: string;
  category: string;
  importance: "critical" | "important";
  status: SkillStatus;
  isCustom: boolean;
}

const WEIGHT = { critical: 2, important: 1 };
const PROGRESS: Record<SkillStatus, number> = { not_started: 0, in_progress: 0.5, mastered: 1 };

export async function buildAssessment(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "User not found");

  const role: any = await Role.findById(user.targetRole).populate("requirements.skill").lean();
  if (!role) throw new HttpError(404, "Target role not found");

  let required: { skill: any; importance: "critical" | "important"; isCustom: boolean }[];
  if (role.isCustom) {
    const mine = await Skill.find({ _id: { $in: user.customSkills } }).lean();
    required = mine.map((skill) => ({ skill, importance: "important" as const, isCustom: true }));
  } else {required = role.requirements.map((r: any) => ({ skill: r.skill, importance: r.importance, isCustom: false }));
  }
  const saved = await UserSkill.find({ user: userId, skill: { $in: required.map((r) => r.skill._id) } }).lean();
  const statusBySkill = new Map(saved.map((s) => [String(s.skill), s.status] as [string, SkillStatus]));

  const items: AssessmentItem[] = required.map((r) => ({
    skillId: String(r.skill._id),
    name: r.skill.name,
    category: r.skill.category,
    importance: r.importance,
    status: statusBySkill.get(String(r.skill._id)) ?? "not_started",
    isCustom: r.isCustom,
  }));

  const totalWeight = items.reduce((sum, i) => sum + WEIGHT[i.importance], 0);
  const earned = items.reduce((sum, i) => sum + WEIGHT[i.importance] * PROGRESS[i.status], 0);

  return {
    role: { id: String(role._id), name: role.name as string, isCustom: Boolean(role.isCustom) },
    items,
    readiness: totalWeight ? Math.round((earned / totalWeight) * 100) : 0,
    mastered: items.filter((i) => i.status === "mastered").length,
    total: items.length,
    criticalGaps: items.filter((i) => i.importance === "critical" && i.status === "not_started").map((i) => i.name),
  };
}



