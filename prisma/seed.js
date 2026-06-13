const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function upsertUser({ email, password, role, firstName, lastName }) {
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role,
      status: "ACTIVE"
    },
    create: {
      email,
      passwordHash,
      role,
      status: "ACTIVE"
    }
  });

  if (role === "CLIENT") {
    await prisma.clientProfile.upsert({
      where: { userId: user.id },
      update: {
        firstName,
        lastName,
        preferredContactMethod: "Mail"
      },
      create: {
        userId: user.id,
        firstName,
        lastName,
        preferredContactMethod: "Mail"
      }
    });
  }

  return user;
}

async function main() {
  await upsertUser({
    email: process.env.SEED_CLIENT_EMAIL || "client@bbg-company.fr",
    password: process.env.SEED_CLIENT_PASSWORD || "Client123!",
    role: "CLIENT",
    firstName: "Sarah",
    lastName: "Diallo"
  });

  await upsertUser({
    email: process.env.SEED_ADMIN_EMAIL || "admin@bbg-company.fr",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin123!",
    role: "ADMIN",
    firstName: "Admin",
    lastName: "BBG"
  });

  await upsertUser({
    email: process.env.SEED_MANAGER_EMAIL || "manager@bbg-company.fr",
    password: process.env.SEED_MANAGER_PASSWORD || "Manager123!",
    role: "MANAGER",
    firstName: "Manager",
    lastName: "BBG"
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
