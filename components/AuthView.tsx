
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Terminal, Mail, Lock, User, ArrowRight, AlertTriangle, Loader2, Chrome, Key, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PlayerData } from '../types';
import ForgotPassword from './ForgotPassword';
import ShadowLoading from './ShadowLoading';

interface AuthViewProps {
  onLogin: (profile: Partial<PlayerData>) => void;
  onAdminAccess?: () => void;
}

// Animation Variants
const cardTransition: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: -10,
    transition: { duration: 0.2 }
  }
};

const AuthView: React.FC<AuthViewProps> = ({ onLogin, onAdminAccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD'>('LOGIN');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
        try {
            // 1. Check direct session from storage/memory
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                if (mounted) await handleSessionUser(session.user);
                return; 
            }

            // 2. If no session, check if we are in a redirect flow (OAuth/MagicLink)
            const hasAuthParams = window.location.hash && (
                window.location.hash.includes('access_token') || 
                window.location.hash.includes('type=recovery') ||
                window.location.hash.includes('error_description')
            );

            if (hasAuthParams) {
                console.log("Auth params detected, waiting for auth state change...");
                // Keep loading true, let onAuthStateChange handle it
            } else {
                if (mounted) setCheckingSession(false);
            }

        } catch (e) {
            console.error("Session Check Error", e);
            if (mounted) setCheckingSession(false);
        }
    };

    checkAuth();

    // Listen for auth changes (Google Redirects, Link clicks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            if (mounted) {
                setCheckingSession(true); // Ensure loading is shown while fetching profile
                await handleSessionUser(session.user);
            }
        } else if (event === 'SIGNED_OUT') {
            if (mounted) {
                setCheckingSession(false);
                setMode('LOGIN');
            }
        }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  const handleSessionUser = async (user: any) => {
      setLoading(true);
      setError(null);
      
      try {
          // STEP 1: Attempt to fetch existing profile
          const { data: existingProfile, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();

          if (fetchError) throw fetchError;

          if (existingProfile) {
              console.log("Profile Found. Loading Data...");
              loadUserIntoApp(user, existingProfile);
          } else {
              console.log("No Profile Found. Attempting Creation...");
              // STEP 2: Profile doesn't exist (or wasn't found). Attempt INSERT.
              // We use INSERT instead of UPSERT to prevent accidental overwrites if it actually exists.
              
              const name = user.user_metadata?.full_name || fullName || 'Hunter';
              const username = user.email?.split('@')[0] || `hunter_${Date.now().toString().slice(-4)}`;
              
              const newProfile = {
                  id: user.id,
                  username: username,
                  name: name,
                  pin: '0000',
                  keys: 0,
                  raw_data: {}, // Initialize empty JSON object
                  updated_at: new Date().toISOString()
              };

              const { error: insertError } = await supabase.from('profiles').insert(newProfile);

              if (insertError) {
                  // STEP 3: Handle Race Condition
                  // If error is 23505 (Unique Violation), it means the profile DID exist but wasn't found in Step 1.
                  // This saves us from overwriting data.
                  if (insertError.code === '23505') {
                      console.log("Profile already exists (Race Condition). Fetching again...");
                      const { data: retryProfile, error: retryError } = await supabase
                          .from('profiles')
                          .select('*')
                          .eq('id', user.id)
                          .single();
                          
                      if (retryError) throw retryError;
                      loadUserIntoApp(user, retryProfile);
                  } else {
                      throw insertError;
                  }
              } else {
                  // Insert Success - Truly a new user
                  console.log("New Profile Created.");
                  loadUserIntoApp(user, newProfile); 
              }
          }
      } catch (err: any) {
          console.error("Profile Load/Create Error:", err);
          setError("Failed to load profile. Please try refreshing.");
          setLoading(false);
          setCheckingSession(false);
      }
  };

  const loadUserIntoApp = (user: any, profile: any) => {
      const playerData = profile.raw_data || {};
      
      // If creating a fresh object, ensure we don't pass an empty object that causes reset
      // registerUser in App.tsx handles merging, but we want to be safe.
      
      onLogin({
          ...playerData,
          userId: user.id,
          name: profile.name || user.user_metadata?.full_name || 'Hunter',
          username: profile.username || user.email?.split('@')[0],
          keys: profile.keys !== undefined ? profile.keys : (playerData.keys || 0)
      });
      
      // Cleanup loading state usually handled by unmount, but good practice
      if (document.body.contains(document.getElementById('root'))) {
          setLoading(false);
          setCheckingSession(false);
      }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      try {
          const { error } = await supabase.auth.signInWithPassword({
              email,
              password
          });
          if (error) throw error;
          // Session listener will handle the rest
      } catch (err: any) {
          setError(err.message || "LOGIN FAILED");
          setLoading(false);
      }
  };

  const handleSignup = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      try {
          const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                  data: {
                      full_name: fullName
                  }
              }
          });
          if (error) throw error;

          // If session exists immediately (email confirm disabled), listener handles it.
          if (!data.session && data.user) {
             // If manual confirm required but user wants seamless, warn them.
             // But usually listener fires if "Enable Email Confirmations" is OFF in Supabase.
             setError("Account created. Logging in...");
          }

      } catch (err: any) {
          setError(err.message || "SIGNUP FAILED");
          setLoading(false);
      }
  };

  const handleGoogleLogin = async () => {
      setError(null);
      setLoading(true); // Show loading immediately to prevent clicks
      try {
          const { error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                  redirectTo: window.location.origin
              }
          });
          if (error) throw error;
      } catch (err: any) {
          setError(err.message || "GOOGLE AUTH FAILED");
          setLoading(false);
      }
  };

  // If checking session/redirect, show loading screen only
  if (checkingSession) {
      return <ShadowLoading />;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-mono relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-system-accent/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-system-neon/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,210,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,210,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        
        {/* Header */}
        <AnimatePresence mode="wait">
            {mode !== 'FORGOT_PASSWORD' && (
                <motion.div 
                    key="header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center mb-8"
                >
                   <motion.div 
                     initial={{ scale: 0 }} 
                     animate={{ scale: 1 }}
                     transition={{ type: "spring", duration: 0.8 }}
                     className="inline-block p-4 bg-black/50 border border-system-border rounded-full mb-4 relative group"
                   >
                      <div className="absolute inset-0 rounded-full blur-md opacity-40 bg-system-neon" />
                      <Terminal size={32} className="text-system-neon relative z-10" />
                   </motion.div>
                   
                   <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">REFORGE</h1>
                   <p className="text-xs tracking-[0.4em] uppercase mt-2 font-bold text-system-neon">
                     AUTHENTICATION PROTOCOL
                   </p>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
            {mode === 'FORGOT_PASSWORD' ? (
                <motion.div 
                    key="forgot"
                    variants={cardTransition}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <ForgotPassword onCancel={() => setMode('LOGIN')} onSuccess={() => setMode('LOGIN')} />
                </motion.div>
            ) : (
                <motion.div 
                    key="auth-form"
                    variants={cardTransition}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-[#050505]/90 border border-system-border backdrop-blur-xl rounded-xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
                >
                    {/* Top Border Gradient */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-system-neon to-transparent opacity-70" />

                    {/* Loading Overlay */}
                    <AnimatePresence>
                        {loading && <ShadowLoading />}
                    </AnimatePresence>

                    {/* Error Banner */}
                    <AnimatePresence>
                     {error && (
                       <motion.div 
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="bg-red-950/30 border-l-2 border-system-danger text-system-danger p-3 rounded mb-6 text-xs font-bold flex items-center gap-2 overflow-hidden"
                       >
                          <AlertTriangle size={16} className="shrink-0 animate-pulse" />
                          {error}
                       </motion.div>
                     )}
                    </AnimatePresence>

                    <form onSubmit={mode === 'LOGIN' ? handleEmailLogin : handleSignup} className="space-y-5">
                        
                        {mode === 'SIGNUP' && (
                            <div>
                                <label className="text-[10px] text-system-neon uppercase tracking-widest block mb-2 font-bold">FULL NAME</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-system-neon transition-colors" size={18} />
                                    <input 
                                        type="text"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-3 pl-10 text-white focus:border-system-neon focus:shadow-[0_0_15px_rgba(0,210,255,0.2)] focus:outline-none placeholder:text-gray-800 transition-all uppercase"
                                        placeholder="HUNTER NAME"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] text-system-neon uppercase tracking-widest block mb-2 font-bold">EMAIL ADDRESS</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-system-neon transition-colors" size={18} />
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-3 pl-10 text-white focus:border-system-neon focus:shadow-[0_0_15px_rgba(0,210,255,0.2)] focus:outline-none placeholder:text-gray-800 transition-all"
                                    placeholder="HUNTER@REFORGE.IO"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] text-system-neon uppercase tracking-widest block mb-2 font-bold">PASSWORD</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-system-neon transition-colors" size={18} />
                                <input 
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-3 pl-10 text-white focus:border-system-neon focus:shadow-[0_0_15px_rgba(0,210,255,0.2)] focus:outline-none placeholder:text-gray-800 transition-all"
                                    placeholder="••••••••"
                                    minLength={6}
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-system-neon text-black font-bold font-mono rounded hover:bg-white hover:shadow-[0_0_20px_rgba(0,210,255,0.5)] transition-all flex items-center justify-center gap-2 group uppercase tracking-wider"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : (mode === 'LOGIN' ? 'LOGIN' : 'INITIATE REGISTRATION')} 
                            {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-4">
                        <div className="h-px bg-gray-800 flex-1" />
                        <span className="text-[10px] text-gray-600 font-mono">OR CONTINUE WITH</span>
                        <div className="h-px bg-gray-800 flex-1" />
                    </div>

                    <button 
                        onClick={handleGoogleLogin}
                        className="w-full py-3 bg-white text-black font-bold font-mono rounded hover:bg-gray-200 transition-all flex items-center justify-center gap-3 uppercase tracking-wider mb-4"
                    >
                        <Chrome size={18} /> GOOGLE
                    </button>

                    <div className="flex justify-between items-center pt-2">
                        <button 
                           onClick={() => setMode('FORGOT_PASSWORD')}
                           className="text-[10px] text-gray-500 hover:text-system-neon transition-colors font-mono tracking-widest"
                        >
                           FORGOT PASSWORD?
                        </button>
                        <button 
                           onClick={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
                           className="text-[10px] text-system-accent hover:text-white transition-colors font-mono tracking-widest font-bold"
                        >
                           {mode === 'LOGIN' ? 'CREATE ACCOUNT' : 'LOGIN'}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        
        {/* Footer Admin Status */}
        {mode !== 'FORGOT_PASSWORD' && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="mt-6 text-center text-[10px] text-gray-600 font-mono flex flex-col items-center gap-2"
            >
                <span>SECURE CONNECTION v2.5.0 // SHADOW PROTOCOL ENABLED</span>
                {onAdminAccess && (
                    <button 
                        onClick={onAdminAccess}
                        className="text-[9px] text-gray-500 hover:text-system-danger transition-colors tracking-widest uppercase border border-transparent hover:border-system-danger/30 px-2 py-1 rounded"
                    >
                        [ ADMIN ACCESS ]
                    </button>
                )}
            </motion.div>
        )}
      </div>
    </div>
  );
};

export default AuthView;
