import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { matchController } from '../controllers/match';

const router = Router();

const createMatchSchema = z.object({
  gameMode: z.enum(['KILLRACE', 'RESURGENCE', 'BATTLE_ROYALE']),
  maxPlayers: z.number().int().min(2).max(100).default(4),
});

const submitScoreSchema = z.object({
  score: z.number().int().min(0),
  kills: z.number().int().min(0),
  deaths: z.number().int().min(0),
  position: z.number().int().min(1).optional(),
});

router.get('/', authenticate, (req: AuthRequest, res, next) => {
  matchController.getAvailableMatches(req, res, next);
});

router.post('/', authenticate, validate(createMatchSchema), (req: AuthRequest, res, next) => {
  matchController.createMatch(req, res, next);
});

router.get('/history', authenticate, (req: AuthRequest, res, next) => {
  matchController.getHistory(req, res, next);
});

router.get('/:id', authenticate, (req: AuthRequest, res, next) => {
  matchController.getMatchById(req, res, next);
});

router.post('/:id/join', authenticate, (req: AuthRequest, res, next) => {
  matchController.joinMatch(req, res, next);
});

router.post('/:id/start', authenticate, (req: AuthRequest, res, next) => {
  matchController.startMatch(req, res, next);
});

router.post('/:id/score', authenticate, validate(submitScoreSchema), (req: AuthRequest, res, next) => {
  matchController.submitScore(req, res, next);
});

router.get('/:id/results', authenticate, (req: AuthRequest, res, next) => {
  matchController.getMatchResults(req, res, next);
});

export default router;
