
import { AdminExercise, Exercise, HealthProfile } from '../types';

// Helper: Shuffle array using Fisher-Yates algorithm
const shuffle = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Main Logic Function
export const generateDailyWorkout = (
  userProfile: HealthProfile,
  focus: string, // e.g., 'CHEST', 'BACK', 'LEGS', 'ARMS', 'CORE', 'SHOULDERS'
  exerciseDatabase: AdminExercise[]
): Exercise[] => {
  
  // --- 1. CONSTANTS & TIME BOXING ---
  const WARMUP_TIME = 5;
  const COOLDOWN_TIME = 5;
  const AVG_EXERCISE_TIME = 10; // Includes sets + rest periods

  // Get user duration (default to 60 if missing)
  const totalDuration = userProfile.sessionDuration || 60;

  // Algorithm: Calculate strictly available time for lifting
  const overheadTime = WARMUP_TIME + COOLDOWN_TIME;
  const availableWorkoutTime = totalDuration - overheadTime;

  // Calculate capacity (Round down to ensure we don't go over time)
  const calculatedCount = Math.floor(availableWorkoutTime / AVG_EXERCISE_TIME);

  // Constraint: Always return at least 1 main exercise
  const exerciseCount = Math.max(1, calculatedCount);

  // --- 2. DETERMINE FILTERS ---
  
  // Determine Target Difficulty (Exact Match)
  let targetDifficulty = 'Beginner';
  if (userProfile.intensity === 'MODERATE') targetDifficulty = 'Intermediate';
  if (userProfile.intensity === 'HIGH') targetDifficulty = 'Advanced';

  // Determine Allowed Environments (Cascading Logic)
  const allowedEnvs: string[] = ['Home'];
  
  if (userProfile.equipment === 'HOME_DUMBBELLS') {
      allowedEnvs.push('Dumbbells');
  } else if (userProfile.equipment === 'GYM') {
      allowedEnvs.push('Dumbbells', 'Gym');
  }

  // Helper filter function
  const filterExercises = (exercises: AdminExercise[], muscleGroup: string) => {
    return exercises.filter(ex => {
        // A. Environment Check (Strict Cascade)
        const envMatch = !ex.environment || allowedEnvs.includes(ex.environment);
        if (!envMatch) return false;

        // B. Difficulty Check (Exact Match)
        if (ex.difficulty !== targetDifficulty) return false;

        // C. Muscle Group Check (Case Insensitive)
        if (ex.muscleGroup.toLowerCase() !== muscleGroup.toLowerCase()) return false;

        return true;
    });
  };

  const mapToRuntime = (ex: AdminExercise): Exercise => {
     // Determine sets/reps based on user Goal
    const isBuildMuscle = userProfile.goal === 'BUILD_MUSCLE';
    const sets = isBuildMuscle ? 4 : 3;
    const reps = isBuildMuscle ? '8-12' : '12-15';

    return {
        name: ex.name,
        sets: sets,
        reps: reps,
        duration: AVG_EXERCISE_TIME, // Force duration to match time-boxing math
        completed: false,
        type: 'COMPOUND', 
        videoUrl: ex.videoUrl,
        imageUrl: ex.imageUrl,
        notes: `Target: ${ex.muscleGroup}`
    };
  };

  const focusUpper = focus.toUpperCase();
  let finalSelection: AdminExercise[] = [];

  // --- 3. SELECT EXERCISES BASED ON COUNT ---

  // SPECIAL LOGIC: ARMS (Split Biceps/Triceps)
  if (focusUpper === 'ARMS') {
      // Get all valid ARMS exercises first
      const armExercises = filterExercises(exerciseDatabase, 'Arms');
      
      // Filter for Biceps (contains 'Curl')
      const bicepsPool = armExercises.filter(ex => ex.name.toLowerCase().includes('curl'));
      
      // Filter for Triceps
      const tricepsPool = armExercises.filter(ex => {
          const n = ex.name.toLowerCase();
          return n.includes('tricep') || n.includes('dip') || n.includes('extension') || n.includes('skullcrusher');
      });

      // Split the calculated count between Bi and Tri
      // If count is odd (e.g. 5), split 3/2
      const halfCount = exerciseCount / 2;
      const bicepsCount = Math.ceil(halfCount);
      const tricepsCount = Math.floor(halfCount);

      // Pick Randomly based on calculated counts
      const selectedBiceps = shuffle(bicepsPool).slice(0, bicepsCount);
      const selectedTriceps = shuffle(tricepsPool).slice(0, tricepsCount);

      finalSelection = [...selectedBiceps, ...selectedTriceps];
  } 
  // STANDARD LOGIC (Chest, Back, Shoulders, Legs, Core)
  else if (focusUpper !== 'REST') {
      let targetMuscle = '';
      if (focusUpper.includes('CHEST')) targetMuscle = 'Chest'; 
      else if (focusUpper.includes('BACK')) targetMuscle = 'Back';
      else if (focusUpper.includes('SHOULDERS')) targetMuscle = 'Shoulders'; 
      else if (focusUpper.includes('LEGS')) targetMuscle = 'Legs';
      else if (focusUpper.includes('CORE') || focusUpper.includes('ABS')) targetMuscle = 'Core';

      if (targetMuscle) {
          const pool = filterExercises(exerciseDatabase, targetMuscle);
          // Slice based on the dynamic exerciseCount
          finalSelection = shuffle(pool).slice(0, exerciseCount);
      }
  }

  // --- FALLBACK ---
  if (finalSelection.length === 0 && focusUpper !== 'REST') {
       return [{
          name: `Standard Pushups (Fallback)`,
          sets: 3,
          reps: '10',
          duration: AVG_EXERCISE_TIME,
          completed: false,
          type: 'COMPOUND',
          notes: 'No matching exercises found in database for your specific Environment/Difficulty filters.'
      }];
  }

  // --- 4. CONSTRUCT FINAL LIST (Warmup + Main + Cooldown) ---
  
  const mainExercises = finalSelection.map(mapToRuntime);

  // If it's a Rest day, logic handles it in HealthView, but if we got here with 'REST', return empty or stretch
  if (focusUpper === 'REST') return [];

  const warmup: Exercise = {
      name: "Dynamic Warmup Protocol",
      sets: 1,
      reps: "5 min",
      duration: WARMUP_TIME,
      completed: false,
      type: 'STRETCH',
      notes: "Increase heart rate. Mobilize joints."
  };

  const cooldown: Exercise = {
      name: "System Cooldown",
      sets: 1,
      reps: "5 min",
      duration: COOLDOWN_TIME,
      completed: false,
      type: 'STRETCH',
      notes: "Static stretching. Lower heart rate."
  };

  return [warmup, ...mainExercises, cooldown];
};
