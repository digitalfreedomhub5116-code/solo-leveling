import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Lock, ChevronRight, AlertTriangle, Loader2, User, Eye, ArrowRight, RefreshCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PlayerData } from '../types';

interface AuthViewProps {
  onLogin: (profile: Partial<PlayerData>) => void;
}

const PIN_SALT = "biosync-v1"; 

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  // Mode: LOGIN or AWAKENING (Register)
  const [mode, setMode] = useState<'LOGIN' | 'AWAKENING'>('LOGIN');
  
  // Form State
  const [realName, setRealName] = useState('');
  const [codename, setCodename] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  // UI State
  const [step, setStep] = useState<number>(1); // 1: Identity, 2: Security
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper: Format codename
  const formatCodename = (val: string) => val.toLowerCase().replace(/[^a-z0-9]/g, '');

  const checkAvailability = async () => {
    if (!codename || codename.length < 3) {
      setError("CODENAME TOO SHORT (MIN 3 CHARS)");
      return false;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', codename)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setError("CODENAME ALREADY TAKEN");
        setLoading(false);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Availability Check Error:", err);
      setError("CONNECTION ERROR");
      setLoading(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    setError(null);
    if (mode === 'AWAKENING') {
        if (!realName.trim()) { setError("REAL NAME REQUIRED"); return; }
        if (!codename.trim()) { setError("CODENAME REQUIRED"); return; }
        
        const available = await checkAvailability();
        if (available) {
            setStep(2);
        }
    } else {
        // Login flow just goes to PIN if codename is entered
        if (!codename.trim()) { setError("ENTER CODENAME"); return; }
        setStep(2);
    }
  };

  const handleAuth = async () => {
    setError(null);
    const handle = formatCodename(codename);
    
    // Validation
    if (pin.length < 4) {
        setError("ACCESS KEY MUST BE 4-6 DIGITS");
        return;
    }

    if (mode === 'AWAKENING') {
        if (pin !== confirmPin) {
            setError("ACCESS KEYS DO NOT MATCH");
            setPin('');
            setConfirmPin('');
            return;
        }
    }

    // Shadow Identity Protocol
    const email = `${handle}.sync@shadow-system.io`;
    const securePassword = `${pin}-${PIN_SALT}`;

    setLoading(true);

    try {
        let user = null;

        if (mode === 'AWAKENING') {
            // REGISTER
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password: securePassword,
                options: { data: { full_name: realName, username: handle } }
            });

            if (signUpError) {
                const msg = signUpError.message || "";
                if (msg.includes("already registered")) {
                    setError("CODENAME ALREADY TAKEN");
                } else {
                    console.error("SignUp Error:", JSON.stringify(signUpError));
                    throw new Error(msg);
                }
                setLoading(false);
                return;
            }
            
            user = data.user;

            // Upsert Profile (Safer than Insert for retries)
            if (user) {
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: user.id,
                    username: handle,
                    name: realName,
                    pin: pin,
                    updated_at: new Date().toISOString()
                });
                
                if (profileError) {
                   console.error("Profile Upsert Error:", JSON.stringify(profileError));
                   throw new Error(`PROFILE ERROR: ${profileError.message || JSON.stringify(profileError)}`);
                }
            }

        } else {
            // LOGIN
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password: securePassword
            });

            if (signInError) {
                console.error("SignIn Error:", JSON.stringify(signInError));
                // Check specifically for invalid login credentials
                if (signInError.message && (signInError.message.includes("Invalid login") || signInError.message.includes("Invalid credentials"))) {
                    throw new Error("INCORRECT ACCESS KEY");
                }
                throw new Error(signInError.message);
            }
            user = data.user;

            // Secondary Verification (DB PIN Check)
            if (user) {
                const { data: profileCheck, error: profileCheckError } = await supabase
                    .from('profiles')
                    .select('pin')
                    .eq('id', user.id)
                    .single();

                if (profileCheckError) {
                    console.error("Profile Check Error:", JSON.stringify(profileCheckError));
                    // If profile doesn't exist but user does (rare), treat as auth error or corrupted state
                    throw new Error("PROFILE DATA CORRUPTED");
                }
                
                if (profileCheck && profileCheck.pin !== pin) {
                    await supabase.auth.signOut();
                    throw new Error("INCORRECT ACCESS KEY");
                }
            }
        }

        // Success - Fetch full profile and callback
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            
            if (profile) {
                onLogin(profile);
            } else {
                // Fallback for immediate register
                onLogin({ name: realName || handle, username: handle, pin, userId: user.id });
            }
        }

    } catch (err: any) {
        const errString = typeof err === 'object' ? (err.message || JSON.stringify(err)) : String(err);
        console.error("Auth Transaction Failed:", errString);
        
        let msg = "UNAUTHORIZED ACCESS DETECTED";
        const lowerErr = errString.toLowerCase();

        if (lowerErr.includes("incorrect access key")) msg = "INCORRECT ACCESS KEY";
        else if (lowerErr.includes("profile error")) msg = "SYSTEM ERROR: PROFILE SYNC";
        else if (lowerErr.includes("corrupted")) msg = "SYSTEM ERROR: DATA CORRUPT";
        else if (lowerErr.includes("rate limit")) msg = "TOO MANY ATTEMPTS. STANDBY.";

        setError(msg);
        setPin('');
        setConfirmPin('');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-mono relative overflow-hidden">
      {/* Dynamic Background */}
      <AnimatePresence>
        {loading && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-system-accent/10 z-0"
             >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 animate-pulse" />
             </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
           <motion.div 
             initial={{ scale: 0 }} 
             animate={{ scale: 1 }}
             className="inline-block p-4 bg-system-card border border-system-border rounded-full mb-4 relative group"
           >
              <Terminal size={32} className={`relative z-10 transition-colors ${mode === 'AWAKENING' ? 'text-system-accent' : 'text-system-neon'}`} />
              {loading && <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${mode === 'AWAKENING' ? 'bg-system-accent' : 'bg-system-neon'}`} />}
           </motion.div>
           
           <h1 className="text-3xl font-bold text-white tracking-tighter">BIO-SYNC OS</h1>
           <p className={`text-xs tracking-[0.3em] uppercase mt-1 transition-colors ${mode === 'AWAKENING' ? 'text-system-accent' : 'text-system-neon'}`}>
             {mode === 'AWAKENING' ? 'PROTOCOL: AWAKENING' : 'PROTOCOL: LOGIN'}
           </p>
        </div>

        {/* Card */}
        <div className="bg-system-card border border-system-border rounded-xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20" />

            {/* Error Banner */}
            <AnimatePresence>
             {error && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="bg-system-danger/20 border border-system-danger/50 text-system-danger p-3 rounded mb-6 text-xs font-bold flex items-center gap-2 overflow-hidden"
               >
                  <AlertTriangle size={16} className="shrink-0" />
                  {error}
               </motion.div>
             )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {/* STEP 1: IDENTITY */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-5"
                    >
                        {mode === 'AWAKENING' && (
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Real Name</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-3 text-gray-600 group-focus-within:text-system-accent" size={18} />
                                    <input 
                                        value={realName}
                                        onChange={e => setRealName(e.target.value)}
                                        placeholder="JIN-WOO SUNG"
                                        className="w-full bg-black border border-system-border rounded p-3 pl-10 text-white focus:border-system-accent focus:outline-none uppercase"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">
                                {mode === 'AWAKENING' ? 'Desired Codename' : 'Codename'}
                            </label>
                            <div className="relative group">
                                <Eye className={`absolute left-3 top-3 text-gray-600 group-focus-within:${mode === 'AWAKENING' ? 'text-system-accent' : 'text-system-neon'}`} size={18} />
                                <input 
                                    value={codename}
                                    onChange={e => setCodename(formatCodename(e.target.value))}
                                    onKeyDown={e => e.key === 'Enter' && handleNextStep()}
                                    placeholder="SHADOW_MONARCH"
                                    className={`w-full bg-black border border-system-border rounded p-3 pl-10 text-white focus:outline-none uppercase font-bold tracking-wider transition-colors ${mode === 'AWAKENING' ? 'focus:border-system-accent' : 'focus:border-system-neon'}`}
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleNextStep}
                            disabled={loading || !codename}
                            className={`w-full py-3 rounded font-bold text-black flex items-center justify-center gap-2 transition-all ${mode === 'AWAKENING' ? 'bg-system-accent hover:bg-white' : 'bg-system-neon hover:bg-white'}`}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>NEXT <ChevronRight size={16} /></>}
                        </button>
                    </motion.div>
                )}

                {/* STEP 2: SECURITY */}
                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                             <span className="text-xs text-gray-500">IDENTITY: <span className="text-white font-bold">{formatCodename(codename).toUpperCase()}</span></span>
                             <button onClick={() => { setStep(1); setError(null); }} className="text-[10px] text-gray-600 hover:text-white flex items-center gap-1">
                                <RefreshCcw size={10} /> CHANGE
                             </button>
                        </div>

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">
                                {mode === 'AWAKENING' ? 'Create Access Key (PIN)' : 'Enter Access Key'}
                            </label>
                            <div className="relative group">
                                <Lock className={`absolute left-3 top-3 text-gray-600 group-focus-within:${mode === 'AWAKENING' ? 'text-system-accent' : 'text-system-neon'}`} size={18} />
                                <input 
                                    type="password"
                                    maxLength={6}
                                    value={pin}
                                    onChange={e => { if (/^\d*$/.test(e.target.value)) setPin(e.target.value); }}
                                    onKeyDown={e => e.key === 'Enter' && (mode === 'LOGIN' ? handleAuth() : null)}
                                    placeholder="••••"
                                    className={`w-full bg-black border border-system-border rounded p-3 pl-10 text-white text-xl tracking-[0.5em] focus:outline-none transition-colors ${mode === 'AWAKENING' ? 'focus:border-system-accent' : 'focus:border-system-neon'}`}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {mode === 'AWAKENING' && (
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Confirm Access Key</label>
                                <div className="relative group">
                                    <Shield className="absolute left-3 top-3 text-gray-600 group-focus-within:text-system-accent" size={18} />
                                    <input 
                                        type="password"
                                        maxLength={6}
                                        value={confirmPin}
                                        onChange={e => { if (/^\d*$/.test(e.target.value)) setConfirmPin(e.target.value); }}
                                        onKeyDown={e => e.key === 'Enter' && handleAuth()}
                                        placeholder="••••"
                                        className="w-full bg-black border border-system-border rounded p-3 pl-10 text-white text-xl tracking-[0.5em] focus:border-system-accent focus:outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={handleAuth}
                            disabled={loading || pin.length < 4}
                            className={`w-full py-3 rounded font-bold text-black flex items-center justify-center gap-2 transition-all ${mode === 'AWAKENING' ? 'bg-system-accent hover:bg-white' : 'bg-system-neon hover:bg-white'}`}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>{mode === 'AWAKENING' ? 'INITIALIZE SYSTEM' : 'ACCESS SYSTEM'} <ArrowRight size={16} /></>}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mode Toggle */}
            <div className="mt-6 pt-6 border-t border-gray-900 text-center">
                <button 
                   onClick={() => {
                       setMode(prev => prev === 'LOGIN' ? 'AWAKENING' : 'LOGIN');
                       setStep(1);
                       setError(null);
                       setPin('');
                       setConfirmPin('');
                   }}
                   className="text-xs font-mono text-gray-500 hover:text-white transition-colors"
                >
                    {mode === 'LOGIN' ? 'NEW USER? [ INITIATE AWAKENING ]' : 'RETURNING USER? [ SYSTEM LOGIN ]'}
                </button>
            </div>
        </div>
        
        <div className="mt-6 text-center text-[10px] text-gray-700 font-mono">
            SECURE CONNECTION v2.0.1 // SHADOW PROTOCOL ENABLED
        </div>
      </div>
    </div>
  );
};

export default AuthView;