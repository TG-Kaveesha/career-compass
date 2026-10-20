import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/error";
import assessmentRoutes from "./routes/assessment";
import authRoutes from "./routes/auth";
import dashboardRoutes from "./routes/dashboard";
import milestoneRoutes from "./routes/milestones";
import profileRoutes from "./routes/profile";
import resourceRoutes from "./routes/resources";
import roleRoutes from "./routes/roles";

export function createApp() {
  const app = express();
  app.use(cors({ origin: env.clientUrl }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/roles", roleRoutes);
  app.use("/api/assessment", assessmentRoutes);
  app.use("/api/milestones", milestoneRoutes);
  app.use("/api/resources", resourceRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/profile", profileRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}