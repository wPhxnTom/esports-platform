import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../controllers/auth';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  pseudo: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Pseudo must be alphanumeric'),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  earlyAccessKey: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', validate(registerSchema), (req, res, next) => {
  authService.register(req, res, next);
});

router.post('/login', validate(loginSchema), (req, res, next) => {
  authService.login(req, res, next);
});

router.get('/me', authenticate, (req: AuthRequest, res, next) => {
  authService.getProfile(req, res, next);
});

export default router;
