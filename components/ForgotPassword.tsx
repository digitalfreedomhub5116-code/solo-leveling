import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Terminal, Lock, CheckCircle, Loader2, ArrowRight, X, ScanFace, Database, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ForgotPasswordProps {
  onCancel: () => void;
  onSuccess: () => void;
}

interface RecoveryQuestion {
  id: string;
  question: string;
  answer_text: string; // Changed from 'answer' to 'answer_text'
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onCancel, onSuccess }) => {
  const [step, setStep] = useState<'IDENTITY' | 'VERIFICATION' | 'RESET'>('IDENTITY');
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<RecoveryQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [newPin, setNewPin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  // Step 1: Find User
  const handleIdentitySearch = async () => {
    if (!username.trim()) {
        setError("ENTER CODENAME TO INITIATE SEARCH");
        return;
    }
    setLoading(true);
    setError(null);
    setStatus('SEARCHING DATABASE...');

    try {
        // Find user by username
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username.toLowerCase().trim())
            .single();

        if (profileError || !profile) {
            throw new Error("USER NOT FOUND");
        }

        setUserId(profile.id);

        // Fetch Questions
        setStatus('RETRIEVING MEMORY FRAGMENTS...');
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
        setStatus('');
    }
  };

  // Step 2: Verify Answers (2/3 Logic)
  const handleVerification = () => {
    setLoading(true);
    setError(null);
    setStatus('ANALYZING RESPONSES...');

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
        setStatus('');
    }, 1500); // Cinematic delay
  };

  // Step 3: Reset PIN
  const handleReset = async () => {
    if (!newPin || newPin.length < 4) {
        setError("INVALID PIN FORMAT");
        return;
    }
    if (!userId) return;

    setLoading(true);
    setError(null);
    setStatus('OVERWRITING SECURITY PROTOCOLS...');

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ pin: newPin })
            .eq('id', userId);

        if (error) throw error;

        setStatus('SYNCHRONIZATION RESTORED.');
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
    <div className="w-full max-w-md bg-system-card border border-system-border rounded-xl p-8 relative overflow-hidden shadow-2xl">
       {/* Background Animation */}
       <div className="absolute inset-0 bg-system-danger/5 pointer-events-none" />
       
       <div className="relative z-10">
          <div className="flex justify-between items-start mb-6 border-b border-system-border pb-4">
             <div>
                <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                    <ShieldAlert className="text-system-danger" size={20} />
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
                 className="bg-red-950/30 border border-red-500/50 text-red-400 p-3 rounded mb-4 text-xs font-mono flex items-center gap-2"
               >
                 <AlertTriangle size={14} /> {error}
               </motion.div>
            )}
          </AnimatePresence>

          {loading && (
             <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Loader2 className="text-system-danger animate-spin mb-2" size={32} />
                <span className="text-system-danger font-mono text-xs animate-pulse tracking-widest">{status}</span>
             </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: FIND USER */}
            {step === 'IDENTITY' && (
                <motion.div
                   key="identity"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="space-y-4"
                >
                   <div>
                      <label className="text-[10px] text-gray-500 font-mono tracking-widest block mb-1">TARGET CODENAME</label>
                      <div className="relative">
                         <ScanFace className="absolute left-3 top-3 text-gray-600" size={18} />
                         <input 
                            value={username}
                            onChange={e => setUsername(e.target.value.toUpperCase())}
                            className="w-full bg-black border border-system-border rounded p-3 pl-10 text-white font-mono focus:border-system-danger focus:outline-none uppercase"
                            placeholder="ENTER USERNAME"
                         />
                      </div>
                   </div>
                   <button 
                      onClick={handleIdentitySearch}
                      className="w-full py-3 bg-system-danger text-black font-bold font-mono rounded hover:bg-white transition-colors flex items-center justify-center gap-2"
                   >
                      INITIATE SCAN <ArrowRight size={16} />
                   </button>
                </motion.div>
            )}

            {/* STEP 2: QUESTIONS */}
            {step === 'VERIFICATION' && (
                <motion.div
                   key="verification"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="space-y-4"
                >
                   <div className="text-[10px] text-gray-500 font-mono mb-2">ANSWER 2 OF 3 SECURITY QUESTIONS TO RESTORE ACCESS</div>
                   
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
                            className="w-full bg-black border border-system-border rounded p-2 text-sm text-white font-mono focus:border-system-danger focus:outline-none"
                            placeholder="Enter answer..."
                         />
                      </div>
                   ))}

                   <button 
                      onClick={handleVerification}
                      className="w-full py-3 bg-system-danger text-black font-bold font-mono rounded hover:bg-white transition-colors flex items-center justify-center gap-2 mt-4"
                   >
                      VERIFY IDENTITY <Database size={16} />
                   </button>
                </motion.div>
            )}

            {/* STEP 3: RESET */}
            {step === 'RESET' && (
                <motion.div
                   key="reset"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="space-y-4"
                >
                   <div className="p-3 bg-system-success/10 border border-system-success/30 rounded text-system-success text-xs font-mono flex items-center gap-2">
                       <CheckCircle size={14} /> ACCESS GRANTED.
                   </div>
                   
                   <div>
                      <label className="text-[10px] text-gray-500 font-mono tracking-widest block mb-1">SET NEW ACCESS KEY (PIN)</label>
                      <div className="relative">
                         <Lock className="absolute left-3 top-3 text-gray-600" size={18} />
                         <input 
                            type="password"
                            maxLength={6}
                            value={newPin}
                            onChange={e => { if (/^\d*$/.test(e.target.value)) setNewPin(e.target.value); }}
                            className="w-full bg-black border border-system-border rounded p-3 pl-10 text-white font-mono text-lg tracking-[0.5em] focus:border-system-success focus:outline-none"
                            placeholder="••••"
                         />
                      </div>
                   </div>

                   <button 
                      onClick={handleReset}
                      className="w-full py-3 bg-system-success text-black font-bold font-mono rounded hover:bg-white transition-colors flex items-center justify-center gap-2"
                   >
                      UPDATE PROTOCOLS <Terminal size={16} />
                   </button>
                </motion.div>
            )}
          </AnimatePresence>
       </div>
    </div>
  );
};

export default ForgotPassword;