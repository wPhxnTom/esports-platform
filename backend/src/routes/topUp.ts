import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../services/prisma';

const router = Router();

const PACKAGES = [
  { id: 'p1', coins: 100, price: 0.99, label: 'Starter Pack' },
  { id: 'p2', coins: 500, price: 3.99, label: 'Competitor Pack' },
  { id: 'p3', coins: 1200, price: 7.99, label: 'Warrior Pack' },
  { id: 'p4', coins: 3000, price: 14.99, label: 'Elite Pack' },
  { id: 'p5', coins: 8000, price: 34.99, label: 'Legend Pack' },
  { id: 'p6', coins: 20000, price: 69.99, label: 'Phxntom Pack' },
];

router.get('/packages', (_req, res) => {
  res.json(PACKAGES);
});

const requestSchema = z.object({ packageId: z.string() });

router.post('/request', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { packageId } = requestSchema.parse(req.body);
    const pkg = PACKAGES.find((p) => p.id === packageId);
    if (!pkg) throw new AppError(400, 'Invalid package', 'INVALID_PACKAGE');

    const topUp = await prisma.topUp.create({
      data: {
        userId: req.userId!,
        coins: pkg.coins,
        paymentAmount: pkg.price,
        paymentMethod: 'MANUAL',
        status: 'PENDING',
      },
    });

    res.json({ message: 'Top-up request created', topUp });
  } catch (err) { next(err); }
});

router.get('/history', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const topUps = await prisma.topUp.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(topUps);
  } catch (err) { next(err); }
});

export default router;
