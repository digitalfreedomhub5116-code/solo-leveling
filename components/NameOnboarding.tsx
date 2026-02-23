
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ArrowRight, Globe, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NameOnboardingProps {
  onComplete: (name: string, country: string, timezone: string) => void;
}

const BANNED_WORDS = [
    "admin", "system", "root", "null", "undefined", "mod", "moderator",
    "sex", "fuck", "shit", "bitch", "cunt", "nigger", "faggot", "whore", "slut", "dick", "pussy", "ass", "bastard"
];

const COUNTRIES = [
    { name: "United States", code: "US", tz: "America/New_York" },
    { name: "India", code: "IN", tz: "Asia/Kolkata" },
    { name: "United Kingdom", code: "GB", tz: "Europe/London" },
    { name: "Canada", code: "CA", tz: "America/Toronto" },
    { name: "Australia", code: "AU", tz: "Australia/Sydney" },
    { name: "Germany", code: "DE", tz: "Europe/Berlin" },
    { name: "France", code: "FR", tz: "Europe/Paris" },
    { name: "Japan", code: "JP", tz: "Asia/Tokyo" },
    { name: "China", code: "CN", tz: "Asia/Shanghai" },
    { name: "Brazil", code: "BR", tz: "America/Sao_Paulo" },
    { name: "Other", code: "OT", tz: Intl.DateTimeFormat().resolvedOptions().timeZone }
];

const NameOnboarding: React.FC<NameOnboardingProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('United States');
  const [error, setError] = useState<string | null>(null);
  
  // Availability State
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Sync validation (Format & Profanity)
  const validateFormat = (val: string): boolean => {
      const lower = val.toLowerCase().trim();
      if (lower.length < 3) return false;
      if (lower.length > 15) return false;
      if (BANNED_WORDS.some(word => lower.includes(word))) return false;
      if (!/^[a-zA-Z0-9_]+$/.test(val)) return false;
      return true;
  };

  // Real-time Database Check
  useEffect(() => {
      // Reset state on change
      setIsAvailable(null);
      setError(null);

      const trimmedName = name.trim();

      // Don't check if format is invalid yet
      if (!validateFormat(trimmedName)) {
          if (trimmedName.length > 0 && trimmedName.length < 3) {
              // Silent wait for more typing
          } else if (trimmedName.length > 0) {
              // If invalid char or bad word, visual feedback comes from manual validation logic later or implicit "null" availability
          }
          return;
      }

      setIsChecking(true);

      const timer = setTimeout(async () => {
          try {
              const { count, error: dbError } = await supabase
                  .from('profiles')
                  .select('*', { count: 'exact', head: true })
                  .eq('username', trimmedName);
              
              if (dbError) throw dbError;

              // count === 0 means available
              if (count === 0) {
                  setIsAvailable(true);
              } else {
                  setIsAvailable(false);
                  setError("Codename already taken. Choose another.");
              }
          } catch (err) {
              console.error("Check failed", err);
              // Fallback: assume available if offline to prevent block, or show error
              setIsAvailable(null); 
          } finally {
              setIsChecking(false);
          }
      }, 600); // 600ms debounce

      return () => clearTimeout(timer);
  }, [name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const trimmedName = name.trim();
    if (!trimmedName) return;
    
    // Final Validations
    if (trimmedName.length < 3) {
        setError("Identity must be at least 3 characters.");
        return;
    }
    if (trimmedName.length > 15) {
        setError("Identity too long (Max 15 chars).");
        return;
    }
    if (BANNED_WORDS.some(word => trimmedName.toLowerCase().includes(word))) {
        setError("Identity rejected by System Protocol (Profanity/Reserved).");
        return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedName)) {
        setError("Identity contains invalid characters (A-Z, 0-9, _ only).");
        return;
    }

    if (isAvailable === false) {
        setError("Codename already registered.");
        return;
    }

    // Find Timezone
    const selectedCountry = COUNTRIES.find(c => c.name === country) || COUNTRIES[COUNTRIES.length - 1];
    
    onComplete(trimmedName, country, selectedCountry.tz);
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-6 z-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,210,255,0.1)_0%,transparent_70%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
           <Terminal className="text-system-neon w-12 h-12 mx-auto mb-6" />
           <h1 className="text-3xl md:text-4xl font-black text-white font-mono tracking-tighter mb-4">
             IDENTITY REQUIRED
           </h1>
           <p className="text-gray-500 font-mono text-xs tracking-widest uppercase">
             Establish your unique system ID
           </p>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-6">
           <div>
               <label className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-widest mb-2 block">Codename</label>
               <div className="relative">
                   <input 
                     autoFocus
                     type="text"
                     value={name}
                     onChange={(e) => { setName(e.target.value); }}
                     className={`
                        w-full bg-[#0a0a0a] border-b-2 text-center text-3xl md:text-4xl font-mono py-4 focus:outline-none transition-colors uppercase pr-12
                        ${isAvailable === true ? 'text-system-success border-system-success' : isAvailable === false ? 'text-red-500 border-red-500' : 'text-white border-gray-800 focus:border-system-neon'}
                     `}
                     placeholder="HUNTER"
                   />
                   
                   {/* Status Icon */}
                   <div className="absolute right-0 top-1/2 -translate-y-1/2">
                       {isChecking ? (
                           <Loader2 className="animate-spin text-system-neon" size={24} />
                       ) : isAvailable === true ? (
                           <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                               <CheckCircle className="text-system-success drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" size={24} />
                           </motion.div>
                       ) : isAvailable === false ? (
                           <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                               <XCircle className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" size={24} />
                           </motion.div>
                       ) : null}
                   </div>
               </div>
           </div>

           <div>
               <label className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-widest mb-2 block flex items-center gap-2">
                   <Globe size={12} /> Locality (For Time Sync)
               </label>
               <select 
                   value={country}
                   onChange={(e) => setCountry(e.target.value)}
                   className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 text-white font-mono text-xs focus:border-system-neon outline-none"
               >
                   {COUNTRIES.map(c => (
                       <option key={c.code} value={c.name}>{c.name}</option>
                   ))}
               </select>
           </div>

           {error && (
               <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-xs font-mono text-center bg-red-900/20 p-2 rounded border border-red-900">
                   {error}
               </motion.div>
           )}
           
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             disabled={!name.trim() || isChecking || isAvailable === false}
             className="w-full mt-12 bg-white text-black font-bold font-mono py-4 rounded-full flex items-center justify-center gap-3 hover:bg-system-neon hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
           >
              CONFIRM IDENTITY <ArrowRight size={20} />
           </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default NameOnboarding;
