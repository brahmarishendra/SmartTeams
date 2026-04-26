import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { Clock, Camera, User, Loader2, LogOut } from 'lucide-react';

export default function Profile() {
  const { profile, signOut } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ completed: 0, total: 0, score: 0 });
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  useEffect(() => {
    if (profile) {
      fetchUserTasks();
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const fetchUserTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', profile?.id)
      .order('updated_at', { ascending: false });

    if (data) {
      setTasks(data);
      const completed = data.filter(t => t.status === 'Completed').length;
      const total = data.length;
      setStats({
        completed,
        total,
        score: total > 0 ? Math.round((completed / total) * 100) : 0
      });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      
      // Convert to Base64 for "local" database storage
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = reader.result as string;
        
        // Update profile in database immediately
        const { error } = await supabase
          .from('profiles')
          .update({
            avatar_url: base64String,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile?.id);

        if (error) throw error;
        
        setAvatarUrl(base64String);
        // We don't reload the page, just update local state
        // AuthContext will pick it up on next session or we could manually refresh
      };

    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="animate-in fade-in duration-500 w-full bg-white font-sans">
      
      <div className="max-w-[1200px] mx-auto">
        
        {/* Profile Header section - Simplified */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8 bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#1f2937] to-[#4b5563] flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-xl ring-4 ring-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.full_name?.charAt(0) || <User className="w-10 h-10" />
                )}
              </div>
              
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
              </label>

              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-3xl">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-[#1f2937] tracking-tight mb-1">{profile.full_name}</h1>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-gray-400 bg-white px-3 py-1 rounded-full inline-block border border-gray-100 shadow-sm">{profile.role}</p>
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-md border border-green-100">Verified</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end">
            <p className="hidden md:block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Account ID</p>
            <p className="hidden md:block text-xs font-mono text-gray-300">{profile.id.substring(0, 18)}...</p>
            
            <button 
              onClick={() => signOut()}
              className="mt-2 md:mt-4 flex items-center gap-2 px-6 py-3 md:px-4 md:py-2 bg-red-50 text-red-600 rounded-2xl md:rounded-xl hover:bg-red-100 transition-all text-sm font-bold border border-red-100 shadow-sm active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#f3f4f6] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-sm">
             <div className="text-5xl font-light text-[#1f2937] tracking-tight mb-2">
                {stats.total || 0}
             </div>
             <div className="text-[13px] font-medium text-gray-500">
                Total assigned tasks
             </div>
          </div>
          
          <div className="bg-[#1f2937] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-md">
             <div className="text-5xl font-light text-white tracking-tight mb-2">
                {stats.completed}
             </div>
             <div className="text-[13px] font-medium text-gray-400">
                Completed tasks
             </div>
          </div>

          <div className="bg-[#e4ff8c] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-sm">
             <div className="text-5xl font-light text-[#1f2937] tracking-tight mb-2">
                {stats.score}<span className="text-4xl text-[#1f2937]/50">%</span>
             </div>
             <div className="text-[13px] font-medium text-[#1f2937]/70 px-4 leading-tight">
                Overall efficiency score
             </div>
          </div>
        </div>

        {/* Content Below Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           <div>
              <h3 className="text-lg font-bold text-[#1f2937] mb-6 flex items-center gap-2">
                 <Clock className="w-5 h-5 text-gray-400" />
                 Recent Activity
              </h3>
              
              <div className="space-y-0">
                 {tasks.slice(0, 5).map((task, i) => (
                    <div key={task.id} className="flex gap-6 relative group">
                       {i !== Math.min(tasks.length, 5) - 1 && (
                          <div className="absolute left-6 top-14 bottom-[-10px] w-[2px] bg-gray-100 group-hover:bg-gray-200 transition-colors"></div>
                       )}
                       <div className="w-12 pt-4 flex flex-col items-center shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex flex-col items-center justify-center border-4 border-white shadow-sm z-10">
                             <span className="text-sm font-bold text-[#1f2937]">{format(parseISO(task.updated_at), 'd')}</span>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 mt-2 uppercase">
                             {format(parseISO(task.updated_at), 'MMM')}
                          </span>
                       </div>
                       <div className="flex-1 py-4">
                          <div className="flex justify-between items-start mb-1">
                             <h4 className="font-bold text-[#1f2937] text-[15px]">{task.title}</h4>
                          </div>
                          <p className="text-[13px] font-medium text-gray-500 flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${task.status === 'Completed' ? 'bg-green-500' : 'bg-orange-400'}`}></span>
                             Marked as {task.status}
                          </p>
                       </div>
                    </div>
                 ))}
                 
                 {tasks.length === 0 && (
                    <div className="text-center py-12 text-gray-400 font-medium">
                       No recent activity found.
                    </div>
                 )}
              </div>
           </div>

           <div className="hidden lg:block bg-gray-50/50 rounded-[2rem] border border-gray-100 p-8">
              <div className="text-center text-gray-400 font-medium mt-10">
                 Calendar View / Schedule<br/>
                 <span className="text-sm font-normal text-gray-300">(Coming Soon)</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
