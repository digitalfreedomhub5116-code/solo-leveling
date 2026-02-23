
import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Clock } from 'lucide-react';

interface LevelProgressCardProps {
  level: number;
  currentXP: number;
  maxXP: number;
}

const LevelProgressCard: React.FC<LevelProgressCardProps> = ({
  level,
  currentXP,
  maxXP,
}) => {
  // Mapping Level Progress to "Your Plan" UI from reference
  return (
    <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center px-2">
            <h3 className="text-lg font-bold text-white">Your plan</h3>
            <div className="flex gap-2 text-[10px] font-bold text-gray-500 uppercase">
                <span className="text-white bg-[#2C2C2E] px-3 py-1 rounded-full">All workouts</span>
                <span className="px-3 py-1">Lower body</span>
            </div>
        </div>

        {/* Card 1: Lower Body (Purple Gradient) */}
        <div className="w-full bg-[#D4C4FA] rounded-[2rem] p-5 flex justify-between items-center relative overflow-hidden h-32">
            <div className="relative z-10">
                <h4 className="text-black font-bold text-lg leading-tight mb-1">Lower body workout</h4>
                <div className="flex items-center gap-2 text-black/70 text-xs font-medium">
                    <span className="bg-white/50 px-2 py-0.5 rounded text-[10px] font-bold">5 exercises</span>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center bg-white rounded-2xl w-16 h-16 shadow-sm z-10">
                <span className="text-lg font-black text-black">30</span>
                <span className="text-[10px] font-bold text-gray-500">mins</span>
            </div>
            
            {/* Visual Decor */}
            <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none">
                 <Dumbbell size={100} className="text-white/40 rotate-[-15deg]" />
            </div>
        </div>

        {/* Card 2: Upper Body (Pinkish/Light Purple Gradient) */}
        <div className="w-full bg-[#F3E8FF] rounded-[2rem] p-5 flex justify-between items-center relative overflow-hidden h-32">
            <div className="relative z-10">
                <h4 className="text-black font-bold text-lg leading-tight mb-1">Upper body workout</h4>
                <div className="flex items-center gap-2 text-black/70 text-xs font-medium">
                    <span className="bg-white/50 px-2 py-0.5 rounded text-[10px] font-bold">Level {level}</span>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center bg-white rounded-2xl w-16 h-16 shadow-sm z-10">
                <span className="text-lg font-black text-black">20</span>
                <span className="text-[10px] font-bold text-gray-500">mins</span>
            </div>
             
             {/* Character Image Placeholder */}
             <img 
                src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=200&auto=format&fit=crop" 
                className="absolute right-20 top-2 w-20 h-28 object-cover mix-blend-multiply opacity-50 pointer-events-none"
                alt="Workout"
             />
        </div>
    </div>
  );
};

export default LevelProgressCard;
