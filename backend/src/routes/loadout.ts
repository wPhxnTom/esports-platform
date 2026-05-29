import { Router } from 'express';
import { loadoutService } from '../services/loadout';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { weaponName, category } = req.query as any;
    const loadouts = await loadoutService.list(weaponName, category);
    res.json(loadouts);
  } catch (err) { next(err); }
});

router.get('/mine', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const loadouts = await loadoutService.myLoadouts(req.userId!);
    res.json(loadouts);
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const loadout = await loadoutService.getById(req.params.id as string);
    res.json(loadout);
  } catch (err) { next(err); }
});

router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const loadout = await loadoutService.create(req.userId!, req.body);
    res.status(201).json(loadout);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await loadoutService.delete(req.params.id as string, req.userId!);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/:id/review', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const review = await loadoutService.addReview(
      req.params.id as string,
      req.userId!,
      req.body
    );
    res.json(review);
  } catch (err) { next(err); }
});

export default router;