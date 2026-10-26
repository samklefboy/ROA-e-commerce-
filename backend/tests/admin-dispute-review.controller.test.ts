import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  reviewDispute: vi.fn(),
}));

vi.mock("../src/services/admin/admin-dispute-review.service.js", () => ({
  reviewDispute: mocks.reviewDispute,
}));

import { reviewDisputeController } from "../src/controllers/admin/admin-dispute-review.controller.js";

const IDS = {
  dispute: "dispute-1",
  admin: "admin-1",
};

const REVIEW_NOTE = "Reviewed the evidence and verified the dispute details.";

type RequestOverrides = {
  id?: unknown;
  authUser?: { id: string; phone: string } | undefined;
  body?: unknown;
};

function makeRequest(overrides: RequestOverrides = {}) {
  const id = Object.prototype.hasOwnProperty.call(overrides, "id")
    ? overrides.id
    : IDS.dispute;

  const authUser = Object.prototype.hasOwnProperty.call(overrides, "authUser")
    ? overrides.authUser
    : { id: IDS.admin, phone: "+2348012345678" };

  const body = Object.prototype.hasOwnProperty.call(overrides, "body")
    ? overrides.body
    : {};

  return {
    params: { id },
    authUser,
    body,
  } as unknown as Request;
}

function makeResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };

  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

describe("reviewDisputeController", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("authentication and request validation", () => {
    it("rejects a request without an authenticated user", async () => {
      const req = makeRequest({ authUser: undefined });
      const res = makeResponse();

      await expect(reviewDisputeController(req, res)).rejects.toMatchObject({
        message: "Authentication required",
      });

      expect(mocks.reviewDispute).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it.each([
      ["missing dispute ID", undefined],
      ["empty dispute ID", ""],
      ["non-string dispute ID", ["dispute-1"]],
    ])("rejects a %s", async (_description, id) => {
      const req = makeRequest({ id });
      const res = makeResponse();

      await expect(reviewDisputeController(req, res)).rejects.toMatchObject({
        message: "A valid dispute ID is required",
      });

      expect(mocks.reviewDispute).not.toHaveBeenCalled();
    });

    it.each([
      ["null", null],
      ["an array", []],
      ["a string", "invalid"],
      ["a number", 123],
      ["a boolean", true],
    ])("rejects a request body containing %s", async (_description, body) => {
      const req = makeRequest({ body });
      const res = makeResponse();

      await expect(reviewDisputeController(req, res)).rejects.toMatchObject({
        message: "Request body must be an object",
      });

      expect(mocks.reviewDispute).not.toHaveBeenCalled();
    });

    it.each([
      ["a number", 123],
      ["a boolean", true],
      ["an object", {}],
      ["an array", []],
      ["null", null],
    ])(
      "rejects a review note containing %s",
      async (_description, reviewNote) => {
        const req = makeRequest({ body: { reviewNote } });
        const res = makeResponse();

        await expect(reviewDisputeController(req, res)).rejects.toMatchObject({
          message: "Review note must be a string of at most 5000 characters",
        });

        expect(mocks.reviewDispute).not.toHaveBeenCalled();
      },
    );

    it("rejects a review note longer than 5000 characters", async () => {
      const req = makeRequest({
        body: { reviewNote: "x".repeat(5001) },
      });
      const res = makeResponse();

      await expect(reviewDisputeController(req, res)).rejects.toMatchObject({
        message: "Review note must be a string of at most 5000 characters",
      });

      expect(mocks.reviewDispute).not.toHaveBeenCalled();
    });
  });

  describe("successful review requests", () => {
    it("reviews a dispute and returns the expected success response", async () => {
      const dispute = {
        id: IDS.dispute,
        status: "UNDER_REVIEW",
        reviewNote: REVIEW_NOTE,
      };

      mocks.reviewDispute.mockResolvedValue(dispute);

      const req = makeRequest({
        body: { reviewNote: REVIEW_NOTE },
      });
      const res = makeResponse();

      await reviewDisputeController(req, res);

      expect(mocks.reviewDispute).toHaveBeenCalledTimes(1);
      expect(mocks.reviewDispute).toHaveBeenCalledWith({
        disputeId: IDS.dispute,
        adminId: IDS.admin,
        reviewNote: REVIEW_NOTE,
      });

      expect(res.status).toHaveBeenCalledOnce();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Dispute moved to admin review successfully",
        data: dispute,
      });
    });

    it("allows a request without a review note", async () => {
      const dispute = {
        id: IDS.dispute,
        status: "UNDER_REVIEW",
      };

      mocks.reviewDispute.mockResolvedValue(dispute);

      const req = makeRequest({ body: {} });
      const res = makeResponse();

      await reviewDisputeController(req, res);

      expect(mocks.reviewDispute).toHaveBeenCalledWith({
        disputeId: IDS.dispute,
        adminId: IDS.admin,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Dispute moved to admin review successfully",
        data: dispute,
      });
    });

    it("accepts a review note containing exactly 5000 characters", async () => {
      const reviewNote = "x".repeat(5000);

      mocks.reviewDispute.mockResolvedValue({ id: IDS.dispute });

      const req = makeRequest({
        body: { reviewNote },
      });
      const res = makeResponse();

      await reviewDisputeController(req, res);

      expect(mocks.reviewDispute).toHaveBeenCalledWith({
        disputeId: IDS.dispute,
        adminId: IDS.admin,
        reviewNote,
      });
    });

    it("preserves an explicitly supplied empty review note", async () => {
      mocks.reviewDispute.mockResolvedValue({ id: IDS.dispute });

      const req = makeRequest({
        body: { reviewNote: "" },
      });
      const res = makeResponse();

      await reviewDisputeController(req, res);

      expect(mocks.reviewDispute).toHaveBeenCalledWith({
        disputeId: IDS.dispute,
        adminId: IDS.admin,
        reviewNote: "",
      });
    });

    it("ignores unrelated request body properties", async () => {
      mocks.reviewDispute.mockResolvedValue({ id: IDS.dispute });

      const req = makeRequest({
        body: {
          reviewNote: REVIEW_NOTE,
          outcome: "REJECTED",
          adminId: "forged-admin-id",
          unexpectedField: true,
        },
      });
      const res = makeResponse();

      await reviewDisputeController(req, res);

      expect(mocks.reviewDispute).toHaveBeenCalledWith({
        disputeId: IDS.dispute,
        adminId: IDS.admin,
        reviewNote: REVIEW_NOTE,
      });
    });
  });

  describe("service error handling", () => {
    it("propagates a service error without returning a success response", async () => {
      const serviceError = new Error("Dispute not found");

      mocks.reviewDispute.mockRejectedValue(serviceError);

      const req = makeRequest();
      const res = makeResponse();

      await expect(reviewDisputeController(req, res)).rejects.toBe(
        serviceError,
      );

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("does not call the review service when request validation fails", async () => {
      const req = makeRequest({
        body: { reviewNote: "x".repeat(5001) },
      });
      const res = makeResponse();

      await expect(reviewDisputeController(req, res)).rejects.toBeDefined();

      expect(mocks.reviewDispute).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
