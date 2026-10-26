import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import {
  startEscrowReleaseWorker,
  stopEscrowReleaseWorker,
} from "./services/escrow-release-worker.service.js";

const server = app.listen(env.PORT, () => {
  console.log(`R.O.A API running on http://localhost:${env.PORT}`);
  startEscrowReleaseWorker();
});

async function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down...`);

  server.close(async () => {
    try {
      await stopEscrowReleaseWorker();
      await prisma.$disconnect();

      console.log("Server closed.");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);

  process.exit(1);
});
