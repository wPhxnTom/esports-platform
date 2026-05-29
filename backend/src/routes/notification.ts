import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { notificationController } from '../controllers/notification';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res, next) => {
  notificationController.getAll(req, res, next);
});

router.put('/:id/read', authenticate, (req: AuthRequest, res, next) => {
  notificationController.markAsRead(req, res, next);
});

router.put('/read-all', authenticate, (req: AuthRequest, res, next) => {
  notificationController.markAllAsRead(req, res, next);
});

export default router;
