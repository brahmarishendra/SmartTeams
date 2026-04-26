import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { session } = useAuth();

  if (session) {
    return <Navigate to="/dashboard" />;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
              phone_number: phoneNumber,
            }
          }
        });
        
        if (signUpError) {
          if (signUpError.message.includes('rate limit') || signUpError.status === 429) {
            throw new Error('Too many sign-up attempts. Please try again later or log in.');
          }
          throw signUpError;
        }
        
        // If signup success, show modal
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#31170A] flex flex-col items-center justify-center p-4 md:p-8 py-12 font-sans antialiased text-gray-900 select-none overflow-y-auto">

      {/* Outer White Card */}
      <div className="w-full max-w-[1200px] bg-white rounded-[1px] p-4 flex shadow-2xl flex-col md:flex-row shadow-[#170a04]/50 relative">
        
        {/* Sign Up Success Modal */}
        {showSuccessModal && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-500 animate-bounce" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
            <p className="text-lg text-gray-500 max-w-md mb-8 leading-relaxed font-medium">
              Your account has been created. <span className="text-black font-bold">Admin will approve it</span> within 24 hours. You can log in once verified.
            </p>
            <button 
              onClick={() => { setShowSuccessModal(false); setIsLogin(true); }}
              className="px-10 py-4 bg-[#ED6B14] text-white rounded-xl font-bold hover:bg-[#d66010] transition-all shadow-xl shadow-[#ED6B14]/20 cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* Left Side: Dark Abstract Glow */}
        <div className="hidden md:flex relative flex-1 bg-black rounded-[1px] overflow-hidden p-8 flex-col justify-start">
          <div className="absolute inset-0 z-0">
            <img src="/orange_glow.png" alt="Orange Glow Abstract" className="w-full h-full object-cover object-bottom" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-transparent z-10 pointer-events-none"></div>
          <div className="relative z-20">
            <h1 className="text-white text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]">
              Convert your ideas<br />
              into successful<br />
              business.
            </h1>
          </div>
        </div>

        {/* Right Side: Action Form */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 md:px-12 py-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          {/* Header Brand & Back Button */}
          <div className="flex items-center justify-between mb-2">
            <Sun className="text-[#ED6B14] w-8 h-8 md:w-10 md:h-10 animate-[spin_10s_linear_infinite]" strokeWidth={2.5} />
            {!isLogin && (
              <button 
                onClick={() => setIsLogin(true)}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-black transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Go Back
              </button>
            )}
          </div>

          <h2 className="text-3xl font-medium tracking-tight text-black mt-2 mb-2">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h2>
          <p className="text-sm font-medium text-gray-400 mb-6">
            Welcome to TaskFlow — {isLogin ? 'Log in to continue' : 'Let\'s get started'}
          </p>

          <hr className="border-gray-100 mb-6" />

          <form onSubmit={handleAuth} className="space-y-3.5">

            {error && (
              <div className="p-3 text-sm text-[#ED6B14] bg-[#ED6B14]/10 rounded-lg border border-[#ED6B14]/20 font-medium">
                {error}
              </div>
            )}

            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-400">Your name</label>
                  <input 
                    name="name"
                    autoComplete="name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:border-[#ED6B14] focus:ring-1 focus:ring-[#ED6B14] outline-none transition-all duration-200 font-medium text-black"
                    placeholder="John Doe" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-400">Phone Number</label>
                  <input 
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:border-[#ED6B14] focus:ring-1 focus:ring-[#ED6B14] outline-none transition-all duration-200 font-medium text-black"
                    placeholder="+91 9876543210" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required={!isLogin}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-400">Join as</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('EMPLOYEE')}
                      className={`py-3 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-widest cursor-pointer ${
                        role === 'EMPLOYEE' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400'
                      }`}
                    >
                      Employee
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('ADMIN')}
                      className={`py-3 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-widest cursor-pointer ${
                        role === 'ADMIN' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-400">Your email</label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:border-[#ED6B14] focus:ring-1 focus:ring-[#ED6B14] outline-none transition-all font-medium text-black"
                placeholder="hi@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-400">{isLogin ? 'Your password' : 'Create new password'}</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:border-[#ED6B14] focus:ring-1 focus:ring-[#ED6B14] outline-none transition-all font-medium text-black"
                  placeholder="**********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-lg bg-[#ED6B14] hover:bg-[#d66010] text-white font-bold text-[15px] cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center shadow-md shadow-[#ED6B14]/20"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                isLogin ? 'Login to account' : 'Create new account'
              )}
            </button>

          </form>

          <div className="mt-8 text-center text-sm font-medium text-gray-500">
            {isLogin ? "Don't have an account? " : "Already have account? "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-black font-semibold hover:text-[#ED6B14] cursor-pointer transition-colors"
            >
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
