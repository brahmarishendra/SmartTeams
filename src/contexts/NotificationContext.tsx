import React, { createContext, useContext, useState, useCallback } from 'react';
import { Bell, CheckCircle2, XCircle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'assignment';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (title: string, message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const playSound = useCallback(() => {
    try {
      // MS Teams-like notification sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.volume = 0.4;
      audio.play();
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }, []);

  const showNotification = useCallback((title: string, message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, title, message, type }]);
    playSound();

    // Auto remove after 6 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);
  }, [playSound]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {notifications.map((notif) => (
          <div 
            key={notif.id}
            className="pointer-events-auto animate-in slide-in-from-right-full duration-500 ease-out"
          >
            <div className={`
              w-[350px] bg-white dark:bg-[#1f1f1f] border-l-4 rounded-lg shadow-2xl overflow-hidden flex items-start p-4 gap-3
              ${notif.type === 'success' ? 'border-[#107c10]' : 
                notif.type === 'error' ? 'border-[#d83b01]' : 
                notif.type === 'assignment' ? 'border-[#464eb8]' : 
                'border-[#0078d4]'}
            `}>
              <div className={`mt-0.5 shrink-0
                ${notif.type === 'success' ? 'text-[#107c10]' : 
                  notif.type === 'error' ? 'text-[#d83b01]' : 
                  notif.type === 'assignment' ? 'text-[#464eb8]' : 
                  'text-[#0078d4]'}
              `}>
                {notif.type === 'success' && <CheckCircle2 size={20} />}
                {notif.type === 'error' && <XCircle size={20} />}
                {notif.type === 'assignment' && <Bell size={20} />}
                {notif.type === 'info' && <Info size={20} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-[#242424] dark:text-white leading-tight mb-1">
                  {notif.title}
                </h4>
                <p className="text-xs text-[#616161] dark:text-[#adadad] font-medium leading-normal line-clamp-2">
                  {notif.message}
                </p>
              </div>

              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="text-[#616161] hover:text-[#242424] dark:hover:text-white transition-colors p-1"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
