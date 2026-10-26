import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, releaseEscrowMock } = vi.hoisted(() => ({
  prismaMock: {
    escrow: {
      findMany: vi.fn(),
    },
  },
  releaseEscrowMock: vi.fn(),
}));

vi.mock("../src/config/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("../src/services/escrow-release.service.js", () => ({
  releaseEscrow: releaseEscrowMock,
}));

type WorkerModule =
  typeof import("../src/services/escrow-release-worker.service.js");

let worker!: WorkerModule;
let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

async function flushPromises() {
  for (let i = 0; i < 12; i += 1) {
    await Promise.resolve();
  }
}

async function loadWorker() {
  vi.resetModules();
  worker = await import("../src/services/escrow-release-worker.service.js");
  return worker;
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.clearAllMocks();

  prismaMock.escrow.findMany.mockResolvedValue([]);
  releaseEscrowMock.mockResolvedValue({
    alreadyReleased: false,
  });

  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  await loadWorker();
});

afterEach(async () => {
  await worker?.stopEscrowReleaseWorker();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("escrow release worker", () => {
  describe("eligible escrow selection", () => {
    it("queries eligible escrows in release order with the expected batch limit", async () => {
      worker.startEscrowReleaseWorker();
      await flushPromises();

      expect(prismaMock.escrow.findMany).toHaveBeenCalledTimes(1);

      const args = prismaMock.escrow.findMany.mock.calls[0][0];

      expect(args.where).toEqual({
        status: {
          in: ["HELD", "PARTIALLY_REFUNDED"],
        },
        releaseEligibleAt: {
          lte: expect.any(Date),
        },
        releasedAt: null,
      });

      expect(args.select).toEqual({ id: true });
      expect(args.orderBy).toEqual({
        releaseEligibleAt: "asc",
      });
      expect(args.take).toBe(25);
    });

    it("does not call the release service when no escrows are eligible", async () => {
      prismaMock.escrow.findMany.mockResolvedValue([]);

      worker.startEscrowReleaseWorker();
      await flushPromises();

      expect(releaseEscrowMock).not.toHaveBeenCalled();
    });

    it("releases each eligible escrow with the automatic expiry reason", async () => {
      prismaMock.escrow.findMany.mockResolvedValue([
        { id: "escrow-1" },
        { id: "escrow-2" },
        { id: "escrow-3" },
      ]);

      worker.startEscrowReleaseWorker();
      await flushPromises();

      expect(releaseEscrowMock).toHaveBeenCalledTimes(3);

      expect(releaseEscrowMock).toHaveBeenNthCalledWith(1, {
        escrowId: "escrow-1",
        releaseReason: "AUTOMATIC_INSPECTION_WINDOW_EXPIRY",
      });

      expect(releaseEscrowMock).toHaveBeenNthCalledWith(2, {
        escrowId: "escrow-2",
        releaseReason: "AUTOMATIC_INSPECTION_WINDOW_EXPIRY",
      });

      expect(releaseEscrowMock).toHaveBeenNthCalledWith(3, {
        escrowId: "escrow-3",
        releaseReason: "AUTOMATIC_INSPECTION_WINDOW_EXPIRY",
      });
    });
  });

  describe("error handling", () => {
    it("continues processing other escrows when one release fails", async () => {
      prismaMock.escrow.findMany.mockResolvedValue([
        { id: "escrow-1" },
        { id: "escrow-2" },
        { id: "escrow-3" },
      ]);

      releaseEscrowMock
        .mockRejectedValueOnce(new Error("Settlement failed"))
        .mockResolvedValueOnce({ alreadyReleased: false })
        .mockResolvedValueOnce({ alreadyReleased: true });

      worker.startEscrowReleaseWorker();
      await flushPromises();

      expect(releaseEscrowMock).toHaveBeenCalledTimes(3);

      expect(errorSpy).toHaveBeenCalledWith(
        "[Escrow worker] Failed to process escrow escrow-1:",
        expect.any(Error),
      );

      expect(logSpy).toHaveBeenCalledWith(
        "[Escrow worker] Processed escrow escrow-2: alreadyReleased=false",
      );

      expect(logSpy).toHaveBeenCalledWith(
        "[Escrow worker] Processed escrow escrow-3: alreadyReleased=true",
      );
    });

    it("catches a failure fetching eligible escrows", async () => {
      const databaseError = new Error("Database unavailable");

      prismaMock.escrow.findMany.mockRejectedValue(databaseError);

      worker.startEscrowReleaseWorker();
      await flushPromises();

      expect(errorSpy).toHaveBeenCalledWith(
        "[Escrow worker] Failed to fetch eligible escrows:",
        databaseError,
      );

      expect(releaseEscrowMock).not.toHaveBeenCalled();
    });
  });

  describe("scheduling and lifecycle", () => {
    it("runs immediately on startup and repeats every 60 seconds", async () => {
      worker.startEscrowReleaseWorker();
      await flushPromises();

      expect(prismaMock.escrow.findMany).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(
        "[Escrow worker] Started; checking every 60 seconds.",
      );

      await vi.advanceTimersByTimeAsync(59_999);

      expect(prismaMock.escrow.findMany).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1);

      expect(prismaMock.escrow.findMany).toHaveBeenCalledTimes(2);
    });

    it("does not create multiple intervals when started more than once", async () => {
      worker.startEscrowReleaseWorker();
      worker.startEscrowReleaseWorker();

      await flushPromises();

      expect(prismaMock.escrow.findMany).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(60_000);

      expect(prismaMock.escrow.findMany).toHaveBeenCalledTimes(2);
    });

    it("prevents overlapping worker runs", async () => {
      const pendingQuery = deferred<Array<{ id: string }>>();

      prismaMock.escrow.findMany.mockReturnValue(pendingQuery.promise);

      worker.startEscrowReleaseWorker();

      // The initial run is still waiting for the database.
      await flushPromises();

      await vi.advanceTimersByTimeAsync(120_000);

      // Timer ticks during an active run must not start extra queries.
      expect(prismaMock.escrow.findMany).toHaveBeenCalledTimes(1);

      pendingQuery.resolve([]);
      await flushPromises();

      await vi.advanceTimersByTimeAsync(60_000);

      expect(prismaMock.escrow.findMany).toHaveBeenCalledTimes(2);
    });

    it("waits for an active run to finish when stopping", async () => {
      const pendingQuery = deferred<Array<{ id: string }>>();
      let stopped = false;

      prismaMock.escrow.findMany.mockReturnValue(pendingQuery.promise);

      worker.startEscrowReleaseWorker();
      await flushPromises();

      const stopping = worker.stopEscrowReleaseWorker().then(() => {
        stopped = true;
      });

      await flushPromises();

      expect(stopped).toBe(false);

      pendingQuery.resolve([]);
      await stopping;

      expect(stopped).toBe(true);
      expect(logSpy).toHaveBeenCalledWith("[Escrow worker] Stopped.");

      await vi.advanceTimersByTimeAsync(120_000);

      // Stopping must clear the scheduled interval.
      expect(prismaMock.escrow.findMany).toHaveBeenCalledTimes(1);
    });

    it("allows the worker to restart after it has stopped", async () => {
      worker.startEscrowReleaseWorker();
      await flushPromises();

      await worker.stopEscrowReleaseWorker();

      worker.startEscrowReleaseWorker();
      await flushPromises();

      expect(prismaMock.escrow.findMany).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(60_000);

      expect(prismaMock.escrow.findMany).toHaveBeenCalledTimes(3);
    });
  });
});
