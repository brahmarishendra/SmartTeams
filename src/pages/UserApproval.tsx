import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Phone, Shield, ShieldAlert, Loader2 } from 'lucide-react';

export default function UserApproval() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    
    if (data) setPendingUsers(data);
    setLoading(false);
  };

  const handleApproval = async (id: string, approve: boolean) => {
    setProcessing(id);
    try {
      if (approve) {
        await supabase
          .from('profiles')
          .update({ is_approved: true })
          .eq('id', id);
      } else {
        // If rejected, we might want to delete the profile or mark as rejected
        // For now, let's just keep it pending but maybe add a 'rejected' status later
        // Simplified: just update a field if we had one, but let's stick to approval for now
      }
      await fetchPendingUsers();
    } catch (error) {
      console.error(error);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto py-8">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-[#1f2937] tracking-tight mb-2 flex items-center gap-3">
            <ShieldAlert className="w-10 h-10 text-primary" />
            Account Verifications
          </h1>
          <p className="text-gray-500 font-medium">Verify employee identities and phone numbers before granting access.</p>
        </div>
        <div className="bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20">
          <span className="text-sm font-bold text-primary">{pendingUsers.length} Pending Requests</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Fetching pending users...</p>
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-[#1f2937] mb-2">All Clear!</h3>
          <p className="text-gray-400 font-medium">No pending approval requests at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1f2937] to-[#4b5563] text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-gray-200">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-[#1f2937] text-lg leading-tight">{user.full_name}</h3>
                  <p className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block uppercase tracking-wider">{user.role}</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {user.phone_number || 'No phone provided'}
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                  <Shield className="w-4 h-4 text-gray-400" />
                  Employee ID: {user.id.slice(0, 8)}...
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-50">
                <button 
                  onClick={() => handleApproval(user.id, true)}
                  disabled={processing === user.id}
                  className="flex-1 bg-[#1f2937] text-white font-bold py-3 rounded-2xl shadow-lg shadow-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {processing === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Approve
                </button>
                <button 
                  onClick={() => handleApproval(user.id, false)}
                  disabled={processing === user.id}
                  className="px-6 py-3 rounded-2xl border-2 border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
