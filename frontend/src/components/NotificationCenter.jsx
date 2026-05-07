import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from '../services/api';

const NotificationCenter = ({ onClose, notifications: propNotifications, setNotifications: setPropNotifications, unreadCount: propUnreadCount, setUnreadCount: setPropUnreadCount }) => {
  const [localNotifications, setLocalNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadNotifications();
  }, []);
  
  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setLocalNotifications(data);
      if (setPropNotifications) setPropNotifications(data);
      const count = await getUnreadCount();
      if (setPropUnreadCount) setPropUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      if (setPropNotifications) setPropNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      const count = await getUnreadCount();
      if (setPropUnreadCount) setPropUnreadCount(count);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setLocalNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      if (setPropNotifications) setPropNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      if (setPropUnreadCount) setPropUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };
  
  const getIcon = (type) => {
    switch (type) {
      case 'success': return <Check className="h-5 w-5 text-green-500" />;
      case 'error': return <X className="h-5 w-5 text-red-500" />;
      default: return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const notifications = propNotifications || localNotifications;
  const unreadCount = propUnreadCount || notifications.filter(n => !n.is_read).length;
  
  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{unreadCount} new</span>}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1">
            <CheckCheck size={14} />
            <span>Mark all as read</span>
          </button>
        )}
      </div>
      
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No notifications yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div key={notification.id} className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`} onClick={() => handleMarkAsRead(notification.id)}>
                <div className="flex items-start space-x-3">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}</p>
                  </div>
                  {!notification.is_read && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <button onClick={onClose} className="w-full text-center text-sm text-gray-600 hover:text-gray-900">Close</button>
      </div>
    </div>
  );
};

export default NotificationCenter;
