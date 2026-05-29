import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { leaderboardController } from '../controllers/leaderboard';

const router = Router();

router.get('/global', authenticate, (req, res, next) => {
  leaderboardController.getGlobal(req, res, next);
});

router.get('/:gameMode', authenticate, (req, res, next) => {
  leaderboardController.getByGameMode(req, res, next);
});

export default router;
