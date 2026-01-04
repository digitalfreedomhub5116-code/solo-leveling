import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            }
          }
        });
        if (error) throw error;
        
        // Note: Profile creation is deferred to the useSystem hook which runs 
        // immediately after a valid session is established to ensure RLS compliance.
        
        if (data.user && !data.session) {
           setSuccessMsg("Registration Successful. Please check your email for verification.");
        } else {
           setSuccessMsg("Registration Successful. Initializing System...");
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-system-bg flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambient Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-system-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-system-neon/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-system-card/80 backdrop-blur-xl border border-system-border/50 rounded-2xl p-8 relative z-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
             <div className="p-3 bg-system-accent/10 rounded-full border border-system-accent/20">
               <Cpu size={32} className="text-system-accent animate-pulse" />
             </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tighter mb-1 font-mono">
            BIO-SYNC OS
          </h1>
          <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">
            System Authentication Required
          </p>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-system-danger/10 border border-system-danger/30 rounded p-3 mb-6 flex items-start gap-3 overflow-hidden"
            >
              <ShieldAlert size={18} className="text-system-danger shrink-0 mt-0.5" />
              <span className="text-xs text-system-danger font-mono leading-tight">{error}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-system-success/10 border border-system-success/30 rounded p-3 mb-6 flex items-start gap-3 overflow-hidden"
            >
              <User size={18} className="text-system-success shrink-0 mt-0.5" />
              <span className="text-xs text-system-success font-mono leading-tight">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Name Input (Registration Only) */}
          <AnimatePresence>
            {!isLogin && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-1 overflow-hidden"
              >
                <label className="text-xs text-gray-500 font-mono ml-1">NAME / CODENAME</label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 text-gray-600 group-focus-within:text-system-neon transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className="w-full bg-black/50 border border-system-border rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-system-neon focus:shadow-[0_0_10px_rgba(0,210,255,0.2)] transition-all font-mono text-sm"
                    placeholder="Jin Woo"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-mono ml-1">GMAIL / EMAIL</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 text-gray-600 group-focus-within:text-system-neon transition-colors" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/50 border border-system-border rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-system-neon focus:shadow-[0_0_10px_rgba(0,210,255,0.2)] transition-all font-mono text-sm"
                placeholder="hunter@gmail.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-mono ml-1">PASSWORD</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 text-gray-600 group-focus-within:text-system-neon transition-colors" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/50 border border-system-border rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-system-neon focus:shadow-[0_0_10px_rgba(0,210,255,0.2)] transition-all font-mono text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-system-neon text-black font-bold py-3 rounded-lg mt-6 font-mono flex items-center justify-center gap-2 hover:bg-white hover:shadow-[0_0_20px_rgba(0,210,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
             {loading ? 'CONNECTING...' : isLogin ? 'INITIALIZE LINK' : 'REGISTER HUNTER'}
             {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center">
           <button 
             onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMsg(null); }}
             className="text-xs text-gray-500 hover:text-system-accent transition-colors font-mono"
           >
             {isLogin ? "DETECTING NEW SIGNAL? REGISTER" : "SIGNAL FOUND. LOGIN"}
           </button>
        </div>

      </motion.div>
    </div>
  );
};

export default AuthView;