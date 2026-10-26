import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    dispute: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    store: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("../src/config/prisma.js", () => ({
  prisma: mocks.prisma,
}));

import {
  getAdminDisputeById,
  getAdminDisputes,
  getBuyerDisputes,
  getDisputeForParticipant,
  getSellerDisputes,
} from "../src/services/dispute-query.service.js";

import {
  getAdminDisputeController,
  getAdminDisputesController,
  getDisputeController,
  getMyDisputesController,
  getSellerDisputesController,
} from "../src/controllers/dispute-query.controller.js";

import { ApiError } from "../src/utils/api-error.js";

const IDS = {
  dispute: "dispute-1",
  otherDispute: "dispute-2",
  order: "order-1",
  buyer: "buyer-1",
  seller: "seller-1",
  admin: "admin-1",
  store: "store-1",
};

function makeDispute(overrides: Record<string, any> = {}) {
  return {
    id: IDS.dispute,
    orderId: IDS.order,
    escrowId: "escrow-1",
    buyerId: IDS.buyer,
    sellerId: IDS.seller,
    reason: "PRODUCT_NOT_AS_DESCRIBED",
    status: "OPEN",
    description: "The item was not as described.",
    evidence: [],
    sellerResponse: null,
    resolutionNote: null,
    resolvedAt: null,
    createdAt: new Date("2026-10-13T10:00:00.000Z"),
    updatedAt: new Date("2026-10-13T10:00:00.000Z"),
    order: {
      id: IDS.order,
      orderNumber: "ROA-ORDER-001",
      status: "DELIVERED",
      paymentStatus: "PAID",
      total: "100.00",
      currency: "NGN",
      createdAt: new Date("2026-10-12T10:00:00.000Z"),
      store: {
        id: IDS.store,
        ownerId: IDS.seller,
      },
    },
    ...overrides,
  };
}

function makeRequest(overrides: Record<string, any> = {}) {
  return {
    authUser: {
      id: IDS.buyer,
      phone: "08000000000",
    },
    params: {},
    ...overrides,
  } as any;
}

function makeResponse() {
  const res: any = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
}

