
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Castle, X, Zap, Sparkles, HelpCircle, Check, Loader2, Lock, Clock } from 'lucide-react';
import { SystemCoin } from './icons/SystemCoin';
import { SystemKey } from './icons/SystemKey';
import { playSystemSoundEffect } from '../utils/soundEngine';

interface MobileFloatingMenuProps {
  onEnterDungeon: (isFree: boolean) => void;
  gold: number;
  keys: number;
  onConsumeKey: (amount: number) => Promise<boolean>;
  onAddRewards: (gold: number, xp: number, keys: number) => void;
  onAddNotification: (msg: string, type: any) => void;
}

interface RewardCardData {
    type: 'GOLD' | 'XP' | 'KEYS' | 'ITEM';
    amount: number;
    label?: string;
}

interface GachaCardProps {
    data: RewardCardData;
    index: number;
    onSelect: () => void;
    isSelected: boolean;
    anySelected: boolean;
    centerOffset: { x: number; y: number };
}

// --- SELECTABLE GACHA CARD ---
const GachaCard: React.FC<GachaCardProps> = ({ 
    data, 
    index, 
    onSelect, 
    isSelected, 
    anySelected, 
    centerOffset 
}) => {
    const getIcon = () => {
        switch(data.type) {
            case 'GOLD': return <SystemCoin size={32} />;
            case 'XP': return <Zap size={32} className="text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />;
            case 'KEYS': return <SystemKey size={32} />;
            default: return <Sparkles size={32} className="text-purple-400" />;
        }
    };

    // Spread logic relative to the "Center" point
    const spreadX = index % 2 === 0 ? -50 : 50; 
    const spreadY = index < 2 ? -65 : 65;

    const finalX = isSelected ? centerOffset.x : centerOffset.x + spreadX;
    const finalY = isSelected ? centerOffset.y : centerOffset.y + spreadY;

    return (
        <motion.div
            initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
            animate={
                isSelected 
                ? { scale: 1.25, x: finalX, y: finalY, opacity: 1, zIndex: 100, rotateY: 180 } 
                : anySelected 
                    ? { scale: 0, opacity: 0 } 
                    : { scale: 1, x: finalX, y: finalY, opacity: 1, rotateY: 0 }
            }
            transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 20, 
                delay: isSelected ? 0 : 0.1 + (index * 0.05)
            }}
            onClick={!anySelected ? (e) => { e.stopPropagation(); onSelect(); } : undefined}
            className="absolute top-1/2 left-1/2 w-20 h-32 -ml-10 -mt-16 cursor-pointer perspective-1000 z-50 pointer-events-auto"
            style={{ transformStyle: 'preserve-3d' }}
        >
            {/* FRONT (Hidden State) */}
            <div 
                className="absolute inset-0 backface-hidden bg-gray-900 border-2 border-gray-700 rounded-lg flex flex-col items-center justify-center shadow-xl group hover:border-white transition-colors"
                style={{ backfaceVisibility: 'hidden' }}
            >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:10px_10px]" />
                <div className="w-8 h-8 rounded-full bg-black border border-gray-600 flex items-center justify-center text-gray-500">
                    <HelpCircle size={16} />
                </div>
            </div>

            {/* BACK (Revealed State) */}
            <div 
                className={`absolute inset-0 backface-hidden bg-black border-2 ${data.type === 'GOLD' ? 'border-yellow-500' : 'border-system-neon'} rounded-lg flex flex-col items-center justify-center shadow-[0_0_20px_rgba(0,210,255,0.3)]`}
                style={{ 
                    transform: 'rotateY(180deg)', 
                    backfaceVisibility: 'hidden',
                    opacity: isSelected ? 1 : 0 
                }}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-2 scale-90">{getIcon()}</div>
                    <div className="text-lg font-black text-white font-mono">{data.amount > 0 ? `+${data.amount}` : ''}</div>
                    <div className="text-[8px] font-bold bg-gray-800 px-2 py-0.5 rounded text-gray-400 uppercase tracking-wider mt-1">
                        {data.label || data.type}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- IN-PLACE CHEST SELECTOR ---
