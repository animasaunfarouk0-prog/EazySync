import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

dotenv.config({ path: path.join(root, ".env.test"), override: true });

export default async function globalSetup() {
  const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL };
  console.log("[test-setup] Applying migrations to test database...");
  execSync("npx prisma migrate deploy", { cwd: root, env, stdio: "inherit" });
  console.log("[test-setup] Test database ready.");
}
