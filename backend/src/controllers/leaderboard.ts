import { Request, Response, NextFunction } from 'express';
import { leaderboardService } from '../services/leaderboard';

export const leaderboardController = {
  async getGlobal(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const data = await leaderboardService.getGlobalLeaderboard(limit);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  async getByGameMode(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const data = await leaderboardService.getGameModeLeaderboard(
        (req.params.gameMode as string).toUpperCase(),
        limit
      );
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
};
