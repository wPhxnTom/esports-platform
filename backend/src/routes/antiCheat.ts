import { Router } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { antiCheatController } from '../controllers/antiCheat';

const router = Router();

router.post('/proof', authenticate, (req: AuthRequest, res, next) => {
  antiCheatController.submitProof(req, res, next);
});

router.post('/matches/:id/confirm', authenticate, (req: AuthRequest, res, next) => {
  antiCheatController.confirmResult(req, res, next);
});

router.post('/report/player', authenticate, (req: AuthRequest, res, next) => {
  antiCheatController.reportPlayer(req, res, next);
});

router.post('/report/match', authenticate, (req: AuthRequest, res, next) => {
  antiCheatController.reportMatch(req, res, next);
});

router.get('/verification/:id', authenticate, (req: AuthRequest, res, next) => {
  antiCheatController.getVerificationStatus(req, res, next);
});

router.get('/caps', authenticate, (req: AuthRequest, res, next) => {
  antiCheatController.getCaps(req, res, next);
});

router.get('/flagged', authenticate, requireAdmin, (req: AuthRequest, res, next) => {
  antiCheatController.getFlaggedMatches(req, res, next);
});

router.post('/flagged/:id/resolve', authenticate, requireAdmin, (req: AuthRequest, res, next) => {
  antiCheatController.resolveFlagged(req, res, next);
});

export default router;
