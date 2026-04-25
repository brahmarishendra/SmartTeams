import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, isPast, isToday, parseISO, addDays, isBefore, startOfDay } from 'date-fns';
import { Search, Filter as FilterIcon, Calendar, LayoutList, CheckSquare, Plus, X, Bell, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  
  // View State
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar'>('board');

  // Filters State
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterEmployee, setFilterEmployee] = useState('ALL');
  const [filterDate, setFilterDate] = useState('ALL');

  // Modal States
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const { error } = await supabase.from('tasks').insert([{
      title,
      description: desc,
      priority,
      due_date: dueDate || null,
      assigned_to: assignedTo || null,
      created_by: profile.id
    }]);
    if (!error) {
      setShowCreate(false);
      setTitle(''); setDesc(''); setDueDate(''); setAssignedTo('');
    } else {
      alert(error.message);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) alert(error.message);
  };

  useEffect(() => {
    fetchTasks();
    if (profile?.role === 'ADMIN') fetchProfiles();

    const channel = supabase.channel('dashboard-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*, assigned_user:assigned_to(full_name)').order('due_date', { ascending: true });
    if (data) setTasks(data);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) setProfiles(data);
  };

  const filteredTasks = tasks.filter(t => {
    const searchLow = search.toLowerCase();
    if (searchLow && !t.title.toLowerCase().includes(searchLow) && !t.assigned_user?.full_name?.toLowerCase().includes(searchLow)) return false;
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    if (filterEmployee !== 'ALL' && t.assigned_to !== filterEmployee) return false;
    if (filterDate !== 'ALL' && t.due_date) {
      const dDate = parseISO(t.due_date);
      const isOverdue = isPast(dDate) && !isToday(dDate);
      if (filterDate === 'OVERDUE' && (!isOverdue || t.status === 'Completed')) return false;
      if (filterDate === 'TODAY' && !isToday(dDate)) return false;
      if (filterDate === 'NEXT_7_DAYS' && (isBefore(dDate, startOfDay(new Date())) || !isBefore(dDate, addDays(new Date(), 7)))) return false;
    } else if (filterDate !== 'ALL' && !t.due_date) {
      return false;
    }
    return true;
  });

  const upcomingDeadlines = tasks.filter(t => {
    if (t.status === 'Completed' || !t.due_date) return false;
    const dDate = parseISO(t.due_date);
    return isBefore(dDate, addDays(new Date(), 4)) && !isPast(dDate);
  });

  const columns = [
    { id: 'Pending', label: 'To do', count: filteredTasks.filter(t => t.status === 'Pending').length },
    { id: 'In Progress', label: 'In progress', count: filteredTasks.filter(t => t.status === 'In Progress').length },
    { id: 'Blocked', label: 'Blocked', count: filteredTasks.filter(t => t.status === 'Blocked').length },
    { id: 'Completed', label: 'Completed', count: filteredTasks.filter(t => t.status === 'Completed').length }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-[#fecaca] text-[#991b1b]';
      case 'Medium': return 'bg-[#fef08a] text-[#854d0e]';
      case 'Low': return 'bg-[#bfdbfe] text-[#1e3a8a]';
      default: return 'bg-[#e5e7eb] text-[#374151]';
    }
  };

  const canEditStatus = (task: any) => {
    if (!profile) return false;
    return profile.role === 'ADMIN' || task.assigned_to === profile.id;
  };

  return (
    <div className="animate-in fade-in duration-500 w-full h-full min-h-screen bg-[#fcfaf5] p-6 md:p-10 font-sans text-[#1f1d1a] -m-4 md:-m-10">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Workspace Tasks</h1>
        <div className="flex flex-wrap items-center gap-4">
           <div className="flex items-center bg-white rounded-full p-1 border border-[#e5e2db] shadow-sm">
              <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${viewMode === 'list' ? 'bg-[#1f1d1a] text-white shadow-md font-bold' : 'font-semibold text-[#66635e] hover:bg-[#f5f3ef]'}`}><LayoutList className="w-4 h-4" /> List</button>
              <button onClick={() => setViewMode('board')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${viewMode === 'board' ? 'bg-[#1f1d1a] text-white shadow-md font-bold' : 'font-semibold text-[#66635e] hover:bg-[#f5f3ef]'}`}><CheckSquare className="w-4 h-4" /> Board</button>
              <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${viewMode === 'calendar' ? 'bg-[#1f1d1a] text-white shadow-md font-bold' : 'font-semibold text-[#66635e] hover:bg-[#f5f3ef]'}`}><Calendar className="w-4 h-4" /> Calendar</button>
           </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col mb-8 gap-4">
         <div className="flex justify-between items-center gap-4">
            <div className="relative w-full md:max-w-md">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a867d]" />
               <input className="w-full bg-white border border-[#e5e2db] rounded-full pl-11 pr-4 py-2.5 text-sm font-medium text-[#1f1d1a] placeholder-[#8a867d] focus:outline-none focus:ring-2 focus:ring-[#1f1d1a]/20 shadow-sm transition-all" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-4 text-sm font-semibold text-[#66635e]">
               <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors border shadow-sm cursor-pointer ${showFilters ? 'bg-[#1f1d1a] text-white border-[#1f1d1a]' : 'bg-white text-[#1f1d1a] hover:bg-[#f5f3ef] border-[#e5e2db]'}`}><FilterIcon className="w-4 h-4" /> Filters</button>
               {profile?.role === 'ADMIN' && (
                 <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"><Plus className="w-4 h-4" /> Add Task</button>
               )}
            </div>
         </div>
         {showFilters && (
            <div className="bg-white p-4 rounded-[1.5rem] border border-[#e5e2db] shadow-sm flex flex-wrap gap-4 animate-in slide-in-from-top-2">
               <div className="flex flex-col w-full sm:w-auto">
                  <label className="text-[10px] font-bold text-[#8a867d] uppercase tracking-wider ml-1 mb-1">Assignee</label>
                  <select className="bg-[#fcfaf5] border border-[#e5e2db] rounded-xl px-3 py-2 text-sm" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}><option value="ALL">All Team</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select>
               </div>
               <div className="flex flex-col w-full sm:w-auto">
                  <label className="text-[10px] font-bold text-[#8a867d] uppercase tracking-wider ml-1 mb-1">Priority</label>
                  <select className="bg-[#fcfaf5] border border-[#e5e2db] rounded-xl px-3 py-2 text-sm" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}><option value="ALL">All Priorities</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select>
               </div>
               <div className="flex flex-col w-full sm:w-auto">
                  <label className="text-[10px] font-bold text-[#8a867d] uppercase tracking-wider ml-1 mb-1">Due Date</label>
                  <select className="bg-[#fcfaf5] border border-[#e5e2db] rounded-xl px-3 py-2 text-sm" value={filterDate} onChange={e => setFilterDate(e.target.value)}><option value="ALL">Any Time</option><option value="OVERDUE">Overdue</option><option value="TODAY">Today</option><option value="NEXT_7_DAYS">Next 7 Days</option></select>
               </div>
            </div>
         )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         <div className="xl:col-span-3 flex flex-col">
            {viewMode === 'board' && (
               <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-none items-start">
                  {columns.map(col => {
                     const colTasks = filteredTasks.filter(t => t.status === col.id);
                     return (
                        <div key={col.id} className="min-w-[300px] max-w-[320px] flex-1 flex flex-col gap-4">
                           <div className="flex items-center gap-2 mb-2"><h3 className="font-bold text-[#1f1d1a]">{col.label}</h3><span className="text-sm font-medium text-[#8a867d]">({col.count})</span></div>
                           <div className="flex flex-col gap-4">
                              {colTasks.map(task => {
                                 const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) && task.status !== 'Completed';
                                 const editable = canEditStatus(task);
                                 return (
                                    <div key={task.id} className="bg-white rounded-[1.25rem] p-5 shadow-sm border border-[#e5e2db] hover:shadow-md transition-shadow flex flex-col group">
                                       <div className="flex items-start justify-between mb-3">
                                          <div className="flex flex-wrap gap-2">
                                             <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                             {isOverdue && <span className="px-3 py-1 rounded-full bg-[#fee2e2] text-[#991b1b] text-[11px] font-bold uppercase tracking-wider">Overdue</span>}
                                          </div>
                                          <select 
                                             className={`bg-transparent text-[#8a867d] hover:text-[#1f1d1a] text-xs font-bold focus:outline-none appearance-none transition-colors border border-transparent rounded-md px-1 ${editable ? 'cursor-pointer hover:border-[#e5e2db]' : 'cursor-not-allowed opacity-50'}`}
                                             value={task.status}
                                             disabled={!editable}
                                             onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                          >
                                             <option value="Pending">Pending</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="Blocked">Blocked</option>
                                          </select>
                                       </div>
                                       <h4 className="font-bold text-[#1f1d1a] leading-snug mb-2">{task.title}</h4>
                                       <p className="text-xs text-[#66635e] font-medium line-clamp-3 mb-6 leading-relaxed">{task.description}</p>
                                       <div className="flex items-center justify-between mt-auto">
                                          <div className="flex items-center gap-2 text-[#66635e] text-xs font-semibold bg-[#f5f3ef] px-3 py-1.5 rounded-lg border border-[#e5e2db]"><Calendar className="w-3.5 h-3.5" /> {task.due_date ? format(parseISO(task.due_date), 'd MMM') : 'No Date'}</div>
                                          <div className="flex items-center gap-2">
                                              {profile?.role === 'ADMIN' && (
                                                <button 
                                                  onClick={() => handleDeleteTask(task.id)}
                                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                  title="Delete Task"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              )}
                                              <div className="w-7 h-7 rounded-full bg-[#1f1d1a] text-white flex items-center justify-center text-[10px] font-bold" title={task.assigned_user?.full_name}>{task.assigned_user?.full_name?.charAt(0) || '?'}</div>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     );
                  })}
               </div>
            )}

            {viewMode === 'list' && (
               <div className="bg-white rounded-[1.5rem] border border-[#e5e2db] shadow-sm overflow-hidden animate-in fade-in">
                  <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                        <thead className="bg-[#fcfaf5] border-b border-[#e5e2db] text-[#8a867d] uppercase tracking-wider font-bold text-[11px]">
                           <tr><th className="px-6 py-4">Task</th><th className="px-6 py-4">Assignee</th><th className="px-6 py-4">Status & Priority</th><th className="px-6 py-4">Due Date</th></tr>
                        </thead>
                        <tbody>
                           {filteredTasks.map(task => {
                              const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) && task.status !== 'Completed';
                              const editable = canEditStatus(task);
                              return (
                                 <tr key={task.id} className={`border-b border-[#e5e2db] last:border-0 hover:bg-[#fcfaf5] transition-colors ${isOverdue ? 'bg-red-50/70' : ''}`}>
                                    <td className="px-6 py-4"><div className="font-bold text-[#1f1d1a] flex items-center gap-2">{task.title}</div><div className="text-xs text-[#8a867d] mt-1 max-w-[200px] truncate">{task.description}</div></td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2 font-medium"><div className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px] font-bold">{task.assigned_user?.full_name?.charAt(0) || '?'}</div>{task.assigned_user?.full_name || 'Unassigned'}</div></td>
                                    <td className="px-6 py-4 space-y-2">
                                       <select 
                                          className={`bg-[#f5f3ef] border border-[#e5e2db] rounded-md px-2 py-1 text-xs font-bold text-[#1f1d1a] ${editable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                                          disabled={!editable}
                                          value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value)}>
                                          <option value="Pending">Pending</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="Blocked">Blocked</option>
                                       </select>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-[#66635e]">
                                       <div className="flex items-center justify-between">
                                          {task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : '-'}
                                          {profile?.role === 'ADMIN' && (
                                            <button 
                                              onClick={() => handleDeleteTask(task.id)}
                                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          )}
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {viewMode === 'calendar' && (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                  {filteredTasks.map(task => (
                     <div key={task.id} className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[#e5e2db] flex flex-col h-full hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4"><span className={`w-12 h-12 flex items-center justify-center rounded-2xl font-bold text-lg bg-[#fcfaf5] text-[#1f1d1a]`}>{task.due_date ? format(parseISO(task.due_date), 'd') : '?'}</span><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getPriorityColor(task.priority)}`}>{task.priority}</span></div>
                        <h4 className="font-bold text-[#1f1d1a] mb-1">{task.title}</h4>
                        <div className="mt-auto pt-4 border-t border-[#e5e2db] flex justify-between items-center text-xs font-bold text-[#1f1d1a]"><span>{task.assigned_user?.full_name?.split(' ')[0] || 'Unassigned'}</span><span className="text-[#8a867d] bg-[#f5f3ef] px-2 py-1 rounded-md">{task.status}</span></div>
                     </div>
                  ))}
               </div>
            )}
         </div>

         {/* Sidebar: Upcoming Deadlines */}
         <div className="xl:col-span-1 space-y-6">
            <div className="bg-[#1f1d1a] rounded-[1.5rem] p-6 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all">
               <div className="absolute top-0 right-0 p-4 opacity-20"><Bell className="w-16 h-16 text-white" /></div>
               <h3 className="font-bold text-white text-xl mb-1 relative z-10">Action Required</h3>
               <p className="text-[#8a867d] text-xs font-semibold mb-6 relative z-10">Deadlines within 3 days</p>
               <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 relative z-10">
                  {upcomingDeadlines.length === 0 ? <div className="text-center py-6 text-sm font-semibold text-[#8a867d]">All caught up!</div> : upcomingDeadlines.map(task => (
                     <div key={task.id} className="bg-white/10 p-4 rounded-xl space-y-2 border border-white/10 hover:bg-white/20 transition-colors">
                        <h4 className="text-sm font-bold truncate text-white">{task.title}</h4>
                        <div className="flex justify-between text-xs text-white/60 font-semibold"><span>{task.assigned_user?.full_name?.split(' ')[0]}</span><span className="text-orange-400">{format(parseISO(task.due_date), 'MMM do')}</span></div>
                        {profile?.role === 'ADMIN' && <button onClick={() => {}} className="w-full mt-2 py-2 text-xs font-bold bg-white text-[#1f1d1a] rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">Send Reminder</button>}
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1f1d1a]/40 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl">
              <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-[#1f1d1a]">Create New Task</h2><button onClick={() => setShowCreate(false)} className="p-2 bg-[#f5f3ef] hover:bg-[#e5e2db] rounded-full transition-colors text-[#1f1d1a] cursor-pointer"><X className="w-5 h-5" /></button></div>
              <form onSubmit={handleCreateTask} className="space-y-4">
                 <div className="space-y-1.5"><label className="text-sm font-bold text-[#66635e]">Title</label><input className="w-full bg-[#fcfaf5] border border-[#e5e2db] rounded-xl px-4 py-3 text-sm" value={title} onChange={e => setTitle(e.target.value)} required /></div>
                 <div className="space-y-1.5"><label className="text-sm font-bold text-[#66635e]">Assign To</label><select className="w-full bg-[#fcfaf5] border border-[#e5e2db] rounded-xl px-4 py-3 text-sm" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required><option value="" disabled>Select Team Member</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
                 <div className="space-y-1.5"><label className="text-sm font-bold text-[#66635e]">Description</label><textarea className="w-full bg-[#fcfaf5] border border-[#e5e2db] rounded-xl px-4 py-3 text-sm min-h-[100px]" value={desc} onChange={e => setDesc(e.target.value)}></textarea></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-sm font-bold text-[#66635e]">Priority</label><select className="w-full bg-[#fcfaf5] border border-[#e5e2db] rounded-xl px-4 py-3 text-sm" value={priority} onChange={e => setPriority(e.target.value)}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
                    <div className="space-y-1.5"><label className="text-sm font-bold text-[#66635e]">Due Date</label><input type="date" className="w-full bg-[#fcfaf5] border border-[#e5e2db] rounded-xl px-4 py-3 text-sm" value={dueDate} onChange={e => setDueDate(e.target.value)} required /></div>
                 </div>
                 <button type="submit" className="w-full py-3.5 bg-[#1f1d1a] text-white rounded-xl font-bold mt-4 hover:bg-[#3a3631] transition-colors shadow-lg cursor-pointer">Create Task</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
