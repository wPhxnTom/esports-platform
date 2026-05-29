import { Router } from 'express';
import { rewardsService } from '../services/rewards';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/gift-cards', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await rewardsService.listGiftCards(req.userId);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/redeem/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await rewardsService.redeem(req.userId!, req.params.id as string);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/history', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const history = await rewardsService.history(req.userId!);
    res.json(history);
  } catch (err) { next(err); }
});

export default router;
