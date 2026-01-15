
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Database, Save, X, RefreshCw, Video, CheckCircle, Link, Map, Layers, Search, Activity, Trash2, AlertOctagon } from 'lucide-react';
import { AdminExercise, PlayerData } from '../types';
import { useSystem, DUMMY_VIDEO, sanitizeVideoUrl, isEmbed } from '../hooks/useSystem';
import { supabase } from '../lib/supabase';
import WorkoutPlanPreview from './WorkoutPlanPreview'; 

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { updateExerciseDatabase, updateFocusVideos, player } = useSystem();
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'ASSETS' | 'PREVIEW' | 'REGIONS' | 'USERS'>('REGIONS'); 
  const [exercises, setExercises] = useState<AdminExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // User Data State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  
  // Delete User State
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Region Video State
  const [regionVideos, setRegionVideos] = useState<Record<string, string>>(player.focusVideos || {});
  const [regionSaving, setRegionSaving] = useState(false);
  
  // Modal State
  const [editingExercise, setEditingExercise] = useState<AdminExercise | null>(null);
  const [editForm, setEditForm] = useState({ videoUrl: '', imageUrl: '' });
  const [saving, setSaving] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // --- HELPERS ---
  const openEditModal = (exercise: AdminExercise) => {
      setEditingExercise(exercise);
      setEditForm({ videoUrl: exercise.videoUrl || '', imageUrl: exercise.imageUrl || '' });
      setVideoError(false);
  };

  const processVideoInput = (input: string) => {
      if (!input) return '';
      // If user pastes a full iframe tag, extract the src
      if (input.includes('<iframe')) {
          const match = input.match(/src="([^"]+)"/);
          return match ? match[1] : input;
      }
      return input.trim();
  };

  const getErrorMessage = (err: any): string => {
      if (!err) return "Unknown Error";
      if (typeof err === 'string') return err;
      if (err instanceof Error) return err.message;
      if (err.message) return err.message;
      if (err.error_description) return err.error_description;
      try {
          return JSON.stringify(err);
      } catch (e) {
          return String(err);
      }
  };

  // --- DATA LOADING ---
  const fetchExercises = async () => {
      try {
          const { data, error } = await supabase.from('exercises').select('*').order('name', { ascending: true });
          if (error) {
              console.error("Error fetching exercises:", error);
              // Fallback to local system DB if fetch fails
              setExercises(player.exerciseDatabase);
              return;
          }
          if (data) {
              const mapped: AdminExercise[] = data.map((e: any) => {
                  const vid = sanitizeVideoUrl(e.video_url);

                  return {
                      id: e.id,
                      name: e.name,
                      muscleGroup: e.muscle_group,
                      subTarget: e.sub_target,
                      difficulty: e.difficulty,
                      equipmentNeeded: e.equipment_needed, 
                      environment: e.environment, 
                      imageUrl: e.image_url,
                      videoUrl: vid || DUMMY_VIDEO,
                      caloriesBurn: e.calories_burn || 5
                  };
              });
              setExercises(mapped);
              updateExerciseDatabase(mapped);
          }
      } catch (err) {
          console.error("Fetch Error:", err);
          setExercises(player.exerciseDatabase);
      }
  };

  const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
          // Attempt to fetch profiles. 
          // Note: In a real scenario, we'd assume a 'game_data' jsonb column exists containing the PlayerData
          const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .order('updated_at', { ascending: false });

          if (error) throw error;
          setUsers(data || []);
      } catch (err) {
          console.error("Fetch Users Error:", err);
      } finally {
          setLoadingUsers(false);
      }
  };

  useEffect(() => { 
      if (activeTab === 'ASSETS') fetchExercises();
      if (activeTab === 'USERS') fetchUsers();
  }, [activeTab]);

  useEffect(() => { setRegionVideos(player.focusVideos || {}); }, [player.focusVideos]);

  // --- ACTIONS ---
  const handleSaveAsset = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingExercise) return;
      setSaving(true);
      try {
          const cleanVideoUrl = processVideoInput(editForm.videoUrl);
          const { error } = await supabase.from('exercises')
              .update({ video_url: cleanVideoUrl || null, image_url: editForm.imageUrl || null })
              .eq('id', editingExercise.id);

          if (error) throw error;

          const updatedList = exercises.map(ex => ex.id === editingExercise.id ? { ...ex, videoUrl: cleanVideoUrl, imageUrl: editForm.imageUrl } : ex);
          setExercises(updatedList);
          updateExerciseDatabase(updatedList);
          setEditingExercise(null); 
      } catch (err: any) {
          const msg = getErrorMessage(err);
          alert(`Sync Failed: ${msg}`);
      } finally {
          setSaving(false);
      }
  };

  const handleSaveRegions = async () => {
      setRegionSaving(true);
      try {
          // 1. Update React Context immediately (Visually updates app)
          updateFocusVideos(regionVideos);

          // 2. Sync to Supabase
          if (player.userId && !player.userId.startsWith('local-')) {
              const { error } = await supabase.from('profiles')
                  .update({ focus_videos: regionVideos })
                  .eq('id', player.userId);
                  
              if (error) throw error;
          } else {
              console.log("Local mode: Regions saved.");
          }
      } catch (err: any) {
          console.error("Save Error Details:", err);
          const msg = getErrorMessage(err);
          alert(`Database Error: ${msg}`);
      } finally {
          setRegionSaving(false);
      }
  };

  const executeDeleteUser = async () => {
      if (!userToDelete) return;
      setIsDeletingUser(true);
      try {
          // STEP 1: Delete Dependent Data First (Cascading Deletion)
          // To prevent Foreign Key violations if the DB isn't set to CASCADE automatically
          
          // Delete Recovery Questions
          await supabase.from('recovery_questions').delete().eq('user_id', userToDelete.id);
          
          // STEP 2: Delete Profile
          const { error } = await supabase
              .from('profiles')
              .delete()
              .eq('id', userToDelete.id);

          if (error) throw error;

          // STEP 3: Local State Update
          setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
          setUserToDelete(null);
          
      } catch (err: any) {
          const msg = getErrorMessage(err);
          console.error("Deletion Error:", err);
          alert(`Delete Failed: ${msg}. User may still exist in Auth service or has linked records.`);
      } finally {
          setIsDeletingUser(false);
      }
  };

  // Grouping Logic
  const filteredExercises = exercises.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase()));
  const groupedExercises = filteredExercises.reduce((acc, ex) => {
      const group = ex.muscleGroup || 'Uncategorized';
      if (!acc[group]) acc[group] = [];
      acc[group].push(ex);
      return acc;
  }, {} as Record<string, AdminExercise[]>);
  const sortedGroups = Object.keys(groupedExercises).sort();

  // User Filter Logic
  const filteredUsers = users.filter(u => 
      u.username?.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col">
       <header className="sticky top-0 z-30 bg-black/90 backdrop-blur border-b border-gray-800 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white text-black rounded flex items-center justify-center"><Database size={20} /></div>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter">GAME MASTER</h1>
                        <div className="flex gap-4">
                            <button onClick={() => setActiveTab('REGIONS')} className={`text-[10px] font-bold tracking-widest ${activeTab === 'REGIONS' ? 'text-system-neon underline' : 'text-gray-500 hover:text-white'}`}>REGIONS</button>
                            <button onClick={() => setActiveTab('USERS')} className={`text-[10px] font-bold tracking-widest ${activeTab === 'USERS' ? 'text-system-neon underline' : 'text-gray-500 hover:text-white'}`}>USERS</button>
                            <button onClick={() => setActiveTab('ASSETS')} className={`text-[10px] font-bold tracking-widest ${activeTab === 'ASSETS' ? 'text-system-neon underline' : 'text-gray-500 hover:text-white'}`}>DB ASSETS</button>
                            <button onClick={() => setActiveTab('PREVIEW')} className={`text-[10px] font-bold tracking-widest ${activeTab === 'PREVIEW' ? 'text-system-neon underline' : 'text-gray-500 hover:text-white'}`}>PREVIEW</button>
                        </div>
                    </div>
                </div>
             </div>
             <div className="flex gap-2 w-full md:w-auto">
                <button onClick={onLogout} className="p-2 border border-gray-800 rounded hover:bg-red-900/20 hover:text-red-500 text-gray-400" title="Logout"><LogOut size={16} /></button>
             </div>
          </div>
       </header>

       <main className="flex-1 p-4 md:p-6 overflow-y-auto">
           {activeTab === 'PREVIEW' && <WorkoutPlanPreview />}
           
           {activeTab === 'REGIONS' && (
               <div className="max-w-5xl mx-auto space-y-6">
                   <div className="bg-gray-900/30 border border-gray-800 p-4 rounded-lg flex justify-between items-center">
                       <div>
                           <h2 className="text-white font-bold flex items-center gap-2"><Map size={18} className="text-system-accent" /> VISUAL ANATOMY MAPPING</h2>
                           <p className="text-xs text-gray-500">Paste MP4 Links or YouTube/Vimeo URLs. Embeds will be auto-detected.</p>
                       </div>
                       <button onClick={handleSaveRegions} disabled={regionSaving} className="px-6 py-2 bg-system-accent text-white font-bold rounded flex items-center gap-2 hover:bg-white hover:text-black transition-colors disabled:opacity-50">
                           {regionSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                           {regionSaving ? 'SAVING...' : 'SAVE CONFIG'}
                       </button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'CORE', 'CARDIO', 'REST'].map((region) => (
                           <div key={region} className="bg-black border border-gray-800 rounded-xl overflow-hidden group">
                               <div className="aspect-video bg-gray-900 relative">
                                   {regionVideos[region] ? (
                                       isEmbed(regionVideos[region]) ? (
                                           <iframe src={regionVideos[region]} className="w-full h-full opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" title={region} />
                                       ) : (
                                           <video src={regionVideos[region]} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" autoPlay loop muted playsInline />
                                       )
                                   ) : (
                                       <div className="flex items-center justify-center h-full text-gray-700"><Video size={32} /></div>
                                   )}
                                   <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-xs font-bold text-white border border-gray-700">{region}</div>
                               </div>
                               <div className="p-4 border-t border-gray-800">
                                   <div className="relative">
                                       <Link size={14} className="absolute left-3 top-3 text-gray-500" />
                                       <input value={regionVideos[region] || ''} onChange={(e) => setRegionVideos({...regionVideos, [region]: processVideoInput(e.target.value)})} placeholder="Paste URL..." className="w-full bg-gray-900 border border-gray-700 rounded p-2 pl-9 text-xs text-white focus:outline-none focus:border-system-accent font-mono" />
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
           )}

           {activeTab === 'USERS' && (
               <div className="max-w-7xl mx-auto space-y-6">
                   {/* User Stats Header */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="bg-gray-900/40 border border-gray-800 p-4 rounded-lg">
                           <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Hunters</div>
                           <div className="text-2xl font-bold text-white">{users.length}</div>
                       </div>
                       <div className="bg-gray-900/40 border border-gray-800 p-4 rounded-lg">
                           <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Active Today</div>
                           <div className="text-2xl font-bold text-system-neon">
                               {users.filter(u => new Date(u.updated_at).getDate() === new Date().getDate()).length}
                           </div>
                       </div>
                   </div>

                   {/* Toolbar */}
                   <div className="flex justify-between items-center bg-gray-900/30 p-2 rounded-lg border border-gray-800">
                        <div className="relative flex-1 max-w-sm">
                            <Search size={14} className="absolute left-3 top-3 text-gray-500" />
                            <input 
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                placeholder="Search by Codename..."
                                className="w-full bg-black border border-gray-800 rounded px-3 py-2 pl-9 text-xs text-white focus:border-system-neon focus:outline-none"
                            />
                        </div>
                        <button onClick={fetchUsers} className="p-2 text-gray-500 hover:text-white transition-colors">
                            <RefreshCw size={16} className={loadingUsers ? "animate-spin" : ""} />
                        </button>
                   </div>

                   {/* Data Table */}
                   <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
                       <div className="overflow-x-auto">
                           <table className="w-full text-left border-collapse">
                               <thead>
                                   <tr className="bg-gray-900/50 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                       <th className="p-4 border-b border-gray-800">Identity</th>
                                       <th className="p-4 border-b border-gray-800">Rank/Level</th>
                                       <th className="p-4 border-b border-gray-800">Biometrics</th>
                                       <th className="p-4 border-b border-gray-800">Fuel (Cal)</th>
                                       <th className="p-4 border-b border-gray-800 text-center">Daily Quest</th>
                                       <th className="p-4 border-b border-gray-800 text-right">Last Sync</th>
                                       <th className="p-4 border-b border-gray-800 text-right">Actions</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   {filteredUsers.map((user) => {
                                       // Extract Data from potential JSON column or simulate for UI if strictly offline
                                       // Note: This relies on Supabase data structure. If raw_data is missing, we show N/A
                                       const gameData = user.raw_data as PlayerData | undefined; 
                                       const hp = gameData?.healthProfile;
                                       
                                       return (
                                           <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors group">
                                               <td className="p-4">
                                                   <div className="flex items-center gap-3">
                                                       <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-system-neon border border-gray-700">
                                                           {user.username?.substring(0,2).toUpperCase() || 'UN'}
                                                       </div>
                                                       <div>
                                                           <div className="text-sm font-bold text-white group-hover:text-system-neon transition-colors">{user.username || 'Unknown'}</div>
                                                           <div className="text-[10px] text-gray-500">{user.name}</div>
                                                       </div>
                                                   </div>
                                               </td>
                                               <td className="p-4">
                                                   <div className="flex items-center gap-2">
                                                       <span className={`text-xs font-bold ${gameData?.rank === 'S' ? 'text-yellow-500' : 'text-white'}`}>
                                                           {gameData?.rank || 'E'}-Class
                                                       </span>
                                                       <span className="text-[10px] text-gray-600 bg-gray-900 px-1.5 py-0.5 rounded">
                                                           LVL {gameData?.level || 1}
                                                       </span>
                                                   </div>
                                               </td>
                                               <td className="p-4">
                                                   {hp ? (
                                                       <div className="text-xs text-gray-300">
                                                           {hp.height}cm / {hp.weight}kg
                                                       </div>
                                                   ) : (
                                                       <span className="text-[10px] text-gray-700 italic">Not Calibrated</span>
                                                   )}
                                               </td>
                                               <td className="p-4">
                                                   {hp ? (
                                                       <div className="flex items-center gap-1 text-xs text-system-accent">
                                                           <Activity size={12} />
                                                           {hp.macros?.calories || 2000}
                                                       </div>
                                                   ) : (
                                                       <span className="text-gray-800">-</span>
                                                   )}
                                               </td>
                                               <td className="p-4 text-center">
                                                   <div className="flex justify-center">
                                                       {gameData?.dailyQuestComplete ? (
                                                           <CheckCircle size={16} className="text-system-success" />
                                                       ) : (
                                                           <div className="w-4 h-4 rounded-full border-2 border-red-900/50 bg-red-950/20" title="Incomplete" />
                                                       )}
                                                   </div>
                                               </td>
                                               <td className="p-4 text-right">
                                                   <div className="text-[10px] text-gray-500 font-mono">
                                                       {new Date(user.updated_at).toLocaleDateString()}
                                                   </div>
                                               </td>
                                               <td className="p-4 text-right">
                                                   <button 
                                                      onClick={() => setUserToDelete(user)}
                                                      className="p-2 bg-red-900/10 border border-red-900/30 rounded text-red-700 hover:bg-red-600 hover:text-black transition-colors"
                                                      title="Permanently Delete User"
                                                   >
                                                      <Trash2 size={14} />
                                                   </button>
                                               </td>
                                           </tr>
                                       );
                                   })}
                                   {filteredUsers.length === 0 && (
                                       <tr>
                                           <td colSpan={7} className="p-8 text-center text-gray-600 text-xs">
                                               NO DATA FOUND IN SHADOW REGISTRY
                                           </td>
                                       </tr>
                                   )}
                               </tbody>
                           </table>
                       </div>
                   </div>
               </div>
           )}

           {activeTab === 'ASSETS' && (
               <div className="max-w-7xl mx-auto space-y-8">
                   <div className="flex gap-2 mb-4">
                       <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search exercises..." className="bg-gray-900 border border-gray-800 rounded px-4 py-2 text-xs focus:outline-none focus:border-system-neon flex-1" />
                   </div>
                   {sortedGroups.map((group) => (
                       <div key={group}>
                           <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
                               <Layers size={16} className="text-system-neon" />
                               <h2 className="text-lg font-bold text-white tracking-widest uppercase">{group}</h2>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                               {groupedExercises[group].map((ex) => (
                                   <div key={ex.id} onClick={() => openEditModal(ex)} className={`p-4 rounded-lg border cursor-pointer group hover:bg-gray-900 transition-colors ${ex.videoUrl ? 'border-gray-800' : 'border-red-900/30 bg-red-950/10'}`}>
                                       <div className="flex justify-between items-start mb-2">
                                           <span className="text-[10px] font-bold text-gray-500 uppercase">{ex.environment || 'ANY'}</span>
                                           {ex.videoUrl ? <CheckCircle size={14} className="text-system-success" /> : <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                                       </div>
                                       <h3 className="text-sm font-bold text-white group-hover:text-system-neon">{ex.name}</h3>
                                   </div>
                               ))}
                           </div>
                       </div>
                   ))}
               </div>
           )}
       </main>

       {/* EDIT MODAL */}
       <AnimatePresence>
           {editingExercise && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-[#0a0a0a] border border-gray-700 rounded-xl shadow-2xl overflow-hidden p-6">
                       <div className="flex justify-between items-center mb-6">
                           <h2 className="text-xl font-bold text-white">{editingExercise.name}</h2>
                           <button onClick={() => setEditingExercise(null)}><X size={24} className="text-gray-500" /></button>
                       </div>
                       
                       {/* PREVIEW BOX */}
                       <div className="mb-4 aspect-video bg-black rounded border border-gray-800 overflow-hidden relative">
                           {editForm.videoUrl ? (
                               isEmbed(editForm.videoUrl) ? (
                                   <iframe src={editForm.videoUrl} className="w-full h-full" title="Preview" />
                               ) : (
                                   <video src={editForm.videoUrl} className="w-full h-full object-contain" autoPlay loop muted playsInline onError={() => setVideoError(true)} />
                               )
                           ) : (
                               <div className="flex items-center justify-center h-full text-gray-700">NO VIDEO</div>
                           )}
                           {videoError && <div className="absolute inset-0 flex items-center justify-center bg-black text-red-500 text-xs">LOAD ERROR</div>}
                       </div>

                       <form onSubmit={handleSaveAsset} className="space-y-4">
                           <div>
                               <label className="text-xs font-bold text-gray-400 block mb-2">VIDEO URL</label>
                               <input value={editForm.videoUrl} onChange={(e) => { setEditForm({...editForm, videoUrl: processVideoInput(e.target.value)}); setVideoError(false); }} className="w-full bg-black border border-gray-700 rounded p-3 text-sm text-white focus:border-system-neon focus:outline-none" placeholder="Paste URL or Embed..." autoFocus />
                           </div>
                           <div>
                               <label className="text-xs font-bold text-gray-400 block mb-2">IMAGE URL</label>
                               <input value={editForm.imageUrl} onChange={(e) => setEditForm({...editForm, imageUrl: e.target.value})} className="w-full bg-black border border-gray-700 rounded p-3 text-sm text-white focus:border-system-neon focus:outline-none" placeholder="Paste Image URL..." />
                           </div>
                           <div className="flex justify-end gap-3 pt-4">
                               <button type="button" onClick={() => setEditingExercise(null)} className="px-4 py-2 text-gray-500 hover:text-white text-xs font-bold">CANCEL</button>
                               <button type="submit" disabled={saving} className="px-6 py-2 bg-system-neon text-black font-bold rounded text-xs hover:bg-white">{saving ? 'SAVING...' : 'SAVE'}</button>
                           </div>
                       </form>
                   </motion.div>
               </div>
           )}
       </AnimatePresence>

       {/* DELETE USER MODAL */}
       <AnimatePresence>
           {userToDelete && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                   <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.9 }} 
                        className="w-full max-w-md bg-[#0a0a0a] border border-red-600 rounded-xl shadow-[0_0_50px_rgba(220,38,38,0.2)] p-6 overflow-hidden relative"
                   >
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
                        
                        <div className="text-center mb-6">
                            <div className="inline-flex p-4 rounded-full bg-red-950/30 border border-red-600 mb-4">
                                <AlertOctagon size={32} className="text-red-600 animate-pulse" />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-wider mb-2">PERMANENT DELETION</h2>
                            <p className="text-xs text-red-400 font-mono">
                                WARNING: This action cannot be undone. User data will be wiped from the database.
                            </p>
                        </div>

                        <div className="bg-red-950/10 border border-red-900/50 p-4 rounded mb-6 font-mono text-xs">
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-500">TARGET:</span>
                                <span className="text-white font-bold">{userToDelete.username}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-500">NAME:</span>
                                <span className="text-white">{userToDelete.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">ID:</span>
                                <span className="text-gray-600">{userToDelete.id.substring(0,8)}...</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setUserToDelete(null)}
                                className="flex-1 py-3 border border-gray-700 text-gray-400 rounded font-bold text-xs hover:border-white hover:text-white transition-colors"
                            >
                                CANCEL
                            </button>
                            <button 
                                onClick={executeDeleteUser}
                                disabled={isDeletingUser}
                                className="flex-1 py-3 bg-red-600 text-black font-bold rounded text-xs hover:bg-red-500 transition-colors flex items-center justify-center gap-2"
                            >
                                {isDeletingUser ? <RefreshCw className="animate-spin" size={14} /> : <Trash2 size={14} />}
                                {isDeletingUser ? 'ERASING...' : 'CONFIRM DELETE'}
                            </button>
                        </div>
                   </motion.div>
               </div>
           )}
       </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
