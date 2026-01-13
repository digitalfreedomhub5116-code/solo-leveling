
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Target, Dumbbell, Flame, CheckCircle, TrendingUp, ChevronLeft, ChevronRight, Ruler, Fingerprint, Crown, Eye, ChevronDown, ChevronUp, Trophy, Zap, Camera, Upload, Trash2, Maximize2, Search, Utensils, ScanLine, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts';
import { HealthProfile, WorkoutDay, PlayerData, ProgressPhoto, MealLog, FoodItem, LoggedFoodItem } from '../types';
import ActiveWorkoutPlayer from './ActiveWorkoutPlayer';
import WorkoutMap from './WorkoutMap';
import WorkoutOverview from './WorkoutOverview';
import { generateSystemProtocol, calculateTimeEstimate } from '../utils/workoutGenerator';
import { INDIAN_FOOD_DB } from '../utils/indianFoodDb';
import { supabase } from '../lib/supabase'; // Import Supabase Client

interface HealthViewProps {
  healthProfile?: HealthProfile;
  onSaveProfile: (profile: HealthProfile, identity: string) => void;
  onCompleteWorkout: (exercisesCompleted: number, totalExercises: number, results: Record<string, number>, intensityModifier: boolean) => void;
  onFailWorkout: () => void;
  onAddPhoto?: (photo: ProgressPhoto) => void;
  onDeletePhoto?: (id: string) => void;
  onLogMeal?: (meal: MealLog) => void;
  onDeleteMeal?: (id: string) => void;
  playerData: PlayerData;
}

// --- HELPER FUNCTIONS ---
const calculateNutritionPlan = (profile: Partial<HealthProfile>) => {
  // Mifflin-St Jeor Equation
  const weight = profile.weight || 70;
  const height = profile.height || 175;
  const age = profile.age || 25;
  const gender = profile.gender || 'MALE';
  const activity = profile.activityLevel || 'MODERATE';
  const goal = profile.goal || 'BUILD_MUSCLE';

  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr += gender === 'MALE' ? 5 : -161;

  const activityMultipliers: Record<string, number> = {
      'SEDENTARY': 1.2,
      'LIGHT': 1.375,
      'MODERATE': 1.55,
      'VERY_ACTIVE': 1.725
  };
  
  const tdee = bmr * (activityMultipliers[activity] || 1.2);
  
  let targetCalories = tdee;
  if (goal === 'LOSE_WEIGHT') targetCalories -= 500;
  else if (goal === 'BUILD_MUSCLE') targetCalories += 300;
  
  // Macro split (Approximate)
  const protein = Math.round(weight * (goal === 'BUILD_MUSCLE' ? 2.2 : 2.0));
  const fat = Math.round((targetCalories * 0.25) / 9);
  const carbs = Math.round((targetCalories - (protein * 4 + fat * 9)) / 4);

  return {
      bmr: Math.round(bmr),
      macros: {
          calories: Math.round(targetCalories),
          protein,
          fats: fat,
          carbs
      }
  };
};

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const newWidth = Math.min(img.width, MAX_WIDTH);
                const newHeight = img.height * (newWidth / img.width);
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject("Canvas error"); return; }
                
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                // Compress to JPEG 0.7 quality
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressedDataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

// --- SUB-COMPONENTS ---

const NeonSlider: React.FC<{ label: string; value: number; min: number; max: number; unit: string; onChange: (val: number) => void }> = ({ label, value, min, max, unit, onChange }) => {
    return (
        <div className="w-full bg-gray-900/50 p-4 rounded-lg border border-gray-800">
            <div className="flex justify-between mb-2">
                <label className="text-xs font-mono text-gray-500">{label}</label>
                <span className="text-system-neon font-mono font-bold">{value} {unit}</span>
            </div>
            <input 
                type="range" 
                min={min} 
                max={max} 
                value={value} 
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-system-neon"
            />
        </div>
    );
};

const AnalysisView: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 3000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="relative w-32 h-32 mb-8">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-t-4 border-l-4 border-system-neon rounded-full"
                />
                <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 border-b-4 border-r-4 border-system-accent rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <ScanLine size={32} className="text-white animate-pulse" />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-white font-mono mb-2">ANALYZING BIOMETRICS</h2>
            <p className="text-gray-500 font-mono text-xs">CALCULATING OPTIMAL PROTOCOL...</p>
            
            <div className="mt-8 w-full max-w-xs space-y-2">
                {["METABOLIC RATE", "MUSCLE DENSITY", "STRUCTURAL INTEGRITY", "POTENTIAL CAP"].map((item, i) => (
                    <motion.div 
                        key={item}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.5 }}
                        className="flex justify-between text-[10px] font-mono text-gray-400 border-b border-gray-800 pb-1"
                    >
                        <span>{item}</span>
                        <span className="text-system-success">COMPLETE</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const ResultsView: React.FC<{ profile: Partial<HealthProfile>; onConfirm: () => void }> = ({ profile, onConfirm }) => {
    const nutrition = calculateNutritionPlan(profile);
    
    return (
        <div className="h-full flex flex-col">
            <div className="text-center mb-6">
                <Trophy className="w-12 h-12 text-system-neon mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-white font-mono">PROTOCOL GENERATED</h2>
                <p className="text-xs text-gray-500 font-mono">S-RANK POTENTIAL DETECTED</p>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900 p-3 rounded border border-gray-800 text-center">
                        <div className="text-[10px] text-gray-500">DAILY CALORIES</div>
                        <div className="text-xl font-bold text-white">{nutrition.macros.calories}</div>
                    </div>
                    <div className="bg-gray-900 p-3 rounded border border-gray-800 text-center">
                        <div className="text-[10px] text-gray-500">PROTEIN TARGET</div>
                        <div className="text-xl font-bold text-system-accent">{nutrition.macros.protein}g</div>
                    </div>
                </div>

                <div className="bg-gray-900 p-4 rounded border border-gray-800">
                    <h3 className="text-xs font-bold text-gray-400 mb-3 border-b border-gray-800 pb-1">MACRO DISTRIBUTION</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-blue-400">Protein</span>
                            <span className="text-white">{nutrition.macros.protein}g</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: '40%' }} />
                        </div>
                        
                        <div className="flex justify-between text-xs">
                            <span className="text-green-400">Carbs</span>
                            <span className="text-white">{nutrition.macros.carbs}g</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: '35%' }} />
                        </div>

                        <div className="flex justify-between text-xs">
                            <span className="text-yellow-400">Fats</span>
                            <span className="text-white">{nutrition.macros.fats}g</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500" style={{ width: '25%' }} />
                        </div>
                    </div>
                </div>
            </div>

            <button 
                onClick={onConfirm}
                className="w-full mt-6 bg-system-neon text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-white transition-colors"
            >
                <Zap size={18} /> INITIALIZE SYSTEM
            </button>
        </div>
    );
};

