
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Database, Save, X, Search, RefreshCw, Video, Image as ImageIcon, CheckCircle, AlertCircle, Link, Map, Target, Play, AlertTriangle, Code } from 'lucide-react';
import { AdminExercise } from '../types';
import { useSystem } from '../hooks/useSystem';
import { supabase } from '../lib/supabase';
import WorkoutPlanPreview from './WorkoutPlanPreview'; 

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { updateExerciseDatabase, updateFocusVideos, player } = useSystem();
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'ASSETS' | 'PREVIEW' | 'REGIONS'>('ASSETS'); 
  const [exercises, setExercises] = useState<AdminExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Region Video State
  const [regionVideos, setRegionVideos] = useState<Record<string, string>>(player.focusVideos || {});
  
  // Modal State
  const [editingExercise, setEditingExercise] = useState<AdminExercise | null>(null);
  const [editForm, setEditForm] = useState({ videoUrl: '', imageUrl: '' });
  const [saving, setSaving] = useState(false);
  
  // Video Preview Error State
  const [videoError, setVideoError] = useState(false);

  // --- HELPERS ---
  const processVideoInput = (input: string) => {
      // If user pastes an iframe code, extract the src
      if (input.includes('<iframe')) {
          const match = input.match(/src="([^"]+)"/);
          return match ? match[1] : input;
      }
      return input;
  };

  const isEmbed = (url: string) => {
      // Loose check: If it doesn't look like a file extension, assume it's an embed URL
      // Also check for common embed domains to be safe
      if (!url) return false;
      const clean = url.toLowerCase();
      const hasExtension = /\.(mp4|webm|ogg|mov)$/.test(clean);
      const isKnownEmbed = clean.includes('youtube') || clean.includes('vimeo') || clean.includes('screenpal') || clean.includes('loom');
      return isKnownEmbed || !hasExtension;
  };

  // --- FETCH DATA ---
  const fetchExercises = async () => {
      setLoading(true);
      try {
          const { data, error } = await supabase
              .from('exercises')
              .select('*')
              .order('name', { ascending: true });

          if (error) throw error;

          if (data) {
              const mappedExercises: AdminExercise[] = data.map((e: any) => ({
                  id: e.id,
                  name: e.name,
                  muscleGroup: e.muscle_group,
                  subTarget: e.sub_target,
                  difficulty: e.difficulty,
                  equipmentNeeded: e.equipment_needed, 
                  environment: e.environment, 
                  imageUrl: e.image_url,
                  videoUrl: e.video_url,
                  caloriesBurn: e.calories_burn || 5
              }));
              
              setExercises(mappedExercises);
              updateExerciseDatabase(mappedExercises);
          }
      } catch (err: any) {
          console.error("Fetch Error:", err.message);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchExercises();
  }, []);

  useEffect(() => {
      setRegionVideos(player.focusVideos || {});
  }, [player.focusVideos]);

  // --- ACTIONS ---
  const openEditModal = (ex: AdminExercise) => {
      setEditingExercise(ex);
      setEditForm({
          videoUrl: ex.videoUrl || '',
          imageUrl: ex.imageUrl || ''
      });
      setVideoError(false);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingExercise) return;

      setSaving(true);
      try {
          const cleanVideoUrl = processVideoInput(editForm.videoUrl);

          const { error } = await supabase
              .from('exercises')
              .update({
                  video_url: cleanVideoUrl || null,
                  image_url: editForm.imageUrl || null
              })
              .eq('id', editingExercise.id);

          if (error) throw error;

          const updatedList = exercises.map(ex => 
              ex.id === editingExercise.id 
                  ? { ...ex, videoUrl: cleanVideoUrl, imageUrl: editForm.imageUrl }
                  : ex
          );
          setExercises(updatedList);
          updateExerciseDatabase(updatedList);
          
          setEditingExercise(null); 

      } catch (err: any) {
          alert(`Sync Failed: ${err.message}`);
      } finally {
          setSaving(false);
      }
  };

  const handleSaveRegions = () => {
      updateFocusVideos(regionVideos);
  };

  const filteredExercises = exercises
    .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
        const aHasVideo = !!a.videoUrl;
        const bHasVideo = !!b.videoUrl;
        if (aHasVideo === bHasVideo) return 0;
        return aHasVideo ? 1 : -1; 
    });

  const missingVideoCount = exercises.filter(e => !e.videoUrl).length;
  const progressPercent = exercises.length > 0 ? Math.round(((exercises.length - missingVideoCount) / exercises.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col">
       <header className="sticky top-0 z-30 bg-black/90 backdrop-blur border-b border-gray-800 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white text-black rounded flex items-center justify-center">
                        <Database size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter">GAME MASTER</h1>
                        <div className="flex gap-4">
                            <button onClick={() => setActiveTab('ASSETS')} className={`text-[10px] font-bold tracking-widest ${activeTab === 'ASSETS' ? 'text-system-neon underline' : 'text-gray-500 hover:text-white'}`}>ASSET DB</button>
                            <button onClick={() => setActiveTab('REGIONS')} className={`text-[10px] font-bold tracking-widest ${activeTab === 'REGIONS' ? 'text-system-neon underline' : 'text-gray-500 hover:text-white'}`}>REGION MAPS</button>
                            <button onClick={() => setActiveTab('PREVIEW')} className={`text-[10px] font-bold tracking-widest ${activeTab === 'PREVIEW' ? 'text-system-neon underline' : 'text-gray-500 hover:text-white'}`}>WORKOUT PREVIEW</button>
                        </div>
                    </div>
                </div>
                {activeTab === 'ASSETS' && (
                    <div className="hidden md:block flex-1 min-w-[200px]">
                        <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-system-neon">VIDEO COVERAGE</span>
                            <span className="text-white">{progressPercent}%</span>
                        </div>
                        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-system-neon to-system-accent transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>
                )}
             </div>
             <div className="flex gap-2 w-full md:w-auto">
                {activeTab === 'ASSETS' && (
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-600" size={14} />
                        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search exercises..." className="w-full bg-gray-900 border border-gray-800 rounded px-9 py-2 text-xs focus:outline-none focus:border-system-neon" />
                    </div>
                )}
                {activeTab === 'ASSETS' && (
                    <button onClick={() => fetchExercises()} className="p-2 border border-gray-800 rounded hover:bg-gray-800 text-gray-400" title="Refresh Data"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
                )}
                <button onClick={onLogout} className="p-2 border border-gray-800 rounded hover:bg-red-900/20 hover:text-red-500 text-gray-400" title="Logout"><LogOut size={16} /></button>
             </div>
          </div>
       </header>

       <main className="flex-1 p-4 md:p-6 overflow-y-auto">
           {activeTab === 'PREVIEW' ? <WorkoutPlanPreview /> : activeTab === 'REGIONS' ? (
               <div className="max-w-5xl mx-auto space-y-6">
                   <div className="bg-gray-900/30 border border-gray-800 p-4 rounded-lg flex justify-between items-center">
                       <div>
                           <h2 className="text-white font-bold flex items-center gap-2"><Map size={18} className="text-system-accent" /> VISUAL ANATOMY MAPPING (VIDEO)</h2>
                           <p className="text-xs text-gray-500">Assign looping video footage for each workout focus region.</p>
                       </div>
                       <button onClick={handleSaveRegions} className="px-6 py-2 bg-system-accent text-white font-bold rounded flex items-center gap-2 hover:bg-white hover:text-black transition-colors"><Save size={16} /> SAVE CONFIG</button>
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
                                       <input value={regionVideos[region] || ''} onChange={(e) => setRegionVideos({...regionVideos, [region]: processVideoInput(e.target.value)})} placeholder="Video URL or Embed Code..." className="w-full bg-gray-900 border border-gray-700 rounded p-2 pl-9 text-xs text-white focus:outline-none focus:border-system-accent font-mono" />
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
           ) : (
               <>
                   <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                       <AnimatePresence>
                           {filteredExercises.map((ex) => {
                               const hasVideo = !!ex.videoUrl;
                               const hasImage = !!ex.imageUrl;
                               return (
                                   <motion.div key={ex.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={() => openEditModal(ex)} className={`relative p-4 rounded-lg border cursor-pointer group transition-all ${hasVideo ? 'bg-gray-900/20 border-gray-800 hover:border-gray-600' : 'bg-red-950/10 border-red-900/30 hover:border-red-500/50'}`}>
                                       <div className="absolute top-4 right-4">
                                           {hasVideo ? <CheckCircle size={16} className="text-system-success/50" /> : <div className="relative"><div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute opacity-75" /><div className="w-3 h-3 bg-red-600 rounded-full relative z-10 border border-black" /></div>}
                                       </div>
                                       <div className="pr-6">
                                           <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{ex.muscleGroup} {ex.environment && <span className="text-[9px] text-system-neon ml-1">/ {ex.environment}</span>}</div>
                                           <h3 className="text-sm font-bold text-white leading-tight group-hover:text-system-neon transition-colors">{ex.name}</h3>
                                           <div className="mt-3 flex gap-2">
                                               <span className={`text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${hasImage ? 'text-gray-400 border-gray-700' : 'text-red-500 border-red-900/50'}`}><ImageIcon size={10} /> {hasImage ? 'IMG' : 'NO IMG'}</span>
                                               <span className={`text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${hasVideo ? 'text-system-neon border-system-neon/30' : 'text-red-500 border-red-900/50'}`}><Video size={10} /> {hasVideo ? 'LINKED' : 'MISSING'}</span>
                                           </div>
                                       </div>
                                   </motion.div>
                               );
                           })}
                       </AnimatePresence>
                   </div>
                   {filteredExercises.length === 0 && !loading && (
                       <div className="flex flex-col items-center justify-center h-64 text-gray-600"><Database size={48} className="mb-4 opacity-50" /><p>NO ASSETS FOUND</p></div>
                   )}
               </>
           )}
       </main>

       <AnimatePresence>
           {editingExercise && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-[#0a0a0a] border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                       <div className="p-6 border-b border-gray-800 flex justify-between items-start shrink-0">
                           <div>
                               <div className="text-[10px] text-system-neon font-bold tracking-widest uppercase mb-1">EDITING ASSET ID: {editingExercise.id.substring(0, 8)}...</div>
                               <h2 className="text-2xl font-black text-white italic tracking-tighter">{editingExercise.name}</h2>
                               <span className="inline-block mt-2 text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700">{editingExercise.muscleGroup} // {editingExercise.difficulty} // {editingExercise.environment || 'Any'}</span>
                           </div>
                           <button onClick={() => setEditingExercise(null)} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
                       </div>

                       <div className="overflow-y-auto p-6 space-y-6">
                           <div className="relative aspect-video bg-black rounded-lg border border-gray-800 overflow-hidden group">
                               {editForm.videoUrl && !videoError ? (
                                   isEmbed(editForm.videoUrl) ? (
                                       <iframe 
                                           src={editForm.videoUrl} 
                                           className="w-full h-full" 
                                           title="Preview" 
                                           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                           allowFullScreen
                                       />
                                   ) : (
                                       <video key={editForm.videoUrl} src={editForm.videoUrl} className="w-full h-full object-contain" autoPlay loop muted playsInline onError={() => setVideoError(true)} />
                                   )
                               ) : (
                                   <div className="flex flex-col items-center justify-center h-full text-gray-700">
                                       {videoError ? (
                                           <><AlertTriangle size={32} className="text-red-500 mb-2" /><span className="text-xs font-mono text-red-500">PLAYBACK ERROR</span><span className="text-[9px] text-gray-500 mt-1">Try using an Embed Code or direct link.</span></>
                                       ) : (
                                           <><Video size={32} className="mb-2" /><span className="text-xs font-mono">NO SIGNAL</span></>
                                       )}
                                   </div>
                               )}
                               <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded border border-gray-700 text-[9px] font-mono text-system-neon">LIVE PREVIEW</div>
                           </div>

                           <form id="edit-form" onSubmit={handleSaveAsset} className="space-y-4">
                               <div className="space-y-2">
                                   <label className="text-xs font-bold text-gray-400 flex items-center gap-2"><Code size={14} className="text-system-neon" /> VIDEO SOURCE / EMBED CODE</label>
                                   <div className="relative">
                                       <input value={editForm.videoUrl} onChange={(e) => { setEditForm(prev => ({...prev, videoUrl: processVideoInput(e.target.value)})); setVideoError(false); }} className="w-full bg-black border border-gray-700 rounded p-3 pl-10 text-sm text-white focus:border-system-neon focus:outline-none font-mono" placeholder="Paste URL or <iframe> code..." autoFocus />
                                       <Link className="absolute left-3 top-3 text-gray-600" size={16} />
                                   </div>
                                   {!editForm.videoUrl && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} /> REQUIRED</p>}
                               </div>
                               <div className="space-y-2">
                                   <label className="text-xs font-bold text-gray-400 flex items-center gap-2"><ImageIcon size={14} className="text-system-accent" /> THUMBNAIL IMAGE URL</label>
                                   <div className="flex gap-4">
                                       <div className="relative flex-1">
                                           <input value={editForm.imageUrl} onChange={(e) => setEditForm(prev => ({...prev, imageUrl: e.target.value}))} className="w-full bg-black border border-gray-700 rounded p-3 pl-10 text-sm text-white focus:border-system-accent focus:outline-none font-mono" placeholder="Paste image URL here..." />
                                           <Link className="absolute left-3 top-3 text-gray-600" size={16} />
                                       </div>
                                       <div className="w-12 h-12 bg-gray-900 border border-gray-800 rounded overflow-hidden shrink-0 flex items-center justify-center">
                                           {editForm.imageUrl ? <img src={editForm.imageUrl} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-gray-700" />}
                                       </div>
                                   </div>
                               </div>
                           </form>
                       </div>

                       <div className="p-6 border-t border-gray-800 flex justify-end gap-3 shrink-0 bg-[#0a0a0a]">
                           <button type="button" onClick={() => setEditingExercise(null)} className="px-6 py-3 rounded text-xs font-bold text-gray-500 hover:text-white transition-colors">CANCEL</button>
                           <button type="submit" form="edit-form" disabled={saving} className="px-8 py-3 bg-system-neon text-black font-black rounded flex items-center gap-2 hover:bg-white transition-colors disabled:opacity-50">{saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}{saving ? 'SYNCING...' : 'SAVE ASSET'}</button>
                       </div>
                   </motion.div>
               </div>
           )}
       </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
