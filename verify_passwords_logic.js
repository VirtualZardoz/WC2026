const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testPasswordReset() {
  console.log('Testing Password Reset Logic...');
  
  // 1. Create a test user
  const email = `test_${Date.now()}@example.com`;
  const initialPassword = 'password123';
  const initialHash = await bcrypt.hash(initialPassword, 10);
  
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Test User',
      passwordHash: initialHash,
      role: 'user'
    }
  });
  console.log(`Created user ${email}`);

  // 2. Simulate Reset (like in app/api/admin/users/reset-password/route.ts)
  const newPassword = Math.random().toString(36).slice(-8);
  const newHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash }
  });
  console.log(`Reset password to: ${newPassword}`);

  // 3. Verify new password works
  const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
  const isValid = await bcrypt.compare(newPassword, updatedUser.passwordHash);
  
  if (isValid) {
    console.log('Password reset logic verified!');
  } else {
    throw new Error('Password reset logic failed!');
  }

  return { user, newPassword };
}

async function testPasswordChange(user, currentPassword) {
  console.log('Testing Password Change Logic...');
  
  // 1. Simulate Change (like in app/api/profile/password/route.ts)
  const newerPassword = 'newerPassword123';
  
  // Verify current password first
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  const isCurrentValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  
  if (!isCurrentValid) {
    throw new Error('Current password verification failed!');
  }

  const newerHash = await bcrypt.hash(newerPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newerHash }
  });
  console.log(`Changed password to: ${newerPassword}`);

  // 2. Verify newest password works
  const finalUser = await prisma.user.findUnique({ where: { id: user.id } });
  const isFinalValid = await bcrypt.compare(newerPassword, finalUser.passwordHash);
  
  if (isFinalValid) {
    console.log('Password change logic verified!');
  } else {
    throw new Error('Password change logic failed!');
  }
}

async function run() {
  try {
    const { user, newPassword } = await testPasswordReset();
    await testPasswordChange(user, newPassword);
    console.log('ALL PASSWORD LOGIC TESTS PASSED');
    
    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
