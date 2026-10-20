import { connectDB } from "./config/db";
import { env } from "./config/env";
import { createApp } from "./app";
import { seedRoles } from "./seed";

async function main() {
  await connectDB();
  await seedRoles();
  createApp().listen(env.port, () => console.log(`API running on http://localhost:${env.port}`));
}

main().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});