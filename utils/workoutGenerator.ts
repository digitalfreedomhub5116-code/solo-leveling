
import { Exercise, HealthProfile, WorkoutDay } from '../types';

// --- CONFIGURATION ---
const WEEKS_TO_GENERATE = 4;

// --- TYPES ---
type Equipment = 'GYM' | 'HOME_DUMBBELLS' | 'BODYWEIGHT';
type Split = 'PPL' | 'CLASSIC';

// --- HELPER: CREATE EXERCISE ---
const createEx = (
    name: string, 
    sets: number, 
    reps: string, 
    type: 'COMPOUND' | 'ACCESSORY' | 'CARDIO' | 'STRETCH', 
    notes?: string
): Exercise => ({
    name, sets, reps, type, completed: false, duration: 10, notes
});

// --- GYM PPL STORY PROTOCOL (Fixed) ---
// Defined explicitly based on the provided story narration
const GYM_PPL_ROUTINE = {
    WEEK1: {
        MONDAY: [ // Push 1
            createEx('Treadmill Warmup', 1, '5 min', 'STRETCH', 'Wake up the system'),
            createEx('Mobility Routine', 1, 'Full Body', 'STRETCH', 'Ankles, Quads, Shoulders'),
            createEx('Dumbbell Bench Press', 3, '15, 12, 10', 'COMPOUND', 'Increase weight each set'),
            createEx('Dumbbell Shoulder Press', 3, '15, 12, 10', 'COMPOUND'),
            createEx('Incline Dumbbell Flyes', 3, '15, 12, 10', 'ACCESSORY', 'Sculpt upper chest'),
            createEx('Tricep Pushdown (Rope)', 3, '15, 12, 10', 'ACCESSORY'),
            createEx('Ab Wheel Rollouts', 3, '15, 12, 10', 'ACCESSORY', 'Engage core'),
            createEx('Skipping', 3, '2 min rounds', 'CARDIO', '30s rest between rounds'),
            createEx('Full Body Stretch', 1, '5 min', 'STRETCH', 'Cooldown')
        ],
        TUESDAY: [ // Pull 1
            createEx('Treadmill Warmup', 1, '5 min', 'STRETCH'),
            createEx('Pull Ups', 3, '15, 12, 10', 'COMPOUND', 'Use assist if needed'),
            createEx('Cable Seated Wide Row', 3, '15, 12, 10', 'COMPOUND', 'Build thickness'),
            createEx('Rear Delt Flyes', 3, '15, 12, 10', 'ACCESSORY'),
            createEx('Barbell Bicep Curls', 3, '15, 12, 10', 'ACCESSORY'),
            createEx('Incline Dumbbell Curls', 3, '15, 12, 10', 'ACCESSORY', 'Stretch focus'),
            createEx('Burpees', 3, '15 reps', 'CARDIO', 'High intensity'),
            createEx('Cooldown Stretches', 1, '5 min', 'STRETCH')
        ],
        WEDNESDAY: [ // Legs
            createEx('Treadmill & Quad Stretch', 1, '5 min', 'STRETCH'),
            createEx('Dumbbell RDL', 3, '15, 12, 10', 'COMPOUND', 'Hamstring focus'),
            createEx('Leg Press', 3, '15, 12, 10', 'COMPOUND'),
            createEx('Glute Bridges', 3, '15, 12, 10', 'ACCESSORY'),
            createEx('Hanging Leg Raises', 3, '15, 12, 10', 'ACCESSORY', 'Core'),
            createEx('Standing Calf Raises', 3, '15, 12, 10', 'ACCESSORY'),
            createEx('Bicycle Crunches', 3, '15 reps', 'ACCESSORY'),
            createEx('Rowing Machine', 3, '3 min rounds', 'CARDIO'),
            createEx('Leg Stretches', 1, '5 min', 'STRETCH')
        ],
        THURSDAY: [ createEx('Active Recovery Walk', 1, '30 min', 'STRETCH', 'Let muscles repair') ],
        FRIDAY: [ // Push 2
            createEx('Treadmill Warmup', 1, '5 min', 'STRETCH'),
            createEx('Smith Machine Shoulder Press', 3, '15, 12, 10', 'COMPOUND'),
            createEx('Incline Barbell Bench Press', 3, '15, 12, 10', 'COMPOUND'),
            createEx('Lever Leg Extensions', 3, '15, 12, 10', 'ACCESSORY', 'Surprise Leg Mix'),
            createEx('Cable Lateral Raises', 3, '15, 12, 10', 'ACCESSORY'),
            createEx('Tricep Dips', 3, '15, 12, 10', 'ACCESSORY'),
            createEx('Leg Raises', 3, '15 reps', 'ACCESSORY'),
            createEx('Spin Bike', 1, '10 mins', 'CARDIO'),
            createEx('Cooldown', 1, '5 min', 'STRETCH')
        ],
        SATURDAY: [ // Pull 2
            createEx('Treadmill Warmup', 1, '5 min', 'STRETCH'),
            createEx('Cable Bent Over Row (Kneeling)', 3, '15, 12, 10', 'COMPOUND'),
            createEx('Lever Lying Leg Curls', 3, '15, 12, 10', 'ACCESSORY', 'Leg Superset'),
            createEx('Hyperextensions', 3, '15, 12, 10', 'ACCESSORY', 'Lower Back'),
            createEx('Single Leg RDL', 3, '15, 12, 10', 'ACCESSORY', 'Balance'),
            createEx('Dumbbell Hammer Curls', 3, '15, 12, 10', 'ACCESSORY'),
            createEx('Cross Body Mtn Climbers', 3, '15 reps', 'CARDIO'),
            createEx('Brisk Walk', 1, '10 mins', 'CARDIO'),
            createEx('Full Body Stretch', 1, '5 min', 'STRETCH')
        ],
        SUNDAY: [ createEx('Deep Stretch & Recovery', 1, '20 min', 'STRETCH', 'Prepare for Week 2') ]
    },
    WEEK2: {
        MONDAY: [ // Push 1 (Heavy Start)
            createEx('Barbell Bench Press', 3, '12, 10, 8', 'COMPOUND', 'Trade volume for strength'),
            createEx('Barbell Military Press', 3, '12, 10, 8', 'COMPOUND'),
            createEx('High Pulley Cable Flys', 3, '12, 10, 8', 'ACCESSORY'),
            createEx('EZ Bar Skull Crushers', 3, '12, 10, 8', 'ACCESSORY'),
            createEx('Hanging Leg Raises', 3, '12, 10, 8', 'ACCESSORY'),
            createEx('Skipping', 3, '2 min rounds', 'CARDIO')
        ],
        TUESDAY: [ // Pull 1
            createEx('Wide Grip Lat Pulldown', 3, '12, 10, 8', 'COMPOUND', 'Build V-Taper'),
            createEx('Reverse Pec Deck', 3, '12, 10, 8', 'ACCESSORY', 'Rear Delts'),
            createEx('Cable Concentration Curls', 3, '12, 10, 8', 'ACCESSORY', 'Peak focus'),
            createEx('Incline Dumbbell Curls', 3, '12, 10, 8', 'ACCESSORY'),
            createEx('Burpees', 3, '15 reps', 'CARDIO')
        ],
        WEDNESDAY: [ // Legs
            createEx('Lying Leg Curls', 3, '12, 10, 8', 'ACCESSORY', 'Pre-exhaust'),
            createEx('Leg Press', 3, '12, 10, 8', 'COMPOUND'),
            createEx('Tricep Kickbacks (Cable)', 3, '12, 10, 8', 'ACCESSORY', 'Arm Mix-in'),
            createEx('Decline Crunches', 3, '12, 10, 8', 'ACCESSORY'),
            createEx('Seated Calf Raises', 3, '12, 10, 8', 'ACCESSORY', 'Weighted'),
            createEx('Rowing Machine', 3, '3 min rounds', 'CARDIO')
        ],
        THURSDAY: [ createEx('Rest & Grow', 1, 'Full Day', 'STRETCH') ],
        FRIDAY: [ // Push 2
            createEx('Dumbbell Shoulder Press', 3, '12, 10, 8', 'COMPOUND'),
            createEx('Dumbbell Incline Press', 3, '12, 10, 8', 'COMPOUND'),
            createEx('Dumbbell Front Squats', 3, '12, 10, 8', 'COMPOUND', 'Full body challenge'),
            createEx('Cable Lateral Raises', 3, '12, 10, 8', 'ACCESSORY'),
            createEx('Tricep Pushdown (Rope)', 3, '12, 10, 8', 'ACCESSORY'),
            createEx('Spin Bike', 1, '10 mins', 'CARDIO')
        ],
        SATURDAY: [ // Pull 2
            createEx('T-Bar Rows', 3, '12, 10, 8', 'COMPOUND', 'Thick back'),
            createEx('Cable Seated Rows (Neutral)', 3, '12, 10, 8', 'COMPOUND'),
            createEx('Hyperextensions', 3, '12, 10, 8', 'ACCESSORY'),
            createEx('Preacher Curls', 3, '12, 10, 8', 'ACCESSORY'),
            createEx('Lying Leg Curls', 3, '12, 10, 8', 'ACCESSORY'),
            createEx('Brisk Walk', 1, '10 mins', 'CARDIO')
        ],
        SUNDAY: [ createEx('Rest & Recover', 1, 'Full Day', 'STRETCH') ]
    },
    WEEK3: {
        MONDAY: [ // Push 1 (Heavy & Hard)
            createEx('Barbell Bench Press', 3, '10, 8, 8', 'COMPOUND', 'Heavy weight'),
            createEx('Dumbbell Shoulder Press', 3, '10, 8, 8', 'COMPOUND'),
            createEx('Incline Dumbbell Flys', 3, '10, 8, 8', 'ACCESSORY', 'Carve detail'),
            createEx('Tricep Pushdowns (Rope)', 3, '10, 8, 8', 'ACCESSORY'),
            createEx('Ab Wheel Rollouts', 3, '10, 8, 8', 'ACCESSORY'),
            createEx('Skipping', 3, '2 min rounds', 'CARDIO')
        ],
        TUESDAY: [ // Pull 1
            createEx('Pull Ups', 3, '10, 8, 8', 'COMPOUND', 'Add weight if easy'),
            createEx('Cable Seated Wide Row', 3, '10, 8, 8', 'COMPOUND'),
            createEx('Rear Delt Flys', 3, '10, 8, 8', 'ACCESSORY'),
            createEx('Barbell Bicep Curl', 3, '10, 8, 8', 'ACCESSORY', 'Load up'),
            createEx('Incline Dumbbell Curls', 3, '10, 8, 8', 'ACCESSORY'),
            createEx('Burpees', 3, '15 reps', 'CARDIO')
        ],
        WEDNESDAY: [ // Legs
            createEx('Dumbbell RDL', 3, '10, 8, 8', 'COMPOUND'),
            createEx('Leg Press', 3, '10, 8, 8', 'COMPOUND', 'Heavy load'),
            createEx('Glute Bridges', 3, '10, 8, 8', 'ACCESSORY'),
            createEx('Hanging Leg Raises', 3, '10, 8, 8', 'ACCESSORY'),
            createEx('Standing Calf Raises', 3, '10, 8, 8', 'ACCESSORY'),
            createEx('Rowing Machine', 3, '3 min rounds', 'CARDIO')
        ],
        THURSDAY: [ createEx('Rest & Sleep', 1, 'Full Day', 'STRETCH') ],
        FRIDAY: [ // Push 2
            createEx('Smith Machine Shoulder Press', 3, '10, 8, 8', 'COMPOUND', 'Controlled power'),
            createEx('Incline Barbell Bench', 3, '10, 8, 8', 'COMPOUND'),
            createEx('Lever Leg Extensions', 3, '10, 8, 8', 'ACCESSORY'),
            createEx('Cable Lateral Raises', 3, '10, 8, 8', 'ACCESSORY'),
            createEx('Tricep Dips', 3, '10, 8, 8', 'ACCESSORY', 'Heavy'),
            createEx('Spin Bike', 1, '10 mins', 'CARDIO')
        ],
        SATURDAY: [ // Pull 2
            createEx('Cable Bent Over Row', 3, '10, 8, 8', 'COMPOUND'),
            createEx('Lying Leg Curls', 3, '10, 8, 8', 'ACCESSORY'),
            createEx('Hyperextensions', 3, '10, 8, 8', 'ACCESSORY'),
            createEx('Single Leg RDL', 3, '10, 8, 8', 'ACCESSORY'),
            createEx('Dumbbell Hammer Curls', 3, '10, 8, 8', 'ACCESSORY'),
            createEx('Cross Body Mtn Climbers', 3, '15 reps', 'CARDIO')
        ],
        SUNDAY: [ createEx('Full Recovery', 1, 'Full Day', 'STRETCH') ]
    },
    WEEK4: {
        MONDAY: [ // Push 1 (Strength Phase)
            createEx('Barbell Bench Press', 3, '3 x 8', 'COMPOUND', 'Strict Strength'),
            createEx('Barbell Military Press', 3, '3 x 8', 'COMPOUND'),
            createEx('High Pulley Cable Flys', 3, '3 x 8', 'ACCESSORY'),
            createEx('EZ Bar Skull Crushers', 3, '3 x 8', 'ACCESSORY'),
            createEx('Hanging Leg Raises', 3, '3 x 8', 'ACCESSORY', 'Strict form'),
            createEx('Skipping', 3, '2 min rounds', 'CARDIO')
        ],
        TUESDAY: [ // Pull 1
            createEx('Cable Seated Wide Row', 3, '3 x 8', 'COMPOUND'),
            createEx('Wide Grip Lat Pulldown', 3, '3 x 8', 'COMPOUND'),
            createEx('Reverse Pec Deck', 3, '3 x 8', 'ACCESSORY'),
            createEx('Cable Concentration Curls', 3, '3 x 8', 'ACCESSORY'),
            createEx('Incline Dumbbell Curls', 3, '3 x 8', 'ACCESSORY'),
            createEx('Burpees', 3, '15 reps', 'CARDIO')
        ],
        WEDNESDAY: [ // Legs
            createEx('Lying Leg Curls', 3, '3 x 8', 'ACCESSORY', 'Pre-exhaust'),
            createEx('Leg Press', 3, '3 x 8', 'COMPOUND', 'Heavy'),
            createEx('Tricep Kickbacks (Cable)', 3, '3 x 8', 'ACCESSORY', 'Arm Mix'),
            createEx('Decline Crunches', 3, '3 x 8', 'ACCESSORY'),
            createEx('Seated Calf Raises', 3, '3 x 8', 'ACCESSORY', 'Heavy'),
            createEx('Rowing Machine', 3, '3 min rounds', 'CARDIO')
        ],
        THURSDAY: [ createEx('Rest & Prepare', 1, 'Full Day', 'STRETCH') ],
        FRIDAY: [ // Push 2
            createEx('Dumbbell Shoulder Press', 3, '3 x 8', 'COMPOUND', 'Heavy'),
            createEx('Dumbbell Incline Bench', 3, '3 x 8', 'COMPOUND'),
            createEx('Dumbbell Front Squats', 3, '3 x 8', 'COMPOUND', 'Compound Power'),
            createEx('Cable Lateral Raises', 3, '3 x 8', 'ACCESSORY'),
            createEx('Tricep Pushdown (Rope)', 3, '3 x 8', 'ACCESSORY'),
            createEx('Spin Bike', 1, '10 mins', 'CARDIO')
        ],
        SATURDAY: [ // Pull 2
            createEx('T-Bar Rows', 3, '3 x 8', 'COMPOUND', 'Thick back'),
            createEx('Cable Seated Rows (Neutral)', 3, '3 x 8', 'COMPOUND'),
            createEx('Hyperextensions', 3, '3 x 8', 'ACCESSORY'),
            createEx('Preacher Curls', 3, '3 x 8', 'ACCESSORY'),
            createEx('Lying Leg Curls', 3, '3 x 8', 'ACCESSORY'),
            createEx('Brisk Walk', 1, '10 mins', 'CARDIO')
        ],
        SUNDAY: [ createEx('Cycle Complete', 1, 'Full Day', 'STRETCH') ]
    }
};

