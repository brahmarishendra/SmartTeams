import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ session: null, user: null, profile: null, signOut: async () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        if (error.message.includes('refresh_token')) {
          localStorage.clear();
          sessionStorage.clear();
          setLoading(false);
          return;
        }
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        setProfile(null);
        setLoading(false);
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (authUser: User) => {
    let { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
    
    // Auto-repair missing profile if the user account was created before the DB trigger existed
    if (!data) {
      const { data: newProfile, error } = await supabase.from('profiles').upsert({
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Unknown',
        role: authUser.user_metadata?.role || 'EMPLOYEE',
        phone_number: authUser.user_metadata?.phone_number || '',
        is_approved: authUser.user_metadata?.role === 'ADMIN' // Admins auto-approve themselves for bootstrap
      }).select().single();
      
      if (error) {
        // Hard-clear session bypasses Supabase 403 logout failure
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
        return;
      }
      
      data = newProfile;
    }

    setProfile(data);
    setLoading(false);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      // Hard reset state and redirect to ensure "Back to Login" always works
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
