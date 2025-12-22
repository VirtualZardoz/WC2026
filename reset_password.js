const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.user.update({
    where: { email: 'testuser@test.com' },
    data: { passwordHash }
  });
  console.log('Password updated for testuser@test.com');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