// --- ALTERNATIVE ROUTINE GENERATORS (Structure for other scenarios) ---

// Helper to get exercises for Bodyweight scenarios
// weekNum allows for progressive overload logic (e.g. increasing reps)
const getBodyweightExercises = (focus: string, weekNum: number): Exercise[] => {
    const repBase = 15 + (weekNum - 1) * 3; // 15, 18, 21, 24
    const reps = `${repBase}-${repBase + 5}`;
    
    const warmup = [createEx('Dynamic Warmup', 1, '5 min', 'STRETCH')];

    switch(focus) {
        case 'PUSH': return [
            ...warmup,
            createEx('Standard Push-Ups', 4, reps, 'COMPOUND'),
            createEx('Pike Push-Ups', 3, `${repBase - 5}`, 'COMPOUND', 'Shoulders'),
            createEx('Chair Dips', 3, reps, 'ACCESSORY', 'Triceps'),
            createEx('Decline Push-Ups', 3, `${repBase - 3}`, 'ACCESSORY', 'Upper Chest'),
            createEx('Plank to Push-Up', 3, '10', 'ACCESSORY', 'Core Stability')
        ];
        case 'PULL': return [
            ...warmup,
            createEx('Doorframe Rows', 4, reps, 'COMPOUND', 'Back'),
            createEx('Superman Holds', 3, '45s', 'ACCESSORY', 'Lower Back'),
            createEx('Towel Bicep Curls', 3, reps, 'ACCESSORY', 'Manual Resistance'),
            createEx('Reverse Snow Angels', 3, reps, 'ACCESSORY', 'Rear Delts'),
            createEx('Hanging Knee Raises', 3, '15', 'ACCESSORY', 'Abs')
        ];
        case 'LEGS': return [
            ...warmup,
            createEx('Bodyweight Squats', 4, `${repBase + 10}`, 'COMPOUND'),
            createEx('Walking Lunges', 3, '12/leg', 'COMPOUND'),
            createEx('Glute Bridges', 3, '20', 'ACCESSORY'),
            createEx('Calf Raises', 4, '30', 'ACCESSORY'),
            createEx('Wall Sit', 3, '60s', 'STRETCH')
        ];
        case 'UPPER': return [
            ...warmup,
            createEx('Wide Push-Ups', 3, reps, 'COMPOUND'),
            createEx('Pike Push-Ups', 3, '12', 'COMPOUND'),
            createEx('Doorframe Rows', 3, reps, 'COMPOUND'),
            createEx('Dips', 3, '15', 'ACCESSORY'),
            createEx('Shoulder Taps', 3, '20', 'ACCESSORY')
        ];
        case 'LOWER': return [
            ...warmup,
            createEx('Squats', 4, '25', 'COMPOUND'),
            createEx('Reverse Lunges', 3, '12/leg', 'COMPOUND'),
            createEx('Side Lunges', 3, '12/leg', 'ACCESSORY'),
            createEx('Single Leg Glute Bridge', 3, '10/leg', 'ACCESSORY')
        ];
        case 'CORE': return [
            ...warmup,
            createEx('Plank', 3, '60s', 'ACCESSORY'),
            createEx('Leg Raises', 3, '15', 'ACCESSORY'),
            createEx('Russian Twists', 3, '30', 'ACCESSORY'),
            createEx('Bicycle Crunches', 3, '20', 'ACCESSORY')
        ];
        case 'FULL': return [
            ...warmup,
            createEx('Burpees', 3, '10', 'CARDIO'),
            createEx('Squat Jumps', 3, '15', 'COMPOUND'),
            createEx('Push-Ups', 3, '15', 'COMPOUND'),
            createEx('Lunges', 3, '12/leg', 'COMPOUND'),
            createEx('Mountain Climbers', 3, '40s', 'CARDIO')
        ];
        default: return [createEx('Active Recovery', 1, '30m', 'STRETCH')];
    }
};

