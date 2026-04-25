import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Clock, LogOut, Phone, ShieldCheck } from 'lucide-react';

export default function PendingApproval() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-gray-200 border border-gray-100 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <Clock className="w-10 h-10 text-orange-500 animate-pulse" />
        </div>
        
        <h1 className="text-3xl font-bold text-[#1f2937] mb-4 tracking-tight">Wait for Approval</h1>
        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
          Hello <span className="text-[#1f2937] font-bold">{profile?.full_name}</span>, your account is currently pending administrator approval. We verify all employees to ensure workplace security.
        </p>

        <div className="space-y-4 mb-10 text-left">
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Phone className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
              <p className="text-sm font-bold text-[#1f2937]">{profile?.phone_number || 'Not provided'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
              <p className="text-sm font-bold text-orange-500">Verification Pending</p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button 
            onClick={signOut}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white border-2 border-gray-100 text-[#1f2937] font-bold hover:bg-gray-50 transition-all active:scale-[0.98] cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Sign Out & Try Later
          </button>
          <p className="mt-6 text-xs text-gray-400 font-medium">
            The verification process usually takes less than 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
