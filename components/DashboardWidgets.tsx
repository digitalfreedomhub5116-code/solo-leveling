
import React from 'react';
import { PlayerData } from '../types';
import { Footprints, CheckCircle, Flame } from 'lucide-react';

interface DashboardWidgetsProps {
    player: PlayerData;
    onOpenDuskChat?: () => void;
    unreadCount?: number;
}

const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({ player }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      
      {/* 1. STEPS (Purple Card) */}
      <div className="col-span-1 card-purple p-5 flex flex-col justify-between h-[160px] relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
              <span className="text-sm font-bold text-black">Steps</span>
              <Footprints className="text-black/50" size={20} />
          </div>
          
          <div className="relative z-10">
              <h3 className="text-3xl font-bold text-black leading-none mb-1">
                  1840
              </h3>
              <p className="text-[10px] text-black/60 font-bold uppercase">Steps</p>
          </div>

          {/* Decorative footprints icon in background */}
          <div className="absolute bottom-4 right-4 opacity-10 rotate-[-15deg] pointer-events-none">
              <Footprints size={60} />
          </div>
      </div>

      {/* 2. MY GOALS (Dark Card) */}
      <div className="col-span-1 card-dark p-5 flex flex-col justify-between h-[160px] relative bg-[#2C2C2E]">
          <div className="flex justify-between items-start">
              <span className="text-sm font-bold text-white">My Goals</span>
          </div>

          <p className="text-[10px] text-gray-400 leading-tight">
              Keep it up, you can achieve your goals.
          </p>

          <div className="flex items-center gap-3">
              {/* Circular Progress */}
              <div className="relative w-12 h-12">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                        className="text-gray-700"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="text-white"
                        strokeDasharray="42, 100"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">42%</div>
              </div>
          </div>
      </div>

      {/* 3. CALORIES / STATS (Bottom Wide Card) */}
      <div className="col-span-2 card-dark p-5 flex items-center justify-between">
          <div className="space-y-3">
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#85D3E0]" />
                  <span className="text-xs text-white font-bold">1200 Kcal Target</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white" />
                  <span className="text-xs text-white font-bold">320 Kcal Burned</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#D4C4FA]" />
                  <span className="text-xs text-white font-bold">872 Kcal Remaining</span>
              </div>
          </div>

          {/* Donut Chart Visual */}
          <div className="relative w-24 h-24">
             <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                 <circle cx="50" cy="50" r="40" fill="none" stroke="#333" strokeWidth="20" />
                 <circle cx="50" cy="50" r="40" fill="none" stroke="#85D3E0" strokeWidth="20" strokeDasharray="100 250" strokeLinecap="round" />
                 <circle cx="50" cy="50" r="40" fill="none" stroke="#D4C4FA" strokeWidth="20" strokeDasharray="60 250" strokeDashoffset="-110" strokeLinecap="round" />
             </svg>
          </div>
      </div>

    </div>
  );
};

export default DashboardWidgets;
