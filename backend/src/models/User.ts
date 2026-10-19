import { Schema, model, Types } from "mongoose";
import { jsonOptions } from "./helpers";

export const ACADEMIC_YEARS = ["Year 1", "Year 2", "Year 3", "Year 4", "Graduate"] as const;

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  targetRole: Types.ObjectId;
  academicYear: (typeof ACADEMIC_YEARS)[number];
  customSkills: Types.ObjectId[];
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    targetRole: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    academicYear: { type: String, enum: [...ACADEMIC_YEARS], required: true },
    customSkills: [{ type: Schema.Types.ObjectId, ref: "Skill" }],
  },
  { timestamps: true, toJSON: jsonOptions }
);

export const User = model<IUser>("User", userSchema);