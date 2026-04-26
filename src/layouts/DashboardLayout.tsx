import { useEffect, useState } from 'react';
import { Outlet, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, CheckSquare, Bot, LogOut, Loader2, UserCircle, Bell, X, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import Notifications from '../components/Notifications';

export default function DashboardLayout() {
  const { session, profile, signOut } = useAuth();
  const location = useLocation();
  const { showNotification } = useNotifications();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;

    // Consolidated Real-time Channel for ALL workspace communication
    const channel = supabase
      .channel('workspace-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        window.dispatchEvent(new CustomEvent('workspace-refresh'));
      })
      .on('broadcast', { event: 'NOTIFY' }, (payload) => {
        const { title, message, variant, targetRole, targetId, senderId } = payload.payload;
        if (senderId === profile.id) return;
        if (targetRole && profile.role !== targetRole) return;
        if (targetId && profile.id !== targetId) return;
        showNotification(title, message, variant || 'info');
      })
      .on('broadcast', { event: 'REFRESH_TASKS' }, () => {
        window.dispatchEvent(new CustomEvent('workspace-refresh'));
      })
      .on('broadcast', { event: 'REMINDER' }, (payload) => {
        if (payload.payload.assigned_to === profile.id) {
          showNotification('🔔 Task Reminder', `Admin is requesting an update on: ${payload.payload.title}`, 'assignment');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, showNotification]);

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
        <p key="loading-text" className="text-muted-foreground font-medium animate-pulse"><span>Loading Workspace...</span></p>
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
              {!isCollapsed && <span key="brand-name" className="font-bold text-2xl tracking-tight text-foreground whitespace-nowrap"><span>TaskFlow</span></span>}
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
                <div key="profile-info" className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-foreground"><span>{profile?.full_name}</span></p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/50 inline-block px-2 py-0.5 rounded-md mt-1"><span>{profile?.role}</span></p>
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
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden ring-2 ring-white">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0) || 'U'
              )}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay & Aside (Consolidated for smooth exit animations) */}
        <div 
          className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        >
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`} 
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          
          {/* Sidebar */}
          <aside 
            className={`relative w-80 bg-[#f8f9fa] h-full flex flex-col shadow-2xl transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#fcfaf5] relative z-10">
          <div className="flex-1 overflow-y-auto pb-24 md:pb-10">
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

      </div>
    </div>
  );
}
