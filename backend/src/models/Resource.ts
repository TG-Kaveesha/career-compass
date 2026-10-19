import { Schema, model, Types } from "mongoose";
import { jsonOptions } from "./helpers";

export const RESOURCE_TYPES = ["video", "article", "documentation", "certification"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export interface IResource {
  user: Types.ObjectId;
  title: string;
  url: string;
  type: ResourceType;
  skillTag: string;
}

const resourceSchema = new Schema<IResource>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 140 },
    url: { type: String, required: true, trim: true, maxlength: 500 },
    type: { type: String, enum: [...RESOURCE_TYPES], required: true },
    skillTag: { type: String, trim: true, maxlength: 40, default: "" },
  },
  { timestamps: true, toJSON: jsonOptions }
);

export const Resource = model<IResource>("Resource", resourceSchema);