import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as service from '../services/passwordReset';

const router = Router();

const forgotSchema = z.object({
  email: z.string().email(),
});

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  password: z.string().min(6).max(100),
});

router.post('/forgot', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotSchema.parse(req.body);
    const result = await service.requestReset(email);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code } = verifySchema.parse(req.body);
    const result = await service.verifyCode(email, code);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/reset', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code, password } = resetSchema.parse(req.body);
    const result = await service.resetPassword(email, code, password);
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