const NutritionDashboard: React.FC<{ 
    healthProfile: HealthProfile, 
    logs: MealLog[], 
    onLog: (m: MealLog) => void, 
    onDelete: (id: string) => void 
}> = ({ healthProfile, logs, onLog, onDelete }) => {
    const [view, setView] = useState<'OVERVIEW' | 'BUILDER' | 'SCAN'>('OVERVIEW');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [draftItems, setDraftItems] = useState<LoggedFoodItem[]>([]);
    const [draftImage, setDraftImage] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const consumed = useMemo(() => {
        return logs.reduce((acc, log) => ({
            calories: acc.calories + log.totalCalories,
            protein: acc.protein + log.totalProtein,
            carbs: acc.carbs + log.totalCarbs,
            fats: acc.fats + log.totalFats
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    }, [logs]);

    const remainingCalories = Math.max(0, healthProfile.macros.calories - consumed.calories);
    const caloriesProgress = Math.min(100, (consumed.calories / healthProfile.macros.calories) * 100);

    const filteredFood = useMemo(() => {
        if (!searchTerm) return [];
        return INDIAN_FOOD_DB.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm]);

    const handleAddToDraft = (food: FoodItem) => {
        setDraftItems(prev => [...prev, { ...food, quantity: 1 }]);
        setSearchTerm('');
    };

    const removeFromDraft = (index: number) => {
        setDraftItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setScanning(true);
            setScanError(null);
            
            try {
                // 1. Compress the image first
                const base64DataUrl = await compressImage(e.target.files[0]);
                setDraftImage(base64DataUrl); 
                
                // 2. Strip the Data URI header to get raw base64 for Edge Function
                const rawBase64 = base64DataUrl.split(',')[1];

                // 3. Call Supabase Edge Function
                const { data, error } = await supabase.functions.invoke('analyze-food', {
                    body: { image: rawBase64 }
                });

                if (error) {
                    throw new Error(error.message || "Failed to connect to AI Core.");
                }

                // 4. Handle AI Response
                if (data && data.is_food) {
                    const detectedItem: LoggedFoodItem = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: data.dish_name,
                        calories: data.calories,
                        protein: data.protein,
                        carbs: data.carbs,
                        fats: data.fats,
                        servingSize: "1 Serving",
                        quantity: 1
                    };

                    setDraftItems([detectedItem]);
                    setScanning(false);
                    setView('BUILDER');
                } else {
                    setScanning(false);
                    setScanError("NO ORGANIC MATERIAL OR FOOD SIGNATURE DETECTED");
                }

            } catch (err) {
                console.error("Scan Failed", err);
                setScanning(false);
                setScanError("SYSTEM ERROR: UNABLE TO PROCESS IMAGE");
            } finally {
                // Clear input so selecting the same file again works
                if (cameraInputRef.current) cameraInputRef.current.value = '';
            }
        }
    };

    const commitMeal = () => {
        if (draftItems.length === 0) return;

        const totalCalories = Math.round(draftItems.reduce((sum, item) => sum + (item.calories * item.quantity), 0));
        const totalProtein = Math.round(draftItems.reduce((sum, item) => sum + (item.protein * item.quantity), 0));
        const totalCarbs = Math.round(draftItems.reduce((sum, item) => sum + (item.carbs * item.quantity), 0));
        const totalFats = Math.round(draftItems.reduce((sum, item) => sum + (item.fats * item.quantity), 0));

        const newLog: MealLog = {
            id: Math.random().toString(36).substr(2, 9),
            label: `Meal ${logs.length + 1}`,
            items: draftItems,
            totalCalories,
            totalProtein,
            totalCarbs,
            totalFats,
            timestamp: Date.now(),
            imageUrl: draftImage || undefined
        };

        onLog(newLog);
        
        setDraftItems([]);
        setDraftImage(null);
        setView('OVERVIEW');
    };

    const retryScan = () => {
        setScanError(null);
        setDraftImage(null);
        setScanning(false);
        cameraInputRef.current?.click();
    };

    const macroData = [
        { name: 'Protein', value: consumed.protein, color: '#3b82f6' },
        { name: 'Carbs', value: consumed.carbs, color: '#22c55e' },
        { name: 'Fats', value: consumed.fats, color: '#eab308' },
    ];

    if (view === 'SCAN' && (scanning || scanError)) {
        return (
            <div className={`flex flex-col items-center justify-center h-[400px] border ${scanError ? 'border-system-danger' : 'border-system-neon/50'} rounded-xl bg-black relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,210,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,210,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
                
                {!scanError && (
                    <motion.div 
                        animate={{ top: ['0%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 w-full h-1 bg-system-neon shadow-[0_0_20px_#00d2ff] z-10"
                    />
                )}

                <div className="relative z-20 flex flex-col items-center text-center p-6">
                    {scanError ? (
                        <>
                            <AlertTriangle className="w-16 h-16 text-system-danger mb-4 animate-pulse" />
                            <div className="text-system-danger font-mono text-lg font-bold mb-2">SCAN FAILED</div>
                            <div className="text-xs text-gray-400 font-mono mb-6 max-w-xs">{scanError}</div>
                            
                            <div className="flex gap-4">
                                <button onClick={() => setView('OVERVIEW')} className="text-gray-500 hover:text-white text-xs font-mono">CANCEL</button>
                                <button 
                                    onClick={retryScan}
                                    className="bg-system-danger text-black font-bold px-6 py-2 rounded text-xs font-mono hover:bg-white transition-colors flex items-center gap-2"
                                >
                                    <RefreshCw size={14} /> RETRY SCAN
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <ScanLine className="w-16 h-16 text-system-neon animate-pulse mb-4" />
                            <div className="text-system-neon font-mono text-lg font-bold">ANALYZING MATTER...</div>
                            <div className="text-xs text-gray-500 font-mono mt-2">CALCULATING VOLUME & DENSITY</div>
                        </>
                    )}
                </div>

                {draftImage && (
                    <img src={draftImage} className={`absolute inset-0 w-full h-full object-cover z-0 ${scanError ? 'opacity-20 grayscale' : 'opacity-30'}`} alt="Scanning" />
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* TOP CARD: REMAINING CALORIES */}
            {view === 'OVERVIEW' && (
                <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                        <div className="text-center md:text-left">
                            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">REMAINING BUDGET</div>
                            <div className={`text-6xl md:text-7xl font-black font-mono tracking-tighter ${remainingCalories < 200 ? 'text-red-500' : 'text-white'}`}>
                                {remainingCalories}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                                / {healthProfile.macros.calories} KCAL TARGET
                            </div>
                        </div>

                        <div className="flex items-center gap-6 w-full md:w-auto justify-center md:justify-end">
                            <div className="relative w-20 h-20 shrink-0 hidden sm:block">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie
                                            data={macroData}
                                            innerRadius={25}
                                            outerRadius={35}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {macroData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </RechartsPie>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                    MACROS
                                </div>
                            </div>
                            
                            <div className="flex-1 min-w-[140px] space-y-3">
                                {/* Protein */}
                                <div>
                                    <div className="flex justify-between text-[10px] mb-1 font-mono">
                                        <span className="text-blue-400 font-bold">PRO</span>
                                        <span className="text-gray-400">{consumed.protein} / {healthProfile.macros.protein}g</span>
                                    </div>
                                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${Math.min(100, (consumed.protein / healthProfile.macros.protein) * 100)}%` }} 
                                            className="h-full bg-blue-500" 
                                        />
                                    </div>
                                    <div className="text-[9px] text-gray-600 text-right mt-0.5 font-mono">
                                        {Math.max(0, healthProfile.macros.protein - consumed.protein)}g LEFT
                                    </div>
                                </div>

                                {/* Carbs */}
                                <div>
                                    <div className="flex justify-between text-[10px] mb-1 font-mono">
                                        <span className="text-green-400 font-bold">CARB</span>
                                        <span className="text-gray-400">{consumed.carbs} / {healthProfile.macros.carbs}g</span>
                                    </div>
                                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${Math.min(100, (consumed.carbs / healthProfile.macros.carbs) * 100)}%` }} 
                                            className="h-full bg-green-500" 
                                        />
                                    </div>
                                    <div className="text-[9px] text-gray-600 text-right mt-0.5 font-mono">
                                        {Math.max(0, healthProfile.macros.carbs - consumed.carbs)}g LEFT
                                    </div>
                                </div>

                                {/* Fats */}
                                <div>
                                    <div className="flex justify-between text-[10px] mb-1 font-mono">
                                        <span className="text-yellow-400 font-bold">FAT</span>
                                        <span className="text-gray-400">{consumed.fats} / {healthProfile.macros.fats}g</span>
                                    </div>
                                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${Math.min(100, (consumed.fats / healthProfile.macros.fats) * 100)}%` }} 
                                            className="h-full bg-yellow-500" 
                                        />
                                    </div>
                                    <div className="text-[9px] text-gray-600 text-right mt-0.5 font-mono">
                                        {Math.max(0, healthProfile.macros.fats - consumed.fats)}g LEFT
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
                        <motion.div 
                            className="h-full bg-gradient-to-r from-system-neon to-system-accent"
                            initial={{ width: 0 }}
                            animate={{ width: `${caloriesProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* MEAL BUILDER VIEW */}
            {view === 'BUILDER' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                        <button onClick={() => setView('OVERVIEW')} className="text-gray-500 hover:text-white flex items-center gap-1 text-xs font-mono"><ChevronLeft size={14} /> BACK</button>
                        <h3 className="text-system-neon font-bold font-mono">MEAL {logs.length + 1} BUILDER</h3>
                        <div className="w-10" />
                    </div>

                    {draftImage && (
                        <div className="mb-4 relative h-32 w-full bg-black rounded overflow-hidden border border-gray-800">
                            <img src={draftImage} className="w-full h-full object-cover opacity-70" alt="Draft" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-black/50 px-2 py-1 rounded text-[10px] text-white font-mono backdrop-blur-sm border border-gray-700">
                                    IMAGE PROCESSED: QUANTITY ADJUSTED
                                </div>
                            </div>
                            <button onClick={() => setDraftImage(null)} className="absolute top-2 right-2 bg-red-900/80 text-white p-1 rounded-full"><X size={12} /></button>
                        </div>
                    )}

                    <div className="mb-4 space-y-2">
                        {draftItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-black/40 p-2 rounded border border-gray-800">
                                <div>
                                    <div className="text-sm font-bold text-white">{item.name}</div>
                                    <div className="text-[10px] text-gray-500">
                                        {Math.round(item.calories * item.quantity)} kcal | {item.quantity}x Serving ({item.servingSize})
                                    </div>
                                </div>
                                <button onClick={() => removeFromDraft(idx)} className="text-gray-600 hover:text-red-500"><X size={16} /></button>
                            </div>
                        ))}
                        {draftItems.length === 0 && <div className="text-center text-xs text-gray-600 py-4 italic">No items added yet. Search or scan below.</div>}
                    </div>

                    <div className="relative mb-4">
                        <Search size={16} className="absolute left-3 top-3 text-gray-500" />
                        <input 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Add another item (e.g. Rice, Curd)..."
                            className="w-full bg-black border border-gray-700 rounded p-2 pl-9 text-sm text-white focus:border-system-neon focus:outline-none"
                        />
                        {searchTerm && (
                            <div className="absolute top-full left-0 w-full bg-black border border-gray-700 rounded mt-1 max-h-40 overflow-y-auto z-50">
                                {filteredFood.map(food => (
                                    <button 
                                        key={food.id}
                                        onClick={() => handleAddToDraft(food)}
                                        className="w-full text-left p-2 hover:bg-gray-900 text-xs text-gray-300 border-b border-gray-800 last:border-0"
                                    >
                                        <span className="text-white font-bold">{food.name}</span> ({food.calories} kcal)
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-800 pt-4">
                        <div className="text-xs text-gray-400 font-mono">
                            TOTAL: <span className="text-white font-bold">{Math.round(draftItems.reduce((acc, i) => acc + (i.calories * i.quantity), 0))}</span> KCAL
                        </div>
                        <button 
                            onClick={commitMeal}
                            disabled={draftItems.length === 0}
                            className="bg-system-neon text-black font-bold px-4 py-2 rounded text-xs font-mono hover:bg-white transition-colors disabled:opacity-50"
                        >
                            CONFIRM MEAL LOG
                        </button>
                    </div>
                </motion.div>
            )}

            {view === 'OVERVIEW' && (
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setView('BUILDER')}
                        className="p-4 bg-gray-900 border border-gray-800 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-800 transition-colors group"
                    >
                        <Utensils className="text-system-neon group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-white font-mono">BUILD MEAL</span>
                    </button>
                    <button 
                        onClick={() => {
                            setView('SCAN');
                            cameraInputRef.current?.click();
                        }}
                        className="p-4 bg-gray-900 border border-gray-800 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-800 transition-colors group"
                    >
                        <Camera className="text-system-accent group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-white font-mono">AI FOOD SCAN</span>
                        <input 
                            ref={cameraInputRef}
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            className="hidden"
                            onChange={handleScanUpload}
                        />
                    </button>
                </div>
            )}

            {view === 'OVERVIEW' && (
                <div className="space-y-4">
                    <h3 className="text-xs text-gray-500 font-mono uppercase tracking-widest border-b border-gray-800 pb-2">TODAY'S INTAKE</h3>
                    {logs.length === 0 ? (
                        <div className="text-center text-gray-700 text-xs py-8 font-mono border-2 border-dashed border-gray-900 rounded-lg">
                            NO MEALS LOGGED YET
                        </div>
                    ) : (
                        logs.map((log) => (
                            <motion.div 
                                key={log.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-gray-900/30 border border-gray-800 rounded-lg overflow-hidden"
                            >
                                <div className="relative h-16 bg-gray-800 overflow-hidden flex items-center px-4">
                                    {log.imageUrl && (
                                        <>
                                            <img src={log.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Meal" />
                                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
                                        </>
                                    )}
                                    <div className="relative z-10 flex justify-between w-full items-center">
                                        <div>
                                            <span className="text-xs text-system-neon font-bold tracking-widest block">{log.label}</span>
                                            <span className="text-[10px] font-mono text-gray-400">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-white block leading-none">{log.totalCalories}</span>
                                            <span className="text-[8px] text-gray-500 uppercase">KCAL</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 border-t border-gray-800/50 space-y-1">
                                    {log.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-xs text-gray-300">
                                            <span>{item.quantity}x {item.name}</span>
                                            <span className="text-gray-600">{Math.round(item.calories * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="px-3 pb-3 flex gap-3 text-[10px] font-mono text-gray-500 border-t border-gray-800/30 pt-2 mt-1">
                                    <span>P: {log.totalProtein}g</span>
                                    <span>C: {log.totalCarbs}g</span>
                                    <span>F: {log.totalFats}g</span>
                                    <button onClick={() => onDelete(log.id)} className="ml-auto text-red-900 hover:text-red-500 transition-colors">DELETE</button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const PhotoGallery: React.FC<{ 
    photos: ProgressPhoto[]; 
    onAdd: (p: ProgressPhoto) => void; 
    onDelete: (id: string) => void 
}> = ({ photos, onAdd, onDelete }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
    const sortedPhotos = [...photos].sort((a, b) => a.date - b.date);
    const beforePhoto = sortedPhotos.length > 0 ? sortedPhotos[0] : null;
    const currentPhoto = sortedPhotos.length > 1 ? sortedPhotos[sortedPhotos.length - 1] : null;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsProcessing(true);
            try {
                const file = e.target.files[0];
                const base64 = await compressImage(file);
                const newPhoto: ProgressPhoto = {
                    id: Math.random().toString(36).substr(2, 9),
                    date: Date.now(),
                    imageUrl: base64,
                    note: 'Progress Update'
                };
                onAdd(newPhoto);
            } catch (err) {
                console.error("Image Upload Failed", err);
                alert("Failed to process image.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-black/40 border border-system-border rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-white font-bold font-mono text-lg flex items-center gap-2"><Camera className="text-system-neon" /> BODY SCAN LOG</h3>
                    <p className="text-xs text-gray-500 font-mono">VISUALIZE EVOLUTION CHRONOLOGY</p>
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="bg-system-neon/10 text-system-neon border border-system-neon/50 px-6 py-3 rounded-lg font-mono font-bold text-xs hover:bg-system-neon hover:text-black transition-all flex items-center gap-2 disabled:opacity-50">
                    {isProcessing ? <>SCANNING...</> : <><Upload size={16} /> UPLOAD SCAN</>}
                </button>
            </div>
            {beforePhoto && currentPhoto && (
                <div className="space-y-4">
                    <h4 className="text-xs text-system-accent font-mono uppercase tracking-widest border-b border-system-border pb-2">TRANSFORMATION ANALYSIS</h4>
                    <div className="grid grid-cols-2 gap-4 h-[300px] md:h-[400px]">
                        <div className="relative group rounded-xl overflow-hidden border border-gray-800 bg-black">
                            <div className="absolute top-3 left-3 z-10 bg-black/70 px-3 py-1 rounded text-[10px] font-mono font-bold text-gray-400 border border-gray-700">DAY 1 ({new Date(beforePhoto.date).toLocaleDateString()})</div>
                            <img src={beforePhoto.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Before" />
                        </div>
                        <div className="relative group rounded-xl overflow-hidden border border-system-neon/30 bg-black shadow-[0_0_20px_rgba(0,210,255,0.1)]">
                            <div className="absolute top-3 right-3 z-10 bg-system-neon/20 px-3 py-1 rounded text-[10px] font-mono font-bold text-system-neon border border-system-neon/50">CURRENT ({new Date(currentPhoto.date).toLocaleDateString()})</div>
                            <img src={currentPhoto.imageUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="Current" />
                        </div>
                    </div>
                </div>
            )}
            <div className="space-y-4">
                <h4 className="text-xs text-gray-500 font-mono uppercase tracking-widest border-b border-gray-800 pb-2">CHRONOLOGICAL RECORDS</h4>
                {photos.length === 0 ? <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-xl text-gray-600 font-mono text-xs">NO VISUAL DATA AVAILABLE</div> : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {sortedPhotos.map((photo) => (
                            <div key={photo.id} className="relative aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-system-neon transition-colors group cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                                <img src={photo.imageUrl} className="w-full h-full object-cover" alt="Progress" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                    <div className="self-end"><Maximize2 size={16} className="text-white" /></div>
                                    <div><div className="text-[10px] text-gray-300 font-mono">{new Date(photo.date).toLocaleDateString()}</div></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <AnimatePresence>
                {selectedPhoto && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative max-w-4xl w-full max-h-screen flex flex-col items-center">
                            <img src={selectedPhoto.imageUrl} className="max-h-[80vh] w-auto border border-gray-700 rounded-lg shadow-2xl" alt="Detail" />
                            <div className="mt-4 flex items-center gap-6">
                                <div className="text-white font-mono"><div className="text-xs text-gray-500">TIMESTAMP</div><div className="text-sm font-bold">{new Date(selectedPhoto.date).toLocaleDateString()}</div></div>
                                <button onClick={() => { if(confirm("Delete this record permanently?")) { onDelete(selectedPhoto.id); setSelectedPhoto(null); } }} className="p-3 rounded-full bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-black transition-colors"><Trash2 size={20} /></button>
                                <button onClick={() => setSelectedPhoto(null)} className="px-6 py-2 rounded border border-gray-700 text-gray-300 hover:bg-white hover:text-black font-mono text-xs transition-colors">CLOSE</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const HealthView: React.FC<HealthViewProps> = ({ healthProfile, onSaveProfile, onCompleteWorkout, onFailWorkout, onAddPhoto, onDeletePhoto, onLogMeal, onDeleteMeal, playerData }) => {
  const [activeSection, setActiveSection] = useState<'WORKOUT' | 'NUTRITION' | 'TRANSFORMATION'>('WORKOUT');
  const [activeTab, setActiveTab] = useState<'WORKOUT' | 'STATS'>('WORKOUT');
  const [isOnboarding, setIsOnboarding] = useState(!healthProfile);
  const [scanStep, setScanStep] = useState(0);
  const [processingState, setProcessingState] = useState<'IDLE' | 'CALCULATING' | 'RESULTS'>('IDLE');
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [activeWorkoutData, setActiveWorkoutData] = useState<{plan: WorkoutDay, isCardio: boolean} | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [selectedIdentity, setSelectedIdentity] = useState<string>('');
  
  const completedDays = Math.max(0, playerData.streak - 1); 

  const [formData, setFormData] = useState<Partial<HealthProfile>>({
    gender: 'MALE',
    age: 25,
    height: 175,
    weight: 70,
    targetWeight: 70,
    activityLevel: 'MODERATE',
    goal: 'BUILD_MUSCLE',
    equipment: 'GYM',
    sessionDuration: 60,
    intensity: 'MODERATE',
    injuries: [],
    ...healthProfile
  });

  const [realtimeBMI, setRealtimeBMI] = useState(0);
  const [timeEstimate, setTimeEstimate] = useState<string>("");

  useEffect(() => {
    if (formData.height && formData.weight) {
      const h = formData.height / 100;
      const bmi = formData.weight / (h * h);
      setRealtimeBMI(parseFloat(bmi.toFixed(1)));
    }
  }, [formData.height, formData.weight]);

  useEffect(() => {
      const estimate = calculateTimeEstimate(formData);
      setTimeEstimate(estimate);
  }, [formData.weight, formData.targetWeight, formData.intensity, formData.goal]);

  const steps = [
    { id: 'INTRO', title: 'SYSTEM INITIALIZATION', icon: <Activity /> },
    { id: 'METRICS', title: 'BIOMETRIC CALIBRATION', icon: <Ruler /> },
    { id: 'TARGET', title: 'TARGET LOCK', icon: <Target /> },
    { id: 'INTENSITY', title: 'INTENSITY PROTOCOL', icon: <Flame /> },
    { id: 'LOGISTICS', title: 'LOGISTICS', icon: <Dumbbell /> },
    { id: 'IDENTITY', title: 'AFFIRM IDENTITY', icon: <Fingerprint /> },
  ];

  const handleInitiateAnalysis = () => {
      setProcessingState('CALCULATING');
  };

  const handleFinalize = () => {
      const h = (formData.height || 175) / 100;
      const bmi = (formData.weight || 70) / (h * h);
      
      const nutritionPlan = calculateNutritionPlan(formData);

      const tempProfile: HealthProfile = {
          ...formData as HealthProfile,
          startingWeight: formData.weight,
          bmi,
          bmr: nutritionPlan.bmr,
          category: bmi < 25 ? 'OPTIMAL' : 'OVERWEIGHT',
          workoutPlan: [], 
          macros: nutritionPlan.macros 
      };

      const generatedPlan = generateSystemProtocol(tempProfile);
      
      const finalProfile: HealthProfile = {
          ...tempProfile,
          workoutPlan: generatedPlan
      };
      
      onSaveProfile(finalProfile, selectedIdentity || "Shadow Hunter");
      setIsOnboarding(false);
      setProcessingState('IDLE');
  };

  const getIdentityOptions = () => {
     switch (formData.goal) {
         case 'LOSE_WEIGHT':
             return [
                 { title: 'SHADOW DANCER', desc: 'Agility, Speed, Lethal Precision.' },
                 { title: 'WIND WALKER', desc: 'Untouchable, Enduring, Light.' },
                 { title: 'DISCIPLINED MONK', desc: 'Control over Body and Mind.' }
             ];
         case 'BUILD_MUSCLE':
             return [
                 { title: 'IRON MONARCH', desc: 'Unbreakable Defense, Massive Power.' },
                 { title: 'TITAN DESTROYER', desc: 'Force of Nature, Heavy Lifter.' },
                 { title: 'WARLORD', desc: 'Dominance through Strength.' }
             ];
         case 'ENDURANCE':
             return [
                 { title: 'RELENTLESS STRIKER', desc: 'Never Tires, Always Moving.' },
                 { title: 'STORM CHASER', desc: 'Energy that outlasts the storm.' },
                 { title: 'PATHFINDER', desc: 'The Journey is the Destination.' }
             ];
         default:
             return [
                 { title: 'SYSTEM RULER', desc: 'Master of all Stats.' },
                 { title: 'SOLO LEVELER', desc: 'Rising from the weakest to strongest.' },
                 { title: 'HUNTER', desc: 'Seeking growth in every challenge.' }
             ];
     }
  };

  const getMuscleStatus = () => {
      const status = { UPPER: 100, LOWER: 100, CORE: 100, CARDIO: 100 };
      if (!healthProfile) return status;
      if (completedDays > 0) {
          const yesterdayPlan = healthProfile.workoutPlan?.[completedDays - 1];
          if (yesterdayPlan && !yesterdayPlan.isRecovery) {
              const focus = yesterdayPlan.focus;
              if (['CHEST', 'BACK', 'ARMS', 'SHOULDERS'].some(k => focus.includes(k))) status.UPPER = 55;
              if (['LEGS', 'SQUAT'].some(k => focus.includes(k))) status.LOWER = 55;
              if (['CORE', 'ABS'].some(k => focus.includes(k))) status.CORE = 55;
          }
      }
      return status;
  };

  const muscleStatus = getMuscleStatus();

  // --- ONBOARDING RENDER ---
  if (isOnboarding) {
      return createPortal(
          <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4 overflow-hidden font-mono text-white">
             <div className="absolute inset-0 bg-[linear-gradient(rgba(0,210,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,210,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />
             <div className="relative z-10 w-full max-w-xl h-[calc(100dvh-2rem)] md:h-auto flex flex-col justify-center">
                 <AnimatePresence mode="wait">
                       {processingState === 'CALCULATING' && (
                           <motion.div key="calc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
                               <AnalysisView onComplete={() => setProcessingState('RESULTS')} />
                           </motion.div>
                       )}
                       {processingState === 'RESULTS' && (
                           <motion.div key="results" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="w-full h-full p-6">
                               <ResultsView profile={formData} onConfirm={handleFinalize} />
                           </motion.div>
                       )}
                       {processingState === 'IDLE' && (
                           <motion.div key={scanStep} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1 flex flex-col overflow-y-auto md:overflow-visible scrollbar-hide pb-4">
                              <div className="mb-6 md:mb-8 flex items-center gap-3 shrink-0">
                                  <div className="p-2 md:p-3 bg-gray-900 rounded-lg text-system-neon">
                                      {React.cloneElement(steps[scanStep].icon as React.ReactElement<any>, { size: 20 })}
                                  </div>
                                  <div>
                                      <h2 className="text-lg md:text-xl font-bold text-white font-mono tracking-tight">{steps[scanStep].title}</h2>
                                      <p className="text-[10px] md:text-xs text-gray-500 font-mono">COMPLETE CALIBRATION</p>
                                  </div>
                              </div>
                              
                              {scanStep === 0 && (
                                  <div className="text-center flex-1 flex flex-col justify-center">
                                      <Activity className="text-system-neon mx-auto mb-6 animate-pulse w-12 h-12 md:w-16 md:h-16" />
                                      <p className="text-gray-400 mb-6 font-mono text-xs md:text-sm leading-relaxed">The System requires your biometric data to generate an optimized S-Rank growth protocol. <br/><br/> Precision is key.</p>
                                      <div className="grid grid-cols-2 gap-3 md:gap-4 mt-auto md:mt-0">
                                          {['MALE', 'FEMALE'].map(g => (
                                              <button key={g} onClick={() => setFormData({...formData, gender: g as any})} className={`py-3 md:py-4 border rounded-lg font-mono text-xs md:text-sm transition-all ${formData.gender === g ? 'bg-system-neon text-black border-system-neon font-bold' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}>{g}</button>
                                          ))}
                                      </div>
                                  </div>
                              )}
                              {scanStep === 1 && (
                                  <div className="flex-1 flex flex-col justify-center">
                                      <NeonSlider label="HEIGHT" value={formData.height || 175} min={140} max={220} unit="CM" onChange={(v) => setFormData({...formData, height: v})} />
                                      <div className="h-4"></div>
                                      <NeonSlider label="CURRENT WEIGHT" value={formData.weight || 70} min={40} max={150} unit="KG" onChange={(v) => setFormData({...formData, weight: v})} />
                                      <div className="mt-2 md:mt-4 p-3 md:p-4 bg-gray-900/50 rounded-lg border border-gray-800 flex justify-between items-center">
                                          <span className="text-gray-500 font-mono text-[10px] md:text-xs">CALCULATED BMI</span>
                                          <span className={`font-mono text-lg md:text-xl font-bold ${realtimeBMI > 25 ? 'text-system-warning' : 'text-system-success'}`}>{realtimeBMI}</span>
                                      </div>
                                  </div>
                              )}
                              {scanStep === 2 && (
                                  <div className="flex-1 flex flex-col justify-center">
                                      <div className="text-center mb-4 md:mb-6">
                                          <h3 className="text-system-neon font-mono text-3xl md:text-4xl font-black">{formData.targetWeight} KG</h3>
                                          <p className="text-[10px] md:text-xs text-gray-500 font-mono mt-1 md:mt-2">OBJECTIVE</p>
                                          {timeEstimate !== "UNKNOWN" && <div className="inline-block mt-2 px-3 py-1 bg-system-success/10 border border-system-success/20 rounded-full text-[10px] text-system-success font-mono">ESTIMATED TIME: {timeEstimate}</div>}
                                      </div>
                                      <NeonSlider label="TARGET WEIGHT" value={formData.targetWeight || 70} min={40} max={150} unit="KG" onChange={(v) => setFormData({...formData, targetWeight: v})} />
                                      <div className="grid grid-cols-1 gap-2 md:gap-3 mt-4">
                                          {['LOSE_WEIGHT', 'BUILD_MUSCLE', 'ENDURANCE'].map(g => (
                                              <button key={g} onClick={() => setFormData({...formData, goal: g as any})} className={`p-3 border rounded text-left font-mono text-[10px] md:text-xs transition-colors ${formData.goal === g ? 'bg-system-accent/20 border-system-accent text-white' : 'border-gray-800 text-gray-500'}`}>{g.replace('_', ' ')}</button>
                                          ))}
                                      </div>
                                  </div>
                              )}
                              {scanStep === 3 && (
                                  <div className="space-y-2 md:space-y-3">
                                      {[{ id: 'LIGHT', label: 'E-RANK', desc: 'Maintenance' }, { id: 'MODERATE', label: 'B-RANK', desc: 'Balanced Growth' }, { id: 'HIGH', label: 'S-RANK', desc: 'Maximum Intensity' }].map(i => (
                                          <button key={i.id} onClick={() => setFormData({...formData, intensity: i.id as any})} className={`w-full p-4 md:p-5 border rounded-lg flex items-center justify-between group transition-all ${formData.intensity === i.id ? 'bg-red-900/20 border-red-500' : 'border-gray-800 hover:border-gray-600'}`}>
                                              <div className="text-left">
                                                  <div className={`font-bold font-mono text-base md:text-lg ${formData.intensity === i.id ? 'text-red-500' : 'text-gray-400'}`}>{i.label}</div>
                                                  <div className="text-[10px] md:text-xs text-gray-600 font-mono">{i.desc}</div>
                                              </div>
                                              {formData.intensity === i.id && <Flame className="text-red-500 w-4 h-4 md:w-5 md:h-5" />}
                                          </button>
                                      ))}
                                  </div>
                              )}
                              {scanStep === 4 && (
                                  <div className="flex-1 flex flex-col justify-center">
                                      <NeonSlider label="SESSION DURATION" value={formData.sessionDuration || 60} min={30} max={120} unit="MIN" onChange={(v) => setFormData({...formData, sessionDuration: v})} />
                                      <div className="grid grid-cols-2 gap-3 md:gap-4 mt-6">
                                          {['GYM', 'HOME_DUMBBELLS', 'BODYWEIGHT'].map(e => (
                                              <button key={e} onClick={() => setFormData({...formData, equipment: e as any})} className={`py-3 md:py-4 border rounded font-mono text-[10px] md:text-xs ${formData.equipment === e ? 'bg-white text-black font-bold' : 'border-gray-800 text-gray-500'}`}>{e.replace('_', ' ')}</button>
                                          ))}
                                      </div>
                                  </div>
                              )}
                              {scanStep === 5 && (
                                  <div className="flex-1 flex flex-col justify-center space-y-3 md:space-y-4">
                                      <p className="text-gray-400 font-mono text-[10px] md:text-xs mb-2 text-center">SELECT YOUR PATH TO POWER</p>
                                      {getIdentityOptions().map((idOption) => (
                                          <button key={idOption.title} onClick={() => setSelectedIdentity(idOption.title)} className={`relative p-4 md:p-5 border rounded-lg text-left transition-all group overflow-hidden ${selectedIdentity === idOption.title ? 'bg-system-neon/10 border-system-neon ring-1 ring-system-neon' : 'border-gray-800 hover:border-gray-600'}`}>
                                              {selectedIdentity === idOption.title && (<div className="absolute top-0 right-0 p-2"><Crown size={14} className="text-system-neon md:w-4 md:h-4" /></div>)}
                                              <h3 className={`font-bold font-mono text-base md:text-lg ${selectedIdentity === idOption.title ? 'text-white' : 'text-gray-400'}`}>{idOption.title}</h3>
                                              <p className="text-[10px] md:text-xs text-gray-600 font-mono mt-1">{idOption.desc}</p>
                                          </button>
                                      ))}
                                      {selectedIdentity && (<div className="mt-4 text-center"><div className="text-[10px] text-system-neon font-mono animate-pulse">IDENTITY AFFIRMED: {selectedIdentity}</div></div>)}
                                  </div>
                              )}
                           </motion.div>
                       )}
                    </AnimatePresence>
                    {processingState === 'IDLE' && (
                        <div className="mt-auto pt-4 md:pt-6 border-t border-gray-900 bg-[#050505] sticky bottom-0 z-20 shrink-0 flex justify-between items-center pb-2">
                            <button onClick={() => setScanStep(prev => Math.max(0, prev - 1))} className={`text-gray-500 hover:text-white transition-colors ${scanStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}><ChevronLeft size={20} /></button>
                            <div className="flex gap-1">{steps.map((_, i) => (<div key={i} className={`w-1 h-1 rounded-full ${i === scanStep ? 'bg-system-neon' : 'bg-gray-800'}`} />))}</div>
                            <button onClick={() => { if (scanStep < steps.length - 1) setScanStep(prev => prev + 1); else handleInitiateAnalysis(); }} disabled={scanStep === 5 && !selectedIdentity} className="flex items-center gap-2 bg-system-neon text-black font-bold px-4 md:px-6 py-2 rounded-full hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm">{scanStep === steps.length - 1 ? 'AWAKEN' : 'NEXT'} <ChevronRight size={16} /></button>
                        </div>
                    )}
                 </div>
          </div>,
          document.body
      );
  }

  // --- DASHBOARD VIEW ---
  
  if (!healthProfile) return null;
  
  const todaysPlan = healthProfile.workoutPlan?.[activeDayIndex] || { day: 'REST', focus: 'REST', exercises: [], totalDuration: 0 };

  const graphData = [
      { name: 'W1', weight: healthProfile.startingWeight || 75 },
      { name: 'W2', weight: (healthProfile.startingWeight || 75) - 0.5 },
      { name: 'W3', weight: (healthProfile.startingWeight || 75) - 1.2 },
      { name: 'W4', weight: (healthProfile.startingWeight || 75) - 1.8 },
      { name: 'NOW', weight: healthProfile.weight },
  ];

  if (isWorkoutActive && activeWorkoutData) {
      return (
          <ActiveWorkoutPlayer 
             plan={activeWorkoutData.plan}
             onComplete={(completed, total, results) => {
                 onCompleteWorkout(completed, total, results, activeWorkoutData.isCardio);
                 setIsWorkoutActive(false);
                 setActiveWorkoutData(null);
             }}
             onFail={() => {
                 onFailWorkout();
                 setIsWorkoutActive(false);
                 setActiveWorkoutData(null);
             }}
             streak={playerData.streak}
          />
      );
  }

  return (
    <div className="space-y-6 pb-24">
        {/* --- MAIN SECTION TOGGLE --- */}
        <div className="relative flex p-1 bg-gray-900/80 border border-gray-800 rounded-xl backdrop-blur-sm overflow-hidden select-none">
            <motion.div 
                className="absolute top-1 bottom-1 bg-system-neon/20 border border-system-neon/50 rounded-lg shadow-[0_0_15px_rgba(0,210,255,0.3)] z-0"
                layoutId="activeSectionTab"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ 
                    width: 'calc(33.33% - 2.66px)', 
                    left: activeSection === 'WORKOUT' ? '4px' : activeSection === 'NUTRITION' ? '33.33%' : 'calc(66.66% - 4px)'
                }}
            />
            
            <button onClick={() => setActiveSection('WORKOUT')} className={`flex-1 relative z-10 py-3 text-center font-mono font-bold tracking-tight md:tracking-widest transition-colors duration-300 text-[10px] md:text-xs ${activeSection === 'WORKOUT' ? 'text-white text-shadow-neon' : 'text-gray-500 hover:text-gray-300'}`}>WORKOUT</button>
            <button onClick={() => setActiveSection('NUTRITION')} className={`flex-1 relative z-10 py-3 text-center font-mono font-bold tracking-tight md:tracking-widest transition-colors duration-300 text-[10px] md:text-xs ${activeSection === 'NUTRITION' ? 'text-white text-shadow-neon' : 'text-gray-500 hover:text-gray-300'}`}>NUTRITION</button>
            <button onClick={() => setActiveSection('TRANSFORMATION')} className={`flex-1 relative z-10 py-3 text-center font-mono font-bold tracking-tight md:tracking-widest transition-colors duration-300 text-[10px] md:text-xs ${activeSection === 'TRANSFORMATION' ? 'text-white text-shadow-neon' : 'text-gray-500 hover:text-gray-300'}`}>EVOLUTION</button>
        </div>

        <AnimatePresence mode="wait">
            {/* --- WORKOUT SECTION --- */}
            {activeSection === 'WORKOUT' && (
                <motion.div
                    key="workout-section"
                    initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: -50, filter: "blur(10px)" }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="space-y-6"
                >
                    <AnimatePresence>
                        {showOverview && (
                            <WorkoutOverview 
                                plan={todaysPlan}
                                focusVideos={playerData.focusVideos || {}}
                                onStart={(modifiedPlan, isCardio) => {
                                    setActiveWorkoutData({ plan: modifiedPlan, isCardio });
                                    setIsWorkoutActive(true);
                                    setShowOverview(false);
                                }}
                                onCancel={() => setShowOverview(false)}
                            />
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-system-card border border-system-border rounded-xl p-6 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-mono text-gray-400 tracking-widest flex items-center gap-2"><Activity size={14} className="text-system-accent" /> MUSCLE STATUS</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[{ label: 'UPPER BODY', val: muscleStatus.UPPER, color: 'bg-system-neon' }, { label: 'CORE', val: muscleStatus.CORE, color: 'bg-system-warning' }, { label: 'LOWER BODY', val: muscleStatus.LOWER, color: 'bg-system-danger' }, { label: 'CARDIO', val: muscleStatus.CARDIO, color: 'bg-system-success' }].map((part) => (
                                    <div key={part.label} className="bg-gray-900/50 p-3 rounded border border-gray-800">
                                        <div className="flex justify-between mb-1"><span className="text-[10px] text-gray-500 font-mono">{part.label}</span><span className="text-[10px] text-white font-mono">{part.val}%</span></div>
                                        <div className="h-1 bg-gray-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${part.val}%` }} className={`h-full ${part.color} shadow-[0_0_8px_currentColor]`} /></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-system-card border border-system-border rounded-xl p-6 lg:col-span-2 relative">
                            <div className="absolute top-6 left-6 z-10"><h3 className="text-sm font-mono text-gray-400 tracking-widest flex items-center gap-2"><TrendingUp size={14} className="text-system-success" /> WEIGHT TRAJECTORY</h3><p className="text-xs text-gray-600 font-mono">TARGET: {healthProfile.targetWeight} KG</p></div>
                            <div className="w-full mt-4" style={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={graphData}>
                                        <defs><linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                        <XAxis dataKey="name" hide />
                                        <YAxis domain={[0, 'auto']} hide />
                                        <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                                        <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 border-b border-gray-800">
                        <button onClick={() => setActiveTab('WORKOUT')} className={`pb-2 text-sm font-mono transition-colors border-b-2 ${activeTab === 'WORKOUT' ? 'text-system-neon border-system-neon' : 'text-gray-600 border-transparent hover:text-gray-300'}`}>QUEST MAP</button>
                        <button onClick={() => setActiveTab('STATS')} className={`pb-2 text-sm font-mono transition-colors border-b-2 ${activeTab === 'STATS' ? 'text-system-accent border-system-accent' : 'text-gray-600 border-transparent hover:text-gray-300'}`}>PROTOCOL</button>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'WORKOUT' && (
                            <motion.div key="workout" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                                <WorkoutMap currentWeight={healthProfile.weight} targetWeight={healthProfile.targetWeight || healthProfile.weight - 5} workoutPlan={healthProfile.workoutPlan || []} completedDays={completedDays} onStartDay={(dayIndex) => { setActiveDayIndex(dayIndex); setShowOverview(true); }} />
                            </motion.div>
                        )}
                        {activeTab === 'STATS' && (
                            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                {healthProfile.workoutPlan?.map((dayPlan, index) => {
                                    const currentWeek = Math.floor(completedDays / 7);
                                    const itemWeek = Math.floor(index / 7);
                                    if (itemWeek !== currentWeek && index !== completedDays) return null;
                                    const isLocked = index > completedDays;
                                    const isToday = index === completedDays;
                                    const isCompleted = index < completedDays;
                                    return (
                                        <div key={index} className={`bg-system-card border rounded-lg overflow-hidden transition-all ${isToday ? 'border-system-neon/50 shadow-[0_0_10px_rgba(0,210,255,0.1)]' : 'border-system-border'} ${isCompleted ? 'opacity-75 hover:opacity-100' : ''}`}>
                                            <div className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm transition-colors ${isToday ? 'bg-system-neon text-black shadow-[0_0_10px_#00d2ff]' : isCompleted ? 'bg-system-success/20 text-system-success border border-system-success/30' : 'bg-gray-900 text-gray-600 border border-gray-800'}`}>{isCompleted ? <CheckCircle size={18} /> : index + 1}</div>
                                                    <div><div className="flex items-center gap-2 mb-0.5"><h4 className={`font-mono text-sm font-bold uppercase tracking-wider ${isLocked ? 'text-gray-500' : 'text-white'}`}>{dayPlan.focus}</h4>{isToday && <span className="text-[8px] bg-system-neon/20 text-system-neon px-1.5 py-0.5 rounded border border-system-neon/30 animate-pulse">CURRENT</span>}{isCompleted && <span className="text-[8px] bg-system-success/10 text-system-success px-1.5 py-0.5 rounded border border-system-success/20">COMPLETE</span>}{isLocked && <span className="text-[8px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded border border-gray-700">LOCKED</span>}</div><span className="text-[10px] text-gray-500 font-mono uppercase flex items-center gap-1">{dayPlan.day} {dayPlan.isRecovery && <span className="text-system-success">• RECOVERY</span>}</span></div>
                                                </div>
                                                <button onClick={() => setExpandedDay(expandedDay === index ? null : index)} className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-mono font-bold transition-colors ${isLocked ? 'bg-gray-900 text-gray-500 hover:text-gray-300' : 'bg-system-neon/10 text-system-neon hover:bg-system-neon hover:text-black'}`}><Eye size={12} /> {expandedDay === index ? 'HIDE' : 'VIEW'} {expandedDay === index ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</button>
                                            </div>
                                            <AnimatePresence>
                                                {expandedDay === index && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-black/50 border-t border-system-border p-4">
                                                        <div className="relative">
                                                            {isLocked && (<div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px] rounded"><div className="text-gray-500 mb-2"><CheckCircle size={24} /></div><span className="text-[10px] font-mono text-gray-400 tracking-widest uppercase">ACCESS RESTRICTED UNTIL DAY {index + 1}</span></div>)}
                                                            <div className={`space-y-3 ${isLocked ? 'opacity-30 blur-[1px]' : ''}`}>
                                                                {dayPlan.exercises.map((ex, i) => (<div key={i} className="flex justify-between items-center border-b border-gray-800/50 pb-2 last:border-0 last:pb-0"><div className="flex flex-col"><span className="text-xs font-bold text-gray-300">{ex.name}</span>{ex.notes && (<span className="text-[9px] text-system-accent font-mono uppercase">{ex.notes}</span>)}</div><div className="text-right font-mono text-xs"><div className="text-system-neon">{ex.sets} SETS</div><div className="text-gray-500">{ex.reps}</div></div></div>))}
                                                                {dayPlan.isRecovery && (<div className="text-center py-2 text-xs font-mono text-system-success">ACTIVE RECOVERY PROTOCOL</div>)}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                                <div className="text-center text-[10px] text-gray-600 font-mono pt-2">SHOWING CURRENT WEEK OF 4-WEEK CYCLE</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* --- NUTRITION DASHBOARD --- */}
            {activeSection === 'NUTRITION' && (
                <motion.div
                    key="nutrition-section"
                    initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: 50, filter: "blur(10px)" }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="space-y-6"
                >
                    <NutritionDashboard 
                        healthProfile={healthProfile}
                        logs={playerData.nutritionLogs || []}
                        onLog={onLogMeal!}
                        onDelete={onDeleteMeal!}
                    />
                </motion.div>
            )}

            {/* --- TRANSFORMATION SECTION --- */}
            {activeSection === 'TRANSFORMATION' && (
                <motion.div
                    key="transformation-section"
                    initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: 50, filter: "blur(10px)" }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="space-y-6"
                >
                    <PhotoGallery 
                        photos={healthProfile.progressPhotos || []} 
                        onAdd={(p) => onAddPhoto && onAddPhoto(p)}
                        onDelete={(id) => onDeletePhoto && onDeletePhoto(id)}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default HealthView;
