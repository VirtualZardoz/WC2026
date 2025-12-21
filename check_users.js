const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  console.log(`User count: ${userCount}`);
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  console.log(`Admin user: ${admin ? admin.email : 'None'}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
