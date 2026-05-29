import { prisma } from './prisma';
import bcrypt from 'bcrypt';
import { AppError } from '../middleware/errorHandler';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { message: 'If this email exists, a reset code has been sent.' };
  }

  await prisma.passwordReset.updateMany({
    where: { email, used: false },
    data: { used: true },
  });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.passwordReset.create({
    data: { email, code, expiresAt },
  });

  // TODO: send email via nodemailer / SendGrid
  // For now, code is returned so the user can copy it

  return {
    message: 'A verification code has been sent to your email.',
    code, // remove in production
  };
}

export async function verifyCode(email: string, code: string) {
  const record = await prisma.passwordReset.findFirst({
    where: { email, code, used: false, expiresAt: { gte: new Date() } },
  });
  if (!record) {
    throw new AppError(400, 'Invalid or expired code.', 'INVALID_RESET_CODE');
  }
  return { message: 'Code verified.', valid: true };
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  const record = await prisma.passwordReset.findFirst({
    where: { email, code, used: false, expiresAt: { gte: new Date() } },
  });
  if (!record) {
    throw new AppError(400, 'Invalid or expired code.', 'INVALID_RESET_CODE');
  }

  const hashed = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { password: hashed } }),
    prisma.passwordReset.update({ where: { id: record.id }, data: { used: true } }),
  ]);

  return { message: 'Password has been reset successfully.' };
}
