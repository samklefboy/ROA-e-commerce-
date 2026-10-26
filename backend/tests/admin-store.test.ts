import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoreStatus } from "../generated/prisma/client.js";

const mocks = vi.hoisted(() => {
  const storeMock = {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  };

  const auditLogMock = {
    create: vi.fn(),
  };

  const notificationMock = {
    create: vi.fn(),
  };

  const tx = {
    store: storeMock,
    auditLog: auditLogMock,
    notification: notificationMock,
  };

  const prismaMock = {
    store: storeMock,
    auditLog: auditLogMock,
    notification: notificationMock,
    $transaction: vi.fn(),
  };

  return {
    storeMock,
    auditLogMock,
    notificationMock,
    tx,
    prismaMock,
  };
});

vi.mock("../src/config/prisma.js", () => ({
  prisma: mocks.prismaMock,
}));

import {
  getAdminStoreById,
  listAdminStores,
  reinstateAdminStore,
  suspendAdminStore,
} from "../src/services/admin/admin-store.service.js";

const STORE_ID = "store_test_123";
const OWNER_ID = "seller_test_123";
const ADMIN_ID = "admin_test_123";

const activeStore = {
  id: STORE_ID,
  name: "SportZone Official",
  ownerId: OWNER_ID,
  status: StoreStatus.ACTIVE,
};

const suspendedStore = {
  id: STORE_ID,
  name: "SportZone Official",
  ownerId: OWNER_ID,
  status: StoreStatus.SUSPENDED,
  category: "SPORTS",
  about: "Sports products for everyday use",
  whatsapp: "+2348012345678",
  location: "Lagos, Nigeria",
  deliveryDaysMin: 1,
  deliveryDaysMax: 5,
};

const returnedStore = {
  id: STORE_ID,
  name: "SportZone Official",
  slug: "sportzone-official",
  handle: "sportzone",
  category: "SPORTS",
  status: StoreStatus.ACTIVE,
  isVerified: false,
  isOpen: true,
  location: "Lagos, Nigeria",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  owner: {
    id: OWNER_ID,
    phone: "+2348012345678",
    isVerified: true,
  },
  _count: {
    products: 4,
    orders: 2,
  },
};

const validReason = "Policy violation reviewed by ROA administration";

function configureTransactionMock() {
  mocks.prismaMock.$transaction.mockImplementation(
    async (operation: unknown) => {
      if (typeof operation === "function") {
        return operation(mocks.tx);
      }

      if (Array.isArray(operation)) {
        return Promise.all(operation);
      }

      throw new Error("Unexpected transaction operation");
    },
  );
}

