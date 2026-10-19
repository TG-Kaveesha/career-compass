import { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../utils/HttpError";

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, "Route not found"));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, errors: err.details });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ message: "That value already exists" });
  }
  if (err?.name === "CastError" || err?.name === "ValidationError") {
    return res.status(400).json({ message: "Invalid data supplied" });
  }
  console.error(err);
  return res.status(500).json({ message: "Something went wrong on the server" });
};