import { useEffect, useState } from 'react';
import { Outlet, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, CheckSquare, Bot, LogOut, Loader2, UserCircle, Bell, X, Info, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import Notifications from '../components/Notifications';
import { isBefore, addDays, isPast, parseISO } from 'date-fns';

export default function DashboardLayout() {
  const { session, profile, signOut } = useAuth();
  const location = useLocation();
  const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('new-tasks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to=eq.${profile.id}`,
        },
        (payload) => {
          const newRecord = payload.new as any;
          const dueDate = newRecord.due_date ? parseISO(newRecord.due_date) : null;
          const isUrgent = dueDate && isBefore(dueDate, addDays(new Date(), 4)) && !isPast(dueDate);
          
          setNotification({
            title: isUrgent ? '🚨 Urgent Task Assigned' : 'New Task Assigned',
            message: newRecord.title,
          });
          
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5;
            audio.play();
          } catch (e) {
            console.warn("Audio playback failed:", e);
          }
          
          setTimeout(() => setNotification(null), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (profile && !profile.is_approved && location.pathname !== '/pending-approval') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (!profile && session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading Workspace...</p>
        <button onClick={signOut} className="text-sm text-red-500 hover:underline mt-4">
          Click here to Sign Out if this takes too long.
        </button>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'EMPLOYEE'] },
    { name: 'My Tasks', path: '/my-tasks', icon: CheckSquare, roles: ['ADMIN', 'EMPLOYEE'] },
    { name: 'Smart AI', path: '/ai', icon: Bot, roles: ['ADMIN'] },
    { name: 'Approvals', path: '/approvals', icon: ShieldCheck, roles: ['ADMIN'] },
    { name: 'Profile', path: '/profile', icon: UserCircle, roles: ['ADMIN', 'EMPLOYEE'] },
  ];

  const allowedNavItems = navItems.filter(item => item.roles.includes(profile.role));

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-card font-sans">
      <div className="w-full h-full flex flex-col md:flex-row overflow-hidden">
        
        {/* Desktop Sidebar */}
        <aside className={`${isCollapsed ? 'w-24' : 'w-20 lg:w-[280px]'} bg-[#f8f9fa] flex flex-col hidden md:flex border-r border-border/50 shrink-0 transition-all duration-300 relative`}>
          
          <div className={`p-8 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-[45px] h-[45px] rounded-2xl overflow-hidden shadow-lg shadow-primary/20 shrink-0">
                 <img src="https://i.pinimg.com/1200x/7b/0c/29/7b0c29141de963589fb4a78b299006c1.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
              {!isCollapsed && <span className="font-bold text-2xl tracking-tight text-foreground whitespace-nowrap">TaskFlow</span>}
            </div>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 hover:bg-white rounded-xl text-muted-foreground hover:text-primary transition-colors cursor-pointer hidden lg:block"
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
          
          <nav className="flex-1 px-6 space-y-3 overflow-y-auto pb-8">
            {!isCollapsed && <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2">Main Menu</div>}
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center ${isCollapsed ? 'justify-center' : 'justify-start space-x-4'} px-4 py-4 rounded-2xl transition-all font-semibold ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                        : 'text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm'
                    }`
                  }
                  title={item.name}
                >
                  <Icon className="w-6 h-6" />
                  {!isCollapsed && <span>{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>

          <div className={`p-6 mt-auto bg-gradient-to-t from-secondary/80 to-transparent ${isCollapsed ? 'items-center' : ''}`}>
            <div className={`flex ${isCollapsed ? 'flex-col' : 'flex-row'} items-center lg:space-x-4 mb-6 bg-white p-4 rounded-3xl shadow-sm`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-primary text-white flex items-center justify-center font-bold relative shrink-0 shadow-inner overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile?.full_name?.charAt(0) || 'U'
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-foreground">{profile?.full_name}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/50 inline-block px-2 py-0.5 rounded-md mt-1">{profile?.role}</p>
                </div>
              )}
            </div>
            <button 
              onClick={signOut}
              className={`flex w-full items-center ${isCollapsed ? 'justify-center' : 'justify-start space-x-3'} px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer`}
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-5 bg-card border-b border-border/50 sticky top-0 z-20">
           <div className="flex items-center space-x-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-muted-foreground hover:bg-secondary rounded-full cursor-pointer"><LayoutDashboard className="w-6 h-6" /></button>
            <div className="w-10 h-10 rounded-[1rem] overflow-hidden shadow-sm">
               <img src="https://i.pinimg.com/1200x/7b/0c/29/7b0c29141de963589fb4a78b299006c1.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-xl">TaskFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowNotifPanel(!showNotifPanel)} className={`p-2 text-muted-foreground hover:bg-secondary rounded-full relative cursor-pointer ${showNotifPanel ? 'bg-secondary text-primary' : ''}`}><Bell className="w-5 h-5" /></button>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">{profile?.full_name?.charAt(0)}</div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
            <aside className="relative w-80 bg-[#f8f9fa] h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
              <div className="p-8 flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg">
                    <img src="https://i.pinimg.com/1200x/7b/0c/29/7b0c29141de963589fb4a78b299006c1.jpg" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-2xl tracking-tight text-foreground">TaskFlow</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-muted-foreground hover:bg-white rounded-full cursor-pointer"><X className="w-6 h-6" /></button>
              </div>

              <nav className="flex-1 px-6 space-y-3 overflow-y-auto pb-8">
                {allowedNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all font-semibold ${
                          isActive ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-white hover:text-foreground'
                        }`
                      }
                    >
                      <Icon className="w-6 h-6" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-6 bg-gradient-to-t from-secondary/80 to-transparent">
                <div className="flex items-center space-x-4 mb-6 bg-white p-4 rounded-3xl shadow-sm">
                  <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-tr from-accent to-primary text-white flex items-center justify-center font-bold relative shrink-0 overflow-hidden">
                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : profile?.full_name?.charAt(0) || 'U'}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-foreground">{profile?.full_name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/50 inline-block px-2 py-0.5 rounded-md mt-1">{profile?.role}</p>
                  </div>
                </div>
                <button onClick={() => { signOut(); setIsSidebarOpen(false); }} className="flex w-full items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><LogOut className="w-5 h-5" /><span>Sign Out</span></button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#fdfdfd] relative z-10">
          <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 scrollbar-none">
            <Outlet />
          </div>
          {showNotifPanel && (
            <div className="fixed top-20 right-6 z-[60] w-full max-w-sm">
              <Notifications onClose={() => setShowNotifPanel(false)} />
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/50 flex justify-around items-center p-2 pb-safe z-50">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {({ isActive }) => (
                   <>
                     <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${isActive ? 'bg-primary/10' : ''}`}><Icon className={`w-5 h-5 ${isActive ? 'fill-primary/20' : ''}`} /></div>
                     <span className={`text-[10px] font-semibold mt-0.5 ${isActive ? 'opacity-100' : 'opacity-0 h-0'}`}>{item.name}</span>
                   </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {notification && (
          <div className="fixed bottom-20 md:bottom-10 right-6 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
            <div className="bg-[#1f1d1a] text-white p-5 rounded-[1.5rem] shadow-2xl border border-white/10 flex items-start gap-4 max-w-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0"><Info className="w-5 h-5 text-blue-400" /></div>
              <div className="flex-1 min-w-0"><h4 className="font-bold text-sm mb-1">{notification.title}</h4><p className="text-xs text-white/60 font-medium truncate">{notification.message}</p></div>
              <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X className="w-4 h-4 text-white/40" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