function configureDefaultMocks() {
  configureTransactionMock();

  mocks.storeMock.findMany.mockResolvedValue([]);
  mocks.storeMock.count.mockResolvedValue(0);
  mocks.storeMock.findUnique.mockResolvedValue(activeStore);
  mocks.storeMock.updateMany.mockResolvedValue({ count: 1 });
  mocks.storeMock.findUniqueOrThrow.mockResolvedValue(returnedStore);

  mocks.auditLogMock.create.mockResolvedValue({
    id: "audit_test_123",
  });

  mocks.notificationMock.create.mockResolvedValue({
    id: "notification_test_123",
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  configureDefaultMocks();
});

describe("listAdminStores", () => {
  it("returns an empty paginated result by default", async () => {
    const result = await listAdminStores();

    expect(result).toEqual({
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });

    expect(mocks.storeMock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 20,
      }),
    );

    expect(mocks.storeMock.count).toHaveBeenCalled();
    expect(mocks.prismaMock.$transaction).toHaveBeenCalledOnce();
  });

  it("filters by status and search term and applies pagination", async () => {
    mocks.storeMock.findMany.mockResolvedValue([returnedStore]);
    mocks.storeMock.count.mockResolvedValue(21);

    const result = await listAdminStores({
      status: StoreStatus.ACTIVE,
      search: "SportZone",
      page: 2,
      limit: 10,
    });

    expect(result.items).toEqual([returnedStore]);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });

    expect(mocks.storeMock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: StoreStatus.ACTIVE,
          OR: expect.arrayContaining([
            {
              name: {
                contains: "SportZone",
                mode: "insensitive",
              },
            },
          ]),
        }),
        skip: 10,
        take: 10,
      }),
    );
  });

  it.each([
    { page: 0, limit: 20 },
    { page: -1, limit: 20 },
    { page: 1.5, limit: 20 },
    { page: 1, limit: 0 },
    { page: 1, limit: 101 },
    { page: Number.MAX_SAFE_INTEGER + 1, limit: 20 },
  ])("rejects invalid pagination: $page / $limit", async (input) => {
    await expect(listAdminStores(input)).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_PAGINATION",
    });

    expect(mocks.prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe("getAdminStoreById", () => {
  it("returns store details when the store exists", async () => {
    mocks.storeMock.findUnique.mockResolvedValue(returnedStore);

    await expect(getAdminStoreById(STORE_ID)).resolves.toEqual(returnedStore);

    expect(mocks.storeMock.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: STORE_ID },
      }),
    );
  });

  it("rejects when the store does not exist", async () => {
    mocks.storeMock.findUnique.mockResolvedValue(null);

    await expect(getAdminStoreById("missing_store")).rejects.toMatchObject({
      statusCode: 404,
      code: "STORE_NOT_FOUND",
    });
  });
});

