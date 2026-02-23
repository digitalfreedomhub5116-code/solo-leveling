
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { LogOut, Database, Save, RefreshCw, Video, Link, Search, ChevronRight, ShieldAlert, Activity, Plus, Trash2, Globe, GripVertical, List, Download } from 'lucide-react';
import { WorkoutDay, Exercise, AdminExercise } from '../types';
import { useSystem, isEmbed } from '../hooks/useSystem';
import { MASTER_PROTOCOL_REGISTRY } from '../utils/workoutGenerator';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  onLogout: () => void;
}

type ProtocolCategory = 
  | 'GYM_PPL' 
  | 'GYM_CLASSIC' 
  | 'BW_REGULAR' 
  | 'BW_PPL' 
  | 'DB_PPL' 
  | 'DB_REGULAR';

const CATEGORIES: { id: ProtocolCategory; label: string }[] = [
  { id: 'GYM_PPL', label: '1) PPL + FULL GYM' },
  { id: 'GYM_CLASSIC', label: '2) GYM BRO SPLIT' },
  { id: 'BW_REGULAR', label: '3) BODYWEIGHT REGULAR' },
  { id: 'BW_PPL', label: '4) BODYWEIGHT PPL' },
  { id: 'DB_PPL', label: '5) DUMBBELL PPL' },
  { id: 'DB_REGULAR', label: '6) DUMBBELL REGULAR' },
];

const TARGET_GROUPS = [
    'Chest', 
    'Shoulders', 
    'Legs', 
    'Cardio', 
    'Stretching', 
    'Abs', 
    'Back', 
    'General'
];

