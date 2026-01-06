
import { AdminExercise, Exercise, HealthProfile, WorkoutDay } from '../types';

// --- 1. LOCAL MASTER DATABASE (THE BRAIN) ---
// This ensures the system works offline and has the precise tags needed for logic.
const SYSTEM_EXERCISE_DB: AdminExercise[] = [
    // --- CHEST ---
    { id: 'c1', name: 'Barbell Bench Press', muscleGroup: 'Chest', subTarget: 'Middle', equipmentNeeded: 'Barbell', environment: 'Gym', difficulty: 'Intermediate', imageUrl: '', videoUrl: '', caloriesBurn: 12 },
    { id: 'c2', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', subTarget: 'Upper', equipmentNeeded: 'Dumbbell', environment: 'Dumbbells', difficulty: 'Intermediate', imageUrl: '', videoUrl: '', caloriesBurn: 10 },
    { id: 'c3', name: 'Decline Push-Ups', muscleGroup: 'Chest', subTarget: 'Upper', equipmentNeeded: 'Bodyweight', environment: 'Bodyweight', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 8 },
    { id: 'c4', name: 'Cable Flys (High to Low)', muscleGroup: 'Chest', subTarget: 'Lower', equipmentNeeded: 'Cable', environment: 'Gym', difficulty: 'Intermediate', imageUrl: '', videoUrl: '', caloriesBurn: 8 },
    { id: 'c5', name: 'Dumbbell Flys', muscleGroup: 'Chest', subTarget: 'Middle', equipmentNeeded: 'Dumbbell', environment: 'Dumbbells', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 8 },
    { id: 'c6', name: 'Standard Push-Ups', muscleGroup: 'Chest', subTarget: 'Middle', equipmentNeeded: 'Bodyweight', environment: 'Bodyweight', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 5 },
    { id: 'c7', name: 'Dips (Chest Focus)', muscleGroup: 'Chest', subTarget: 'Lower', equipmentNeeded: 'Bodyweight', environment: 'Bodyweight', difficulty: 'Intermediate', imageUrl: '', videoUrl: '', caloriesBurn: 10 },
    
    // --- BACK ---
    { id: 'b1', name: 'Deadlift', muscleGroup: 'Back', subTarget: 'Thickness', equipmentNeeded: 'Barbell', environment: 'Gym', difficulty: 'Advanced', imageUrl: '', videoUrl: '', caloriesBurn: 15 },
    { id: 'b2', name: 'Pull-Ups', muscleGroup: 'Back', subTarget: 'Width', equipmentNeeded: 'Bodyweight', environment: 'Bodyweight', difficulty: 'Intermediate', imageUrl: '', videoUrl: '', caloriesBurn: 10 },
    { id: 'b3', name: 'Lat Pulldowns', muscleGroup: 'Back', subTarget: 'Width', equipmentNeeded: 'Machine', environment: 'Gym', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 8 },
    { id: 'b4', name: 'Dumbbell Rows', muscleGroup: 'Back', subTarget: 'Thickness', equipmentNeeded: 'Dumbbell', environment: 'Dumbbells', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 9 },
    { id: 'b5', name: 'Superman Holds', muscleGroup: 'Back', subTarget: 'Thickness', equipmentNeeded: 'Bodyweight', environment: 'Bodyweight', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 5 },
    { id: 'b6', name: 'Barbell Rows', muscleGroup: 'Back', subTarget: 'Thickness', equipmentNeeded: 'Barbell', environment: 'Gym', difficulty: 'Intermediate', imageUrl: '', videoUrl: '', caloriesBurn: 12 },

    // --- SHOULDERS ---
    { id: 's1', name: 'Overhead Press (Barbell)', muscleGroup: 'Shoulders', subTarget: 'Front', equipmentNeeded: 'Barbell', environment: 'Gym', difficulty: 'Intermediate', imageUrl: '', videoUrl: '', caloriesBurn: 10 },
    { id: 's2', name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', subTarget: 'Front', equipmentNeeded: 'Dumbbell', environment: 'Dumbbells', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 9 },
    { id: 's3', name: 'Lateral Raises', muscleGroup: 'Shoulders', subTarget: 'Side', equipmentNeeded: 'Dumbbell', environment: 'Dumbbells', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 6 },
    { id: 's4', name: 'Face Pulls', muscleGroup: 'Shoulders', subTarget: 'Rear', equipmentNeeded: 'Cable', environment: 'Gym', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 7 },
    { id: 's5', name: 'Pike Push-Ups', muscleGroup: 'Shoulders', subTarget: 'Front', equipmentNeeded: 'Bodyweight', environment: 'Bodyweight', difficulty: 'Intermediate', imageUrl: '', videoUrl: '', caloriesBurn: 8 },
    { id: 's6', name: 'Rear Delt Flys', muscleGroup: 'Shoulders', subTarget: 'Rear', equipmentNeeded: 'Dumbbell', environment: 'Dumbbells', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 6 },

    // --- ARMS ---
    { id: 'a1', name: 'Barbell Curls', muscleGroup: 'Biceps', subTarget: 'Biceps', equipmentNeeded: 'Barbell', environment: 'Gym', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 6 },
    { id: 'a2', name: 'Hammer Curls', muscleGroup: 'Biceps', subTarget: 'Biceps', equipmentNeeded: 'Dumbbell', environment: 'Dumbbells', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 6 },
    { id: 'a3', name: 'Skullcrushers', muscleGroup: 'Triceps', subTarget: 'Triceps', equipmentNeeded: 'Barbell', environment: 'Gym', difficulty: 'Intermediate', imageUrl: '', videoUrl: '', caloriesBurn: 7 },
    { id: 'a4', name: 'Tricep Pushdowns', muscleGroup: 'Triceps', subTarget: 'Triceps', equipmentNeeded: 'Cable', environment: 'Gym', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 6 },
    { id: 'a5', name: 'Diamond Push-Ups', muscleGroup: 'Triceps', subTarget: 'Triceps', equipmentNeeded: 'Bodyweight', environment: 'Bodyweight', difficulty: 'Intermediate', imageUrl: '', videoUrl: '', caloriesBurn: 8 },
    { id: 'a6', name: 'Chin-Ups', muscleGroup: 'Biceps', subTarget: 'Biceps', equipmentNeeded: 'Bodyweight', environment: 'Bodyweight', difficulty: 'Intermediate', imageUrl: '', videoUrl: '', caloriesBurn: 10 },

    // --- LEGS ---
    { id: 'l1', name: 'Barbell Squat', muscleGroup: 'Legs', subTarget: 'Quads', equipmentNeeded: 'Barbell', environment: 'Gym', difficulty: 'Advanced', imageUrl: '', videoUrl: '', caloriesBurn: 15 },
    { id: 'l2', name: 'Goblet Squat', muscleGroup: 'Legs', subTarget: 'Quads', equipmentNeeded: 'Dumbbell', environment: 'Dumbbells', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 12 },
    { id: 'l3', name: 'Romanian Deadlift', muscleGroup: 'Legs', subTarget: 'Hamstrings', equipmentNeeded: 'Barbell', environment: 'Gym', difficulty: 'Intermediate', imageUrl: '', videoUrl: '', caloriesBurn: 12 },
    { id: 'l4', name: 'Lunges', muscleGroup: 'Legs', subTarget: 'Quads', equipmentNeeded: 'Bodyweight', environment: 'Bodyweight', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 10 },
    { id: 'l5', name: 'Calf Raises', muscleGroup: 'Legs', subTarget: 'Calves', equipmentNeeded: 'Bodyweight', environment: 'Bodyweight', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 5 },
    { id: 'l6', name: 'Leg Press', muscleGroup: 'Legs', subTarget: 'Quads', equipmentNeeded: 'Machine', environment: 'Gym', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 10 },

    // --- CORE ---
    { id: 'cr1', name: 'Plank', muscleGroup: 'Core', subTarget: 'Stability', equipmentNeeded: 'Bodyweight', environment: 'Bodyweight', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 5 },
    { id: 'cr2', name: 'Hanging Leg Raises', muscleGroup: 'Core', subTarget: 'Lower Abs', equipmentNeeded: 'Bodyweight', environment: 'Gym', difficulty: 'Advanced', imageUrl: '', videoUrl: '', caloriesBurn: 8 },
    { id: 'cr3', name: 'Russian Twists', muscleGroup: 'Core', subTarget: 'Obliques', equipmentNeeded: 'Bodyweight', environment: 'Bodyweight', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 6 },
    { id: 'cr4', name: 'Cable Crunches', muscleGroup: 'Core', subTarget: 'Upper Abs', equipmentNeeded: 'Cable', environment: 'Gym', difficulty: 'Intermediate', imageUrl: '', videoUrl: '', caloriesBurn: 7 },
    { id: 'cr5', name: 'Lying Leg Raises', muscleGroup: 'Core', subTarget: 'Lower Abs', equipmentNeeded: 'Bodyweight', environment: 'Bodyweight', difficulty: 'Beginner', imageUrl: '', videoUrl: '', caloriesBurn: 6 },
];

// Helper: Shuffle array
const shuffle = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Helper: Calculate weeks to goal
export const calculateTimeEstimate = (profile: Partial<HealthProfile>): string => {
    if (!profile.weight || !profile.targetWeight) return "UNKNOWN";
    
    const diff = Math.abs(profile.weight - profile.targetWeight);
    if (diff === 0) return "GOAL REACHED";

    // Rate based on goal/intensity
    // Lose Weight: 0.5kg/week (Safe) to 1.0kg/week (Aggressive)
    // Build Muscle: 0.25kg/week (Lean)
    
    let rate = 0.5;
    if (profile.goal === 'LOSE_WEIGHT') {
        rate = profile.intensity === 'HIGH' ? 1.0 : 0.5;
    } else if (profile.goal === 'BUILD_MUSCLE') {
        rate = 0.25; // Muscle building is slower
    }

    const weeks = Math.ceil(diff / rate);
    return `${weeks} WEEKS`;
};

// --- CORE GENERATOR LOGIC ---
export const generateSystemProtocol = (userProfile: HealthProfile): WorkoutDay[] => {
    
    const plan: WorkoutDay[] = [];
    const TOTAL_DAYS = 28; // 4 Weeks
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    
    // 1. Determine User Filters
    const allowedEnvs: string[] = ['Bodyweight']; // Everyone can do bodyweight
    if (userProfile.equipment === 'HOME_DUMBBELLS') {
        allowedEnvs.push('Dumbbells', 'Home'); // 'Home' maps to dumbbell/bands usually
    } else if (userProfile.equipment === 'GYM') {
        allowedEnvs.push('Dumbbells', 'Gym', 'Home', 'Machine', 'Cable', 'Barbell');
    }

    // 2. Volume Calculation (Time Constraint Logic)
    // Rule: ~2 mins per set (including rest).
    // 60 mins = 30 sets. 45 mins = 22 sets. 30 mins = 15 sets.
    const totalSetsBudget = Math.floor((userProfile.sessionDuration || 45) / 2);
    
    // 3. Helper to get exercises
    const getExercises = (targetGroup: string, subTargets: string[]): Exercise[] => {
        let selected: AdminExercise[] = [];
        
        // A. Filter DB by Equipment & Muscle Group
        const pool = SYSTEM_EXERCISE_DB.filter(ex => {
            const muscleMatch = ex.muscleGroup.toLowerCase() === targetGroup.toLowerCase() || 
                                (targetGroup === 'Arms' && (ex.muscleGroup === 'Biceps' || ex.muscleGroup === 'Triceps'));
            
            // Strict equipment check based on 'equipmentNeeded' if available
            let strictEquipMatch = true;
            if (userProfile.equipment === 'BODYWEIGHT') {
                strictEquipMatch = ex.equipmentNeeded === 'Bodyweight';
            } else if (userProfile.equipment === 'HOME_DUMBBELLS') {
                strictEquipMatch = ex.equipmentNeeded === 'Dumbbell' || ex.equipmentNeeded === 'Bodyweight';
            }

            return muscleMatch && strictEquipMatch;
        });

        // B. Holistic Activation (Sub-Target Selection)
        subTargets.forEach(sub => {
            const subPool = pool.filter(ex => ex.subTarget === sub);
            if (subPool.length > 0) {
                selected.push(shuffle(subPool)[0]);
            }
        });

        // C. Fill remaining slots with compound/general moves from pool if needed
        // Target roughly 4-6 exercises per workout
        const targetExerciseCount = Math.min(6, Math.max(3, Math.floor(totalSetsBudget / 3))); // 3 sets per exercise avg
        
        const remainingSlots = targetExerciseCount - selected.length;
        if (remainingSlots > 0) {
            const fillers = pool.filter(ex => !selected.includes(ex));
            selected = [...selected, ...shuffle(fillers).slice(0, remainingSlots)];
        }

        // D. Map to Runtime Exercise Type
        return selected.map(ex => ({
            name: ex.name,
            sets: userProfile.goal === 'BUILD_MUSCLE' ? 4 : 3,
            reps: userProfile.goal === 'BUILD_MUSCLE' ? '8-12' : '12-15',
            duration: 10, // Approx
            completed: false,
            type: 'COMPOUND',
            notes: ex.subTarget ? `Focus: ${ex.subTarget}` : undefined,
            videoUrl: ex.videoUrl,
            imageUrl: ex.imageUrl
        }));
    };

    // 4. Generate the 28-day Plan
    // Fixed Split: Mon(1)=Chest, Tue(2)=Back, Wed(3)=Shoulders, Thu(4)=Arms, Fri(5)=Core, Sat(6)=Legs, Sun(0)=Rest
    const todayIndex = new Date().getDay(); 

    for (let i = 0; i < TOTAL_DAYS; i++) {
        const dateIndex = (todayIndex + i) % 7; // 0-6
        const dayLabel = dayNames[dateIndex];
        let dailyExercises: Exercise[] = [];
        let focus = 'REST';
        let isRecovery = false;

        switch (dateIndex) {
            case 1: // Monday
                focus = 'CHEST';
                dailyExercises = getExercises('Chest', ['Upper', 'Middle', 'Lower']);
                break;
            case 2: // Tuesday
                focus = 'BACK';
                dailyExercises = getExercises('Back', ['Width', 'Thickness']);
                break;
            case 3: // Wednesday
                focus = 'SHOULDERS';
                dailyExercises = getExercises('Shoulders', ['Front', 'Side', 'Rear']);
                break;
            case 4: // Thursday
                focus = 'ARMS';
                dailyExercises = getExercises('Arms', ['Biceps', 'Triceps']);
                break;
            case 5: // Friday
                focus = 'CORE';
                dailyExercises = getExercises('Core', ['Upper Abs', 'Lower Abs', 'Obliques']);
                break;
            case 6: // Saturday
                focus = 'LEGS';
                dailyExercises = getExercises('Legs', ['Quads', 'Hamstrings', 'Calves']);
                break;
            case 0: // Sunday
                focus = 'REST';
                isRecovery = true;
                dailyExercises = [{
                    name: 'Active Recovery Walk',
                    sets: 1,
                    reps: '30 min',
                    duration: 30,
                    completed: false,
                    type: 'STRETCH'
                }];
                break;
        }

        // Add Warmup/Cooldown if not rest
        if (!isRecovery && dailyExercises.length > 0) {
            dailyExercises.unshift({
                name: "Dynamic Warmup",
                sets: 1,
                reps: "5 min",
                duration: 5,
                completed: false,
                type: 'STRETCH'
            });
        }

        plan.push({
            day: `DAY ${i + 1} (${dayLabel})`,
            focus,
            exercises: dailyExercises,
            isRecovery,
            totalDuration: userProfile.sessionDuration || 45
        });
    }

    return plan;
};

// Fallback legacy export if needed by other components temporarily
export const generateDailyWorkout = () => [];
