import { Types } from "mongoose";
import { Activity } from "../models/Activity";

export async function logActivity(userId: string | Types.ObjectId, message: string) {
  await Activity.create({ user: userId, message });
}