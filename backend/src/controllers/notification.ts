import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { notificationService } from '../services/notification';

export const notificationController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await notificationService.getUserNotifications(req.userId!, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notif = await notificationService.markAsRead(req.params.id as string, req.userId!);
      if (!notif) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }
      res.json(notif);
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllAsRead(req.userId!);
      res.json({ message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  },
};