// Helper for Dumbbell scenarios
const getDumbbellExercises = (focus: string, weekNum: number): Exercise[] => {
    // Progressive Overload: Reduce reps slightly as weight implies getting heavier, or maintain range
    const repRange = weekNum > 2 ? '8-10' : '10-12';
    const warmup = [createEx('Dynamic Warmup', 1, '5 min', 'STRETCH')];

    switch(focus) {
        case 'PUSH': return [
            ...warmup,
            createEx('DB Floor Press', 4, repRange, 'COMPOUND'),
            createEx('DB Shoulder Press', 3, repRange, 'COMPOUND'),
            createEx('DB Flys', 3, '12-15', 'ACCESSORY'),
            createEx('DB Skullcrushers', 3, '12', 'ACCESSORY'),
            createEx('Lateral Raises', 3, '15', 'ACCESSORY')
        ];
        case 'PULL': return [
            ...warmup,
            createEx('DB Bent Over Rows', 4, repRange, 'COMPOUND'),
            createEx('DB RDL', 3, repRange, 'COMPOUND'),
            createEx('DB Bicep Curls', 3, '12', 'ACCESSORY'),
            createEx('DB Shrugs', 3, '15', 'ACCESSORY'),
            createEx('Renegade Rows', 3, '10/side', 'ACCESSORY')
        ];
        case 'LEGS': return [
            ...warmup,
            createEx('Goblet Squats', 4, repRange, 'COMPOUND'),
            createEx('DB Lunges', 3, '12/leg', 'COMPOUND'),
            createEx('DB RDL', 3, repRange, 'COMPOUND'),
            createEx('Weighted Calf Raises', 4, '20', 'ACCESSORY'),
            createEx('DB Glute Bridge', 3, '15', 'ACCESSORY')
        ];
        // For Classic Split
        case 'CHEST_TRI': return [
            ...warmup,
            createEx('DB Bench Press', 4, repRange, 'COMPOUND'),
            createEx('DB Incline Flys', 3, '12', 'ACCESSORY'),
            createEx('Push-Ups', 3, 'Failure', 'COMPOUND'),
            createEx('DB Overhead Extension', 3, '12', 'ACCESSORY'),
            createEx('DB Kickbacks', 3, '15', 'ACCESSORY')
        ];
        case 'BACK_BI': return [
            ...warmup,
            createEx('DB One Arm Row', 4, repRange, 'COMPOUND'),
            createEx('DB Pullovers', 3, '12', 'ACCESSORY'),
            createEx('DB Reverse Flys', 3, '15', 'ACCESSORY'),
            createEx('DB Hammer Curls', 3, '12', 'ACCESSORY'),
            createEx('Concentration Curls', 3, '12', 'ACCESSORY')
        ];
        case 'SHOULDER_ABS': return [
            ...warmup,
            createEx('Seated DB Press', 4, repRange, 'COMPOUND'),
            createEx('DB Lateral Raises', 3, '15', 'ACCESSORY'),
            createEx('DB Front Raises', 3, '12', 'ACCESSORY'),
            createEx('DB Shrugs', 4, '15', 'ACCESSORY'),
            createEx('Weighted Sit-Ups', 3, '15', 'ACCESSORY')
        ];
        case 'ARMS': return [
            ...warmup,
            createEx('DB Bicep Curls', 3, '10', 'ACCESSORY'),
            createEx('DB Skullcrushers', 3, '10', 'ACCESSORY'),
            createEx('Hammer Curls', 3, '12', 'ACCESSORY'),
            createEx('Overhead Extension', 3, '12', 'ACCESSORY'),
            createEx('Forearm Curls', 3, '20', 'ACCESSORY')
        ];
        default: return [createEx('Active Recovery', 1, '20m', 'STRETCH')];
    }
};

