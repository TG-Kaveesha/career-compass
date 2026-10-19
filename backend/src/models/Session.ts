import { Schema, model, Types } from "mongoose";
import { jsonOptions } from "./helpers";

export interface ISession {
  user: Types.ObjectId;
  device: string;
  location: string;
  expiresAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    device: { type: String, default: "Browser" },
    location: { type: String, default: "Unknown" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, toJSON: jsonOptions }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = model<ISession>("Session", sessionSchema);