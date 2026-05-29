import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { profileController } from '../controllers/profile';

const router = Router();

const updateSchema = z.object({
  pseudo: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
  avatar: z.string().url().optional(),
});

router.get('/', authenticate, (req: AuthRequest, res, next) => {
  profileController.getProfile(req, res, next);
});

router.put('/', authenticate, validate(updateSchema), (req: AuthRequest, res, next) => {
  profileController.updateProfile(req, res, next);
});

export default router;
