
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, User, Briefcase, Award, Shield, Terminal, Activity, Settings } from 'lucide-react';
import { PlayerData } from '../types';

interface ProfileViewProps {
  player: PlayerData;
  onUpdate: (data: { name: string; job: string; title: string }) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ player, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'STATS' | 'LOGS' | 'CONFIG'>('STATS');
  
  // Form State
  const [name, setName] = useState(player.name);
  const [job, setJob] = useState(player.job);
  const [title, setTitle] = useState(player.title);

  const handleSave = () => {
    onUpdate({ name, job, title });
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[80vh] gap-8 w-full max-w-4xl mx-auto">
      
      {/* --- TOP: 3D ID CARD --- */}
      <motion.div 
        initial={{ rotateY: 10, rotateX: 5 }}
        animate={{ 
            rotateY: [10, -10, 10],
            rotateX: [5, -5, 5],
            y: [0, -5, 0]
        }}
        transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
        }}
        className="relative group perspective-1000 shrink-0"
      >
          {/* Card Container */}
          <div className="relative w-[320px] md:w-[380px] h-[220px] bg-black border border-gray-800 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl flex">
             
             {/* Holographic Overlay */}
             <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20 z-20 pointer-events-none" />
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 z-10 pointer-events-none brightness-150 contrast-200" />
             
             {/* Glowing Borders */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-system-neon via-system-accent to-system-neon opacity-80" />

             {/* Left: Avatar Area */}
             <div className="w-1/3 bg-gray-900/50 border-r border-gray-800 relative flex flex-col items-center justify-center p-2">
                 <div className="w-20 h-20 rounded-full border-2 border-system-neon/50 flex items-center justify-center bg-black/50 mb-2">
                    <User size={32} className="text-gray-400" />
                 </div>
                 <div className="text-[10px] font-mono text-system-neon tracking-widest bg-system-neon/10 px-2 py-0.5 rounded border border-system-neon/20">
                    RANK: {player.rank}
                 </div>
                 {/* Scan Line */}
                 <motion.div 
                   animate={{ top: ['0%', '100%', '0%'] }}
                   transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                   className="absolute left-0 w-full h-[1px] bg-system-neon shadow-[0_0_10px_#00d2ff] z-20 opacity-30"
                 />
             </div>

             {/* Right: Info Area */}
             <div className="flex-1 p-4 font-mono flex flex-col justify-between relative z-30">
                 <div>
                    <h2 className="text-white font-bold text-lg tracking-tight uppercase truncate">{player.name}</h2>
                    <div className="text-xs text-system-accent font-bold truncate">{player.job}</div>
                    <div className="text-[10px] text-gray-500 mt-1 truncate">TITLE: {player.title}</div>
                 </div>
                 
                 <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-400 border-b border-gray-800 pb-1">
                        <span>LEVEL</span>
                        <span className="text-white font-bold">{player.level}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                        <span>ID</span>
                        <span className="text-gray-600">#{player.userId?.substring(0,6) || 'SYS-001'}</span>
                    </div>
                 </div>
                 
                 <div className="absolute bottom-2 right-2">
                    <Shield size={24} className="text-gray-800/50" />
                 </div>
             </div>
          </div>
      </motion.div>

      {/* --- BOTTOM: TABBED INTERFACE --- */}
      <div className="w-full max-w-2xl flex flex-col gap-4">
          
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
              <button 
                onClick={() => setActiveTab('STATS')}
                className={`flex-1 pb-3 text-xs font-mono font-bold tracking-widest transition-colors flex items-center justify-center gap-2 ${activeTab === 'STATS' ? 'text-system-neon border-b-2 border-system-neon' : 'text-gray-600 hover:text-gray-300'}`}
              >
                  <Activity size={14} /> STATUS
              </button>
              <button 
                onClick={() => setActiveTab('LOGS')}
                className={`flex-1 pb-3 text-xs font-mono font-bold tracking-widest transition-colors flex items-center justify-center gap-2 ${activeTab === 'LOGS' ? 'text-system-neon border-b-2 border-system-neon' : 'text-gray-600 hover:text-gray-300'}`}
              >
                  <Terminal size={14} /> LOGS
              </button>
              <button 
                onClick={() => setActiveTab('CONFIG')}
                className={`flex-1 pb-3 text-xs font-mono font-bold tracking-widest transition-colors flex items-center justify-center gap-2 ${activeTab === 'CONFIG' ? 'text-system-neon border-b-2 border-system-neon' : 'text-gray-600 hover:text-gray-300'}`}
              >
                  <Settings size={14} /> CONFIG
              </button>
          </div>

          <div className="bg-system-card border border-system-border rounded-xl p-6 min-h-[300px] relative overflow-hidden">
             <AnimatePresence mode="wait">
                
                {/* --- STATS VIEW --- */}
                {activeTab === 'STATS' && (
                    <motion.div
                        key="stats"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                                <div className="text-[10px] text-gray-500 font-mono mb-1">HP</div>
                                <div className="text-xl text-red-500 font-mono font-bold">{player.hp} / {player.maxHp}</div>
                                <div className="h-1 bg-gray-800 mt-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-600" style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
                                </div>
                            </div>
                            <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                                <div className="text-[10px] text-gray-500 font-mono mb-1">MP</div>
                                <div className="text-xl text-blue-500 font-mono font-bold">{player.mp} / {player.maxMp}</div>
                                <div className="h-1 bg-gray-800 mt-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600" style={{ width: `${(player.mp / player.maxMp) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* --- LOGS VIEW --- */}
                {activeTab === 'LOGS' && (
                    <motion.div
                        key="logs"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs text-gray-400 font-mono uppercase tracking-widest">System Activity</h3>
                            <span className="text-[10px] text-gray-600 font-mono">{player.logs.length} ENTRIES</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[250px] space-y-2">
                            {player.logs.length > 0 ? player.logs.map((log) => (
                                <div key={log.id} className="text-[10px] font-mono p-2 border-b border-gray-800/50 hover:bg-white/5 transition-colors rounded">
                                    <div className="flex justify-between text-gray-500 mb-1">
                                        <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div className={
                                        log.type === 'PENALTY' ? "text-red-400" : 
                                        log.type === 'LEVEL_UP' ? "text-system-neon font-bold" :
                                        log.type === 'PURCHASE' ? "text-yellow-500" :
                                        "text-gray-300"
                                    }>
                                        {log.message}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-gray-600 text-xs py-10 font-mono">NO RECORDS FOUND</div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* --- CONFIG VIEW --- */}
                {activeTab === 'CONFIG' && (
                    <motion.div
                        key="config"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="space-y-4">
                             <div>
                                <label className="block text-xs text-gray-500 mb-1 font-mono">CODENAME</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-2.5 text-gray-600" />
                                    <input 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-black border border-gray-800 rounded p-2 pl-9 text-sm font-mono text-white focus:border-system-neon focus:outline-none transition-colors"
                                    />
                                </div>
                             </div>
                             
                             <div>
                                <label className="block text-xs text-gray-500 mb-1 font-mono">JOB CLASS</label>
                                <div className="relative">
                                    <Briefcase size={16} className="absolute left-3 top-2.5 text-gray-600" />
                                    <input 
                                        value={job}
                                        onChange={(e) => setJob(e.target.value)}
                                        className="w-full bg-black border border-gray-800 rounded p-2 pl-9 text-sm font-mono text-white focus:border-system-neon focus:outline-none transition-colors"
                                    />
                                </div>
                             </div>

                             <div>
                                <label className="block text-xs text-gray-500 mb-1 font-mono">TITLE</label>
                                <div className="relative">
                                    <Award size={16} className="absolute left-3 top-2.5 text-gray-600" />
                                    <input 
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-black border border-gray-800 rounded p-2 pl-9 text-sm font-mono text-white focus:border-system-neon focus:outline-none transition-colors"
                                    />
                                </div>
                             </div>

                             <button 
                               onClick={handleSave}
                               className="w-full bg-white text-black font-bold py-2 rounded flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors text-xs font-mono"
                             >
                                <Save size={14} /> UPDATE REGISTRATION
                             </button>
                        </div>
                    </motion.div>
                )}

             </AnimatePresence>
          </div>
      </div>

    </div>
  );
};

export default ProfileView;
