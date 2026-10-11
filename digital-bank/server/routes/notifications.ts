import { Router } from 'express';
import { db } from '../db/database.js';
import { authMiddleware, AuthenticatedRequest, customerOnly } from '../middleware/authMiddleware.js';

export const notificationRouter = Router();

// GET /api/notifications - list notifications
notificationRouter.get('/', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const notifications = db.getNotificationsForUser(user.id);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (err) {
    console.error('[Notifications] list error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve notifications.' });
  }
});

// PATCH /api/notifications/:id/read - mark single as read
notificationRouter.patch('/:id/read', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const success = db.markNotificationAsRead(user.id, id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Notification not found.' });
      return;
    }

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('[Notifications] mark error:', err);
    res.status(500).json({ success: false, error: 'Failed to update notification.' });
  }
});

// POST /api/notifications/read-all - mark all notifications as read
notificationRouter.post('/read-all', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    db.markAllNotificationsAsRead(user.id);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('[Notifications] read all error:', err);
    res.status(500).json({ success: false, error: 'Failed to mark notifications as read.' });
  }
});

// DELETE /api/notifications/:id - remove notification
notificationRouter.delete('/:id', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const success = db.deleteNotification(user.id, id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Notification not found.' });
      return;
    }

    res.json({ success: true, message: 'Notification removed.' });
  } catch (err) {
    console.error('[Notifications] delete error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete notification.' });
  }
});
