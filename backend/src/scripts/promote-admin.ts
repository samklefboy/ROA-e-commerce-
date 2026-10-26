import "dotenv/config";

import { prisma } from "../config/prisma.js";

async function main() {
  const phone = process.env.ADMIN_PHONE?.trim();

  if (!phone) {
    throw new Error(
      "ADMIN_PHONE is required. Set it to the verified account's phone number.",
    );
  }

  const user = await prisma.user.findUnique({
    where: { phone },
    select: {
      id: true,
      phone: true,
      isVerified: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error(
      "Admin account not found. Register and verify the account first.",
    );
  }

  if (!user.isVerified) {
    throw new Error(
      "The account must be verified before it can become an admin.",
    );
  }

  if (user.role === "ADMIN") {
    console.log("This account is already an administrator.");
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
    select: {
      id: true,
      phone: true,
      role: true,
    },
  });

  console.log("Administrator role assigned successfully.");
  console.log({
    id: updatedUser.id,
    phone: updatedUser.phone,
    role: updatedUser.role,
  });
}

main()
  .catch((error: unknown) => {
    console.error("Failed to promote administrator:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
