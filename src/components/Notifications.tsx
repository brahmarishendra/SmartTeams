import React from 'react';
import { Bell, Mail, MessageSquare, Clock, Check, MoreVertical, ShieldCheck, Zap } from 'lucide-react';
import { format } from 'date-fns';

export default function Notifications({ onClose }: { onClose: () => void }) {
  const notifications = [
    {
      id: 1,
      type: 'whatsapp',
      sender: 'Admin / System',
      message: '🚨 URGENT: The "Client Presentation" task is due in 30 minutes! Please ensure the slides are uploaded.',
      time: new Date(),
      isRead: false,
      priority: 'high'
    },
    {
      id: 2,
      type: 'email',
      sender: 'TaskFlow AI',
      message: 'New Workspace Insight: "Team productivity has increased by 15% this week. Great job!"',
      time: new Date(Date.now() - 3600000),
      isRead: false,
      priority: 'medium'
    },
    {
      id: 3,
      type: 'whatsapp',
      sender: 'Project Manager',
      message: '✅ Task Approved: Your update on "Landing Page Fixes" was reviewed and marked as completed.',
      time: new Date(Date.now() - 7200000),
      isRead: true,
      priority: 'low'
    },
    {
      id: 4,
      type: 'system',
      sender: 'Security',
      message: 'Your account was successfully verified with phone number +91 *******210.',
      time: new Date(Date.now() - 86400000),
      isRead: true,
      priority: 'low'
    }
  ];

  return (
    <div className="w-full max-w-sm bg-white/80 dark:bg-[#121212]/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/40 dark:border-white/10 overflow-hidden flex flex-col max-h-[550px] animate-in fade-in slide-in-from-top-4 duration-500">
      
      {/* Header */}
      <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-[#1f2937] dark:text-white text-lg">Activity</h3>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Live Workspace</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400 cursor-pointer">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
        {notifications.map((notif) => (
          <div 
            key={notif.id} 
            className={`p-5 rounded-[1.8rem] border transition-all cursor-pointer relative group ${
              notif.isRead 
                ? 'bg-transparent border-gray-50 dark:border-white/5' 
                : 'bg-white dark:bg-white/5 border-primary/10 shadow-sm'
            } hover:scale-[1.02] hover:shadow-md`}
          >
            {!notif.isRead && (
              <span className="absolute top-5 right-5 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            )}

            <div className="flex gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                notif.type === 'whatsapp' 
                  ? 'bg-[#25D366]/10 text-[#25D366]' 
                  : notif.type === 'email' 
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-purple-100 text-purple-600'
              }`}>
                {notif.type === 'whatsapp' ? <MessageSquare className="w-5 h-5" /> : notif.type === 'email' ? <Mail className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{notif.sender}</p>
                  <span className="text-[9px] font-bold text-gray-400">{format(notif.time, 'HH:mm')}</span>
                </div>
                <p className={`text-sm font-bold leading-relaxed mb-1 ${notif.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-[#1f2937] dark:text-white'}`}>
                  {notif.message}
                </p>
                {notif.priority === 'high' && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-red-500 uppercase bg-red-50 px-2 py-0.5 rounded-full">
                    <Zap className="w-2 h-2 fill-current" /> Urgent
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-6 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5">
        <button className="w-full py-4 text-xs font-black text-primary hover:bg-primary/5 rounded-[1.2rem] transition-all uppercase tracking-[0.2em] cursor-pointer">
          Clear all activity
        </button>
      </div>
    </div>
  );
}
