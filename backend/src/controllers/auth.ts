import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { authService as service } from '../services/auth';

export const authService = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { pseudo, email, password, earlyAccessKey } = req.body;
      const result = await service.register(pseudo, email, password, earlyAccessKey);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await service.login(email, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await service.getProfile(req.userId!);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
};
