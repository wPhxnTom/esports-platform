import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../services/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const PLATFORMS = ['PSN', 'XBOX', 'STEAM', 'BATTLE_NET', 'ACTIVISION'] as const;

const linkSchema = z.object({
  platform: z.enum(PLATFORMS),
  gamertag: z.string().min(1).max(30),
});

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const links = await prisma.platformLink.findMany({
      where: { userId: req.userId },
      select: { id: true, platform: true, gamertag: true, platformId: true, linkedAt: true },
    });
    res.json(links);
  } catch (err) { next(err); }
});

router.post('/link', authenticate, validate(linkSchema), async (req: AuthRequest, res, next) => {
  try {
    const { platform, gamertag } = req.body;
    const existing = await prisma.platformLink.findUnique({
      where: { userId_platform: { userId: req.userId!, platform } },
    });
    if (existing) throw new AppError(409, 'Platform already linked', 'PLATFORM_ALREADY_LINKED');
    const link = await prisma.platformLink.create({
      data: { userId: req.userId!, platform, gamertag },
    });
    res.status(201).json({ id: link.id, platform: link.platform, gamertag: link.gamertag, platformId: link.platformId, linkedAt: link.linkedAt });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const link = await prisma.platformLink.findFirst({
      where: { id: req.params.id as string, userId: req.userId },
    });
    if (!link) throw new AppError(404, 'Platform link not found', 'LINK_NOT_FOUND');
    await prisma.platformLink.delete({ where: { id: link.id } });
    res.json({ message: 'Platform unlinked' });
  } catch (err) { next(err); }
});

export default router;
