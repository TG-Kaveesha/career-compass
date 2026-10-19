import { Schema, model, Types } from "mongoose";
import { jsonOptions } from "./helpers";

export type Importance = "critical" | "important";

export interface IRequirement {
  skill: Types.ObjectId;
  importance: Importance;
}

export interface IRole {
  name: string;
  description: string;
  isCustom: boolean;
  requirements: IRequirement[];
}

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    isCustom: { type: Boolean, default: false },
    requirements: [
      {
        _id: false,
        skill: { type: Schema.Types.ObjectId, ref: "Skill", required: true },
        importance: { type: String, enum: ["critical", "important"], default: "important" },
      },
    ],
  },
  { toJSON: jsonOptions }
);

export const Role = model<IRole>("Role", roleSchema);