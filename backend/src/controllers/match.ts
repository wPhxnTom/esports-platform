import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { matchService } from '../services/match';

export const matchController = {
  async createMatch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { gameMode, maxPlayers } = req.body;
      const match = await matchService.createMatch(req.userId!, gameMode, maxPlayers);
      res.status(201).json(match);
    } catch (err) {
      next(err);
    }
  },

  async joinMatch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const match = await matchService.joinMatch(req.params.id as string, req.userId!);
      res.json(match);
    } catch (err) {
      next(err);
    }
  },

  async startMatch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const match = await matchService.startMatch(req.params.id as string, req.userId!);
      res.json(match);
    } catch (err) {
      next(err);
    }
  },

  async submitScore(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await matchService.submitScore(req.params.id as string, req.userId!, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getAvailableMatches(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const matches = await matchService.getAvailableMatches();
      res.json(matches);
    } catch (err) {
      next(err);
    }
  },

  async getMatchById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const match = await matchService.getMatchById(req.params.id as string);
      res.json(match);
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const history = await matchService.getMatchHistory(req.userId!, page, limit);
      res.json(history);
    } catch (err) {
      next(err);
    }
  },

  async getMatchResults(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const results = await matchService.getMatchResults(req.params.id as string);
      res.json(results);
    } catch (err) {
      next(err);
    }
  },
};
