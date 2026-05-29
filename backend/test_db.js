const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length, JSON.stringify(users));
  } catch (e) {
    console.error('Error:', e.message);
  }
  await prisma.$disconnect();
}
test();
