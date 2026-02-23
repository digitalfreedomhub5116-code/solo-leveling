
import { TierLevel, TierConfig, Outfit, Shadow, CombatStats } from '../types';

export const TIERS: Record<TierLevel, TierConfig> = {
  E: { id: 'E', statCap: 70, color: 'text-gray-400' },
  D: { id: 'D', statCap: 150, color: 'text-green-400' },
  C: { id: 'C', statCap: 300, color: 'text-blue-400' },
  B: { id: 'B', statCap: 600, color: 'text-purple-400' },
  A: { id: 'A', statCap: 1200, color: 'text-yellow-400' },
  S: { id: 'S', statCap: 5000, color: 'text-red-500' },
};

// Base Stats are "Pre-Buff" values provided by the outfit
export const OUTFITS: Outfit[] = [
  {
    id: 'outfit_starter',
    name: 'Neophyte Tracksuit',
    tier: 'E',
    description: 'Basic gear for the awakened. Offers minimal protection but unrestricted movement.',
    image: 'https://res.cloudinary.com/dcnqnbvp0/image/upload/v1769880473/eranklogoimg_nra2wm.jpg', // Placeholder E-Rank
    baseStats: { attack: 40, loot: 10, ultimate: 5, extraction: 0 },
    cost: 0
  },
  {
    id: 'outfit_assassin',
    name: 'Midnight Assassin',
    tier: 'B',
    description: 'Stealth gear woven from shadow thread. High extraction capability.',
    image: 'https://res.cloudinary.com/dcnqnbvp0/image/upload/v1769880470/branklogoimg_q1yqhw.jpg', // Placeholder B-Rank
    baseStats: { attack: 450, loot: 200, ultimate: 300, extraction: 550 },
    cost: 5000
  },
  {
    id: 'outfit_monarch',
    name: 'Monarch\'s Raiment',
    tier: 'S',
    description: 'The ceremonial armor of the Shadow Monarch. Limits transcended.',
    image: 'https://res.cloudinary.com/dcnqnbvp0/image/upload/v1769880469/sranklogoimg_bd6fu1.jpg', // Placeholder S-Rank
    baseStats: { attack: 2500, loot: 1500, ultimate: 4000, extraction: 5000 },
    cost: 50000
  },
  {
    id: 'outfit_knight',
    name: 'Iron Will Plate',
    tier: 'C',
    description: 'Standard issue tank armor. High durability.',
    image: 'https://res.cloudinary.com/dcnqnbvp0/image/upload/v1769880473/cranklogoimg_c0bkns.jpg',
    baseStats: { attack: 150, loot: 50, ultimate: 100, extraction: 20 },
    cost: 1500
  }
];

export const SHADOWS: Shadow[] = [
    {
        id: 'shadow_igris',
        name: 'Igris',
        rank: 'Elite',
        image: 'https://res.cloudinary.com/dcnqnbvp0/image/upload/v1771234567/igris_placeholder.png', // Needs valid URL, using placeholder logic in UI if fail
        buffs: [{ stat: 'attack', value: 150 }, { stat: 'ultimate', value: 50 }]
    },
    {
        id: 'shadow_tank',
        name: 'Tank',
        rank: 'Minion',
        image: '',
        buffs: [{ stat: 'loot', value: 30 }]
    },
    {
        id: 'shadow_beru',
        name: 'Beru',
        rank: 'Monarch',
        image: '',
        buffs: [{ stat: 'attack', value: 500 }, { stat: 'extraction', value: 200 }]
    }
];

/**
 * Calculates the final stat value considering base outfit stats, 
 * shadow buffs, and tier caps.
 */
export const calculateStat = (
  baseValue: number,
  tier: TierLevel,
  equippedShadows: (Shadow | null)[],
  statKey: keyof CombatStats
): { total: number; isCapped: boolean; cap: number } => {
  
  const tierConfig = TIERS[tier];
  let total = baseValue;

  // Add Shadow Buffs
  equippedShadows.forEach((shadow) => {
    if (shadow) {
      const buff = shadow.buffs.find((b) => b.stat === statKey);
      if (buff) total += buff.value;
    }
  });

  // Check Cap
  const isCapped = total >= tierConfig.statCap;
  const finalValue = Math.min(total, tierConfig.statCap);

  return {
    total: finalValue,
    isCapped,
    cap: tierConfig.statCap,
  };
};
