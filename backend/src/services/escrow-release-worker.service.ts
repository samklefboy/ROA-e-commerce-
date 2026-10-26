import { prisma } from "../config/prisma.js";
import { releaseEscrow } from "./escrow-release.service.js";

const INTERVAL_MS = 60_000;
const BATCH_SIZE = 25;

let interval: ReturnType<typeof setInterval> | undefined;
let activeRun: Promise<void> | null = null;

async function processEligibleEscrows(): Promise<void> {
  const now = new Date();

  const eligibleEscrows = await prisma.escrow.findMany({
    where: {
      status: {
        in: ["HELD", "PARTIALLY_REFUNDED"],
      },
      releaseEligibleAt: {
        lte: now,
      },
      releasedAt: null,
    },
    select: {
      id: true,
    },
    orderBy: {
      releaseEligibleAt: "asc",
    },
    take: BATCH_SIZE,
  });

  for (const escrow of eligibleEscrows) {
    try {
      const result = await releaseEscrow({
        escrowId: escrow.id,
        releaseReason: "AUTOMATIC_INSPECTION_WINDOW_EXPIRY",
      });

      console.log(
        `[Escrow worker] Processed escrow ${escrow.id}: ` +
          `alreadyReleased=${result.alreadyReleased}`,
      );
    } catch (error) {
      // One ineligible escrow must not prevent the rest of the batch.
      console.error(
        `[Escrow worker] Failed to process escrow ${escrow.id}:`,
        error,
      );
    }
  }
}

async function runWorker(): Promise<void> {
  try {
    await processEligibleEscrows();
  } catch (error) {
    console.error("[Escrow worker] Failed to fetch eligible escrows:", error);
  }
}

function triggerWorker(): void {
  // Prevent overlapping runs in this Node.js process.
  if (activeRun) {
    return;
  }

  activeRun = runWorker().finally(() => {
    activeRun = null;
  });
}

export function startEscrowReleaseWorker(): void {
  if (interval) {
    return;
  }

  console.log("[Escrow worker] Started; checking every 60 seconds.");

  // Process eligible escrows on startup instead of waiting one minute.
  triggerWorker();

  interval = setInterval(triggerWorker, INTERVAL_MS);
}

export async function stopEscrowReleaseWorker(): Promise<void> {
  if (interval) {
    clearInterval(interval);
    interval = undefined;
  }

  // Let the current batch finish before disconnecting Prisma.
  if (activeRun) {
    await activeRun;
  }

  console.log("[Escrow worker] Stopped.");
}
