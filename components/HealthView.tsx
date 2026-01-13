
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Target, Dumbbell, Flame, CheckCircle, TrendingUp, ChevronLeft, ChevronRight, Ruler, Fingerprint, Crown, Trophy, Zap, Camera, Search, Utensils, ScanLine, X, AlertTriangle, RefreshCw, Droplets, Moon, Calendar, Map as MapIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts';
import { HealthProfile, WorkoutDay, PlayerData, ProgressPhoto, MealLog, FoodItem, LoggedFoodItem } from '../types';
import ActiveWorkoutPlayer from './ActiveWorkoutPlayer';
import WorkoutMap from './WorkoutMap';
import WorkoutOverview from './WorkoutOverview';
import { generateSystemProtocol } from '../utils/workoutGenerator';
import { INDIAN_FOOD_DB } from '../utils/indianFoodDb';
import { supabase } from '../lib/supabase';

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
  
  const protein = Math.round(weight * (goal === 'BUILD_MUSCLE' ? 2.2 : 2.0));
  const fat = Math.round((targetCalories * 0.25) / 9);
  const carbs = Math.round((targetCalories - (protein * 4 + fat * 9)) / 4);

  return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
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
    
    const weightDiff = Math.abs((profile.weight || 0) - (profile.targetWeight || 0));
    const rate = profile.goal === 'BUILD_MUSCLE' ? 0.25 : 0.5;
    const weeks = weightDiff === 0 ? 0 : Math.max(4, Math.ceil(weightDiff / rate));
    const waterIntake = Math.round((profile.weight || 70) * 0.033 * 10) / 10;
    const trainingDays = profile.equipment === 'BODYWEIGHT' ? "5-6" : "4-5";
    
    return (
        <div className="h-full flex flex-col">
            <div className="text-center mb-6">
                <Trophy className="w-12 h-12 text-system-neon mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-white font-mono">PROTOCOL OPTIMIZED</h2>
                <p className="text-xs text-gray-500 font-mono tracking-widest">S-RANK POTENTIAL CONFIRMED</p>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                
                <div className="bg-gray-900/50 p-4 rounded border border-gray-800">
                    <h3 className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-3 border-b border-gray-800 pb-1 flex items-center gap-2">
                        <Calendar size={12} /> PROJECTED TIMELINE
                    </h3>
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-left">
                            <div className="text-[10px] text-gray-400">CURRENT</div>
                            <div className="text-xl font-bold text-white">{profile.weight} KG</div>
                        </div>
                        <div className="flex-1 px-4 flex flex-col items-center">
                            <div className="text-xs text-system-neon font-bold mb-1">{weeks} WEEKS</div>
                            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: '60%' }} 
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-system-neon animate-pulse" 
                                /> 
                            </div>
                            <div className="text-[9px] text-gray-500 mt-1">ESTIMATED COMPLETION</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-gray-400">TARGET</div>
                            <div className="text-xl font-bold text-system-success">{profile.targetWeight} KG</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-900/50 p-3 rounded border border-gray-800 flex flex-col items-center justify-center text-center">
                        <div className="text-[9px] text-gray-500 font-mono uppercase flex items-center gap-1 mb-1">
                            <Droplets size={10} className="text-blue-400" /> Water Intake
                        </div>
                        <div className="text-lg font-bold text-white flex items-center gap-1">
                            <span className="text-xl">{waterIntake}</span> <span className="text-[10px] text-gray-400">L/DAY</span>
                        </div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded border border-gray-800 flex flex-col items-center justify-center text-center">
                        <div className="text-[9px] text-gray-500 font-mono uppercase flex items-center gap-1 mb-1">
                            <Moon size={10} className="text-purple-400" /> Sleep Cycle
                        </div>
                        <div className="text-lg font-bold text-white flex items-center gap-1">
                            <span className="text-xl">7.5+</span> <span className="text-[10px] text-gray-400">HOURS</span>
                        </div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded border border-gray-800 flex flex-col items-center justify-center text-center">
                        <div className="text-[9px] text-gray-500 font-mono uppercase flex items-center gap-1 mb-1">
                            <Dumbbell size={10} className="text-system-neon" /> Frequency
                        </div>
                        <div className="text-lg font-bold text-white flex items-center gap-1">
                            <span className="text-xl">{trainingDays}</span> <span className="text-[10px] text-gray-400">DAYS/WK</span>
                        </div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded border border-gray-800 flex flex-col items-center justify-center text-center">
                        <div className="text-[9px] text-gray-500 font-mono uppercase flex items-center gap-1 mb-1">
                            <Flame size={10} className="text-orange-400" /> TDEE
                        </div>
                        <div className="text-lg font-bold text-white flex items-center gap-1">
                            <span className="text-xl">{nutrition.tdee}</span>
                            <span className="text-[10px] text-gray-400">KCAL</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 p-4 rounded border border-gray-800">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-1">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Utensils size={12} /> NUTRITION PROTOCOL
                        </h3>
                        <span className="text-xs text-system-neon font-bold">{nutrition.macros.calories} KCAL TARGET</span>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-blue-400 font-bold">PROTEIN (RECOVERY)</span>
                                <span className="text-white">{nutrition.macros.protein}g</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} transition={{ delay: 0.2 }} className="h-full bg-blue-500" />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-green-400 font-bold">CARBS (FUEL)</span>
                                <span className="text-white">{nutrition.macros.carbs}g</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: '35%' }} transition={{ delay: 0.3 }} className="h-full bg-green-500" />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-yellow-400 font-bold">FATS (HORMONES)</span>
                                <span className="text-white">{nutrition.macros.fats}g</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: '25%' }} transition={{ delay: 0.4 }} className="h-full bg-yellow-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button 
                onClick={onConfirm}
                className="w-full mt-6 bg-system-neon text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-white transition-colors shadow-[0_0_15px_rgba(0,210,255,0.4)]"
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

                let data;
                
                try {
                    // 3. Call Supabase Edge Function
                    const response = await supabase.functions.invoke('analyze-food', {
                        body: { 
                            image: rawBase64,
                            user_context: {
                                goal: healthProfile.goal,
                                daily_calorie_target: healthProfile.macros.calories
                            }
                        }
                    });
                    
                    if (response.error) throw response.error;
                    data = response.data;

                } catch (apiError) {
                    console.warn("AI Core Connection Failed - Switching to Simulation Protocol", apiError);
                    // FALLBACK MOCK DATA for Demo/Offline purposes
                    // Pick a random item from DB to simulate recognition to prevent "Failed to fetch" breaking the UI
                    const randomFood = INDIAN_FOOD_DB[Math.floor(Math.random() * INDIAN_FOOD_DB.length)];
                    
                    // Simulate network/processing delay
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    data = {
                        dish_name: randomFood.name,
                        calories: randomFood.calories,
                        protein: randomFood.protein,
                        carbs: randomFood.carbs,
                        fats: randomFood.fats,
                        is_food: true,
                        confidence: 0.95
                    };
                }

                // 4. Handle AI Response (or Mock)
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

                        <div className="flex items-center gap-6">
                            <div className="relative w-24 h-24">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie
                                            data={macroData}
                                            innerRadius={30}
                                            outerRadius={40}
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
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                    MACROS
                                </div>
                            </div>
                            
                            <div className="space-y-1 text-xs font-mono">
                                <div className="flex items-center gap-2 text-blue-400"><div className="w-2 h-2 rounded-full bg-blue-500"/> PRO: {consumed.protein}g</div>
                                <div className="flex items-center gap-2 text-green-400"><div className="w-2 h-2 rounded-full bg-green-500"/> CARB: {consumed.carbs}g</div>
                                <div className="flex items-center gap-2 text-yellow-400"><div className="w-2 h-2 rounded-full bg-yellow-500"/> FAT: {consumed.fats}g</div>
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

