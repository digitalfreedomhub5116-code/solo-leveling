import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Lock, CheckCircle, ArrowRight, X, ScanFace, Database, AlertTriangle, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ShadowLoading from './ShadowLoading';

interface ForgotPasswordProps {
  onCancel: () => void;
  onSuccess: () => void;
}

interface RecoveryQuestion {
  id: string;
  question: string;
  answer_text: string;
}

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

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onCancel, onSuccess }) => {
  const [step, setStep] = useState<'IDENTITY' | 'VERIFICATION' | 'RESET'>('IDENTITY');
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<RecoveryQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [newPin, setNewPin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIdentitySearch = async () => {
    if (!username.trim()) {
        setError("ENTER CODENAME TO INITIATE SEARCH");
        return;
    }
    setLoading(true);
    setError(null);

    try {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username.toLowerCase().trim())
            .single();

        if (profileError || !profile) {
            throw new Error("USER NOT FOUND");
        }

        setUserId(profile.id);

        const { data: qData, error: qError } = await supabase
            .from('recovery_questions')
            .select('*')
            .eq('user_id', profile.id);

        if (qError || !qData || qData.length === 0) {
            throw new Error("NO RECOVERY DATA FOUND");
        }

        setQuestions(qData);
        setStep('VERIFICATION');
    } catch (err: any) {
        console.error("Identity Search Error:", JSON.stringify(err));
        setError("IDENTITY VERIFICATION FAILED. ACCESS DENIED.");
    } finally {
        setLoading(false);
    }
  };

  const handleVerification = () => {
    setLoading(true);
    setError(null);

    setTimeout(() => {
        let correctCount = 0;
        
        questions.forEach((q, index) => {
            const userAnswer = answers[index]?.toLowerCase().trim();
            const dbAnswer = q.answer_text.toLowerCase().trim();
            if (userAnswer === dbAnswer) {
                correctCount++;
            }
        });

        if (correctCount >= 2) {
            setStep('RESET');
        } else {
            setError(`VERIFICATION FAILED. ${correctCount}/3 MATCHES. 2 REQUIRED.`);
        }
        setLoading(false);
    }, 1500); 
  };

  const handleReset = async () => {
    if (!newPin || newPin.length < 4) {
        setError("INVALID PIN FORMAT");
        return;
    }
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ pin: newPin })
            .eq('id', userId);

        if (error) throw error;

        setTimeout(() => {
            onSuccess();
        }, 1000);
    } catch (err) {
        console.error("Reset Error:", JSON.stringify(err));
        setError("SYSTEM WRITE ERROR");
        setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#050505]/90 border border-system-danger/30 backdrop-blur-xl rounded-xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.2)]">
       {/* Background Animation */}
       <div className="absolute inset-0 bg-system-danger/5 pointer-events-none" />
       
       {/* Loading Overlay */}
       <AnimatePresence>
          {loading && <ShadowLoading />}
       </AnimatePresence>

       <div className="relative z-10">
          <div className="flex justify-between items-start mb-6 border-b border-system-border pb-4">
             <div>
                <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                    <ShieldAlert className="text-system-danger animate-pulse" size={20} />
                    RECOVERY MODE
                </h2>
                <p className="text-[10px] text-system-danger/70 font-mono tracking-widest mt-1">
                    PROTOCOL: MEMORY RECONSTRUCTION
                </p>
             </div>
             <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
             </button>
          </div>

          <AnimatePresence mode="wait">
            {error && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="bg-black/50 border-l-2 border-system-danger text-system-danger p-3 rounded mb-4 text-xs font-mono flex items-center gap-2"
               >
                 <AlertTriangle size={14} /> {error}
               </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* STEP 1: FIND USER */}
            {step === 'IDENTITY' && (
                <motion.div
                   key="identity"
                   variants={glitchVariants}
                   initial="hidden"
                   animate="visible"
                   exit="exit"
                   className="space-y-4"
                >
                   <div>
                      <label className="text-[10px] text-system-danger font-mono tracking-widest block mb-2 font-bold">TARGET CODENAME</label>
                      <div className="relative group">
                         <ScanFace className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-system-danger transition-colors" size={18} />
                         <input 
                            value={username}
                            onChange={e => setUsername(e.target.value.toUpperCase())}
                            className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-3 pl-10 text-white font-mono focus:border-system-danger focus:shadow-[0_0_15px_rgba(220,38,38,0.2)] focus:outline-none uppercase placeholder:text-gray-800 transition-all"
                            placeholder="ENTER USERNAME"
                         />
                      </div>
                   </div>
                   <button 
                      onClick={handleIdentitySearch}
                      className="w-full py-3 bg-system-danger/10 border border-system-danger/50 text-system-danger font-bold font-mono rounded hover:bg-system-danger hover:text-black hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all flex items-center justify-center gap-2 group"
                   >
                      INITIATE SCAN <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </motion.div>
            )}

            {/* STEP 2: QUESTIONS */}
            {step === 'VERIFICATION' && (
                <motion.div
                   key="verification"
                   variants={glitchVariants}
                   initial="hidden"
                   animate="visible"
                   exit="exit"
                   className="space-y-4"
                >
                   <div className="text-[10px] text-gray-500 font-mono mb-2 flex items-center gap-2">
                       <Database size={12} className="text-system-danger" /> 
                       ANSWER 2 OF 3 SECURITY QUESTIONS
                   </div>
                   
                   {questions.map((q, idx) => (
                      <div key={q.id}>
                         <label className="text-[10px] text-system-danger/80 font-mono block mb-1 truncate">{q.question}</label>
                         <input 
                            value={answers[idx]}
                            onChange={e => {
                                const newAnswers = [...answers];
                                newAnswers[idx] = e.target.value;
                                setAnswers(newAnswers);
                            }}
                            className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2 text-sm text-white font-mono focus:border-system-danger focus:shadow-[0_0_10px_rgba(220,38,38,0.15)] focus:outline-none transition-all placeholder:text-gray-800"
                            placeholder="Enter answer..."
                         />
                      </div>
                   ))}

                   <button 
                      onClick={handleVerification}
                      className="w-full py-3 bg-system-danger/10 border border-system-danger/50 text-system-danger font-bold font-mono rounded hover:bg-system-danger hover:text-black hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all flex items-center justify-center gap-2 mt-4"
                   >
                      VERIFY IDENTITY <ScanFace size={16} />
                   </button>
                </motion.div>
            )}

            {/* STEP 3: RESET */}
            {step === 'RESET' && (
                <motion.div
                   key="reset"
                   variants={glitchVariants}
                   initial="hidden"
                   animate="visible"
                   exit="exit"
                   className="space-y-4"
                >
                   <div className="p-3 bg-system-success/10 border border-system-success/30 rounded text-system-success text-xs font-mono flex items-center gap-2">
                       <CheckCircle size={14} /> ACCESS GRANTED.
                   </div>
                   
                   <div>
                      <label className="text-[10px] text-system-success font-mono tracking-widest block mb-2 font-bold">SET NEW ACCESS KEY</label>
                      <div className="relative group">
                         <Lock className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-system-success transition-colors" size={18} />
                         <input 
                            type="password"
                            maxLength={6}
                            value={newPin}
                            onChange={e => { if (/^\d*$/.test(e.target.value)) setNewPin(e.target.value); }}
                            className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-3 pl-10 text-white font-mono text-lg tracking-[0.5em] focus:border-system-success focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] focus:outline-none transition-all placeholder:text-gray-800"
                            placeholder="••••"
                         />
                      </div>
                   </div>

                   <button 
                      onClick={handleReset}
                      className="w-full py-3 bg-system-success/10 border border-system-success/50 text-system-success font-bold font-mono rounded hover:bg-system-success hover:text-black hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 group"
                   >
                      UPDATE PROTOCOLS <Key size={16} className="group-hover:rotate-45 transition-transform" />
                   </button>
                </motion.div>
            )}
          </AnimatePresence>
       </div>
    </div>
  );
};

export default ForgotPassword;