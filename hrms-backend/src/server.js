import "dotenv/config";
import app from "./app.js";
import prisma from "./config/prisma.js";

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await prisma.$connect();
    console.log("Database connected.");
    app.listen(PORT, () => {
      console.log(`HRMS backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});