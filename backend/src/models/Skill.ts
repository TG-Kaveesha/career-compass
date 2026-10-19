import { Schema, model, Types } from "mongoose";
import { jsonOptions } from "./helpers";

export interface ISkill {
    name: string;
  category: string;
  owner?: Types.ObjectId;
}

const skillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    category: { type: String, required: true, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { toJSON: jsonOptions }
);

skillSchema.index({ name: 1, owner: 1 }, { unique: true });

export const Skill = model<ISkill>("Skill", skillSchema);