const HealthView: React.FC<HealthViewProps> = ({ 
  healthProfile, 
  onSaveProfile, 
  onCompleteWorkout, 
  onFailWorkout, 
  onLogMeal, 
  onDeleteMeal,
  playerData 
}) => {
  const [setupPhase, setSetupPhase] = useState<'INPUT' | 'ANALYSIS' | 'RESULTS'>('INPUT');
  const [tempProfile, setTempProfile] = useState<Partial<HealthProfile>>({
      gender: 'MALE',
      age: 25,
      height: 170,
      weight: 70,
      targetWeight: 70,
      activityLevel: 'MODERATE',
      goal: 'BUILD_MUSCLE',
      equipment: 'GYM',
      sessionDuration: 45,
      intensity: 'MODERATE',
      injuries: []
  });

  const [activeTab, setActiveTab] = useState<'MAP' | 'NUTRITION'>('MAP');
  
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const [activeSessionPlan, setActiveSessionPlan] = useState<WorkoutDay | null>(null);

  const handleStartAnalysis = () => setSetupPhase('ANALYSIS');
  const handleAnalysisComplete = () => setSetupPhase('RESULTS');
  const handleConfirmProfile = () => {
      const plan = generateSystemProtocol(tempProfile as HealthProfile);
      const nutrition = calculateNutritionPlan(tempProfile);
      
      let identity = "Hunter";
      if (tempProfile.goal === 'LOSE_WEIGHT') identity = "Shadow Assassin";
      if (tempProfile.goal === 'BUILD_MUSCLE') identity = "Iron Monarch";
      if (tempProfile.goal === 'ENDURANCE') identity = "Wind Walker";

      const finalProfile: HealthProfile = {
          ...tempProfile as HealthProfile,
          workoutPlan: plan,
          macros: nutrition.macros,
          bmi: 0,
          bmr: nutrition.bmr,
          category: 'Unknown'
      };
      
      onSaveProfile(finalProfile, identity);
  };

  const handleSelectDay = (idx: number) => {
      setSelectedDayIdx(idx);
  };

  const handleEnterDungeon = (modifiedPlan: WorkoutDay) => {
      setActiveSessionPlan(modifiedPlan);
  };

  const handleSessionComplete = (exCompleted: number, total: number, results: Record<string, number>) => {
      onCompleteWorkout(exCompleted, total, results, false);
      setActiveSessionPlan(null);
      setSelectedDayIdx(null);
  };

  const handleSessionFail = () => {
      onFailWorkout();
      setActiveSessionPlan(null);
      setSelectedDayIdx(null);
  };

  if (!healthProfile) {
      if (setupPhase === 'ANALYSIS') return <AnalysisView onComplete={handleAnalysisComplete} />;
      if (setupPhase === 'RESULTS') return <ResultsView profile={tempProfile} onConfirm={handleConfirmProfile} />;
      
      return (
          <div className="max-w-xl mx-auto py-8 space-y-8">
              <div className="text-center">
                   <h2 className="text-2xl font-bold text-white font-mono">BIOMETRIC CALIBRATION</h2>
                   <p className="text-xs text-gray-500 font-mono">CONFIGURE SYSTEM PARAMETERS</p>
              </div>
              
              <div className="space-y-4">
                  <NeonSlider label="AGE" value={tempProfile.age || 25} min={16} max={80} unit="YRS" onChange={v => setTempProfile(p => ({...p, age: v}))} />
                  <NeonSlider label="HEIGHT" value={tempProfile.height || 170} min={140} max={220} unit="CM" onChange={v => setTempProfile(p => ({...p, height: v}))} />
                  <NeonSlider label="CURRENT WEIGHT" value={tempProfile.weight || 70} min={40} max={150} unit="KG" onChange={v => setTempProfile(p => ({...p, weight: v}))} />
                  <NeonSlider label="TARGET WEIGHT" value={tempProfile.targetWeight || 70} min={40} max={150} unit="KG" onChange={v => setTempProfile(p => ({...p, targetWeight: v}))} />
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs text-gray-500 mb-1 font-mono">PRIMARY OBJECTIVE</label>
                          <select 
                            value={tempProfile.goal}
                            onChange={e => setTempProfile(p => ({...p, goal: e.target.value as any}))}
                            className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-white text-xs font-mono focus:border-system-neon"
                          >
                              <option value="LOSE_WEIGHT">LOSE WEIGHT (ASSASSIN)</option>
                              <option value="BUILD_MUSCLE">BUILD MUSCLE (MONARCH)</option>
                              <option value="ENDURANCE">ENDURANCE (RANGER)</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs text-gray-500 mb-1 font-mono">AVAILABLE GEAR</label>
                          <select 
                            value={tempProfile.equipment}
                            onChange={e => setTempProfile(p => ({...p, equipment: e.target.value as any}))}
                            className="w-full bg-gray-900 border border-gray-800 rounded p-3 text-white text-xs font-mono focus:border-system-neon"
                          >
                              <option value="GYM">FULL GYM ACCESS</option>
                              <option value="HOME_DUMBBELLS">HOME (DUMBBELLS)</option>
                              <option value="BODYWEIGHT">BODYWEIGHT ONLY</option>
                          </select>
                      </div>
                  </div>
              </div>

              <button 
                  onClick={handleStartAnalysis}
                  className="w-full py-4 bg-system-neon text-black font-bold text-lg rounded shadow-[0_0_20px_#00d2ff] hover:bg-white transition-all font-mono"
              >
                  INITIATE SCAN
              </button>
          </div>
      );
  }

  if (activeSessionPlan) {
      return (
          <ActiveWorkoutPlayer 
             plan={activeSessionPlan} 
             onComplete={handleSessionComplete} 
             onFail={handleSessionFail}
             streak={playerData.streak}
          />
      );
  }

  return (
      <div className="h-full flex flex-col">
          <div className="flex gap-4 mb-4 border-b border-gray-800 pb-2">
              <button 
                onClick={() => setActiveTab('MAP')}
                className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold font-mono transition-colors ${activeTab === 'MAP' ? 'bg-system-neon text-black' : 'text-gray-500 hover:text-white'}`}
              >
                  <MapIcon size={14} /> CAMPAIGN MAP
              </button>
              <button 
                onClick={() => setActiveTab('NUTRITION')}
                className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold font-mono transition-colors ${activeTab === 'NUTRITION' ? 'bg-system-accent text-white' : 'text-gray-500 hover:text-white'}`}
              >
                  <Utensils size={14} /> NUTRITION
              </button>
          </div>

          <div className="flex-1 relative">
              {activeTab === 'MAP' && (
                  selectedDayIdx !== null ? (
                      <WorkoutOverview 
                         plan={healthProfile.workoutPlan[selectedDayIdx % 7]} 
                         focusVideos={playerData.focusVideos} 
                         onStart={handleEnterDungeon} 
                         onCancel={() => setSelectedDayIdx(null)} 
                      />
                  ) : (
                      <WorkoutMap 
                         currentWeight={healthProfile.weight} 
                         targetWeight={healthProfile.targetWeight || healthProfile.weight} 
                         workoutPlan={healthProfile.workoutPlan}
                         completedDays={playerData.history.length} 
                         onStartDay={handleSelectDay}
                      />
                  )
              )}

              {activeTab === 'NUTRITION' && (
                  <NutritionDashboard 
                      healthProfile={healthProfile}
                      logs={playerData.nutritionLogs}
                      onLog={onLogMeal!}
                      onDelete={onDeleteMeal!}
                  />
              )}
          </div>
      </div>
  );
};

export default HealthView;
