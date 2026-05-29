import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../services/prisma';
import { Badge, UserBadge } from '@prisma/client';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const badges = await prisma.userBadge.findMany({
      where: { userId: req.userId! },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    const allBadges = await prisma.badge.findMany();
    const result = allBadges.map((badge: Badge) => {
      const earned = badges.find((b: UserBadge & { badge: Badge }) => b.badgeId === badge.id);
      return {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        imageUrl: badge.imageUrl,
        earned: !!earned,
        earnedAt: earned?.earnedAt || null,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
