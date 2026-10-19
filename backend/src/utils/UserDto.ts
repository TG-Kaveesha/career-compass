import { Types } from "mongoose";
import { User } from "../models/User";
import { HttpError } from "./HttpError";

export async function getUserDto(userId: string | Types.ObjectId) {
    const u: any = await User.findById(userId).populate("targetRole", "name isCustom").lean();
  if (!u) throw new HttpError(404, "User not found");
  return {
    id: String(u._id),
    name: u.name as string,
    email: u.email as string,
    academicYear: u.academicYear as string,
    targetRole: {
      id: String(u.targetRole._id),
      name: u.targetRole.name as string,
      isCustom: Boolean(u.targetRole.isCustom),
    },
  };
}
 