// Helper to ensure all exercises have stable IDs for Reorder keys
const ensureIds = (registry: Record<string, WorkoutDay[]>) => {
    // Deep clone to avoid mutating strict mode props or frozen objects
    const updated = JSON.parse(JSON.stringify(registry));
    
    Object.keys(updated).forEach(key => {
        updated[key] = updated[key].map((day: WorkoutDay) => ({
            ...day,
            exercises: day.exercises.map((ex: Exercise) => ({
                ...ex,
                // Generate a unique ID if one doesn't exist
                id: ex.id || Math.random().toString(36).substr(2, 9) + Date.now().toString().slice(-4)
            }))
        }));
    });
    return updated;
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { updateFocusVideos, saveGlobalProtocols, saveExerciseDatabase, player } = useSystem();
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'PROTOCOLS' | 'REGIONS' | 'USERS' | 'EXERCISES'>('PROTOCOLS');
  const [selectedCategory, setSelectedCategory] = useState<ProtocolCategory>('GYM_PPL');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  
  // Local cache for editing protocol data
  const [localRegistry, setLocalRegistry] = useState<Record<string, WorkoutDay[]>>(() => {
      const registry = player.customProtocols && Object.keys(player.customProtocols).length > 0 
        ? player.customProtocols 
        : MASTER_PROTOCOL_REGISTRY;
      return ensureIds(registry);
  });

  // Local cache for Exercise Database
  const [exerciseList, setExerciseList] = useState<AdminExercise[]>(player.exerciseDatabase);
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Effect to sync local registry if the global one updates (e.g. initial fetch completes)
  useEffect(() => {
      if (player.customProtocols && Object.keys(player.customProtocols).length > 0) {
          setLocalRegistry(ensureIds(player.customProtocols));
      }
  }, [player.customProtocols]);

  // Sync exercise list
  useEffect(() => {
      setExerciseList(player.exerciseDatabase);
  }, [player.exerciseDatabase]);

  // User Data State
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Region Video State
  const [regionVideos, setRegionVideos] = useState<Record<string, string>>(player.focusVideos || {});
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when player data loads from global fetching
  useEffect(() => {
      if (player.focusVideos) {
          setRegionVideos(player.focusVideos);
      }
  }, [player.focusVideos]);

  // --- DATA LOADING ---
  const fetchUsers = async () => {
      try {
          const { data, error } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false });
          if (error) throw error;
          setUsers(data || []);
      } catch (err) {
          console.error("Fetch Users Error:", err);
      }
  };

  useEffect(() => { 
      if (activeTab === 'USERS') fetchUsers();
  }, [activeTab]);

  // --- EXERCISE DB ACTIONS ---
  
  const handleSyncFromProtocols = () => {
      const newExercises = [...exerciseList];
      const existingNames = new Set(newExercises.map(e => e.name.toLowerCase()));
      let addedCount = 0;
      
      Object.values(localRegistry).forEach((days: WorkoutDay[]) => {
          days.forEach(day => {
              day.exercises.forEach(ex => {
                  const normalizedName = ex.name.toLowerCase();
                  if (!existingNames.has(normalizedName)) {
                      // Infer Muscle Group from Focus
                      const focus = day.focus.toUpperCase();
                      let group = 'General';
                      if (focus.includes('PUSH') || focus.includes('CHEST')) group = 'Chest';
                      if (focus.includes('SHOULDER')) group = 'Shoulders';
                      if (focus.includes('PULL') || focus.includes('BACK')) group = 'Back';
                      if (focus.includes('LEG') || focus.includes('SQUAT')) group = 'Legs';
                      if (focus.includes('CARDIO') || ex.type === 'CARDIO') group = 'Cardio';
                      if (focus.includes('ABS') || focus.includes('CORE')) group = 'Abs';
                      if (ex.type === 'STRETCH') group = 'Stretching';

                      newExercises.push({
                          id: Math.random().toString(36).substr(2, 9),
                          name: ex.name,
                          muscleGroup: group,
                          difficulty: 'Intermediate',
                          videoUrl: ex.videoUrl || '',
                          imageUrl: '',
                          caloriesBurn: 0
                      });
                      existingNames.add(normalizedName);
                      addedCount++;
                  }
              });
          });
      });
      setExerciseList(newExercises);
      alert(`Scan Complete. Imported ${addedCount} new exercises from protocols.`);
  };

  const handleAddDBExercise = () => {
      const newEx: AdminExercise = {
          id: Math.random().toString(36).substr(2, 9),
          name: "New Exercise",
          muscleGroup: "General",
          difficulty: "Intermediate",
          videoUrl: "",
          imageUrl: "",
          caloriesBurn: 0
      };
      setExerciseList([newEx, ...exerciseList]);
  };

  const handleDeleteDBExercise = (id: string) => {
      if(window.confirm("Delete this exercise from the global list?")) {
          setExerciseList(exerciseList.filter(e => e.id !== id));
      }
  };

  const handleUpdateDBExercise = (id: string, field: keyof AdminExercise, value: any) => {
      setExerciseList(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSaveExerciseDB = async () => {
      setIsSaving(true);
      await saveExerciseDatabase(exerciseList);
      setIsSaving(false);
      alert("Exercise Database Saved to Cloud.");
  };

  // --- PROTOCOL ACTIONS ---

  // Helper to update specific field of an exercise
  const handleUpdateExerciseField = (exIdx: number, field: keyof Exercise, value: any) => {
      const updated = { ...localRegistry };
      const weekStartIdx = (selectedWeek - 1) * 7;
      const targetDayIdx = weekStartIdx + selectedDayIdx;
      
      if (updated[selectedCategory][targetDayIdx]) {
          const days = [...updated[selectedCategory]];
          const day = { ...days[targetDayIdx] };
          const exercises = [...day.exercises];
          
          exercises[exIdx] = { ...exercises[exIdx], [field]: value };
          
          day.exercises = exercises;
          days[targetDayIdx] = day;
          updated[selectedCategory] = days;
          
          setLocalRegistry(updated);
      }
  };

  // Handle Drag Reorder
  const handleReorderExercises = (newOrder: Exercise[]) => {
      const updated = { ...localRegistry };
      const weekStartIdx = (selectedWeek - 1) * 7;
      const targetDayIdx = weekStartIdx + selectedDayIdx;

      if (updated[selectedCategory][targetDayIdx]) {
          const days = [...updated[selectedCategory]];
          const day = { ...days[targetDayIdx] };
          
          day.exercises = newOrder;
          
          days[targetDayIdx] = day;
          updated[selectedCategory] = days;
          setLocalRegistry(updated);
      }
  };

  const handleAddExercise = () => {
      const updated = { ...localRegistry };
      const weekStartIdx = (selectedWeek - 1) * 7;
      const targetDayIdx = weekStartIdx + selectedDayIdx;

      if (updated[selectedCategory][targetDayIdx]) {
          const days = [...updated[selectedCategory]];
          const day = { ...days[targetDayIdx] };
          
          const newExercise: Exercise = {
              id: Math.random().toString(36).substr(2, 9),
              name: `New Exercise ${Date.now().toString().slice(-4)}`, 
              sets: 3,
              reps: '10',
              type: 'ACCESSORY',
              completed: false,
              duration: 0,
              notes: '',
              videoUrl: ''
          };

          day.exercises = [...day.exercises, newExercise];
          days[targetDayIdx] = day;
          updated[selectedCategory] = days;
          
          setLocalRegistry(updated);
      }
  };

  const handleDeleteExercise = (exIdx: number) => {
      if (!window.confirm("Remove this exercise from the current day?")) return;

      const updated = { ...localRegistry };
      const weekStartIdx = (selectedWeek - 1) * 7;
      const targetDayIdx = weekStartIdx + selectedDayIdx;

      if (updated[selectedCategory][targetDayIdx]) {
          const days = [...updated[selectedCategory]];
          const day = { ...days[targetDayIdx] };
          
          day.exercises = day.exercises.filter((_, i) => i !== exIdx);
          
          days[targetDayIdx] = day;
          updated[selectedCategory] = days;
          setLocalRegistry(updated);
      }
  };

  const handleDeleteEverywhere = (exerciseName: string) => {
      if (!exerciseName) return;
      const confirmText = `WARNING: This will delete "${exerciseName}" from ALL protocols, ALL weeks, and ALL days.\n\nThis action cannot be undone.\n\nAre you sure?`;
      if (!window.confirm(confirmText)) return;

      const updated = { ...localRegistry };
      let deletedCount = 0;

      // Iterate over every category
      Object.keys(updated).forEach(catKey => {
          const days = [...updated[catKey]];
          // Iterate over every day in the category
          updated[catKey] = days.map(day => {
              const originalLength = day.exercises.length;
              const filteredExercises = day.exercises.filter(ex => ex.name !== exerciseName);
              
              if (filteredExercises.length < originalLength) {
                  deletedCount += (originalLength - filteredExercises.length);
              }

              return {
                  ...day,
                  exercises: filteredExercises
              };
          });
      });

      setLocalRegistry(updated);
      alert(`Operation Complete. Deleted ${deletedCount} instances of "${exerciseName}" from the system.`);
  };

  const handleSaveProtocol = async () => {
      setIsSaving(true);
      try {
          // 1. Save Structure GLOBALLY to 'system_protocols'
          await saveGlobalProtocols(localRegistry);

          // 2. Extract Videos for Global Sync
          const videoMap: Record<string, string> = {};
          (Object.values(localRegistry) as WorkoutDay[][]).forEach(days => {
              days.forEach(day => {
                  day.exercises.forEach(ex => {
                      if (ex.videoUrl && ex.videoUrl.trim() !== '') {
                          videoMap[ex.name] = ex.videoUrl.trim();
                      }
                  });
              });
          });
          
          // 3. Upsert to Global Video Table
          if (Object.keys(videoMap).length > 0) {
              await updateFocusVideos(videoMap);
          }

          alert("GLOBAL UPDATE SUCCESSFUL. All protocols and video links have been synchronized to the cloud.");
      } catch (err) {
          alert("Save Failed. Check console for details.");
          console.error(err);
      } finally {
          setIsSaving(false);
      }
  };

  const handleSaveRegions = async () => {
      setIsSaving(true);
      try {
          await updateFocusVideos(regionVideos);
          alert("Neural Visuals Synced to Cloud.");
      } catch (err) {
          alert(`Sync Failed`);
      } finally {
          setIsSaving(false);
      }
  };

  // Helper for current day data
  const currentPlanDays = localRegistry[selectedCategory] || [];
  const currentDay = currentPlanDays[(selectedWeek - 1) * 7 + selectedDayIdx];

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col">
       <header className="sticky top-0 z-30 bg-black/90 backdrop-blur border-b border-gray-800 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-system-neon text-black rounded flex items-center justify-center font-black shadow-[0_0_15px_#00d2ff]">GM</div>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter text-white">SYSTEM OVERRIDE</h1>
                        <div className="flex gap-4 mt-1 overflow-x-auto scrollbar-hide">
                            <button onClick={() => setActiveTab('PROTOCOLS')} className={`text-[10px] font-bold tracking-widest transition-colors whitespace-nowrap ${activeTab === 'PROTOCOLS' ? 'text-system-neon' : 'text-gray-600 hover:text-white'}`}>[ MASTER_PROTOCOLS ]</button>
                            <button onClick={() => setActiveTab('EXERCISES')} className={`text-[10px] font-bold tracking-widest transition-colors whitespace-nowrap ${activeTab === 'EXERCISES' ? 'text-system-neon' : 'text-gray-600 hover:text-white'}`}>[ WORKOUT_LIST ]</button>
                            <button onClick={() => setActiveTab('REGIONS')} className={`text-[10px] font-bold tracking-widest transition-colors whitespace-nowrap ${activeTab === 'REGIONS' ? 'text-system-neon' : 'text-gray-600 hover:text-white'}`}>[ ANATOMY_VISUALS ]</button>
                            <button onClick={() => setActiveTab('USERS')} className={`text-[10px] font-bold tracking-widest transition-colors whitespace-nowrap ${activeTab === 'USERS' ? 'text-system-neon' : 'text-gray-600 hover:text-white'}`}>[ HUNTER_REGISTRY ]</button>
                        </div>
                    </div>
                </div>
             </div>
             <button onClick={onLogout} className="p-2 border border-red-900/30 rounded hover:bg-red-900/20 hover:text-red-500 text-gray-600 transition-all flex items-center gap-2 text-xs">
                <LogOut size={14} /> <span>DISCONNECT</span>
             </button>
          </div>
       </header>

       <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full pb-24">
           
           {activeTab === 'PROTOCOLS' && (
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   {/* Left Sidebar: Categories */}
                   <div className="lg:col-span-1 space-y-2">
                       <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-4 font-bold flex items-center gap-2">
                           <Database size={12} /> SELECT DATASET
                       </h3>
                       {CATEGORIES.map(cat => (
                           <button
                             key={cat.id}
                             onClick={() => { setSelectedCategory(cat.id); setSelectedWeek(1); setSelectedDayIdx(0); }}
                             className={`w-full text-left p-3 rounded border font-bold text-xs transition-all relative overflow-hidden ${selectedCategory === cat.id ? 'bg-system-neon border-system-neon text-black' : 'bg-system-card border-gray-800 text-gray-500 hover:border-gray-600'}`}
                           >
                               {cat.label}
                               {selectedCategory === cat.id && <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2" size={14} />}
                           </button>
                       ))}
                   </div>

                   {/* Right Area: Deep Editor */}
                   <div className="lg:col-span-3 space-y-6">
                       <div className="bg-system-card border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                           <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900/20">
                               <div>
                                   <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">{CATEGORIES.find(c => c.id === selectedCategory)?.label}</h2>
                                   <div className="flex gap-4 mt-2">
                                       <div className="flex items-center gap-2">
                                           <span className="text-[10px] text-gray-500 font-bold uppercase">Phase Select:</span>
                                           {[1, 2, 3, 4].map(w => (
                                               <button 
                                                 key={w}
                                                 onClick={() => setSelectedWeek(w)}
                                                 className={`w-8 h-8 rounded border font-bold text-xs transition-all ${selectedWeek === w ? 'bg-white text-black border-white shadow-[0_0_10px_white]' : 'bg-black border-gray-800 text-gray-600 hover:text-white'}`}
                                               >
                                                   W{w}
                                               </button>
                                           ))}
                                       </div>
                                   </div>
                               </div>
                               <button 
                                 onClick={handleSaveProtocol}
                                 disabled={isSaving}
                                 className="px-6 py-2 bg-system-neon text-black font-black rounded flex items-center gap-2 hover:bg-white transition-all text-xs"
                               >
                                   {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                                   DEPLOY GLOBAL CHANGES
                               </button>
                           </div>

                           <div className="grid grid-cols-7 border-b border-gray-800 divide-x divide-gray-800 bg-black">
                               {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d, idx) => (
                                   <button 
                                      key={d}
                                      onClick={() => setSelectedDayIdx(idx)}
                                      className={`p-3 text-[10px] font-bold transition-colors ${selectedDayIdx === idx ? 'bg-system-neon text-black' : 'text-gray-600 hover:bg-white/5'}`}
                                   >
                                       {d}
                                   </button>
                               ))}
                           </div>

                           <div className="p-6 min-h-[400px]">
                               <AnimatePresence mode="wait">
                                   {currentDay ? (
                                       <motion.div 
                                           key={`${selectedCategory}-${selectedWeek}-${selectedDayIdx}`}
                                           initial={{ opacity: 0, x: 20 }}
                                           animate={{ opacity: 1, x: 0 }}
                                           exit={{ opacity: 0, x: -20 }}
                                           className="space-y-6"
                                       >
                                           <div className="flex justify-between items-end border-b border-gray-800 pb-4">
                                               <div>
                                                   <h3 className="text-sm font-black text-system-neon tracking-[0.2em]">{currentDay.focus} INSTANCE</h3>
                                                   <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">{currentDay.day}</p>
                                               </div>
                                               <div className="text-right">
                                                   <div className="text-[10px] text-gray-500 font-bold">EST. DURATION</div>
                                                   <div className="text-lg font-black text-white">{currentDay.totalDuration} MIN</div>
                                               </div>
                                           </div>

                                           <Reorder.Group axis="y" values={currentDay.exercises} onReorder={handleReorderExercises} className="space-y-3">
                                               {currentDay.exercises.map((ex, exIdx) => (
                                                   <Reorder.Item 
                                                        key={ex.id || ex.name} 
                                                        value={ex}
                                                        className="bg-black/40 border border-gray-800 rounded-lg p-4 group hover:border-gray-600 transition-colors relative cursor-grab active:cursor-grabbing"
                                                   >
                                                       <div className="flex items-start gap-3">
                                                           {/* Drag Handle */}
                                                           <div className="pt-3 text-gray-700 group-hover:text-gray-500">
                                                               <GripVertical size={16} />
                                                           </div>

                                                           <div className="flex-1 flex flex-col gap-4">
                                                               {/* Row 1: Main Info Editable */}
                                                               <div className="flex flex-col md:flex-row gap-3">
                                                                   <div className="flex-1">
                                                                       <label className="text-[8px] text-gray-600 uppercase font-bold">Exercise Name</label>
                                                                       <input 
                                                                           value={ex.name}
                                                                           onChange={(e) => handleUpdateExerciseField(exIdx, 'name', e.target.value)}
                                                                           className="w-full bg-black border border-gray-800 rounded p-2 text-xs font-bold text-white focus:border-system-neon focus:outline-none"
                                                                       />
                                                                   </div>
                                                                   <div className="w-24">
                                                                       <label className="text-[8px] text-gray-600 uppercase font-bold">Sets</label>
                                                                       <input 
                                                                           type="number"
                                                                           value={ex.sets}
                                                                           onChange={(e) => handleUpdateExerciseField(exIdx, 'sets', parseInt(e.target.value))}
                                                                           className="w-full bg-black border border-gray-800 rounded p-2 text-xs font-mono text-white focus:border-system-neon focus:outline-none"
                                                                       />
                                                                   </div>
                                                                   <div className="w-32">
                                                                       <label className="text-[8px] text-gray-600 uppercase font-bold">Reps/Duration</label>
                                                                       <input 
                                                                           value={ex.reps}
                                                                           onChange={(e) => handleUpdateExerciseField(exIdx, 'reps', e.target.value)}
                                                                           className="w-full bg-black border border-gray-800 rounded p-2 text-xs font-mono text-system-neon focus:border-system-neon focus:outline-none"
                                                                       />
                                                                   </div>
                                                                   <div className="w-32">
                                                                       <label className="text-[8px] text-gray-600 uppercase font-bold">Type</label>
                                                                       <select 
                                                                           value={ex.type}
                                                                           onChange={(e) => handleUpdateExerciseField(exIdx, 'type', e.target.value)}
                                                                           className="w-full bg-black border border-gray-800 rounded p-2 text-xs font-bold text-gray-400 focus:border-system-neon focus:outline-none"
                                                                       >
                                                                           <option value="COMPOUND">COMPOUND</option>
                                                                           <option value="ACCESSORY">ACCESSORY</option>
                                                                           <option value="CARDIO">CARDIO</option>
                                                                           <option value="STRETCH">STRETCH</option>
                                                                       </select>
                                                                   </div>
                                                               </div>

                                                               {/* Row 2: Metadata & Actions */}
                                                               <div className="flex flex-col md:flex-row gap-4 items-end">
                                                                   <div className="flex-1 space-y-2 w-full">
                                                                       <div className="relative">
                                                                           <Video size={12} className="absolute left-2 top-2.5 text-gray-500" />
                                                                           <input 
                                                                               value={ex.videoUrl || ''} 
                                                                               onChange={e => handleUpdateExerciseField(exIdx, 'videoUrl', e.target.value)}
                                                                               placeholder="Neural Link (Video URL)..." 
                                                                               className="w-full bg-black border border-gray-800 rounded py-1.5 pl-7 pr-2 text-[10px] text-gray-300 focus:outline-none focus:border-system-neon transition-colors font-mono"
                                                                           />
                                                                       </div>
                                                                       <div className="relative">
                                                                           <Activity size={12} className="absolute left-2 top-2.5 text-gray-500" />
                                                                           <input 
                                                                               value={ex.notes || ''} 
                                                                               onChange={e => handleUpdateExerciseField(exIdx, 'notes', e.target.value)}
                                                                               placeholder="Technical notes..." 
                                                                               className="w-full bg-black border border-gray-800 rounded py-1.5 pl-7 pr-2 text-[10px] text-gray-500 focus:outline-none focus:border-gray-600 transition-colors italic"
                                                                           />
                                                                       </div>
                                                                   </div>

                                                                   <div className="flex gap-2">
                                                                       <button 
                                                                           onClick={() => handleDeleteExercise(exIdx)}
                                                                           className="p-2 border border-red-900/30 bg-red-950/10 rounded text-red-700 hover:bg-red-900/30 hover:text-red-500 transition-colors"
                                                                           title="Delete from this day"
                                                                       >
                                                                           <Trash2 size={16} />
                                                                       </button>
                                                                       <button 
                                                                           onClick={() => handleDeleteEverywhere(ex.name)}
                                                                           className="p-2 border border-red-600 bg-red-600 text-black rounded font-bold hover:bg-white hover:text-red-600 transition-colors shadow-[0_0_10px_rgba(220,38,38,0.4)]"
                                                                           title="DELETE FROM EVERYWHERE (Global)"
                                                                       >
                                                                           <Globe size={16} />
                                                                       </button>
                                                                   </div>
                                                               </div>
                                                           </div>
                                                       </div>
                                                   </Reorder.Item>
                                               ))}
                                           </Reorder.Group>

                                           <button 
                                               onClick={handleAddExercise}
                                               className="w-full py-3 border-2 border-dashed border-gray-800 rounded-lg text-gray-500 font-bold text-xs uppercase tracking-widest hover:border-system-neon hover:text-system-neon hover:bg-system-neon/5 transition-all flex items-center justify-center gap-2"
                                           >
                                               <Plus size={16} /> Add Exercise Protocol
                                           </button>
                                       </motion.div>
                                   ) : (
                                       <div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-700">
                                            <ShieldAlert size={48} className="mb-4 opacity-20" />
                                            <p className="text-[10px] uppercase font-bold tracking-widest">Dataset Empty or Locked</p>
                                            <p className="text-[9px] mt-2 max-w-xs leading-relaxed">Ensure protocol text has been analyzed and formatted into the system core registry.</p>
                                       </div>
                                   )}
                               </AnimatePresence>
                           </div>
                       </div>
                   </div>
               </div>
           )}

           {activeTab === 'EXERCISES' && (
               <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
                   <div className="bg-gray-900/30 border border-gray-800 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                       <div>
                           <h2 className="text-white font-bold flex items-center gap-2"><List size={18} className="text-system-neon" /> GLOBAL EXERCISE REGISTRY</h2>
                           <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">Exercises available for custom plan creation</p>
                       </div>
                       <div className="flex gap-2">
                           <button onClick={handleSyncFromProtocols} className="px-4 py-2 bg-gray-800 text-gray-300 font-bold rounded flex items-center gap-2 hover:bg-gray-700 transition-all text-xs border border-gray-700">
                               <Download size={14} /> SCAN & IMPORT
                           </button>
                           <button onClick={handleSaveExerciseDB} disabled={isSaving} className="px-6 py-2 bg-system-neon text-black font-bold rounded flex items-center gap-2 hover:bg-white transition-all disabled:opacity-50 text-xs shadow-[0_0_15px_rgba(0,210,255,0.3)]">
                               {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                               SAVE DB
                           </button>
                       </div>
                   </div>

                   <div className="bg-[#050505] border border-gray-800 rounded-xl overflow-hidden shadow-2xl p-4">
                       <div className="flex justify-between mb-4">
                           <div className="relative flex-1 max-w-md">
                               <Search size={16} className="absolute left-3 top-3 text-gray-600" />
                               <input 
                                   value={exerciseSearch}
                                   onChange={e => setExerciseSearch(e.target.value)}
                                   placeholder="SEARCH REGISTRY..."
                                   className="w-full bg-black border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:border-system-neon outline-none"
                               />
                           </div>
                           <button onClick={handleAddDBExercise} className="px-4 py-2 bg-system-neon/10 text-system-neon border border-system-neon/30 rounded font-bold text-xs flex items-center gap-2 hover:bg-system-neon hover:text-black transition-colors">
                               <Plus size={14} /> ADD EXERCISE
                           </button>
                       </div>

                       <div className="overflow-x-auto">
                           <table className="w-full text-left border-collapse">
                               <thead>
                                   <tr className="bg-gray-900/50 text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-gray-800">
                                       <th className="p-3 w-1/3">Name</th>
                                       <th className="p-3 w-1/4">Muscle Group</th>
                                       <th className="p-3">Video Link</th>
                                       <th className="p-3 w-16 text-center">Action</th>
                                   </tr>
                               </thead>
                               <tbody className="text-xs font-mono">
                                   {exerciseList
                                       .filter(ex => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
                                       .map((ex) => (
                                       <tr key={ex.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors group">
                                           <td className="p-2">
                                               <input 
                                                   value={ex.name}
                                                   onChange={(e) => handleUpdateDBExercise(ex.id, 'name', e.target.value)}
                                                   className="w-full bg-transparent border-none text-white focus:outline-none focus:text-system-neon"
                                               />
                                           </td>
                                           <td className="p-2">
                                               <select 
                                                   value={ex.muscleGroup}
                                                   onChange={(e) => handleUpdateDBExercise(ex.id, 'muscleGroup', e.target.value)}
                                                   className="w-full bg-transparent border border-gray-800 rounded p-1 text-gray-400 focus:outline-none focus:border-system-neon focus:text-white"
                                               >
                                                   {TARGET_GROUPS.map(g => (
                                                       <option key={g} value={g} className="bg-black">{g}</option>
                                                   ))}
                                               </select>
                                           </td>
                                           <td className="p-2">
                                               <input 
                                                   value={ex.videoUrl || ''}
                                                   onChange={(e) => handleUpdateDBExercise(ex.id, 'videoUrl', e.target.value)}
                                                   placeholder="No link"
                                                   className="w-full bg-transparent border-none text-gray-500 focus:outline-none focus:text-white truncate"
                                               />
                                           </td>
                                           <td className="p-2 text-center">
                                               <button onClick={() => handleDeleteDBExercise(ex.id)} className="text-gray-700 hover:text-red-500 transition-colors">
                                                   <Trash2 size={14} />
                                               </button>
                                           </td>
                                       </tr>
                                   ))}
                                   {exerciseList.length === 0 && (
                                       <tr>
                                           <td colSpan={4} className="p-8 text-center text-gray-600">Database Empty. Try "SCAN & IMPORT".</td>
                                       </tr>
                                   )}
                               </tbody>
                           </table>
                       </div>
                   </div>
               </div>
           )}

           {activeTab === 'REGIONS' && (
               <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
                   <div className="bg-gray-900/30 border border-gray-800 p-6 rounded-xl flex justify-between items-center">
                       <div>
                           <h2 className="text-white font-bold flex items-center gap-2"><Activity size={18} className="text-system-accent" /> NEURAL VISUALIZER MAPPING</h2>
                           <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">Global exercise video pointers (Synced across all users)</p>
                       </div>
                       <button onClick={handleSaveRegions} disabled={isSaving} className="px-6 py-2 bg-system-accent text-white font-bold rounded flex items-center gap-2 hover:bg-white hover:text-black transition-all disabled:opacity-50 text-xs shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                           {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                           SYNC NEURAL LINKS
                       </button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'CORE', 'CARDIO', 'REST'].map((region) => (
                           <div key={region} className="bg-[#050505] border border-gray-800 rounded-xl overflow-hidden group hover:border-system-accent/50 transition-colors">
                               <div className="aspect-video bg-gray-900 relative">
                                   {regionVideos[region] ? (
                                       isEmbed(regionVideos[region]) ? (
                                           <iframe src={regionVideos[region]} className="w-full h-full opacity-60 group-hover:opacity-100 transition-opacity" title={region} />
                                       ) : (
                                           <video src={regionVideos[region]} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" autoPlay loop muted playsInline />
                                       )
                                   ) : (
                                       <div className="flex items-center justify-center h-full text-gray-800"><Video size={32} /></div>
                                   )}
                                   <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold text-white border border-gray-700 font-mono tracking-widest uppercase">{region}</div>
                               </div>
                               <div className="p-4 border-t border-gray-800">
                                   <div className="relative">
                                       <Link size={14} className="absolute left-3 top-3 text-gray-600" />
                                       <input value={regionVideos[region] || ''} onChange={(e) => setRegionVideos({...regionVideos, [region]: e.target.value})} placeholder="Input Video URL (MP4/YT)..." className="w-full bg-black border border-gray-800 rounded p-2 pl-9 text-[10px] text-white focus:outline-none focus:border-system-accent font-mono" />
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
           )}

           {activeTab === 'USERS' && (
               <div className="space-y-6 animate-in fade-in duration-500">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="bg-gray-900/40 border border-gray-800 p-4 rounded-xl">
                           <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Registered Hunters</div>
                           <div className="text-2xl font-bold text-white">{users.length}</div>
                       </div>
                       <div className="bg-gray-900/40 border border-gray-800 p-4 rounded-xl md:col-span-2">
                            <div className="relative h-full flex items-center">
                                <Search size={16} className="absolute left-3 text-gray-600" />
                                <input 
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                    placeholder="SEARCH HUNTER REGISTRY..."
                                    className="w-full h-full bg-black border border-gray-800 rounded-lg pl-10 pr-4 text-xs text-white focus:border-system-neon outline-none"
                                />
                            </div>
                       </div>
                   </div>

                   <div className="bg-system-card border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                       <div className="overflow-x-auto">
                           <table className="w-full text-left border-collapse">
                               <thead>
                                   <tr className="bg-gray-900/50 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                       <th className="p-4 border-b border-gray-800">Hunter Identity</th>
                                       <th className="p-4 border-b border-gray-800">Class/Rank</th>
                                       <th className="p-4 border-b border-gray-800">Biometrics</th>
                                       <th className="p-4 border-b border-gray-800 text-right">Last Sync</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   {users.filter(u => u.username?.toLowerCase().includes(userSearch.toLowerCase())).map((user) => (
                                       <tr key={user.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                           <td className="p-4 font-bold text-sm text-white">{user.username || 'ANONYMOUS'}</td>
                                           <td className="p-4"><span className="text-[10px] bg-gray-800 px-2 py-1 rounded text-gray-400 font-bold tracking-widest uppercase">Rank: {user.raw_data?.rank || 'E'}</span></td>
                                           <td className="p-4 text-xs text-gray-500">{user.name}</td>
                                           <td className="p-4 text-right text-[10px] text-gray-600">{new Date(user.updated_at).toLocaleDateString()}</td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                   </div>
               </div>
           )}
       </main>
    </div>
  );
};

export default AdminDashboard;
