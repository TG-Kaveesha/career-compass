import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Session } from "../models/Session";
import { HttpError } from "../utils/HttpError";

export interface AuthPayload {
  userId: string;
  sessionId: string;
}

declare global {
    namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new HttpError(401, "Please log in to continue");
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as unknown as AuthPayload;
    const session = await Session.exists({ _id: payload.sessionId, user: payload.userId });
    if (!session) throw new HttpError(401, "Your session has ended. Please log in again");
    req.auth = payload;
    next();
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(401, "Invalid or expired token"));
  }
}