const ChestSelector = ({ 
    label, 
    color, 
    onClick, 
    delay, 
    isActive, 
    isFaded, 
    isOpening, 
    onVideoEnd,
    centerOffset,
    videoUrl,
    scale = 1,
    costLabel,
    isLocked,
    children 
}: { 
    label: string, 
    color: string, 
    onClick: () => void, 
    delay: number, 
    isActive: boolean, 
    isFaded: boolean, 
    isOpening: boolean, 
    onVideoEnd?: () => void,
    centerOffset: { x: number, y: number },
    videoUrl: string,
    scale?: number,
    costLabel: React.ReactNode,
    isLocked?: boolean,
    children?: React.ReactNode
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isVideoReady, setIsVideoReady] = useState(false);

    useEffect(() => {
        if (isOpening && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
        }
    }, [isOpening]);

    return (
        <div 
            className={`flex flex-col items-center gap-2 cursor-pointer relative z-10 transition-all duration-500 ${isFaded ? 'opacity-30 grayscale' : 'opacity-100'}`} 
            style={{ transform: `scale(${scale})` }}
            onClick={!isFaded && !isOpening && !isLocked ? onClick : undefined}
        >
            <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: isActive && isOpening ? 1.1 : 1, opacity: 1 }} 
                transition={{ delay: isOpening ? 0 : delay, type: "spring", stiffness: 200, damping: 15 }}
            >
                <motion.div
                    animate={!isOpening ? { y: [-5, 5, -5] } : { y: 0 }}
                    transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: Math.random() * 2 
                    }}
                    whileHover={!isOpening && !isFaded && !isLocked ? { scale: 1.15 } : {}}
                    whileTap={!isOpening && !isFaded && !isLocked ? { scale: 0.9 } : {}}
                    className={`relative w-28 h-28 flex items-center justify-center rounded-xl bg-black overflow-hidden ${isLocked ? 'border border-gray-800' : ''}`}
                    style={{ backgroundColor: '#000000' }} 
                >
                    {/* SKELETON LOADER */}
                    {!isVideoReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-xl animate-pulse z-10">
                            <Loader2 className="animate-spin text-gray-600" size={24} />
                        </div>
                    )}

                    {/* LOCKED OVERLAY */}
                    {isLocked && (
                        <div className="absolute inset-0 z-30 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                            <Lock className="text-gray-500" size={24} />
                        </div>
                    )}

                    {/* Video Thumbnail */}
                    <video 
                        ref={videoRef}
                        src={videoUrl}
                        className={`w-full h-full object-contain rounded-xl transition-opacity duration-300 ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}
                        muted={!isOpening} 
                        loop={!isOpening} 
                        playsInline
                        preload="auto"
                        style={{ mixBlendMode: 'screen' }} 
                        onEnded={isOpening ? onVideoEnd : undefined}
                        onLoadedData={() => setIsVideoReady(true)}
                    />
                    
                    {/* Render Children (Cards) */}
                    {children}
                </motion.div>
            </motion.div>
            
            <motion.div 
                animate={{ opacity: isOpening ? 0 : 1 }}
                className="flex flex-col items-center"
            >
                <span className={`text-[9px] font-mono font-black uppercase tracking-widest ${color} drop-shadow-md`}>
                    {label}
                </span>
                <span className={`text-[8px] font-mono font-bold bg-black/80 px-2 py-0.5 rounded border border-gray-800 mt-1 flex items-center gap-1 ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                    {costLabel}
                </span>
            </motion.div>
        </div>
    );
};

