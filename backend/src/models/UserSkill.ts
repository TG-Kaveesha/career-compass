import { Schema, model, Types } from "mongoose";
import { jsonOptions } from "./helpers";

export const SKILL_STATUSES = ["not_started", "in_progress", "mastered"] as const;
export type SkillStatus = (typeof SKILL_STATUSES)[number];

export interface IUserSkill {
  user: Types.ObjectId;
  skill: Types.ObjectId;
  status: SkillStatus;
}

const userSkillSchema = new Schema<IUserSkill>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    skill: { type: Schema.Types.ObjectId, ref: "Skill", required: true },
    status: { type: String, enum: [...SKILL_STATUSES], default: "not_started" },
  },
  { timestamps: true, toJSON: jsonOptions }
);

userSkillSchema.index({ user: 1, skill: 1 }, { unique: true });

export const UserSkill = model<IUserSkill>("UserSkill", userSkillSchema);