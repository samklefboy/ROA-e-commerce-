import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import type {
  CreateAddressInput,
  UpdateAddressInput,
} from "../utils/validators/address.validation.js";

export async function getUserAddresses(userId: string) {
  return prisma.address.findMany({
    where: {
      userId,
    },
    orderBy: [
      {
        isDefault: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function getAddressById(userId: string, addressId: string) {
  const address = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId,
    },
  });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  return address;
}

export async function createAddress(userId: string, input: CreateAddressInput) {
  const shouldBeDefault = input.isDefault === true;

  return prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const existingCount = await tx.address.count({
      where: {
        userId,
      },
    });

    const isDefault = shouldBeDefault || existingCount === 0;

    return tx.address.create({
      data: {
        userId,

        recipientName: input.recipientName,

        phone: input.phone,

        addressLine1: input.addressLine1,

        addressLine2: input.addressLine2 ?? null,

        city: input.city,

        stateCode: input.stateCode ?? null,

        countryCode: input.countryCode ?? "NG",

        landmark: input.landmark ?? null,

        isDefault,
      },
    });
  });
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: UpdateAddressInput,
) {
  await getAddressById(userId, addressId);

  return prisma.$transaction(async (tx) => {
    if (input.isDefault === true) {
      await tx.address.updateMany({
        where: {
          userId,
          id: {
            not: addressId,
          },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const data: Record<string, unknown> = {};

    if (input.recipientName !== undefined) {
      data.recipientName = input.recipientName;
    }

    if (input.phone !== undefined) {
      data.phone = input.phone;
    }

    if (input.addressLine1 !== undefined) {
      data.addressLine1 = input.addressLine1;
    }

    if (input.addressLine2 !== undefined) {
      data.addressLine2 = input.addressLine2;
    }

    if (input.city !== undefined) {
      data.city = input.city;
    }

    if (input.stateCode !== undefined) {
      data.stateCode = input.stateCode;
    }

    if (input.countryCode !== undefined) {
      data.countryCode = input.countryCode;
    }

    if (input.landmark !== undefined) {
      data.landmark = input.landmark;
    }

    if (input.isDefault !== undefined) {
      data.isDefault = input.isDefault;
    }

    return tx.address.update({
      where: {
        id: addressId,
      },
      data,
    });
  });
}

export async function setDefaultAddress(userId: string, addressId: string) {
  await getAddressById(userId, addressId);

  return prisma.$transaction(async (tx) => {
    await tx.address.updateMany({
      where: {
        userId,
      },
      data: {
        isDefault: false,
      },
    });

    return tx.address.update({
      where: {
        id: addressId,
      },
      data: {
        isDefault: true,
      },
    });
  });
}

export async function deleteAddress(userId: string, addressId: string) {
  const address = await getAddressById(userId, addressId);

  await prisma.address.delete({
    where: {
      id: address.id,
    },
  });

  if (address.isDefault) {
    const nextAddress = await prisma.address.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (nextAddress) {
      await prisma.address.update({
        where: {
          id: nextAddress.id,
        },
        data: {
          isDefault: true,
        },
      });
    }
  }

  return {
    message: "Address deleted successfully",
  };
}
