import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Lock, ChevronRight, AlertTriangle, Loader2, User, Eye, ArrowRight, RefreshCcw, HelpCircle, Database, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PlayerData } from '../types';
import ForgotPassword from './ForgotPassword';

interface AuthViewProps {
  onLogin: (profile: Partial<PlayerData>) => void;
}

const PIN_SALT = "biosync-v1"; 

const SECURITY_QUESTIONS = [
    "What was the name of your first pet?",
    "In what city were you born?",
    "What is your mother's maiden name?",
    "What is the model of your first vehicle?",
    "What was the name of your childhood best friend?",
    "What is your favorite food?"
];

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  // Mode: LOGIN, AWAKENING (Register), or RECOVERY
  const [mode, setMode] = useState<'LOGIN' | 'AWAKENING' | 'RECOVERY'>('LOGIN');
  
  // Registration Form State
  const [regStep, setRegStep] = useState<number>(1); // 1: Name, 2: Codename, 3: PIN, 4: Recovery
  const [realName, setRealName] = useState('');
  const [codename, setCodename] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  // Recovery Questions State
  const [recoveryQuestions, setRecoveryQuestions] = useState([
      { question: SECURITY_QUESTIONS[0], answer: '' },
      { question: SECURITY_QUESTIONS[1], answer: '' },
      { question: SECURITY_QUESTIONS[2], answer: '' }
  ]);

  // Login State
  const [loginId, setLoginId] = useState(''); // Codename
  const [loginPin, setLoginPin] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper: Format codename
  const formatCodename = (val: string) => val.toLowerCase().replace(/[^a-z0-9]/g, '');

  const checkAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setError("CODENAME TOO SHORT (MIN 3 CHARS)");
      return false;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setError("CODENAME ALREADY IN USE");
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

  // --- REGISTRATION LOGIC ---
  const handleRegNext = async () => {
    setError(null);

    // STEP A: REAL NAME
    if (regStep === 1) {
        if (!realName.trim()) { setError("IDENTIFICATION REQUIRED"); return; }
        setRegStep(2);
    } 
    // STEP B: CODENAME
    else if (regStep === 2) {
        const handle = formatCodename(codename);
        const isAvailable = await checkAvailability(handle);
        if (isAvailable) {
            setRegStep(3);
        }
    }
    // STEP C: PIN
    else if (regStep === 3) {
        if (pin.length < 4) { setError("PIN MUST BE 4-6 DIGITS"); return; }
        if (pin !== confirmPin) { setError("PIN MISMATCH"); setPin(''); setConfirmPin(''); return; }
        setRegStep(4);
    }
    // STEP D: RECOVERY & SUBMIT
    else if (regStep === 4) {
        const isValid = recoveryQuestions.every(q => q.answer.trim().length > 0);
        if (!isValid) { setError("ALL QUESTIONS MUST BE ANSWERED"); return; }
        
        // Finalize Registration
        await finalizeRegistration();
    }
  };

  const finalizeRegistration = async () => {
      setLoading(true);
      const handle = formatCodename(codename);
      const email = `${handle}.sync@shadow-system.io`;
      const securePassword = `${pin}-${PIN_SALT}`;

      try {
          // 1. Create Auth User
          const { data, error: signUpError } = await supabase.auth.signUp({
              email,
              password: securePassword,
              options: { data: { full_name: realName, username: handle } }
          });

          if (signUpError) throw signUpError;
          const user = data.user;
          if (!user) throw new Error("USER CREATION FAILED");

          // 2. Insert Profile
          const { error: profileError } = await supabase.from('profiles').upsert({
              id: user.id,
              username: handle,
              name: realName,
              pin: pin,
              updated_at: new Date().toISOString()
          });
          if (profileError) throw profileError;

          // 3. Insert Recovery Questions (FIX: using 'answer_text')
          const { error: recoveryError } = await supabase.from('recovery_questions').insert(
              recoveryQuestions.map(q => ({
                  user_id: user.id,
                  question: q.question,
                  answer_text: q.answer.trim() // Ensure this column matches DB schema
              }))
          );
          if (recoveryError) {
              console.warn("Recovery Save Error (Non-Fatal):", recoveryError);
          }

          // Success
          onLogin({ name: realName, username: handle, pin, userId: user.id });

      } catch (err: any) {
          console.error("Registration Error:", err);
          setError(err.message || "INITIALIZATION FAILED");
      } finally {
          setLoading(false);
      }
  };

  // --- LOGIN LOGIC ---
  const handleLogin = async () => {
      setError(null);
      if (!loginId.trim()) { setError("ENTER CODENAME"); return; }
      if (loginPin.length < 4) { setError("INVALID PIN"); return; }

      setLoading(true);
      const handle = formatCodename(loginId);
      const email = `${handle}.sync@shadow-system.io`;
      const securePassword = `${loginPin}-${PIN_SALT}`;

      try {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password: securePassword
          });

          if (signInError) throw new Error("INCORRECT CREDENTIALS");
          
          const user = data.user;
          if (user) {
              // Fetch full profile
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
              
              if (profile) onLogin(profile);
              else onLogin({ name: handle, username: handle, userId: user.id });
          }
      } catch (err: any) {
          setError(err.message || "ACCESS DENIED");
          setLoginPin('');
      } finally {
          setLoading(false);
      }
  };

  // --- RENDER ---
  if (mode === 'RECOVERY') {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center p-6 font-mono relative overflow-hidden">
             <div className="relative z-10 w-full max-w-md">
                 <ForgotPassword 
                    onCancel={() => { setMode('LOGIN'); setError(null); }}
                    onSuccess={() => { setMode('LOGIN'); setError('PIN RESET SUCCESSFUL. PLEASE LOG IN.'); }}
                 />
             </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-mono relative overflow-hidden">
      {/* Background Ambience */}
      <AnimatePresence>
        {loading && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-system-accent/10 z-0 pointer-events-none"
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
             {mode === 'AWAKENING' ? 'PROTOCOL: NEW USER' : 'PROTOCOL: LOGIN'}
           </p>
        </div>

        {/* Card */}
        <div className="bg-system-card border border-system-border rounded-xl p-8 shadow-2xl relative overflow-hidden">
            
            {/* Error Banner */}
            <AnimatePresence>
             {error && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className={`border p-3 rounded mb-6 text-xs font-bold flex items-center gap-2 overflow-hidden ${error.includes("SUCCESS") ? "bg-system-success/20 border-system-success/50 text-system-success" : "bg-system-danger/20 border-system-danger/50 text-system-danger"}`}
               >
                  <AlertTriangle size={16} className="shrink-0" />
                  {error}
               </motion.div>
             )}
            </AnimatePresence>

            {/* --- AWAKENING FLOW --- */}
            {mode === 'AWAKENING' && (
                <div className="space-y-6">
                    {/* Progress Bar */}
                    <div className="flex gap-1 mb-4">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className={`h-1 flex-1 rounded ${s <= regStep ? 'bg-system-accent' : 'bg-gray-800'}`} />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {/* STEP A: NAME */}
                        {regStep === 1 && (
                            <motion.div key="reg1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">REAL NAME</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-gray-600" size={18} />
                                    <input 
                                        value={realName}
                                        onChange={e => setRealName(e.target.value)}
                                        className="w-full bg-black border border-system-border rounded p-3 pl-10 text-white focus:border-system-accent focus:outline-none uppercase"
                                        placeholder="JIN-WOO SUNG"
                                        autoFocus
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* STEP B: CODENAME */}
                        {regStep === 2 && (
                            <motion.div key="reg2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">DESIRED CODENAME</label>
                                <div className="relative">
                                    <Eye className="absolute left-3 top-3 text-gray-600" size={18} />
                                    <input 
                                        value={codename}
                                        onChange={e => setCodename(formatCodename(e.target.value))}
                                        className="w-full bg-black border border-system-border rounded p-3 pl-10 text-white focus:border-system-accent focus:outline-none uppercase font-bold"
                                        placeholder="SHADOW_MONARCH"
                                        autoFocus
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* STEP C: PIN */}
                        {regStep === 3 && (
                            <motion.div key="reg3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">CREATE 4-DIGIT PIN</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 text-gray-600" size={18} />
                                        <input 
                                            type="password"
                                            maxLength={6}
                                            value={pin}
                                            onChange={e => { if (/^\d*$/.test(e.target.value)) setPin(e.target.value); }}
                                            className="w-full bg-black border border-system-border rounded p-3 pl-10 text-white text-xl tracking-[0.5em] focus:border-system-accent focus:outline-none"
                                            placeholder="••••"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">CONFIRM PIN</label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-3 text-gray-600" size={18} />
                                        <input 
                                            type="password"
                                            maxLength={6}
                                            value={confirmPin}
                                            onChange={e => { if (/^\d*$/.test(e.target.value)) setConfirmPin(e.target.value); }}
                                            className="w-full bg-black border border-system-border rounded p-3 pl-10 text-white text-xl tracking-[0.5em] focus:border-system-accent focus:outline-none"
                                            placeholder="••••"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP D: RECOVERY */}
                        {regStep === 4 && (
                            <motion.div key="reg4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                                <div className="text-xs text-gray-500 mb-2 font-mono flex items-center gap-2">
                                     <Database size={14} /> RECOVERY PROTOCOL (3 Q/A)
                                </div>
                                {recoveryQuestions.map((q, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <select 
                                           value={q.question}
                                           onChange={e => {
                                               const newQ = [...recoveryQuestions];
                                               newQ[idx].question = e.target.value;
                                               setRecoveryQuestions(newQ);
                                           }}
                                           className="w-full bg-black border border-system-border rounded p-2 text-[10px] text-gray-400 focus:border-system-accent outline-none"
                                        >
                                            {SECURITY_QUESTIONS.map(option => (
                                                <option key={option} value={option} disabled={recoveryQuestions.some((rq, i) => i !== idx && rq.question === option)}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                        <input 
                                           value={q.answer}
                                           onChange={e => {
                                               const newQ = [...recoveryQuestions];
                                               newQ[idx].answer = e.target.value;
                                               setRecoveryQuestions(newQ);
                                           }}
                                           placeholder="Answer..."
                                           className="w-full bg-black/50 border border-system-border rounded p-2 text-sm text-white focus:border-system-accent outline-none"
                                        />
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button 
                        onClick={handleRegNext}
                        disabled={loading}
                        className="w-full py-3 bg-system-accent text-black font-bold font-mono rounded hover:bg-white transition-colors flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (regStep === 4 ? 'INITIALIZE SYSTEM' : 'NEXT STEP')} 
                        {!loading && <ArrowRight size={16} />}
                    </button>
                </div>
            )}

            {/* --- LOGIN FLOW --- */}
            {mode === 'LOGIN' && (
                <div className="space-y-5">
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">CODENAME</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-gray-600" size={18} />
                            <input 
                                value={loginId}
                                onChange={e => setLoginId(formatCodename(e.target.value))}
                                className="w-full bg-black border border-system-border rounded p-3 pl-10 text-white focus:border-system-neon focus:outline-none uppercase font-bold"
                                placeholder="SHADOW_MONARCH"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">ACCESS KEY (PIN)</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-3 text-gray-600" size={18} />
                            <input 
                                type="password"
                                maxLength={6}
                                value={loginPin}
                                onChange={e => { if (/^\d*$/.test(e.target.value)) setLoginPin(e.target.value); }}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                className="w-full bg-black border border-system-border rounded p-3 pl-10 text-white text-xl tracking-[0.5em] focus:border-system-neon focus:outline-none"
                                placeholder="••••"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleLogin}
                        disabled={loading || !loginId || loginPin.length < 4}
                        className="w-full py-3 bg-system-neon text-black font-bold font-mono rounded hover:bg-white transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'ACCESS SYSTEM'}
                    </button>

                    <div className="text-center">
                        <button 
                           onClick={() => setMode('RECOVERY')}
                           className="text-[10px] text-gray-600 hover:text-system-danger transition-colors font-mono"
                        >
                           FORGOT PASSKEY?
                        </button>
                    </div>
                </div>
            )}

            {/* Mode Switcher */}
            <div className="mt-6 pt-6 border-t border-gray-900 text-center">
                <button 
                   onClick={() => {
                       setMode(prev => prev === 'LOGIN' ? 'AWAKENING' : 'LOGIN');
                       setRegStep(1);
                       setError(null);
                       setPin('');
                       setConfirmPin('');
                       setLoginPin('');
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