describe("suspendAdminStore", () => {
  it("suspends an active store and records an audit log and notification", async () => {
    mocks.storeMock.findUnique.mockResolvedValue(activeStore);
    mocks.storeMock.findUniqueOrThrow.mockResolvedValue({
      ...returnedStore,
      status: StoreStatus.SUSPENDED,
    });

    const result = await suspendAdminStore({
      storeId: STORE_ID,
      adminId: ADMIN_ID,
      reason: validReason,
    });

    expect(result.status).toBe(StoreStatus.SUSPENDED);

    expect(mocks.storeMock.updateMany).toHaveBeenCalledWith({
      where: {
        id: STORE_ID,
        status: StoreStatus.ACTIVE,
      },
      data: {
        status: StoreStatus.SUSPENDED,
      },
    });

    expect(mocks.auditLogMock.create).toHaveBeenCalledWith({
      data: {
        actorType: "ADMIN",
        actorId: ADMIN_ID,
        userId: OWNER_ID,
        action: "STORE_SUSPENDED",
        reference: STORE_ID,
        metadata: {
          storeId: STORE_ID,
          storeName: activeStore.name,
          previousStatus: StoreStatus.ACTIVE,
          newStatus: StoreStatus.SUSPENDED,
          reason: validReason,
        },
      },
    });

    expect(mocks.notificationMock.create).toHaveBeenCalledWith({
      data: {
        recipientId: OWNER_ID,
        type: "STORE_SUSPENDED",
        title: "Your store has been suspended",
        message: expect.any(String),
        data: {
          storeId: STORE_ID,
          storeName: activeStore.name,
          status: StoreStatus.SUSPENDED,
          reason: validReason,
        },
      },
    });

    expect(mocks.prismaMock.$transaction).toHaveBeenCalledOnce();
  });

  it.each([
    StoreStatus.PENDING,
    StoreStatus.SUSPENDED,
    StoreStatus.CLOSED,
    StoreStatus.REJECTED,
  ])("rejects suspension when current status is %s", async (status) => {
    mocks.storeMock.findUnique.mockResolvedValue({
      ...activeStore,
      status,
    });

    await expect(
      suspendAdminStore({
        storeId: STORE_ID,
        adminId: ADMIN_ID,
        reason: validReason,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "STORE_NOT_ACTIVE",
    });

    expect(mocks.storeMock.updateMany).not.toHaveBeenCalled();
    expect(mocks.auditLogMock.create).not.toHaveBeenCalled();
    expect(mocks.notificationMock.create).not.toHaveBeenCalled();
  });

  it("rejects suspension if the store does not exist", async () => {
    mocks.storeMock.findUnique.mockResolvedValue(null);

    await expect(
      suspendAdminStore({
        storeId: STORE_ID,
        adminId: ADMIN_ID,
        reason: validReason,
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "STORE_NOT_FOUND",
    });

    expect(mocks.storeMock.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a reason shorter than five characters", async () => {
    await expect(
      suspendAdminStore({
        storeId: STORE_ID,
        adminId: ADMIN_ID,
        reason: " bad ",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_STORE_STATUS_REASON",
    });

    expect(mocks.prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a reason longer than 1000 characters", async () => {
    await expect(
      suspendAdminStore({
        storeId: STORE_ID,
        adminId: ADMIN_ID,
        reason: "x".repeat(1001),
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_STORE_STATUS_REASON",
    });

    expect(mocks.prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a concurrent status change without writing audit or notification", async () => {
    mocks.storeMock.findUnique.mockResolvedValue(activeStore);
    mocks.storeMock.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      suspendAdminStore({
        storeId: STORE_ID,
        adminId: ADMIN_ID,
        reason: validReason,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "STORE_STATUS_CHANGED",
    });

    expect(mocks.auditLogMock.create).not.toHaveBeenCalled();
    expect(mocks.notificationMock.create).not.toHaveBeenCalled();
  });

  it("propagates audit-log failure and does not create a notification", async () => {
    mocks.storeMock.findUnique.mockResolvedValue(activeStore);
    mocks.auditLogMock.create.mockRejectedValue(
      new Error("Audit database failure"),
    );

    await expect(
      suspendAdminStore({
        storeId: STORE_ID,
        adminId: ADMIN_ID,
        reason: validReason,
      }),
    ).rejects.toThrow("Audit database failure");

    expect(mocks.notificationMock.create).not.toHaveBeenCalled();
  });

  it("propagates notification failure", async () => {
    mocks.storeMock.findUnique.mockResolvedValue(activeStore);
    mocks.notificationMock.create.mockRejectedValue(
      new Error("Notification database failure"),
    );

    await expect(
      suspendAdminStore({
        storeId: STORE_ID,
        adminId: ADMIN_ID,
        reason: validReason,
      }),
    ).rejects.toThrow("Notification database failure");
  });
});

describe("reinstateAdminStore", () => {
  it("reinstates a suspended store with complete setup", async () => {
    mocks.storeMock.findUnique.mockResolvedValue(suspendedStore);
    mocks.storeMock.findUniqueOrThrow.mockResolvedValue({
      ...returnedStore,
      status: StoreStatus.ACTIVE,
    });

    const result = await reinstateAdminStore({
      storeId: STORE_ID,
      adminId: ADMIN_ID,
      reason: "Required setup has been verified and the store may resume",
    });

    expect(result.status).toBe(StoreStatus.ACTIVE);

    expect(mocks.storeMock.updateMany).toHaveBeenCalledWith({
      where: {
        id: STORE_ID,
        status: StoreStatus.SUSPENDED,
      },
      data: {
        status: StoreStatus.ACTIVE,
      },
    });

    expect(mocks.auditLogMock.create).toHaveBeenCalledWith({
      data: {
        actorType: "ADMIN",
        actorId: ADMIN_ID,
        userId: OWNER_ID,
        action: "STORE_REINSTATED",
        reference: STORE_ID,
        metadata: {
          storeId: STORE_ID,
          storeName: suspendedStore.name,
          previousStatus: StoreStatus.SUSPENDED,
          newStatus: StoreStatus.ACTIVE,
          reason: "Required setup has been verified and the store may resume",
        },
      },
    });

    expect(mocks.notificationMock.create).toHaveBeenCalledWith({
      data: {
        recipientId: OWNER_ID,
        type: "STORE_REINSTATED",
        title: "Your store has been reinstated",
        message: expect.any(String),
        data: {
          storeId: STORE_ID,
          storeName: suspendedStore.name,
          status: StoreStatus.ACTIVE,
          reason: "Required setup has been verified and the store may resume",
        },
      },
    });
  });

  it("rejects reinstatement when the store does not exist", async () => {
    mocks.storeMock.findUnique.mockResolvedValue(null);

    await expect(
      reinstateAdminStore({
        storeId: STORE_ID,
        adminId: ADMIN_ID,
        reason: validReason,
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "STORE_NOT_FOUND",
    });

    expect(mocks.storeMock.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    StoreStatus.ACTIVE,
    StoreStatus.PENDING,
    StoreStatus.CLOSED,
    StoreStatus.REJECTED,
  ])("rejects reinstatement when current status is %s", async (status) => {
    mocks.storeMock.findUnique.mockResolvedValue({
      ...suspendedStore,
      status,
    });

    await expect(
      reinstateAdminStore({
        storeId: STORE_ID,
        adminId: ADMIN_ID,
        reason: validReason,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "STORE_NOT_SUSPENDED",
    });

    expect(mocks.storeMock.updateMany).not.toHaveBeenCalled();
    expect(mocks.auditLogMock.create).not.toHaveBeenCalled();
    expect(mocks.notificationMock.create).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: "missing category",
      changes: { category: null },
    },
    {
      label: "blank about",
      changes: { about: "   " },
    },
    {
      label: "missing WhatsApp",
      changes: { whatsapp: null },
    },
    {
      label: "blank location",
      changes: { location: "   " },
    },
    {
      label: "missing minimum delivery days",
      changes: { deliveryDaysMin: null },
    },
    {
      label: "missing maximum delivery days",
      changes: { deliveryDaysMax: null },
    },
    {
      label: "non-positive minimum delivery days",
      changes: { deliveryDaysMin: 0 },
    },
    {
      label: "maximum delivery days below minimum",
      changes: { deliveryDaysMin: 5, deliveryDaysMax: 2 },
    },
  ])("rejects reinstatement with $label", async ({ changes }) => {
    mocks.storeMock.findUnique.mockResolvedValue({
      ...suspendedStore,
      ...changes,
    });

    await expect(
      reinstateAdminStore({
        storeId: STORE_ID,
        adminId: ADMIN_ID,
        reason: validReason,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "STORE_SETUP_INCOMPLETE",
    });

    expect(mocks.storeMock.updateMany).not.toHaveBeenCalled();
    expect(mocks.auditLogMock.create).not.toHaveBeenCalled();
    expect(mocks.notificationMock.create).not.toHaveBeenCalled();
  });

  it("rejects reinstatement when the reason is blank", async () => {
    await expect(
      reinstateAdminStore({
        storeId: STORE_ID,
        adminId: ADMIN_ID,
        reason: "     ",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_STORE_STATUS_REASON",
    });

    expect(mocks.prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a concurrent status change without writing audit or notification", async () => {
    mocks.storeMock.findUnique.mockResolvedValue(suspendedStore);
    mocks.storeMock.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      reinstateAdminStore({
        storeId: STORE_ID,
        adminId: ADMIN_ID,
        reason: validReason,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "STORE_STATUS_CHANGED",
    });

    expect(mocks.auditLogMock.create).not.toHaveBeenCalled();
    expect(mocks.notificationMock.create).not.toHaveBeenCalled();
  });

  it("propagates notification failure", async () => {
    mocks.storeMock.findUnique.mockResolvedValue(suspendedStore);
    mocks.notificationMock.create.mockRejectedValue(
      new Error("Notification database failure"),
    );

    await expect(
      reinstateAdminStore({
        storeId: STORE_ID,
        adminId: ADMIN_ID,
        reason: validReason,
      }),
    ).rejects.toThrow("Notification database failure");
  });
});