const MobileFloatingMenu: React.FC<MobileFloatingMenuProps> = ({ 
    onEnterDungeon, 
    gold, 
    keys,
    onConsumeKey,
    onAddRewards,
    onAddNotification
}) => {
  const [activeModal, setActiveModal] = useState<'NONE' | 'REWARDS' | 'DUNGEON'>('NONE');
  const [isChestLoaded, setIsChestLoaded] = useState(false);
  
  // Chest Logic
  const [chestPhase, setChestPhase] = useState<'SELECTION' | 'OPENING' | 'CARDS_EMERGE'>('SELECTION');
  const [rewards, setRewards] = useState<RewardCardData[]>([]);
  const [selectedChestType, setSelectedChestType] = useState<string>(''); 
  
  // Cooldown Logic
  const [nextDailyTime, setNextDailyTime] = useState<number>(0);
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");

  // Initialize Timer from LocalStorage
  useEffect(() => {
      const savedTime = localStorage.getItem('daily_chest_next_claim');
      if (savedTime) {
          const next = parseInt(savedTime, 10);
          setNextDailyTime(next);
      }
  }, []);

  // Timer Tick
  useEffect(() => {
      const interval = setInterval(() => {
          const now = Date.now();
          if (nextDailyTime > now) {
              const diff = nextDailyTime - now;
              const mins = Math.floor(diff / 60000);
              const secs = Math.floor((diff % 60000) / 1000);
              setTimeLeftStr(`${mins}m ${secs}s`);
          } else {
              setTimeLeftStr("");
              // If it was previously set and now it's ready, we could notify once
              if (nextDailyTime !== 0 && now >= nextDailyTime) {
                  // Reset logic done
              }
          }
      }, 1000);
      return () => clearInterval(interval);
  }, [nextDailyTime]);

  // Check for Ready state on mount
  useEffect(() => {
      const savedTime = localStorage.getItem('daily_chest_next_claim');
      const now = Date.now();
      if (!savedTime || now > parseInt(savedTime, 10)) {
          onAddNotification("Daily Chest Available", "SUCCESS");
      }
  }, []);
  
  // Selection Logic
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

  // Reset when modal opens
  useEffect(() => {
      if (activeModal === 'REWARDS') {
          setChestPhase('SELECTION');
          setSelectedChestType('');
          setSelectedCardIndex(null);
      }
  }, [activeModal]);

  const handleSelectChest = async (type: string) => {
      // 1. Cost & Cooldown Validation
      if (type === 'DAILY') {
          if (Date.now() < nextDailyTime) {
              playSystemSoundEffect('WARNING');
              return;
          }
      } else if (type === 'LEGENDARY') {
          if (keys < 7) {
              playSystemSoundEffect('DANGER');
              onAddNotification("Need 7 Keys", "WARNING");
              return;
          }
          await onConsumeKey(7);
      } else if (type === 'ALLIANCE') {
          if (keys < 36) {
              playSystemSoundEffect('DANGER');
              onAddNotification("Need 36 Keys", "WARNING");
              return;
          }
          await onConsumeKey(36);
      }

      // 2. Open Logic
      playSystemSoundEffect('PURCHASE');
      setSelectedChestType(type);
      setChestPhase('OPENING');
      setSelectedCardIndex(null);
      
      const pool = [
          { type: 'GOLD', amount: type === 'LEGENDARY' ? 1000 : 200, label: 'GOLD' },
          { type: 'XP', amount: type === 'LEGENDARY' ? 500 : 100, label: 'EXP' },
          { type: 'KEYS', amount: type === 'LEGENDARY' ? 3 : 1, label: 'KEY' },
          { type: 'ITEM', amount: 0, label: 'POTION' },
      ];
      
      setRewards([...pool].sort(() => Math.random() - 0.5) as RewardCardData[]);
  };

  const handleVideoEnd = () => {
      setChestPhase('CARDS_EMERGE');
  };

  const handleCardSelect = (index: number) => {
      playSystemSoundEffect('TICK');
      setSelectedCardIndex(index);
  };

  const handleCollect = () => {
      // Reward logic
      if (selectedCardIndex !== null) {
          const reward = rewards[selectedCardIndex];
          onAddRewards(
              reward.type === 'GOLD' ? reward.amount : 0,
              reward.type === 'XP' ? reward.amount : 0,
              reward.type === 'KEYS' ? reward.amount : 0
          );
          
          if (selectedChestType === 'DAILY') {
              // Set 40 min cooldown
              const cooldown = 40 * 60 * 1000;
              const next = Date.now() + cooldown;
              setNextDailyTime(next);
              localStorage.setItem('daily_chest_next_claim', next.toString());
          }
          
          playSystemSoundEffect('LEVEL_UP');
      }
      setActiveModal('NONE');
  };

  // Helper to render chest logic
  const renderChestSlot = (type: string, label: string, color: string, delay: number, offset: { x: number, y: number }, scale: number = 1) => {
      const isSelected = selectedChestType === type;
      const isSomethingSelected = selectedChestType !== '';
      const isOpening = isSelected && (chestPhase === 'OPENING' || chestPhase === 'CARDS_EMERGE');
      const showCards = isSelected && chestPhase === 'CARDS_EMERGE';

      // Specific Video URL based on chest type
      let videoUrl = "https://res.cloudinary.com/dcnqnbvp0/video/upload/v1771008540/Untitled_video_-_Made_with_Clipchamp_21_ehz8d1.mp4"; // Default (Daily)
      
      if (type === 'LEGENDARY') {
          videoUrl = "https://res.cloudinary.com/dcnqnbvp0/video/upload/v1771014509/tdthgf_-_Made_with_Clipchamp_2_qf8zyy.mp4";
      } else if (type === 'ALLIANCE') {
          videoUrl = "https://res.cloudinary.com/dcnqnbvp0/video/upload/v1771015223/The_chest_should_202602140208_znzx6_1_mya5vc.mp4";
      }

      // Cost Label Logic
      let costNode: React.ReactNode = "FREE";
      let isLocked = false;

      if (type === 'DAILY') {
          if (timeLeftStr) {
              costNode = <><Clock size={10} /> {timeLeftStr}</>;
              isLocked = true;
          } else {
              costNode = <><Check size={10} /> READY</>;
          }
      } else if (type === 'LEGENDARY') {
          costNode = <><SystemKey size={10} /> 7 KEYS</>;
          if (keys < 7) isLocked = true;
      } else if (type === 'ALLIANCE') {
          costNode = <><SystemKey size={10} /> 36 KEYS</>;
          if (keys < 36) isLocked = true;
      }

      return (
          <ChestSelector 
              label={label} 
              color={color} 
              onClick={() => handleSelectChest(type)} 
              delay={delay}
              isActive={isSelected}
              isFaded={isSomethingSelected && !isSelected}
              isOpening={isOpening}
              onVideoEnd={handleVideoEnd}
              centerOffset={offset}
              videoUrl={videoUrl}
              scale={scale}
              costLabel={costNode}
              isLocked={isLocked}
          >
              {showCards && (
                  <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                      {rewards.map((r, i) => (
                          <GachaCard 
                              key={i} 
                              data={r} 
                              index={i} 
                              onSelect={() => handleCardSelect(i)} 
                              isSelected={selectedCardIndex === i}
                              anySelected={selectedCardIndex !== null}
                              centerOffset={offset}
                          />
                      ))}
                  </div>
              )}
          </ChestSelector>
      );
  };

  return (
    <>
      <div className="fixed right-4 bottom-24 z-[80] flex flex-col gap-4 md:hidden pointer-events-none">
        
        {/* REWARDS BUTTON */}
        <motion.button
          initial={{ x: 100, opacity: 0, y: 0 }}
          animate={{ x: 0, opacity: 1, y: [0, -8, 0] }}
          transition={{ 
            x: { type: "spring", stiffness: 200, damping: 20, delay: 0.5 },
            opacity: { duration: 0.5, delay: 0.5 },
            y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
          }}
          onClick={() => setActiveModal('REWARDS')}
          className="pointer-events-auto w-12 h-12 bg-black/40 backdrop-blur-md border border-purple-500/40 rounded-full flex items-center justify-center active:scale-90 transition-all relative group hover:bg-black/80 hover:border-purple-500/60 overflow-hidden"
        >
            {!isChestLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.2)]" />
                </div>
            )}
            <img 
                src="https://res.cloudinary.com/dcnqnbvp0/image/upload/v1771005827/finalimage_zeavky.png"
                alt="Rewards"
                className={`w-full h-full object-cover transition-opacity duration-500 ${isChestLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsChestLoaded(true)}
            />
        </motion.button>

        {/* DUNGEON BUTTON */}
        <motion.button
          initial={{ x: 100, opacity: 0, y: 0 }}
          animate={{ x: 0, opacity: 1, y: [0, -8, 0] }}
          transition={{ 
            x: { type: "spring", stiffness: 200, damping: 20, delay: 0.7 },
            opacity: { duration: 0.5, delay: 0.7 },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.7 }
          }}
          onClick={() => setActiveModal('DUNGEON')}
          className="pointer-events-auto w-12 h-12 bg-black/40 backdrop-blur-md border border-red-600/30 rounded-full flex items-center justify-center active:scale-90 transition-all relative group hover:bg-black/80 hover:border-red-600/60 overflow-hidden"
        >
            <img 
                src="https://res.cloudinary.com/dcnqnbvp0/image/upload/v1771017431/dungeonlogo_1_hucwnd.jpg"
                alt="Dungeon"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
        </motion.button>
      </div>

      <AnimatePresence>
        {activeModal !== 'NONE' && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
                onClick={() => setActiveModal('NONE')}
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-sm bg-[#0a0a0a] border border-gray-800 rounded-2xl relative overflow-visible"
                >
                    <button 
                        onClick={() => setActiveModal('NONE')}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white z-20"
                    >
                        <X size={20} />
                    </button>

                    {activeModal === 'REWARDS' && (
                        <div className="p-0 flex flex-col items-center min-h-[600px]">
                            <div className="w-full p-6 text-center border-b border-gray-800 bg-gray-900/50 relative z-10 shrink-0 rounded-t-2xl">
                                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">
                                    <span className="text-purple-500">{chestPhase === 'SELECTION' ? 'CHOOSE' : selectedChestType}</span> CACHE
                                </h2>
                            </div>

                            <div className="relative w-full flex-1 flex flex-col items-center justify-center bg-black rounded-b-2xl p-6 transition-colors duration-500 overflow-visible">
                                <div className="flex flex-col items-center justify-center w-full h-full relative z-20 gap-4">
                                    <div className="relative z-30">
                                        {renderChestSlot('DAILY', 'Daily', 'text-cyan-400', 0.1, { x: 0, y: 100 })}
                                    </div>
                                    <div className="flex items-center justify-center gap-4 relative z-20">
                                        {renderChestSlot('LEGENDARY', 'Legendary', 'text-yellow-500', 0.2, { x: 60, y: -80 }, 1.1)}
                                        {renderChestSlot('ALLIANCE', 'Alliance', 'text-purple-500', 0.3, { x: -60, y: -80 }, 1.2)}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full p-4 border-t border-gray-800 bg-gray-900/50 flex justify-center relative z-20 shrink-0 rounded-b-2xl">
                                {chestPhase === 'SELECTION' && <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Select a cache to unlock</div>}
                                {chestPhase === 'OPENING' && <div className="text-xs text-purple-400 font-mono animate-pulse uppercase tracking-widest">UNLOCKING...</div>}
                                {chestPhase === 'CARDS_EMERGE' && selectedCardIndex === null && (
                                    <div className="text-xs text-white font-mono animate-pulse uppercase tracking-widest font-bold">
                                        SELECT ONE REWARD
                                    </div>
                                )}
                                {selectedCardIndex !== null && (
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={handleCollect}
                                        className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Check size={16} /> CLAIM REWARD
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    )}

                    {activeModal === 'DUNGEON' && (
                        <div className="p-0 flex flex-col">
                            <div className="h-32 bg-red-950/30 relative flex items-center justify-center overflow-hidden border-b border-red-900/50 rounded-t-2xl">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.2)_0%,transparent_70%)]" />
                                <Castle size={64} className="text-red-600 relative z-10 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
                            </div>
                            <div className="p-6 text-center space-y-6">
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">DEMON TOWER</h2>
                                    <p className="text-[10px] text-red-400 font-mono uppercase tracking-[0.2em] font-bold">Floor 1 - 100 Available</p>
                                </div>
                                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-3 tracking-widest">Potential Acquisition</p>
                                    <div className="flex justify-center items-center gap-6">
                                        <div className="flex flex-col items-center gap-1">
                                            <SystemCoin size={32} />
                                            <span className="text-xs font-bold text-yellow-500">100-5000</span>
                                        </div>
                                        <div className="w-px h-8 bg-gray-700" />
                                        <div className="flex flex-col items-center gap-1">
                                            <SystemKey size={32} />
                                            <span className="text-xs font-bold text-purple-500">Key Drops</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { setActiveModal('NONE'); onEnterDungeon(true); }}
                                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    ENTER DUNGEON <Castle size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileFloatingMenu;
