import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from './prisma';
import { AppError } from '../middleware/errorHandler';

export class AuthService {
  async register(pseudo: string, email: string, password: string, earlyAccessKey?: string) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ pseudo }, { email }] },
    });
    if (existing) {
      if (existing.pseudo === pseudo) {
        throw new AppError(409, 'Pseudo already taken', 'PSEUDO_TAKEN');
      }
      throw new AppError(409, 'Email already registered', 'EMAIL_TAKEN');
    }

    if (earlyAccessKey) {
      const keyRecord = await prisma.earlyAccessKey.findUnique({ where: { key: earlyAccessKey } });
      if (!keyRecord || keyRecord.used || (keyRecord.expiresAt && keyRecord.expiresAt < new Date())) {
        throw new AppError(400, 'Invalid or expired early access key', 'INVALID_KEY');
      }
      if (keyRecord.useCount >= keyRecord.maxUses) {
        throw new AppError(400, 'This key has reached its maximum usage', 'KEY_EXHAUSTED');
      }
      await prisma.earlyAccessKey.update({
        where: { id: keyRecord.id },
        data: { useCount: { increment: 1 } },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { pseudo, email, password: hashedPassword },
    });

    const token = this.generateToken(user.id);
    return { token, user: this.sanitizeUser(user) };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const token = this.generateToken(user.id);
    return { token, user: this.sanitizeUser(user) };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, data: { pseudo?: string; avatar?: string }) {
    if (data.pseudo) {
      const existing = await prisma.user.findUnique({ where: { pseudo: data.pseudo } });
      if (existing && existing.id !== userId) {
        throw new AppError(409, 'Pseudo already taken', 'PSEUDO_TAKEN');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    return this.sanitizeUser(user);
  }

  private generateToken(userId: string) {
    return jwt.sign({ userId }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    } as jwt.SignOptions);
  }

  private sanitizeUser(user: any) {
    const { password, ...rest } = user;
    return rest;
  }
}

export const authService = new AuthService();
