import React from 'react';
import { Bell } from 'lucide-react';
import { markNotificationAsRead } from '../../lib/firebase';

const NotificationCenter = ({ notifications = [] }) => {
  const [items, setItems] = React.useState(notifications);

  React.useEffect(() => setItems(notifications), [notifications]);

  const handleRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error('Error marking notification read:', e);
    }
  };

  if (!items.length) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No notifications</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.slice(0, 6).map((n) => (
        <button
          key={n.id}
          onClick={() => !n.read && handleRead(n.id)}
          className={`w-full text-left p-3 rounded-lg border ${n.read ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-100'}`}
        >
          <p className={`text-sm ${n.read ? 'text-gray-600' : 'font-medium text-gray-900'}`}>
            {n.title || n.message || 'Notification'}
          </p>
          {n.title && n.message && (
            <p className="text-xs text-gray-500 mt-1">{n.message}</p>
          )}
        </button>
      ))}
    </div>
  );
};

export default NotificationCenter;
