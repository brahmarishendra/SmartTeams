import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui';
import { format, isPast, parseISO, isToday } from 'date-fns';
import { Clock, LayoutList, Play, Pause, TrendingUp, Trash2 } from 'lucide-react';
import { realtimeService } from '../lib/realtime';

export default function MyTasks() {
  const { profile } = useAuth();
  const { showNotification } = useNotifications();
  const [tasks, setTasks] = useState<any[]>([]);

  // Work Session State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    fetchMyTasks();
    const savedStartTime = localStorage.getItem('work_session_start');
    const isRunning = localStorage.getItem('work_session_running') === 'true';
    if (savedStartTime && isRunning) {
      const startTime = parseInt(savedStartTime, 10);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimerSeconds(elapsed);
      setTimerRunning(true);
    }
    
    // Listen for global refresh events
    const handleRefresh = () => fetchMyTasks();
    window.addEventListener('workspace-refresh', handleRefresh);

    return () => {
      window.removeEventListener('workspace-refresh', handleRefresh);
    };
  }, [profile]);

  useEffect(() => {
    let interval: any;
    if (timerRunning) {
      interval = setInterval(() => { setTimerSeconds(s => s + 1); }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const toggleTimer = () => {
    if (!timerRunning) {
      const startTime = Date.now() - (timerSeconds * 1000);
      localStorage.setItem('work_session_start', startTime.toString());
      localStorage.setItem('work_session_running', 'true');
      setTimerRunning(true);
    } else {
      localStorage.setItem('work_session_running', 'false');
      setTimerRunning(false);
    }
  };

  const resetTimer = () => {
    localStorage.removeItem('work_session_start');
    localStorage.setItem('work_session_running', 'false');
    setTimerSeconds(0);
    setTimerRunning(false);
  };

  const fetchMyTasks = async () => {
    if (!profile) return;
    let query = supabase.from('tasks').select('*');
    if (profile.role !== 'ADMIN') { query = query.eq('assigned_to', profile.id); }
    const { data } = await query.order('due_date', { ascending: true });
    if (data) setTasks(data);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (!error) { 
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)); 
      showNotification('Status Updated', `Task status changed to ${newStatus}`, 'success');
      
      // Notify Admin and refresh everyone
      realtimeService.notify({
        senderId: profile.id,
        targetRole: 'ADMIN',
        title: '🔄 Status Change',
        message: `${profile.full_name?.split(' ')[0]} updated a task to ${newStatus}`,
        variant: 'success'
      });
      realtimeService.triggerRefresh();
    } else {
      showNotification('Error', error.message, 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (!error) { 
      setTasks(tasks.filter(t => t.id !== taskId)); 
      showNotification('Deleted', 'Task has been removed', 'info');
      
      // Notify all and refresh
      realtimeService.notify({
        senderId: profile.id,
        title: '🗑️ Task Removed',
        message: `${profile.full_name?.split(' ')[0]} deleted a task.`,
        variant: 'error'
      });
      realtimeService.triggerRefresh();
    } else {
      showNotification('Error', error.message, 'error');
    }
  };

  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const overdueTasks = tasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)) && t.status !== 'Completed');

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90">
            Welcome back, <span className="text-primary">{profile?.full_name?.split(' ')[0]}!</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">Workspace Real-time Status.</p>
        </div>
        <div className="flex gap-4 bg-white p-4 rounded-2xl shadow-sm border border-border/40 shrink-0">
           <div className="text-center px-2"><span className="text-2xl font-bold">{tasks.length}</span><p className="text-[10px] font-bold text-muted-foreground uppercase">Total</p></div>
           <div className="w-[1px] bg-border"></div>
           <div className="text-center px-2"><span className="text-2xl font-bold">{completedCount}</span><p className="text-[10px] font-bold text-muted-foreground uppercase">Done</p></div>
           <div className="w-[1px] bg-border"></div>
           <div className="text-center px-2"><span className="text-2xl font-bold text-red-500">{overdueTasks.length}</span><p className="text-[10px] font-bold text-muted-foreground uppercase">Overdue</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         <div className="lg:col-span-4 space-y-6">
            
            {/* Analytics Dashboard Card */}
            <Card className="border-none bg-white rounded-2xl shadow-sm border border-border/40 overflow-hidden">
               <CardContent className="p-6">
                  <div className="w-full flex justify-between items-start mb-6">
                     <h3 className="text-sm font-bold">Analytics Dashboard</h3>
                     <div className="px-2 py-1 bg-green-50 rounded-lg text-[10px] font-bold text-green-600 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> LIVE</div>
                  </div>
                  
                  {/* Circular Ring */}
                  <div className="flex justify-center mb-8">
                     <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                           <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                           <circle cx="50" cy="50" r="42" fill="none" stroke="url(#progressGradient)" strokeWidth="10" strokeLinecap="round" strokeDasharray="264" strokeDashoffset={264 - (progressPercentage / 100 * 264)} className="transition-all duration-1000" />
                           <defs><linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#ea580c" /></linearGradient></defs>
                        </svg>
                        <div className="absolute flex flex-col items-center"><span className="text-xl font-black">{progressPercentage}%</span></div>
                     </div>
                  </div>

                  {/* Restored Bar Charts */}
                  <div className="space-y-5 mb-6">
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><span>Efficiency</span><span>85%</span></div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                           <div className="h-full bg-orange-500/80 rounded-full w-[85%] transition-all"></div>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><span>Completion Rate</span><span>{progressPercentage}%</span></div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                           <div className="h-full bg-orange-600 rounded-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                     </div>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-3">
                     <div className="p-3 bg-secondary/50 rounded-xl border border-border/40 text-center"><p className="text-lg font-bold">{completedCount}</p><p className="text-[9px] font-bold text-muted-foreground uppercase">Done</p></div>
                     <div className="p-3 bg-secondary/50 rounded-xl border border-border/40 text-center"><p className="text-lg font-bold">{tasks.length - completedCount}</p><p className="text-[9px] font-bold text-muted-foreground uppercase">Left</p></div>
                  </div>
               </CardContent>
            </Card>

            <Card className="border-none bg-white rounded-2xl shadow-sm border border-border/40 overflow-hidden">
               <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-full flex justify-between items-center mb-4">
                     <h3 className="text-sm font-bold">Work Session</h3>
                     <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div className="relative w-28 h-28 flex items-center justify-center mb-4">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                         <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeDasharray="5 5" />
                         <circle cx="50" cy="50" r="45" fill="none" stroke="#f97316" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - ((timerSeconds % 3600) / 3600 * 283)} strokeLinecap="round" />
                      </svg>
                      <div className="absolute flex flex-col items-center"><span className="text-lg font-bold tracking-tighter font-mono">{formatTime(timerSeconds)}</span><span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{timerRunning ? 'Real-time' : 'Paused'}</span></div>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={toggleTimer} className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform cursor-pointer hover:scale-105 ${timerRunning ? 'bg-secondary text-foreground' : 'bg-primary text-white shadow-primary/20'}`}>{timerRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}</button>
                      <button onClick={resetTimer} className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"><Clock className="w-4 h-4" /></button>
                  </div>
               </CardContent>
            </Card>
         </div>

          <div className="lg:col-span-8">
            <Card className="border-none bg-[#121212] text-white rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col">
               <CardHeader className="p-6 pb-2 border-b border-white/5">
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 bg-white/5 rounded-xl"><LayoutList className="w-5 h-5 text-white/70" /></div>
                     <div><CardTitle className="text-lg font-bold">{profile?.role === 'ADMIN' ? 'All Workspace Tasks' : 'Assigned Tasks'}</CardTitle><p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">{tasks.length} Active Items</p></div>
                  </div>
               </CardHeader>
               <CardContent className="p-6 flex-1 overflow-y-auto space-y-4 scrollbar-none">
                   {tasks.map(task => {
                     const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) && task.status !== 'Completed';
                     return (
                      <div key={task.id} className={`group relative p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all border ${isOverdue ? 'bg-red-500/10 border-red-500/40 shadow-sm shadow-red-500/10' : 'bg-white/5 border-white/5'}`}>
                         <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${isOverdue ? 'bg-red-50' : 'bg-primary'}`}></div>
                            <div className="min-w-0">
                               <h4 className="font-bold text-sm truncate">{task.title}</h4>
                               <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-white/40 uppercase tracking-wider"><Clock className="w-3 h-3" /> <span>{task.due_date ? format(parseISO(task.due_date), 'MMM d') : 'No deadline'}</span><span className="w-0.5 h-0.5 bg-white/20 rounded-full"></span><span>{task.priority}</span></div>
                            </div>
                         </div>
                         <div className="flex items-center gap-2 shrink-0">
                            <select className="h-9 rounded-lg bg-white/10 border-none px-3 text-[11px] font-bold text-white/90 cursor-pointer outline-none" value={task.status} onChange={e => handleStatusChange(task.id, e.target.value)}>
                               <option value="Pending" className="text-gray-900">Pending</option><option value="In Progress" className="text-gray-900">In Progress</option><option value="Completed" className="text-gray-900">Completed</option><option value="Blocked" className="text-gray-900">Blocked</option>
                            </select>
                            {profile?.role === 'ADMIN' && ( <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button> )}
                         </div>
                      </div>
                     );
                  })}
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
