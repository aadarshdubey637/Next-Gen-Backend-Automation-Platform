import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X, 
  Check, 
  Trash2,
  ExternalLink,
  Clock
} from 'lucide-react';
import axios from 'axios';

const formatRelativeTime = (dateString) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  } catch (err) {
    return 'recently';
  }
};

const NotificationSystem = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/v1/notifications/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/v1/notifications/${id}`, 
        { is_read: true }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update state immediately for better UX
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/v1/notifications/mark-all-read', 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update state immediately
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/v1/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const deleted = notifications.find(n => n.id === id);
      if (deleted && !deleted.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-[#00ffaa]" size={16} />;
      case 'warning': return <AlertTriangle className="text-orange-500" size={16} />;
      case 'error': return <AlertCircle className="text-red-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-all group"
      >
        <Bell size={20} className={`text-slate-400 group-hover:text-white transition-colors ${unreadCount > 0 ? 'animate-bounce-short' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00ffaa] text-black text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(0,255,170,0.4)] border-2 border-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 md:w-96 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl shadow-2xl z-[100] overflow-hidden"
          >
            <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between bg-black/20">
              <h4 className="text-sm font-bold text-white tracking-tight uppercase">Notifications</h4>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-black uppercase tracking-widest text-[#00ffaa] hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-600 gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center opacity-50">
                    <Bell size={24} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest">No new notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id}
                    className={`p-4 border-b border-[#1a1a1a] transition-all hover:bg-white/[0.02] relative group ${!n.is_read ? 'bg-[#00ffaa]/[0.02]' : ''}`}
                  >
                    {!n.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00ffaa]" />
                    )}
                    <div className="flex gap-4">
                      <div className="mt-1 shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h5 className={`text-xs font-bold ${!n.is_read ? 'text-white' : 'text-slate-400'}`}>{n.title}</h5>
                          <span className="text-[9px] font-medium text-slate-600 whitespace-nowrap flex items-center gap-1">
                            <Clock size={8} />
                            {formatRelativeTime(n.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{n.message}</p>
                        
                        <div className="pt-2 flex items-center gap-3">
                          {!n.is_read ? (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(n.id);
                              }}
                              className="text-[9px] font-black uppercase tracking-widest text-[#00ffaa] flex items-center gap-1 hover:underline"
                            >
                              <Check size={10} /> Mark read
                            </button>
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-1">
                              <CheckCircle2 size={10} /> Read
                            </span>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n.id);
                            }}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-red-500 flex items-center gap-1 transition-colors"
                          >
                            <Trash2 size={10} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 bg-black/40 border-t border-[#1a1a1a] text-center">
                <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
                  View all activity
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem;
