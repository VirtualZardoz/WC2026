const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({ where: { email: 'admin@example.com' } })
  .then(u => console.log(u.id))
  .finally(() => prisma.$disconnect());
