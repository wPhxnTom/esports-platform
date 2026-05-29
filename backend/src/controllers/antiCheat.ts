import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { antiCheatService } from '../services/antiCheat';

export const antiCheatController = {
  async submitProof(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { matchId, proofUrl, notes } = req.body;
      await antiCheatService.submitProof(matchId, req.userId!, proofUrl, notes);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async confirmResult(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await antiCheatService.confirmMatchResult(req.params.id as string, req.userId!);
      res.json(result);
    } catch (err) { next(err); }
  },

  async reportPlayer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { targetId, reason, description, matchId } = req.body;
      const result = await antiCheatService.reportPlayer(req.userId!, targetId, reason, description, matchId);
      res.json(result);
    } catch (err) { next(err); }
  },

  async reportMatch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { matchId, targetId, reason, description } = req.body;
      const result = await antiCheatService.reportMatch(matchId, req.userId!, targetId, reason, description);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getVerificationStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await antiCheatService.getMatchVerificationStatus(req.params.id as string);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getCaps(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const caps = await antiCheatService.checkDailyCaps(req.userId!);
      res.json(caps);
    } catch (err) { next(err); }
  },

  async getFlaggedMatches(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const matches = await antiCheatService.getFlaggedMatches();
      res.json(matches);
    } catch (err) { next(err); }
  },

  async resolveFlagged(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { action } = req.body;
      const result = await antiCheatService.resolveFlaggedMatch(req.params.id as string, action);
      res.json(result);
    } catch (err) { next(err); }
  },
};
