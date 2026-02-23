
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, Skull, Sparkles, LogOut, ChevronUp, Lock, Zap } from 'lucide-react';
import { useCoinReward } from '../hooks/useCoinReward';
import { playSystemSoundEffect } from '../utils/soundEngine';
import { SystemCoin } from './icons/SystemCoin';
import { SystemKey } from './icons/SystemKey';

// --- TYPES ---
export type CardType = 'SAFE' | 'TRAP' | 'JACKPOT';
export type TurnState = 'IDLE' | 'REVEALING' | 'SHOW_ALL' | 'GAME_OVER' | 'VICTORY' | 'LOCKED' | 'TRANSITION';

export interface FloorReward {
    gold: number;
    xp: number;
    keys: number;
}

export interface FloorCardData {
    id: string;
    type: CardType;
    isRevealed: boolean;
    reward: FloorReward;
}

export interface DemonCastleProps {
    gold: number;
    keys: number;
    lastDungeonEntry: number;
    onDeductGold: (amount: number) => boolean;
    onConsumeKey: (amount?: number) => Promise<boolean>;
    onEnterDungeon: (isFree: boolean) => Promise<boolean>;
    onAddRewards: (gold: number, xp: number, keys: number) => void;
    onPlayStateChange: (isPlaying: boolean) => void;
    initialMode?: 'LOBBY' | 'PLAYING';
    onExit: () => void;
}

interface LootBag {
    gold: number;
    xp: number;
    keys: number;
}

// --- CONFIGURATION ---
const getKeyReward = (floor: number) => (floor % 10 === 0 ? 3 : floor % 5 === 0 ? 1 : 0);
const getGoldReward = (floor: number) => Math.floor(10 * Math.pow(1.1, floor));
const getXpReward = (floor: number) => Math.floor(50 * Math.pow(1.1, floor));

// --- SUB-COMPONENTS ---

