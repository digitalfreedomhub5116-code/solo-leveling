
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Database, Save, X, RefreshCw, Video, CheckCircle, Link, Map, Layers } from 'lucide-react';
import { AdminExercise } from '../types';
import { useSystem, DUMMY_VIDEO } from '../hooks/useSystem'; // Imported DUMMY_VIDEO
import { supabase } from '../lib/supabase';
import WorkoutPlanPreview from './WorkoutPlanPreview'; 

interface AdminDashboardProps {
  onLogout: () => void;
}

const BROKEN_VIDEO_PART = 'github.com/digitalfreedomhub5116-code';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { updateExerciseDatabase, updateFocusVideos, player } = useSystem();
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'ASSETS' | 'PREVIEW' | 'REGIONS'>('REGIONS'); 
  const [exercises, setExercises] = useState<AdminExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const isEmbed = (url: string) => {
      if (!url) return false;
      const clean = url.toLowerCase();
      // If it ends in a video extension, it's a direct file. Otherwise, assume embed.
      const hasDirectExtension = /\.(mp4|webm|ogg|mov)($|\?)/.test(clean);
      const isKnownEmbed = clean.includes('youtube') || clean.includes('youtu.be') || clean.includes('vimeo');
      return isKnownEmbed || !hasDirectExtension;
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
                  let vid = e.video_url || '';
                  // Auto-fix broken links in view
                  if (vid.includes(BROKEN_VIDEO_PART)) vid = DUMMY_VIDEO;

                  return {
                      id: e.id,
                      name: e.name,
                      muscleGroup: e.muscle_group,
                      subTarget: e.sub_target,
                      difficulty: e.difficulty,
                      equipmentNeeded: e.equipment_needed, 
                      environment: e.environment, 
                      imageUrl: e.image_url,
                      videoUrl: vid,
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

  useEffect(() => { fetchExercises(); }, []);
  useEffect(() => { setRegionVideos(player.focusVideos || {}); }, [player.focusVideos]);

  // --- SAVE ACTIONS ---
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
              // Alert removed for smoother experience, maybe show a toast in future
          } else {
              // Silent local save
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

  // Grouping Logic
  const filteredExercises = exercises.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase()));
  const groupedExercises = filteredExercises.reduce((acc, ex) => {
      const group = ex.muscleGroup || 'Uncategorized';
      if (!acc[group]) acc[group] = [];
      acc[group].push(ex);
      return acc;
  }, {} as Record<string, AdminExercise[]>);
  const sortedGroups = Object.keys(groupedExercises).sort();

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
                            <button onClick={() => setActiveTab('REGIONS')} className={`text-[10px] font-bold tracking-widest ${activeTab === 'REGIONS' ? 'text-system-neon underline' : 'text-gray-500 hover:text-white'}`}>REGION MAPS</button>
                            <button onClick={() => setActiveTab('ASSETS')} className={`text-[10px] font-bold tracking-widest ${activeTab === 'ASSETS' ? 'text-system-neon underline' : 'text-gray-500 hover:text-white'}`}>ASSET DB</button>
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
           {activeTab === 'PREVIEW' ? <WorkoutPlanPreview /> : activeTab === 'REGIONS' ? (
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
           ) : (
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
    </div>
  );
};

export default AdminDashboard;
