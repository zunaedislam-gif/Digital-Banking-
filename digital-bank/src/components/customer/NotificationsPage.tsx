import { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Send, 
  Receipt, 
  CreditCard, 
  Shield, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api.js';
import { NotificationItem } from '../../types/banking.js';
import { formatRelativeTime } from '../../utils/formatters.js';

interface NotificationsPageProps {
  onRefreshCount?: () => void;
}

export function NotificationsPage({ onRefreshCount }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      if (onRefreshCount) onRefreshCount();
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      if (onRefreshCount) onRefreshCount();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setIsProcessing(true);
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (onRefreshCount) onRefreshCount();
    } catch (err) {
      console.error('Error marking all read:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (onRefreshCount) onRefreshCount();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'transfer': return <Send className="w-4 h-4 text-emerald-400" />;
      case 'bill': return <Receipt className="w-4 h-4 text-cyan-400" />;
      case 'card': return <CreditCard className="w-4 h-4 text-blue-400" />;
      case 'security': return <Shield className="w-4 h-4 text-amber-400" />;
      case 'account': return <UserCheck className="w-4 h-4 text-teal-400" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const unreadList = notifications.filter((n) => !n.isRead);
  const displayed = filter === 'unread' ? unreadList : notifications;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            ACTIVITY ALERTS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time notifications for transfers, bills, cards, and security logins.
          </p>
        </div>

        {unreadList.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
            filter === 'all'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Unread ({unreadList.length})</span>
          {unreadList.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs">Loading notifications...</p>
        </div>
      ) : displayed.length > 0 ? (
        <div className="space-y-3">
          {displayed.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                n.isRead
                  ? 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                  : 'bg-slate-900 border-emerald-500/30 shadow-lg'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${
                  n.isRead ? 'bg-slate-950 border-slate-800' : 'bg-slate-950 border-emerald-500/30'
                }`}>
                  {getNotifIcon(n.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className={`text-sm font-bold ${n.isRead ? 'text-slate-200' : 'text-white'}`}>
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                    {n.message}
                  </p>
                  <span className="text-[11px] font-mono text-slate-500 block pt-1">
                    {formatRelativeTime(n.timestamp)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1 shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition text-xs"
                    title="Mark as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Bell className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No notifications</h3>
          <p className="text-xs text-slate-400">
            {filter === 'unread' ? 'All caught up! No unread notifications.' : 'You have no notification items.'}
          </p>
        </div>
      )}
    </div>
  );
}
