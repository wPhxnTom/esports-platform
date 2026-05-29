const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'test@test.com' } });
    console.log('User found:', !!user);
    if (user) {
      const valid = await bcrypt.compare('test', user.password);
      console.log('Password valid:', valid);
      const token = jwt.sign({ userId: user.id }, 'dev-secret-key', { expiresIn: '7d' });
      console.log('Token generated:', !!token);
      const { password, ...rest } = user;
      console.log('Sanitized user:', JSON.stringify(rest));
    }
  } catch (e) {
    console.error('Error:', e.message, e.stack?.split('\n').slice(0,3).join('\n'));
  }
  await prisma.$disconnect();
}
test();
