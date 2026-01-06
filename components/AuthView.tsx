
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Lock, AlertTriangle, User, Eye, ArrowRight, Database, Key, Cpu } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PlayerData } from '../types';
import ForgotPassword from './ForgotPassword';
import ShadowLoading from './ShadowLoading';

interface AuthViewProps {
  onLogin: (profile: Partial<PlayerData>) => void;
  onAdminAccess?: () => void;
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

// Glitch transition variants
const glitchVariants = {
  hidden: { opacity: 0, x: -20, skewX: 10 },
  visible: { 
    opacity: 1, 
    x: 0, 
    skewX: 0,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  },
  exit: { 
    opacity: 0, 
    x: 20, 
    skewX: -10,
    transition: { duration: 0.2 }
  }
};

const AuthView: React.FC<AuthViewProps> = ({ onLogin, onAdminAccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'AWAKENING' | 'RECOVERY'>('LOGIN');
  
  const [regStep, setRegStep] = useState<number>(1);
  const [realName, setRealName] = useState('');
  const [codename, setCodename] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const [recoveryQuestions, setRecoveryQuestions] = useState([
      { question: SECURITY_QUESTIONS[0], answer: '' },
      { question: SECURITY_QUESTIONS[1], answer: '' },
      { question: SECURITY_QUESTIONS[2], answer: '' }
  ]);

  const [loginId, setLoginId] = useState('');
  const [loginPin, setLoginPin] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleRegNext = async () => {
    setError(null);
    if (regStep === 1) {
        if (!realName.trim()) { setError("IDENTIFICATION REQUIRED"); return; }
        setRegStep(2);
    } else if (regStep === 2) {
        const handle = formatCodename(codename);
        const isAvailable = await checkAvailability(handle);
        if (isAvailable) {
            setRegStep(3);
        }
    } else if (regStep === 3) {
        if (pin.length < 4) { setError("PIN MUST BE 4-6 DIGITS"); return; }
        if (pin !== confirmPin) { setError("PIN MISMATCH"); setPin(''); setConfirmPin(''); return; }
        setRegStep(4);
    } else if (regStep === 4) {
        const isValid = recoveryQuestions.every(q => q.answer.trim().length > 0);
        if (!isValid) { setError("ALL QUESTIONS MUST BE ANSWERED"); return; }
        await finalizeRegistration();
    }
  };

  const finalizeRegistration = async () => {
      setLoading(true);
      const handle = formatCodename(codename);
      const email = `${handle}.sync@shadow-system.io`;
      const securePassword = `${pin}-${PIN_SALT}`;

      try {
          const { data, error: signUpError } = await supabase.auth.signUp({
              email,
              password: securePassword,
              options: { data: { full_name: realName, username: handle } }
          });

          if (signUpError) throw signUpError;
          const user = data.user;
          if (!user) throw new Error("USER CREATION FAILED");

          const { error: profileError } = await supabase.from('profiles').upsert({
              id: user.id,
              username: handle,
              name: realName,
              pin: pin,
              updated_at: new Date().toISOString()
          });
          if (profileError) throw profileError;

          const { error: recoveryError } = await supabase.from('recovery_questions').insert(
              recoveryQuestions.map(q => ({
                  user_id: user.id,
                  question: q.question,
                  answer_text: q.answer.trim()
              }))
          );
          if (recoveryError) console.warn("Recovery Save Error:", recoveryError);

          onLogin({ name: realName, username: handle, pin, userId: user.id });

      } catch (err: any) {
          console.error("Registration Error:", err);
          setError(err.message || "INITIALIZATION FAILED");
      } finally {
          setLoading(false);
      }
  };

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

  if (mode === 'RECOVERY') {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center p-6 font-mono relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
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
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-system-accent/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-system-neon/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,210,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,210,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        
        {/* Header Logo */}
        <div className="text-center mb-8">
           <motion.div 
             initial={{ scale: 0 }} 
             animate={{ scale: 1 }}
             transition={{ type: "spring", duration: 0.8 }}
             className="inline-block p-4 bg-black/50 border border-system-border rounded-full mb-4 relative group"
           >
              <div className={`absolute inset-0 rounded-full blur-md opacity-40 ${mode === 'AWAKENING' ? 'bg-system-accent' : 'bg-system-neon'}`} />
              <Terminal size={32} className={`relative z-10 ${mode === 'AWAKENING' ? 'text-system-accent' : 'text-system-neon'}`} />
           </motion.div>
           
           <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">BIO-SYNC OS</h1>
           <p className={`text-xs tracking-[0.4em] uppercase mt-2 font-bold transition-colors ${mode === 'AWAKENING' ? 'text-system-accent' : 'text-system-neon'}`}>
             {mode === 'AWAKENING' ? 'PROTOCOL: AWAKENING' : 'PROTOCOL: ACCESS'}
           </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#050505]/90 border border-system-border backdrop-blur-xl rounded-xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            
            {/* Top Border Gradient */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${mode === 'AWAKENING' ? 'system-accent' : 'system-neon'} to-transparent opacity-70`} />

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
                 className={`border-l-2 p-3 rounded mb-6 text-xs font-bold flex items-center gap-2 overflow-hidden bg-black/50 ${error.includes("SUCCESS") ? "border-system-success text-system-success" : "border-system-danger text-system-danger"}`}
               >
                  <AlertTriangle size={16} className="shrink-0 animate-pulse" />
                  {error}
               </motion.div>
             )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
            {/* --- AWAKENING FLOW --- */}
            {mode === 'AWAKENING' && (
                <motion.div key="awakening-container" variants={glitchVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                    {/* Progress Bar */}
                    <div className="flex gap-1 mb-4">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className={`h-1 flex-1 rounded-sm ${s <= regStep ? 'bg-system-accent shadow-[0_0_5px_#8b5cf6]' : 'bg-gray-900'}`} />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {/* STEP A: NAME */}
                        {regStep === 1 && (
                            <motion.div key="reg1" variants={glitchVariants} initial="hidden" animate="visible" exit="exit">
                                <label className="text-[10px] text-system-accent uppercase tracking-widest block mb-2 font-bold">REAL NAME IDENTIFICATION</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-system-accent transition-colors" size={18} />
                                    <input 
                                        value={realName}
                                        onChange={e => setRealName(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-3 pl-10 text-white focus:border-system-accent focus:shadow-[0_0_15px_rgba(139,92,246,0.2)] focus:outline-none uppercase placeholder:text-gray-800 transition-all"
                                        placeholder="JIN-WOO SUNG"
                                        autoFocus
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* STEP B: CODENAME */}
                        {regStep === 2 && (
                            <motion.div key="reg2" variants={glitchVariants} initial="hidden" animate="visible" exit="exit">
                                <label className="text-[10px] text-system-accent uppercase tracking-widest block mb-2 font-bold">DESIRED CODENAME</label>
                                <div className="relative group">
                                    <Eye className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-system-accent transition-colors" size={18} />
                                    <input 
                                        value={codename}
                                        onChange={e => setCodename(formatCodename(e.target.value))}
                                        className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-3 pl-10 text-white focus:border-system-accent focus:shadow-[0_0_15px_rgba(139,92,246,0.2)] focus:outline-none uppercase font-bold placeholder:text-gray-800 transition-all"
                                        placeholder="SHADOW_MONARCH"
                                        autoFocus
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* STEP C: PIN */}
                        {regStep === 3 && (
                            <motion.div key="reg3" variants={glitchVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-system-accent uppercase tracking-widest block mb-2 font-bold">CREATE 4-DIGIT PASSKEY</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-system-accent transition-colors" size={18} />
                                        <input 
                                            type="password"
                                            maxLength={6}
                                            value={pin}
                                            onChange={e => { if (/^\d*$/.test(e.target.value)) setPin(e.target.value); }}
                                            className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-3 pl-10 text-white text-xl tracking-[0.5em] focus:border-system-accent focus:shadow-[0_0_15px_rgba(139,92,246,0.2)] focus:outline-none transition-all placeholder:text-gray-800"
                                            placeholder="••••"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2 font-bold">CONFIRM PASSKEY</label>
                                    <div className="relative group">
                                        <Shield className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-system-accent transition-colors" size={18} />
                                        <input 
                                            type="password"
                                            maxLength={6}
                                            value={confirmPin}
                                            onChange={e => { if (/^\d*$/.test(e.target.value)) setConfirmPin(e.target.value); }}
                                            className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-3 pl-10 text-white text-xl tracking-[0.5em] focus:border-system-accent focus:shadow-[0_0_15px_rgba(139,92,246,0.2)] focus:outline-none transition-all placeholder:text-gray-800"
                                            placeholder="••••"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP D: RECOVERY */}
                        {regStep === 4 && (
                            <motion.div key="reg4" variants={glitchVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                                <div className="text-xs text-gray-500 mb-2 font-mono flex items-center gap-2 border-b border-gray-800 pb-2">
                                     <Database size={14} className="text-system-accent" /> RECOVERY PROTOCOL (3 Q/A)
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
                                           className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2 text-[10px] text-gray-400 focus:border-system-accent outline-none"
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
                                           className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2 text-sm text-white focus:border-system-accent focus:shadow-[0_0_10px_rgba(139,92,246,0.1)] outline-none"
                                        />
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button 
                        onClick={handleRegNext}
                        disabled={loading}
                        className="w-full py-3 bg-system-accent/10 border border-system-accent/50 text-system-accent font-bold font-mono rounded hover:bg-system-accent hover:text-black hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all flex items-center justify-center gap-2 mt-4 group"
                    >
                        {regStep === 4 ? 'INITIALIZE SYSTEM' : 'NEXT STEP'} 
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            )}

            {/* --- LOGIN FLOW --- */}
            {mode === 'LOGIN' && (
                <motion.div key="login-container" variants={glitchVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                    <div>
                        <label className="text-[10px] text-system-neon uppercase tracking-widest block mb-2 font-bold">CODENAME</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-system-neon transition-colors" size={18} />
                            <input 
                                value={loginId}
                                onChange={e => setLoginId(formatCodename(e.target.value))}
                                className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-3 pl-10 text-white focus:border-system-neon focus:shadow-[0_0_15px_rgba(0,210,255,0.2)] focus:outline-none uppercase font-bold placeholder:text-gray-800 transition-all"
                                placeholder="SHADOW_MONARCH"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-system-neon uppercase tracking-widest block mb-2 font-bold">ACCESS KEY</label>
                        <div className="relative group">
                            <Key className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-system-neon transition-colors" size={18} />
                            <input 
                                type="password"
                                maxLength={6}
                                value={loginPin}
                                onChange={e => { if (/^\d*$/.test(e.target.value)) setLoginPin(e.target.value); }}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-3 pl-10 text-white text-xl tracking-[0.5em] focus:border-system-neon focus:shadow-[0_0_15px_rgba(0,210,255,0.2)] focus:outline-none transition-all placeholder:text-gray-800"
                                placeholder="••••"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleLogin}
                        disabled={loading || !loginId || loginPin.length < 4}
                        className="w-full py-3 bg-system-neon/10 border border-system-neon/50 text-system-neon font-bold font-mono rounded hover:bg-system-neon hover:text-black hover:shadow-[0_0_20px_rgba(0,210,255,0.5)] transition-all flex items-center justify-center gap-2 group"
                    >
                        <Cpu size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                        ACCESS SYSTEM
                    </button>

                    <div className="text-center pt-2">
                        <button 
                           onClick={() => setMode('RECOVERY')}
                           className="text-[10px] text-gray-600 hover:text-system-danger transition-colors font-mono tracking-widest"
                        >
                           FORGOT PASSKEY?
                        </button>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* Mode Switcher */}
            <div className="mt-8 pt-6 border-t border-gray-900 text-center">
                <button 
                   onClick={() => {
                       setMode(prev => prev === 'LOGIN' ? 'AWAKENING' : 'LOGIN');
                       setRegStep(1);
                       setError(null);
                       setPin('');
                       setConfirmPin('');
                       setLoginPin('');
                   }}
                   className="text-xs font-mono text-gray-500 hover:text-white transition-colors tracking-wider"
                >
                    {mode === 'LOGIN' ? 'NEW USER? [ INITIATE AWAKENING ]' : 'RETURNING USER? [ SYSTEM LOGIN ]'}
                </button>
            </div>
        </div>
        
        <div className="mt-6 text-center text-[10px] text-gray-800 font-mono flex flex-col items-center gap-2">
            <span>SECURE CONNECTION v2.0.1 // SHADOW PROTOCOL ENABLED</span>
            {onAdminAccess && (
                <button 
                    onClick={onAdminAccess}
                    className="text-[9px] text-gray-900 hover:text-system-danger transition-colors opacity-50 hover:opacity-100 tracking-widest uppercase"
                >
                    [ ADMIN ACCESS ]
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