// Helper for Gym Classic
const getGymClassicExercises = (focus: string, weekNum: number): Exercise[] => {
    const repRange = weekNum === 4 ? '6-8' : '8-12';
    const warmup = [createEx('Cardio & Mobility', 1, '5-10 min', 'STRETCH')];

    switch(focus) {
        case 'CHEST': return [
            ...warmup,
            createEx('Barbell Bench Press', 4, repRange, 'COMPOUND'),
            createEx('Incline DB Press', 3, '10', 'COMPOUND'),
            createEx('Cable Flys', 3, '15', 'ACCESSORY'),
            createEx('Dips', 3, 'Failure', 'COMPOUND')
        ];
        case 'BACK': return [
            ...warmup,
            createEx('Deadlift', 3, weekNum === 4 ? '5' : '8', 'COMPOUND'),
            createEx('Lat Pulldowns', 4, '10-12', 'COMPOUND'),
            createEx('T-Bar Rows', 3, '10', 'COMPOUND'),
            createEx('Face Pulls', 3, '15', 'ACCESSORY')
        ];
        case 'LEGS': return [
            ...warmup,
            createEx('Barbell Squat', 4, repRange, 'COMPOUND'),
            createEx('Leg Press', 3, '12', 'COMPOUND'),
            createEx('Romanian Deadlift', 3, '10', 'COMPOUND'),
            createEx('Leg Extensions', 3, '15', 'ACCESSORY'),
            createEx('Calf Raises', 4, '15', 'ACCESSORY')
        ];
        case 'SHOULDERS': return [
            ...warmup,
            createEx('Overhead Press', 4, repRange, 'COMPOUND'),
            createEx('DB Lateral Raises', 4, '15', 'ACCESSORY'),
            createEx('Front Plate Raise', 3, '12', 'ACCESSORY'),
            createEx('Reverse Pec Deck', 3, '15', 'ACCESSORY')
        ];
        case 'ARMS': return [
            ...warmup,
            createEx('Barbell Curls', 3, '10', 'ACCESSORY'),
            createEx('Skullcrushers', 3, '10', 'ACCESSORY'),
            createEx('Preacher Curls', 3, '12', 'ACCESSORY'),
            createEx('Tricep Pushdowns', 3, '12', 'ACCESSORY'),
            createEx('Hammer Curls', 3, '12', 'ACCESSORY')
        ];
        default: return [createEx('Active Recovery', 1, '20m', 'STRETCH')];
    }
};