async function expectApiError(
  action: () => Promise<unknown>,
  expected: {
    statusCode?: number;
    code?: string;
  },
) {
  try {
    await action();
    expect.fail("Expected the operation to throw an ApiError");
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject(expected);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Dispute query services", () => {
  describe("getBuyerDisputes", () => {
    it("queries only the specified buyer's disputes, newest first", async () => {
      const disputes = [makeDispute()];
      mocks.prisma.dispute.findMany.mockResolvedValue(disputes);

      await expect(getBuyerDisputes(IDS.buyer)).resolves.toBe(disputes);

      expect(mocks.prisma.dispute.findMany).toHaveBeenCalledWith({
        where: {
          buyerId: IDS.buyer,
        },
        select: expect.any(Object),
        orderBy: {
          createdAt: "desc",
        },
      });
    });
  });

  describe("getSellerDisputes", () => {
    it("restricts disputes to the seller and a store they own", async () => {
      const disputes = [makeDispute()];
      mocks.prisma.dispute.findMany.mockResolvedValue(disputes);

      await expect(getSellerDisputes(IDS.seller)).resolves.toBe(disputes);

      expect(mocks.prisma.dispute.findMany).toHaveBeenCalledWith({
        where: {
          sellerId: IDS.seller,
          order: {
            store: {
              ownerId: IDS.seller,
            },
          },
        },
        select: expect.any(Object),
        orderBy: {
          createdAt: "desc",
        },
      });
    });
  });

  describe("getAdminDisputes", () => {
    it("returns all disputes newest first", async () => {
      const disputes = [makeDispute()];
      mocks.prisma.dispute.findMany.mockResolvedValue(disputes);

      await expect(getAdminDisputes()).resolves.toBe(disputes);

      expect(mocks.prisma.dispute.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        orderBy: {
          createdAt: "desc",
        },
      });
    });
  });

  describe("getDisputeForParticipant", () => {
    it("allows the buyer to query their dispute", async () => {
      const dispute = makeDispute();
      mocks.prisma.dispute.findFirst.mockResolvedValue(dispute);

      await expect(
        getDisputeForParticipant(IDS.dispute, IDS.buyer),
      ).resolves.toBe(dispute);

      expect(mocks.prisma.dispute.findFirst).toHaveBeenCalledWith({
        where: {
          id: IDS.dispute,
          OR: [
            {
              buyerId: IDS.buyer,
            },
            {
              sellerId: IDS.buyer,
              order: {
                store: {
                  ownerId: IDS.buyer,
                },
              },
            },
          ],
        },
        select: expect.any(Object),
      });
    });

    it("uses the seller's identity and store ownership in the access query", async () => {
      const dispute = makeDispute();
      mocks.prisma.dispute.findFirst.mockResolvedValue(dispute);

      await getDisputeForParticipant(IDS.dispute, IDS.seller);

      expect(mocks.prisma.dispute.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: IDS.dispute,
            OR: [
              {
                buyerId: IDS.seller,
              },
              {
                sellerId: IDS.seller,
                order: {
                  store: {
                    ownerId: IDS.seller,
                  },
                },
              },
            ],
          },
        }),
      );
    });

    it("returns the same 404 when the dispute is missing or inaccessible", async () => {
      mocks.prisma.dispute.findFirst.mockResolvedValue(null);

      await expectApiError(
        () => getDisputeForParticipant(IDS.dispute, "unrelated-user"),
        {
          statusCode: 404,
          code: "DISPUTE_NOT_FOUND",
        },
      );
    });
  });

  describe("getAdminDisputeById", () => {
    it("queries a dispute by its unique ID", async () => {
      const dispute = makeDispute();
      mocks.prisma.dispute.findUnique.mockResolvedValue(dispute);

      await expect(getAdminDisputeById(IDS.dispute)).resolves.toBe(dispute);

      expect(mocks.prisma.dispute.findUnique).toHaveBeenCalledWith({
        where: {
          id: IDS.dispute,
        },
        select: expect.any(Object),
      });
    });

    it("throws 404 when the requested dispute does not exist", async () => {
      mocks.prisma.dispute.findUnique.mockResolvedValue(null);

      await expectApiError(() => getAdminDisputeById("missing-dispute"), {
        statusCode: 404,
        code: "DISPUTE_NOT_FOUND",
      });
    });
  });
});

