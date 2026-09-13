import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, Clock, FileUp, Sparkles, X } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'system' | 'upload' | 'ai';
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Lab report synchronized',
    description: 'Quest Diagnostics metabolic panel was added to records.',
    time: '2 hours ago',
    type: 'upload',
    read: false,
  },
  {
    id: 'n-2',
    title: 'Medication schedule active',
    description: 'Metformin 500 mg evening dose reminder active.',
    time: 'Yesterday',
    type: 'system',
    read: true,
  },
  {
    id: 'n-3',
    title: 'Timeline ready for review',
    description: '18 historical healthcare events unified chronologically.',
    time: '3 days ago',
    type: 'ai',
    read: true,
  },
];

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const popoverRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-600 ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-xl shadow-xl border border-zinc-200 z-50 overflow-hidden animate-in fade-in duration-100">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-teal-50 text-teal-700 rounded-md">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-teal-700 hover:text-teal-800 font-medium cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                No notifications right now
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 flex items-start gap-3 transition-colors ${
                    item.read ? 'bg-white' : 'bg-zinc-50/70'
                  }`}
                >
                  <div className="mt-0.5 text-teal-700 shrink-0">
                    {item.type === 'upload' && <FileUp className="w-4 h-4 text-sky-600" />}
                    {item.type === 'system' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                    {item.type === 'ai' && <Sparkles className="w-4 h-4 text-amber-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-zinc-900 truncate">
                        {item.title}
                      </p>
                      <button
                        onClick={() => clearNotification(item.id)}
                        className="text-zinc-400 hover:text-zinc-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-400">
                      <Clock className="w-3 h-3" />
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-100 text-center">
            <span className="text-[11px] text-zinc-500 font-medium">
              HealthTimeline notification alerts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