// --- SCHEDULE GENERATOR ---

export const generateSystemProtocol = (profile: HealthProfile): WorkoutDay[] => {
    const plan: WorkoutDay[] = [];
    const equipment = profile.equipment as Equipment; 
    const split = profile.workoutSplit as Split; 
    
    // Generate 28 Days (4 Weeks)
    const TOTAL_DAYS = WEEKS_TO_GENERATE * 7;

    for (let i = 0; i < TOTAL_DAYS; i++) {
        const weekNum = Math.floor(i / 7) + 1; // 1, 2, 3, 4
        const dayOfWeekIndex = (i % 7); // 0=Mon, 1=Tue... 6=Sun
        
        let focus = 'REST';
        let exercises: Exercise[] = [];
        let isRecovery = false;
        let dayLabel = `WEEK ${weekNum} - DAY ${dayOfWeekIndex + 1}`;

        // ============================================================
        // SCENARIO 1: GYM + PPL (THE STORY MODE)
        // ============================================================
        if (equipment === 'GYM' && split === 'PPL') {
            const weekKey = `WEEK${weekNum}` as keyof typeof GYM_PPL_ROUTINE;
            const weekRoutine = GYM_PPL_ROUTINE[weekKey];
            
            // Map index to Week Day Keys in Story
            const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
            const dayKey = days[dayOfWeekIndex] as keyof typeof weekRoutine;
            
            exercises = weekRoutine[dayKey] ? [...weekRoutine[dayKey]] : [];
            
            // Determine Focus Label for UI
            if (dayOfWeekIndex === 0) focus = 'PUSH A';
            else if (dayOfWeekIndex === 1) focus = 'PULL A';
            else if (dayOfWeekIndex === 2) focus = 'LEGS';
            else if (dayOfWeekIndex === 3) { focus = 'REST'; isRecovery = true; }
            else if (dayOfWeekIndex === 4) focus = 'PUSH B';
            else if (dayOfWeekIndex === 5) focus = 'PULL B';
            else { focus = 'REST'; isRecovery = true; }
        } 
        
        // ============================================================
        // SCENARIO 2: BODYWEIGHT
        // ============================================================
        else if (equipment === 'BODYWEIGHT') {
            if (split === 'PPL') {
                // Fixed PPL for BW: P P L P P L R
                if (dayOfWeekIndex === 0 || dayOfWeekIndex === 3) { focus = 'PUSH'; exercises = getBodyweightExercises('PUSH', weekNum); }
                else if (dayOfWeekIndex === 1 || dayOfWeekIndex === 4) { focus = 'PULL'; exercises = getBodyweightExercises('PULL', weekNum); }
                else if (dayOfWeekIndex === 2 || dayOfWeekIndex === 5) { focus = 'LEGS'; exercises = getBodyweightExercises('LEGS', weekNum); }
                else { focus = 'REST'; isRecovery = true; exercises = [createEx('Light Walk', 1, '30m', 'STRETCH')]; }
            } else {
                // Classic / Regular (Upper/Lower/Core/Full)
                // Mon: Upper, Tue: Lower, Wed: Core/Cardio, Thu: Upper, Fri: Full, Sat: Active, Sun: Rest
                if (dayOfWeekIndex === 0 || dayOfWeekIndex === 3) { focus = 'UPPER'; exercises = getBodyweightExercises('UPPER', weekNum); }
                else if (dayOfWeekIndex === 1) { focus = 'LOWER'; exercises = getBodyweightExercises('LOWER', weekNum); }
                else if (dayOfWeekIndex === 2) { focus = 'CORE'; exercises = getBodyweightExercises('CORE', weekNum); }
                else if (dayOfWeekIndex === 4) { focus = 'FULL'; exercises = getBodyweightExercises('FULL', weekNum); }
                else if (dayOfWeekIndex === 5) { focus = 'ACTIVE'; exercises = [createEx('Yoga / Stretch', 1, '30m', 'STRETCH')]; isRecovery = true; }
                else { focus = 'REST'; isRecovery = true; exercises = [createEx('Rest', 1, '0m', 'STRETCH')]; }
            }
        }

        // ============================================================
        // SCENARIO 3: DUMBBELLS
        // ============================================================
        else if (equipment === 'HOME_DUMBBELLS') {
            if (split === 'PPL') {
                // Fixed PPL
                if (dayOfWeekIndex === 0 || dayOfWeekIndex === 3) { focus = 'PUSH'; exercises = getDumbbellExercises('PUSH', weekNum); }
                else if (dayOfWeekIndex === 1 || dayOfWeekIndex === 4) { focus = 'PULL'; exercises = getDumbbellExercises('PULL', weekNum); }
                else if (dayOfWeekIndex === 2 || dayOfWeekIndex === 5) { focus = 'LEGS'; exercises = getDumbbellExercises('LEGS', weekNum); }
                else { focus = 'REST'; isRecovery = true; exercises = [createEx('Walk', 1, '20m', 'STRETCH')]; }
            } else {
                // Classic Bro Split for Dumbbells
                if (dayOfWeekIndex === 0) { focus = 'CHEST/TRI'; exercises = getDumbbellExercises('CHEST_TRI', weekNum); }
                else if (dayOfWeekIndex === 1) { focus = 'BACK/BI'; exercises = getDumbbellExercises('BACK_BI', weekNum); }
                else if (dayOfWeekIndex === 2) { focus = 'LEGS'; exercises = getDumbbellExercises('LEGS', weekNum); }
                else if (dayOfWeekIndex === 3) { focus = 'SHOULDERS'; exercises = getDumbbellExercises('SHOULDER_ABS', weekNum); }
                else if (dayOfWeekIndex === 4) { focus = 'ARMS'; exercises = getDumbbellExercises('ARMS', weekNum); }
                else { focus = 'REST'; isRecovery = true; exercises = [createEx('Recovery', 1, '15m', 'STRETCH')]; }
            }
        }

        // ============================================================
        // SCENARIO 4: GYM + CLASSIC (BRO SPLIT)
        // ============================================================
        else {
            // Gym Classic: 5 Day Split
            if (dayOfWeekIndex === 0) { focus = 'CHEST'; exercises = getGymClassicExercises('CHEST', weekNum); }
            else if (dayOfWeekIndex === 1) { focus = 'BACK'; exercises = getGymClassicExercises('BACK', weekNum); }
            else if (dayOfWeekIndex === 2) { focus = 'LEGS'; exercises = getGymClassicExercises('LEGS', weekNum); }
            else if (dayOfWeekIndex === 3) { focus = 'SHOULDERS'; exercises = getGymClassicExercises('SHOULDER', weekNum); }
            else if (dayOfWeekIndex === 4) { focus = 'ARMS'; exercises = getGymClassicExercises('ARMS', weekNum); }
            else { focus = 'REST'; isRecovery = true; exercises = [createEx('Active Recovery', 1, '20 min', 'STRETCH')]; }
        }

        plan.push({
            day: dayLabel,
            focus,
            exercises,
            isRecovery,
            totalDuration: profile.sessionDuration || 45
        });
    }

    return plan;
};

export const calculateTimeEstimate = (profile: Partial<HealthProfile>): string => {
    if (!profile.weight || !profile.targetWeight) return "UNKNOWN";
    const diff = Math.abs(profile.weight - profile.targetWeight);
    if (diff === 0) return "GOAL REACHED";
    const rate = profile.goal === 'BUILD_MUSCLE' ? 0.25 : 0.5;
    const weeks = Math.ceil(diff / rate);
    return `${weeks} WEEKS`;
};

// Fallback
export const generateDailyWorkout = () => [];
