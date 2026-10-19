import { Schema, model, Types } from "mongoose";
import { jsonOptions } from "./helpers";

export const MILESTONE_STATUSES = ["todo", "in_progress", "completed"] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export interface IMilestone {
  user: Types.ObjectId;
  title: string;
  skillTag: string;
  dueDate: Date | null;
  status: MilestoneStatus;
}

const milestoneSchema = new Schema<IMilestone>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    skillTag: { type: String, trim: true, maxlength: 40, default: "" },
    dueDate: { type: Date, default: null },
    status: { type: String, enum: [...MILESTONE_STATUSES], default: "todo" },
  },
  { timestamps: true, toJSON: jsonOptions }
);

export const Milestone = model<IMilestone>("Milestone", milestoneSchema);