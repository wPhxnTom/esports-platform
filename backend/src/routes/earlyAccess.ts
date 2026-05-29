import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../services/prisma';

const router = Router();

router.post('/validate', async (req, res, next) => {
  try {
    const { key } = z.object({ key: z.string().min(1) }).parse(req.body);
    const record = await prisma.earlyAccessKey.findUnique({ where: { key } });
    if (!record || record.used || (record.expiresAt && record.expiresAt < new Date())) {
      throw new AppError(400, 'Invalid or expired early access key', 'INVALID_KEY');
    }
    if (record.useCount >= record.maxUses) {
      throw new AppError(400, 'This key has reached its maximum usage', 'KEY_EXHAUSTED');
    }
    res.json({ valid: true, message: 'Early access key is valid' });
  } catch (err) { next(err); }
});

const generateSchema = z.object({
  count: z.number().int().min(1).max(100).default(5),
  maxUses: z.number().int().min(1).default(1),
});

router.post('/generate', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { count, maxUses } = generateSchema.parse(req.body);
    const keys = [];
    for (let i = 0; i < count; i++) {
      const key = `PHXNTOM-${crypto.randomBytes(16).toString('hex').toUpperCase().slice(0, 24)}`;
      keys.push({ key, maxUses });
    }
    await prisma.earlyAccessKey.createMany({ data: keys });
    res.json({ message: `${count} keys generated`, keys: keys.map((k) => k.key) });
  } catch (err) { next(err); }
});

router.get('/list', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const keys = await prisma.earlyAccessKey.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(keys);
  } catch (err) { next(err); }
});

export default router;
