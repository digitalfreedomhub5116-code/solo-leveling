import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Briefcase, Award, Fingerprint, Scan, Shield } from 'lucide-react';
import { PlayerData } from '../types';

interface ProfileViewProps {
  player: PlayerData;
  onUpdate: (data: { name: string; job: string; title: string }) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ player, onUpdate }) => {
  const [name, setName] = useState(player.name);
  const [job, setJob] = useState(player.job);
  const [title, setTitle] = useState(player.title);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onUpdate({ name, job, title });
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
      
      {/* 3D Floating ID Card Effect */}
      <motion.div 
        initial={{ rotateY: 10, rotateX: 5 }}
        animate={{ 
            rotateY: [10, -10, 10],
            rotateX: [5, -5, 5],
            y: [0, -10, 0]
        }}
        transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
        }}
        className="relative group perspective-1000"
      >
          {/* Card Container */}
          <div className="relative w-[340px] md:w-[400px] h-[550px] bg-black border border-gray-800 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
             
             {/* Holographic Overlay */}
             <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20 z-20 pointer-events-none" />
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 z-10 pointer-events-none brightness-150 contrast-200" />
             
             {/* Glowing Borders */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-system-neon via-system-accent to-system-neon opacity-80" />
             <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-system-accent via-system-neon to-system-accent opacity-80" />

             {/* Header */}
             <div className="p-6 border-b border-gray-800 relative z-30">
                 <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tighter text-white">HUNTER LICENSE</h2>
                        <div className="flex items-center gap-2 mt-1">
                             <div className="w-2 h-2 rounded-full bg-system-success animate-pulse shadow-[0_0_5px_#10b981]" />
                             <span className="text-[10px] font-mono text-system-success tracking-widest">VERIFIED ID</span>
                        </div>
                    </div>
                    <Shield className="text-gray-700" size={32} />
                 </div>
             </div>

             {/* Avatar / Image Placeholder */}
             <div className="relative h-48 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center border-b border-gray-800 overflow-hidden group-hover:from-gray-800 transition-colors">
                 <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <Scan size={120} className="text-system-neon animate-pulse-fast" />
                 </div>
                 <div className="relative z-10 flex flex-col items-center">
                    <User size={64} className="text-gray-500 mb-2" />
                    <div className="px-3 py-1 bg-system-neon/10 border border-system-neon/30 rounded text-system-neon text-xs font-mono tracking-widest">
                        RANK: {player.rank}
                    </div>
                 </div>
                 
                 {/* Scan Line */}
                 <motion.div 
                   animate={{ top: ['0%', '100%', '0%'] }}
                   transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                   className="absolute left-0 w-full h-[1px] bg-system-neon shadow-[0_0_10px_#00d2ff] z-20 opacity-50"
                 />
             </div>

             {/* Details */}
             <div className="p-6 space-y-4 relative z-30 font-mono">
                 <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest">Name</label>
                    <div className="text-xl font-bold text-white tracking-tight">{name}</div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest">Job Class</label>
                        <div className="text-sm font-bold text-system-accent">{job}</div>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest">Level</label>
                        <div className="text-sm font-bold text-white">{player.level}</div>
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest">Current Title</label>
                    <div className="text-sm font-bold text-system-neon">{title}</div>
                 </div>
                 
                 <div className="pt-4 mt-2 border-t border-gray-800 flex items-center justify-between opacity-50">
                    <Fingerprint size={32} />
                    <div className="text-[8px] text-right">
                        ID: {player.userId || 'SYS-LOC-001'}<br/>
                        ISSUED: {new Date().getFullYear()}
                    </div>
                 </div>
             </div>
          </div>
      </motion.div>

      {/* Edit Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-system-card border border-system-border rounded-lg p-6"
      >
         <div className="flex justify-between items-center mb-6">
             <h3 className="text-white font-mono font-bold flex items-center gap-2">
                <Briefcase size={18} className="text-gray-500" />
                UPDATE REGISTRATION
             </h3>
             <button 
               onClick={() => setIsEditing(!isEditing)}
               className={`text-xs font-mono px-3 py-1 rounded transition-colors ${isEditing ? 'bg-system-danger/20 text-system-danger' : 'bg-gray-800 text-gray-400'}`}
             >
                {isEditing ? 'CANCEL' : 'EDIT MODE'}
             </button>
         </div>

         <div className="space-y-4">
             <div>
                <label className="block text-xs text-gray-500 mb-1 font-mono">CODENAME</label>
                <div className="relative">
                    <User size={16} className="absolute left-3 top-2.5 text-gray-600" />
                    <input 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={!isEditing}
                        className={`w-full bg-system-bg border rounded p-2 pl-9 text-sm font-mono focus:outline-none transition-colors ${isEditing ? 'border-system-border text-white focus:border-system-neon' : 'border-transparent text-gray-500 cursor-not-allowed'}`}
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
                        disabled={!isEditing}
                        className={`w-full bg-system-bg border rounded p-2 pl-9 text-sm font-mono focus:outline-none transition-colors ${isEditing ? 'border-system-border text-white focus:border-system-neon' : 'border-transparent text-gray-500 cursor-not-allowed'}`}
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
                        disabled={!isEditing}
                        className={`w-full bg-system-bg border rounded p-2 pl-9 text-sm font-mono focus:outline-none transition-colors ${isEditing ? 'border-system-border text-white focus:border-system-neon' : 'border-transparent text-gray-500 cursor-not-allowed'}`}
                    />
                </div>
             </div>

             {isEditing && (
                 <motion.button 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   onClick={handleSave}
                   className="w-full mt-4 bg-system-neon text-black font-bold py-3 rounded flex items-center justify-center gap-2 hover:bg-white transition-colors"
                 >
                    <Save size={18} /> SAVE CHANGES
                 </motion.button>
             )}
         </div>
      </motion.div>

    </div>
  );
};

export default ProfileView;