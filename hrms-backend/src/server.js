require("dotenv").config();

const app = require("./app");
const { PrismaClient } = require("@prisma/client");

const PORT = process.env.PORT || 5000;

const prisma = new PrismaClient();

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

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
