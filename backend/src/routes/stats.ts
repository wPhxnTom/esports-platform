import { Router } from 'express';
import { prisma } from '../services/prisma';
import { getConnectedCount } from '../socket';

const router = Router();

router.get('/online', (_req, res) => {
  res.json({ connected: getConnectedCount() });
});

router.get('/db', async (_req, res) => {
  const [users, matches, completed, reports] = await Promise.all([
    prisma.user.count(),
    prisma.match.count(),
    prisma.match.count({ where: { status: 'COMPLETED' } }),
    prisma.matchReport.count(),
  ]);
  res.json({ users, matches, completedMatches: completed, reports });
});

export default router;