describe("Dispute query controllers", () => {
  describe("getMyDisputesController", () => {
    it("returns the authenticated buyer's disputes", async () => {
      const disputes = [makeDispute()];
      mocks.prisma.dispute.findMany.mockResolvedValue(disputes);

      const req = makeRequest();
      const res = makeResponse();

      await getMyDisputesController(req, res);

      expect(mocks.prisma.dispute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            buyerId: IDS.buyer,
          },
        }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: disputes,
      });
    });

    it("rejects requests without an authenticated user", async () => {
      const req = makeRequest({
        authUser: undefined,
      });
      const res = makeResponse();

      await expectApiError(() => getMyDisputesController(req, res), {
        statusCode: 401,
        code: "AUTH_REQUIRED",
      });

      expect(mocks.prisma.dispute.findMany).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getSellerDisputesController", () => {
    it("returns disputes when the authenticated user owns a store", async () => {
      const disputes = [makeDispute()];

      mocks.prisma.store.findUnique.mockResolvedValue({
        id: IDS.store,
      });
      mocks.prisma.dispute.findMany.mockResolvedValue(disputes);

      const req = makeRequest({
        authUser: {
          id: IDS.seller,
          phone: "08000000001",
        },
      });
      const res = makeResponse();

      await getSellerDisputesController(req, res);

      expect(mocks.prisma.store.findUnique).toHaveBeenCalledWith({
        where: {
          ownerId: IDS.seller,
        },
        select: {
          id: true,
        },
      });

      expect(mocks.prisma.dispute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sellerId: IDS.seller,
            order: {
              store: {
                ownerId: IDS.seller,
              },
            },
          },
        }),
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: disputes,
      });
    });

    it("rejects authenticated users who do not own a store", async () => {
      mocks.prisma.store.findUnique.mockResolvedValue(null);

      const req = makeRequest();
      const res = makeResponse();

      await expectApiError(() => getSellerDisputesController(req, res), {
        statusCode: 403,
        code: "SELLER_ACCESS_REQUIRED",
      });

      expect(mocks.prisma.dispute.findMany).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("rejects requests without an authenticated user", async () => {
      const req = makeRequest({
        authUser: undefined,
      });
      const res = makeResponse();

      await expectApiError(() => getSellerDisputesController(req, res), {
        statusCode: 401,
        code: "AUTH_REQUIRED",
      });

      expect(mocks.prisma.store.findUnique).not.toHaveBeenCalled();
      expect(mocks.prisma.dispute.findMany).not.toHaveBeenCalled();
    });
  });

  describe("getDisputeController", () => {
    it("returns a dispute accessible to the authenticated participant", async () => {
      const dispute = makeDispute();
      mocks.prisma.dispute.findFirst.mockResolvedValue(dispute);

      const req = makeRequest({
        params: {
          id: IDS.dispute,
        },
      });
      const res = makeResponse();

      await getDisputeController(req, res);

      expect(mocks.prisma.dispute.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: IDS.dispute,
          }),
        }),
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: dispute,
      });
    });

    it("rejects requests without an authenticated user", async () => {
      const req = makeRequest({
        authUser: undefined,
        params: {
          id: IDS.dispute,
        },
      });
      const res = makeResponse();

      await expectApiError(() => getDisputeController(req, res), {
        statusCode: 401,
        code: "AUTH_REQUIRED",
      });

      expect(mocks.prisma.dispute.findFirst).not.toHaveBeenCalled();
    });

    it("rejects a missing dispute ID", async () => {
      const req = makeRequest({
        params: {},
      });
      const res = makeResponse();

      await expectApiError(() => getDisputeController(req, res), {
        statusCode: 400,
      });

      expect(mocks.prisma.dispute.findFirst).not.toHaveBeenCalled();
    });

    it("rejects an array-valued dispute ID", async () => {
      const req = makeRequest({
        params: {
          id: [IDS.dispute, IDS.otherDispute],
        },
      });
      const res = makeResponse();

      await expectApiError(() => getDisputeController(req, res), {
        statusCode: 400,
      });

      expect(mocks.prisma.dispute.findFirst).not.toHaveBeenCalled();
    });

    it("returns 404 when the dispute is missing or belongs to someone else", async () => {
      mocks.prisma.dispute.findFirst.mockResolvedValue(null);

      const req = makeRequest({
        authUser: {
          id: "unrelated-user",
          phone: "08000000002",
        },
        params: {
          id: IDS.dispute,
        },
      });
      const res = makeResponse();

      await expectApiError(() => getDisputeController(req, res), {
        statusCode: 404,
        code: "DISPUTE_NOT_FOUND",
      });

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("getAdminDisputesController", () => {
    it("returns the admin dispute list in the standard response format", async () => {
      const disputes = [makeDispute()];
      mocks.prisma.dispute.findMany.mockResolvedValue(disputes);

      const req = makeRequest();
      const res = makeResponse();

      await getAdminDisputesController(req, res);

      expect(mocks.prisma.dispute.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: disputes,
      });
    });
  });

  describe("getAdminDisputeController", () => {
    it("returns the requested dispute in the standard response format", async () => {
      const dispute = makeDispute();
      mocks.prisma.dispute.findUnique.mockResolvedValue(dispute);

      const req = makeRequest({
        params: {
          id: IDS.dispute,
        },
      });
      const res = makeResponse();

      await getAdminDisputeController(req, res);

      expect(mocks.prisma.dispute.findUnique).toHaveBeenCalledWith({
        where: {
          id: IDS.dispute,
        },
        select: expect.any(Object),
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: dispute,
      });
    });

    it("rejects a missing dispute ID", async () => {
      const req = makeRequest({
        params: {},
      });
      const res = makeResponse();

      await expectApiError(() => getAdminDisputeController(req, res), {
        statusCode: 400,
      });

      expect(mocks.prisma.dispute.findUnique).not.toHaveBeenCalled();
    });

    it("returns 404 when the requested dispute does not exist", async () => {
      mocks.prisma.dispute.findUnique.mockResolvedValue(null);

      const req = makeRequest({
        params: {
          id: "missing-dispute",
        },
      });
      const res = makeResponse();

      await expectApiError(() => getAdminDisputeController(req, res), {
        statusCode: 404,
        code: "DISPUTE_NOT_FOUND",
      });
    });
  });
});
