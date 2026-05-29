import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { aiMatchmakingService } from '../services/aiMatchmaking';

const router = Router();

router.post('/queue/join', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { gameMode = 'KILLRACE' } = req.body;
    const result = await aiMatchmakingService.joinQueue(req.userId!, gameMode);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/queue/leave', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await aiMatchmakingService.leaveQueue(req.userId!);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/queue/status', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await aiMatchmakingService.getQueueStatus(req.userId!);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/queue/count', authenticate, async (_req: AuthRequest, res, next) => {
  try {
    const count = await aiMatchmakingService.getQueueCount();
    res.json({ count });
  } catch (err) { next(err); }
});

router.post('/queue/process', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await aiMatchmakingService.processQueue(req.body.gameMode);
    res.json({ matched: result ?? null });
  } catch (err) { next(err); }
});

router.get('/suggestions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const suggestions = await aiMatchmakingService.suggestMatchups(req.userId!, limit);
    res.json(suggestions);
  } catch (err) { next(err); }
});

export default router;
