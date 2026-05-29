const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.$executeRawUnsafe('UPDATE User SET coins = 100 WHERE coins = 0');
  console.log(`Updated ${result} users`);
  await prisma.$disconnect();
}
main();
