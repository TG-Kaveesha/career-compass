import { Schema, model, Types } from "mongoose";
import { jsonOptions } from "./helpers";

export interface IActivity {
  user: Types.ObjectId;
  message: string;
}

const activitySchema = new Schema<IActivity>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, maxlength: 200 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: jsonOptions }
);

activitySchema.index({ user: 1, createdAt: -1 });

export const Activity = model<IActivity>("Activity", activitySchema);