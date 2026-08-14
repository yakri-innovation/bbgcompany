const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, status: true }
  });
  console.log("USERS:", JSON.stringify(users, null, 2));

  const announcements = await prisma.announcement.count();
  console.log("ANNOUNCEMENTS:", announcements);
}

main()
  .catch((error) => {
    console.log("ERR:", error.constructor.name);
    console.log("CODE:", error.errorCode);
    console.log("FULL:", error.message);
  })
  .finally(() => prisma.$disconnect());