// 1. The Elevator Doors
const ElevatorDoors = ({ isOpen, floor, isLobby }: { isOpen: boolean; floor: number, isLobby: boolean }) => {
    return (
        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-center overflow-hidden">
            {/* Left Door */}
            <motion.div 
                initial={{ x: 0 }}
                animate={{ x: isOpen ? '-100%' : '0%' }}
                transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                className="absolute left-0 top-0 bottom-0 w-1/2 bg-[#0a0a0a] border-r-2 border-gray-800 flex items-center justify-end pr-2 shadow-2xl z-50"
            >
                <div className="w-1 h-32 bg-gray-800 rounded-full" />
            </motion.div>

            {/* Right Door */}
            <motion.div 
                initial={{ x: 0 }}
                animate={{ x: isOpen ? '100%' : '0%' }}
                transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#0a0a0a] border-l-2 border-gray-800 flex items-center justify-start pl-2 shadow-2xl z-50"
            >
                <div className="w-1 h-32 bg-gray-800 rounded-full" />
            </motion.div>

            {/* Floor Indicator (Visible when doors are closed) */}
            <div className="absolute inset-0 flex items-center justify-center z-[60]">
                <AnimatePresence>
                    {!isOpen && !isLobby && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.5 }}
                            className="bg-black border-2 border-red-900/50 p-6 rounded-lg shadow-xl text-center"
                        >
                            <div className="text-red-500 font-mono text-xs uppercase tracking-[0.3em] mb-2 animate-pulse">Floor Protocol</div>
                            <div className="text-6xl font-black text-white font-mono flex items-center gap-4">
                                <ChevronUp className="animate-bounce text-red-600" size={48} />
                                {floor}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// 2. The Card
const DungeonCard = ({ 
    card, 
    onClick, 
    disabled 
}: { 
    card: FloorCardData; 
    onClick: (e: React.MouseEvent<HTMLElement>) => void; 
    disabled: boolean;
}) => {
    return (
        <div 
            className={`relative w-full aspect-[2/3] perspective-1000 group cursor-pointer ${disabled ? 'pointer-events-none' : ''}`}
            onClick={onClick}
        >
            <motion.div
                className="w-full h-full relative preserve-3d transition-all duration-500"
                animate={{ rotateY: card.isRevealed ? 180 : 0 }}
                whileHover={!card.isRevealed && !disabled ? { scale: 1.05, y: -5 } : {}}
                style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
            >
                {/* --- CARD BACK (HIDDEN STATE) --- */}
                <div 
                    className="absolute inset-0 backface-hidden rounded-xl bg-gray-900 border border-gray-700 shadow-lg overflow-hidden flex flex-col items-center justify-center"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    {/* Simplified Background for Performance */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
                    
                    {/* Pattern */}
                    <div className="absolute inset-2 border border-dashed border-gray-700 rounded-lg opacity-30" />
                    
                    {/* Glowing Core */}
                    <div className="relative z-10 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-black border border-gray-600 flex items-center justify-center transition-all duration-300">
                        <Ghost className="text-gray-600 w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    
                    <div className="absolute bottom-4 text-[8px] sm:text-[10px] text-gray-600 font-mono tracking-widest uppercase">
                        Unknown
                    </div>
                </div>

                {/* --- CARD FRONT (REVEALED STATE) --- */}
                <div 
                    className={`absolute inset-0 backface-hidden rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center shadow-xl
                    ${card.type === 'TRAP' ? 'bg-red-950 border-red-600' : 
                      card.type === 'JACKPOT' ? 'bg-purple-950 border-purple-500' : 
                      'bg-gray-900 border-yellow-500'}`}
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    {/* Light Burst Background */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
                    
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: card.isRevealed ? 1 : 0 }}
                        transition={{ type: "spring", delay: 0.1 }}
                        className="relative z-10"
                    >
                        {card.type === 'TRAP' && <Skull className="w-10 h-10 sm:w-16 sm:h-16 text-red-500" />}
                        {card.type === 'SAFE' && <SystemCoin size={64} />}
                        {card.type === 'JACKPOT' && <Sparkles className="w-10 h-10 sm:w-16 sm:h-16 text-purple-400" />}
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative z-10 mt-2 sm:mt-4 text-center"
                    >
                        <div className={`text-lg sm:text-2xl font-black font-mono ${card.type === 'TRAP' ? 'text-red-500' : card.type === 'JACKPOT' ? 'text-purple-300' : 'text-yellow-300'}`}>
                            {card.type === 'TRAP' ? 'TRAP' : `+${card.reward.gold}`}
                        </div>
                        {card.reward.keys > 0 && (
                            <div className="text-[10px] sm:text-xs font-bold text-purple-400 flex items-center justify-center gap-1 mt-1">
                                <SystemKey size={12} /> +{card.reward.keys}
                            </div>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const DemonCastle: React.FC<DemonCastleProps> = ({ 
    gold, keys, lastDungeonEntry, 
    onDeductGold, onConsumeKey, onEnterDungeon, onAddRewards, 
    onPlayStateChange, initialMode = 'LOBBY', onExit 
}) => {
    const { triggerCoinReward } = useCoinReward();
    const isMounted = useRef(true);

    // State
    const [mode, setMode] = useState<'LOBBY' | 'PLAYING'>(initialMode);
    const [floor, setFloor] = useState(1);
    const [lootBag, setLootBag] = useState<LootBag>({ gold: 0, xp: 0, keys: 0 });
    const [cards, setCards] = useState<FloorCardData[]>([]);
    const [turnState, setTurnState] = useState<TurnState>('IDLE');
    const [doorsOpen, setDoorsOpen] = useState(true);

    // Effects
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (mode === 'PLAYING') {
            onPlayStateChange(true);
            startFloorSequence(1);
        } else {
            onPlayStateChange(false);
            setDoorsOpen(true);
        }
    }, [mode]);

    // --- GAME LOGIC ---

    const startFloorSequence = async (targetFloor: number) => {
        // 1. Close Doors
        setDoorsOpen(false);
        setTurnState('TRANSITION');

        // 2. Wait for close + simulation time
        await new Promise(r => setTimeout(r, 1200));
        
        if (!isMounted.current) return;

        // 3. Update Floor Data behind doors
        setFloor(targetFloor);
        generateCards(targetFloor);

        // 4. Open Doors
        await new Promise(r => setTimeout(r, 500));
        setDoorsOpen(true);
        setTurnState('IDLE');
    };

    const generateCards = (currentFloor: number) => {
        const cardCount = 3; 
        const isJackpotFloor = currentFloor % 5 === 0;
        const newCards: FloorCardData[] = [];
        
        for (let i = 0; i < cardCount; i++) {
            newCards.push({
                id: `floor_${currentFloor}_card_${i}`,
                type: 'SAFE', // Will be determined on click for suspense logic
                isRevealed: false,
                reward: { 
                    gold: getGoldReward(currentFloor), 
                    xp: getXpReward(currentFloor), 
                    keys: 0 
                }
            });
        }
        setCards(newCards);
    };

    const handleCardClick = async (cardIndex: number, e: React.MouseEvent<HTMLElement>) => {
        if (turnState !== 'IDLE') return;
        setTurnState('REVEALING');

        // Determine Fate
        const isJackpotFloor = floor % 5 === 0;
        const trapChance = isJackpotFloor ? 0 : (floor > 10 ? 0.45 : 0.33);
        const roll = Math.random();
        
        let resultType: CardType = 'SAFE';
        if (roll < trapChance) resultType = 'TRAP';
        else if (isJackpotFloor || Math.random() < 0.1) resultType = 'JACKPOT';

        // Update Selected Card
        const newCards = [...cards];
        const selectedCard = { ...newCards[cardIndex] };
        selectedCard.type = resultType;
        selectedCard.isRevealed = true;
        
        if (resultType === 'JACKPOT') {
            selectedCard.reward.keys = getKeyReward(floor) || 1;
            selectedCard.reward.gold *= 2;
        }

        newCards[cardIndex] = selectedCard;
        setCards(newCards);

        // Process Result
        if (resultType === 'TRAP') {
            playSystemSoundEffect('DANGER');
            setTurnState('GAME_OVER');
        } else {
            playSystemSoundEffect('PURCHASE');
            if (resultType === 'JACKPOT') playSystemSoundEffect('LEVEL_UP');
            
            triggerCoinReward(e, 'dungeon-loot-counter');

            setLootBag(prev => ({
                gold: prev.gold + selectedCard.reward.gold,
                xp: prev.xp + selectedCard.reward.xp,
                keys: prev.keys + selectedCard.reward.keys
            }));

            // Reveal others after delay
            setTimeout(() => {
                revealOthers(cardIndex);
                setTurnState('SHOW_ALL');
                
                // Next floor trigger
                setTimeout(() => {
                    startFloorSequence(floor + 1);
                }, 1500);
            }, 800);
        }
    };

    const revealOthers = (selectedIndex: number) => {
        setCards(prev => prev.map((c, i) => {
            if (i === selectedIndex) return c;
            // Generate fake results for others to show "what could have been"
            const type = Math.random() > 0.5 ? 'TRAP' : 'SAFE';
            return { ...c, isRevealed: true, type, reward: { ...c.reward, gold: 5 } };
        }));
    };

    const handleCashOut = () => {
        onAddRewards(lootBag.gold, lootBag.xp, lootBag.keys);
        onExit(); // Or reset to Lobby
    };

    // --- RENDER ---

    return (
        <div className="relative h-[calc(100vh-80px)] w-full overflow-hidden bg-black font-mono">
            
            {/* 1. Global Elevator Doors (Overlay everything) */}
            <ElevatorDoors isOpen={doorsOpen} floor={floor} isLobby={mode === 'LOBBY'} />

            {/* 2. Top HUD (Sticky) */}
            <div className="absolute top-0 left-0 w-full z-40 p-4 flex justify-between items-start pointer-events-none">
                <div className="pointer-events-auto bg-black/80 border border-gray-800 backdrop-blur-md rounded-xl p-3 flex items-center gap-4 shadow-lg">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Current Floor</span>
                        <span className="text-2xl font-black text-white leading-none">{floor}</span>
                    </div>
                    <div className="h-8 w-px bg-gray-700" />
                    <div id="dungeon-loot-counter" className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Loot Bag</span>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-yellow-400 flex items-center gap-1"><SystemCoin size={16}/> {lootBag.gold}</span>
                            <span className="text-sm font-bold text-purple-400 flex items-center gap-1"><SystemKey size={16}/> {lootBag.keys}</span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleCashOut}
                    className="pointer-events-auto bg-system-success/10 border border-system-success/50 text-system-success px-4 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-system-success hover:text-black transition-colors shadow-lg flex items-center gap-2"
                >
                    <LogOut size={14} /> LEAVE
                </button>
            </div>

            {/* 3. Main Content Area */}
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6">
                
                {/* OPTIMIZED BACKGROUND: Static Image with Gradient */}
                {/* Using a high-quality dungeon image as static background. No animation loop. */}
                <div 
                    className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-30"
                    style={{ backgroundImage: `url('https://res.cloudinary.com/dcnqnbvp0/image/upload/f_auto,q_auto,w_800/v1771066637/Image_202602141625_tlkmvf.jpg')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] pointer-events-none" />

                <AnimatePresence mode="wait">
                    {mode === 'LOBBY' ? (
                        <motion.div 
                            key="lobby"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="text-center z-10 space-y-8 max-w-md w-full"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-600 blur-[80px] opacity-10" />
                                <Ghost size={80} className="relative z-10 text-white mx-auto drop-shadow-2xl" />
                            </div>
                            
                            <div>
                                <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase mb-2">
                                    Demon Tower
                                </h1>
                                <p className="text-gray-400 font-mono text-xs uppercase tracking-[0.3em]">
                                    Ascend the floors. Survive the traps.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <button 
                                    onClick={() => onEnterDungeon(true).then(ok => ok && setMode('PLAYING'))}
                                    className="w-full py-5 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl hover:border-white transition-all group relative overflow-hidden"
                                >
                                    <div className="relative z-10 flex items-center justify-between px-6">
                                        <div className="text-left">
                                            <div className="text-white font-bold text-lg uppercase italic">Standard Entry</div>
                                            <div className="text-gray-500 text-[10px] uppercase tracking-widest">1 Free Daily Run</div>
                                        </div>
                                        <ChevronUp className="text-gray-600 group-hover:text-white transition-colors" />
                                    </div>
                                </button>

                                <button 
                                    onClick={() => onEnterDungeon(false).then(ok => ok && setMode('PLAYING'))}
                                    className="w-full py-5 bg-gradient-to-r from-red-950 to-red-900 border border-red-800 rounded-xl hover:border-red-500 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10 flex items-center justify-between px-6">
                                        <div className="text-left">
                                            <div className="text-red-100 font-bold text-lg uppercase italic flex items-center gap-2">
                                                <Zap size={16} fill="currentColor" /> Overdrive
                                            </div>
                                            <div className="text-red-400 text-[10px] uppercase tracking-widest">Cost: 3 Keys</div>
                                        </div>
                                        <Lock size={20} className="text-red-500" />
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    ) : turnState === 'GAME_OVER' ? (
                        <motion.div 
                            key="gameover"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center z-30 bg-black/90 p-10 rounded-3xl border border-red-900 shadow-2xl"
                        >
                            <Skull size={100} className="mx-auto text-red-600 mb-6 animate-pulse" />
                            <h2 className="text-4xl font-black text-red-500 uppercase tracking-tighter mb-2">Eliminated</h2>
                            <p className="text-gray-500 text-xs uppercase tracking-widest mb-8">Floor {floor} Claimed Your Soul</p>
                            
                            <div className="bg-red-950/30 p-4 rounded-xl mb-8 border border-red-900/30">
                                <div className="text-[10px] text-red-400 uppercase font-bold mb-2">Resources Lost</div>
                                <div className="flex justify-center gap-6 opacity-50 line-through font-mono">
                                    <span className="text-yellow-600">{lootBag.gold} G</span>
                                    <span className="text-purple-600">{lootBag.keys} K</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => { setLootBag({gold:0,xp:0,keys:0}); setFloor(1); setMode('LOBBY'); }}
                                className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                            >
                                Return to Lobby
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="cards"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="relative z-10 w-full max-w-5xl"
                        >
                            {/* Card Grid - Always 3 columns */}
                            <div className="grid grid-cols-3 gap-3 md:gap-8 px-2 md:px-0 w-full">
                                {cards.map((card, idx) => (
                                    <div key={card.id} className="flex justify-center items-center w-full">
                                        <div className="w-full max-w-[110px] sm:max-w-[180px] md:max-w-[240px]">
                                            <DungeonCard 
                                                card={card} 
                                                onClick={(e) => handleCardClick(idx, e)} 
                                                disabled={turnState !== 'IDLE'}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Instruction Text */}
                            <div className="mt-8 md:mt-12 text-center">
                                <p className="text-gray-500 font-mono text-[10px] sm:text-xs uppercase tracking-[0.3em] animate-pulse">
                                    {turnState === 'IDLE' ? 'Choose your fate' : 'Calibrating...'}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DemonCastle;
