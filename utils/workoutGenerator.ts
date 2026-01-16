import { Exercise, HealthProfile, WorkoutDay } from '../types';

// --- TYPES ---
type Equipment = 'GYM' | 'HOME_DUMBBELLS' | 'BODYWEIGHT';
type Split = 'PPL' | 'CLASSIC';

// --- HELPER: CREATE EXERCISE ---
const createEx = (
    name: string, 
    sets: number, 
    reps: string, 
    type: 'COMPOUND' | 'ACCESSORY' | 'CARDIO' | 'STRETCH', 
    notes?: string,
    videoUrl?: string
): Exercise => ({
    name, sets, reps, type, completed: false, duration: 10, notes, videoUrl
});

const UNIVERSAL_WARMUP = [
    createEx('Treadmill/Brisk Walk Warmup', 1, '5 min', 'STRETCH', 'Wake up the system (30-45 cal)'),
    createEx('Mobility: Ankle Rotations', 1, '10 reps/side', 'STRETCH'),
    createEx('Mobility: Quad Stretches', 1, '10s/side', 'STRETCH'),
    createEx('Mobility: Cat & Cow', 1, '10 reps', 'STRETCH'),
    createEx('Mobility: Shoulder & Wrist Rotations', 1, '10 reps/side', 'STRETCH'),
];

const UNIVERSAL_COOLDOWN = [
    createEx('Cooldown: Child Pose', 1, '1 min', 'STRETCH'),
    createEx('Cooldown: Shavasana', 1, '2 min', 'STRETCH'),
    createEx('Full Body Stretch', 1, '5 min', 'STRETCH')
];

// --- PPL GYM MASTER DATA ---
const generateGymPpl = (): WorkoutDay[] => {
    const plan: WorkoutDay[] = [];
    const weeks = [
        { label: 'WEEK 1: INITIALIZATION', reps: '15, 12, 10' },
        { label: 'WEEK 2: PROGRESSION', reps: '12, 10, 8' },
        { label: 'WEEK 3: PEAK VOLUME', reps: '10, 8, 8' },
        { label: 'WEEK 4: STRENGTH PHASE', reps: '3 x 8' }
    ];

    weeks.forEach((w, wIdx) => {
        const reps = w.reps;
        const start = wIdx * 7;
        
        // Day 1
        plan.push({
            day: `DAY ${start + 1}`,
            focus: 'PUSH 1',
            totalDuration: 60,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx('Dumbbell Bench Press', 3, reps, 'COMPOUND', 'Increase weight each set'),
                createEx('Dumbbell Shoulder Press', 3, reps, 'COMPOUND'),
                createEx('Incline Dumbbell Flyes', 3, reps, 'ACCESSORY'),
                createEx('Tricep Pushdown (Rope)', 3, reps, 'ACCESSORY'),
                createEx('Ab Wheel Rollouts', 3, reps, 'ACCESSORY'),
                createEx('Skipping', 3, '2 min', 'CARDIO', '30s rest between rounds'),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Day 2
        plan.push({
            day: `DAY ${start + 2}`,
            focus: 'PULL 1',
            totalDuration: 60,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx('Pull Ups', 3, reps, 'COMPOUND', 'Assisted if needed'),
                createEx('Cable Seated Wide Grip Row', 3, reps, 'COMPOUND'),
                createEx('Rear Delt Flyes', 3, reps, 'ACCESSORY'),
                createEx('Barbell Bicep Curls', 3, reps, 'ACCESSORY'),
                createEx('Incline Dumbbell Curls', 3, reps, 'ACCESSORY'),
                createEx('Burpees', 3, '15 reps', 'CARDIO', '30s rest'),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Day 3
        plan.push({
            day: `DAY ${start + 3}`,
            focus: 'LEGS',
            totalDuration: 70,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx('Dumbbell Romanian Deadlift', 3, reps, 'COMPOUND'),
                createEx('Leg Press', 3, reps, 'COMPOUND'),
                createEx('Glute Bridges', 3, reps, 'ACCESSORY'),
                createEx('Hanging Leg Raises', 3, reps, 'ACCESSORY'),
                createEx('Standing Calf Raises', 3, reps, 'ACCESSORY'),
                createEx('Bicycle Crunches', 3, '15 reps', 'ACCESSORY'),
                createEx('Rowing Machine', 3, '3 min', 'CARDIO'),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Day 4
        plan.push({
            day: `DAY ${start + 4}`,
            focus: 'REST',
            totalDuration: 0,
            isRecovery: true,
            exercises: [createEx('Active Recovery Walk', 1, '20 min', 'STRETCH', 'Light movement only')]
        });

        // Day 5
        plan.push({
            day: `DAY ${start + 5}`,
            focus: 'PUSH 2',
            totalDuration: 60,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx('Smith Machine Shoulder Press', 3, reps, 'COMPOUND'),
                createEx('Incline Barbell Bench Press', 3, reps, 'COMPOUND'),
                createEx('Lever Leg Extensions', 3, reps, 'ACCESSORY', 'Surprise leg integration'),
                createEx('Cable Lateral Raises', 3, reps, 'ACCESSORY'),
                createEx('Tricep Dips', 3, reps, 'ACCESSORY'),
                createEx('Leg Raises', 3, '15 reps', 'ACCESSORY'),
                createEx('Spin Bike', 1, '10 min', 'CARDIO'),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Day 6
        plan.push({
            day: `DAY ${start + 6}`,
            focus: 'PULL 2',
            totalDuration: 65,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx('Cable Bent Over Row (Kneeling)', 3, reps, 'COMPOUND'),
                createEx('Lever Lying Leg Curls', 3, reps, 'ACCESSORY', 'Hamstring focus'),
                createEx('Hyperextensions', 3, reps, 'ACCESSORY'),
                createEx('Single Leg Romanian Deadlift', 3, reps, 'ACCESSORY'),
                createEx('Dumbbell Hammer Curls', 3, reps, 'ACCESSORY'),
                createEx('Cross Body Mountain Climbers', 3, '15 reps', 'CARDIO'),
                createEx('Brisk Walk', 1, '10 min', 'CARDIO'),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Day 7
        plan.push({
            day: `DAY ${start + 7}`,
            focus: 'REST',
            totalDuration: 0,
            isRecovery: true,
            exercises: [createEx('Deep Recovery', 1, '30 min', 'STRETCH', 'Prepare for next week')]
        });
    });

    return plan;
};

// --- CLASSIC BRO SPLIT MASTER DATA ---
const generateGymClassic = (): WorkoutDay[] => {
    const plan: WorkoutDay[] = [];
    const weeks = [
        { label: 'WEEK 1: VOLUME PHASE', reps: '12, 10, 8' },
        { label: 'WEEK 2: PROGRESSIVE OVERLOAD', reps: '12, 10, 8' },
        { label: 'WEEK 3: PEAK VOLUME', reps: '12, 10, 8' },
        { label: 'WEEK 4: STRENGTH & DENSITY', reps: '3 x 8' }
    ];

    weeks.forEach((w, wIdx) => {
        const reps = w.reps;
        const start = wIdx * 7;
        
        // Monday
        plan.push({
            day: `DAY ${start + 1}`,
            focus: 'CHEST',
            totalDuration: 60,
            exercises: [
                createEx('Treadmill Warmup', 1, '5 min', 'STRETCH'),
                createEx('Upper Body Mobility', 1, 'Full', 'STRETCH', 'Arm Circles & Torso Twists'),
                createEx('Barbell Bench Press', 3, reps, 'COMPOUND', 'Power builder'),
                createEx('Incline Dumbbell Press', 3, reps, 'COMPOUND', '30-degree incline'),
                createEx('Chest Dips', 3, reps === '3 x 8' ? '8' : 'Failure', 'COMPOUND', 'Lean forward for pecs'),
                createEx('Pec Deck Machine', 3, reps, 'ACCESSORY', 'Hard squeeze at center'),
                createEx('Push-Ups', 2, 'Failure', 'ACCESSORY', 'Empty the tank'),
                createEx('Doorway Pec Stretch', 1, '1 min', 'STRETCH'),
                createEx('Overhead Tricep Stretch', 1, '1 min', 'STRETCH')
            ]
        });

        // Tuesday
        plan.push({
            day: `DAY ${start + 2}`,
            focus: 'BACK',
            totalDuration: 60,
            exercises: [
                createEx('Treadmill Warmup', 1, '5 min', 'STRETCH'),
                createEx('Shoulder/Arm Rotations', 1, 'Full', 'STRETCH'),
                createEx('Wide Grip Pull-Ups', 3, reps === '3 x 8' ? '8' : 'Failure', 'COMPOUND', 'Assisted if needed'),
                createEx('Bent Over Barbell Rows', 3, reps, 'COMPOUND', 'Pull to stomach'),
                createEx('Lat Pulldown (Neutral/Close)', 3, reps, 'COMPOUND', 'V-handle attachment'),
                createEx('Single Arm Dumbbell Rows', 3, reps, 'COMPOUND', 'Pull to hip pocket'),
                createEx('Hyperextensions', 3, reps, 'ACCESSORY', 'Lower back focus'),
                createEx('Lat Hang', 1, '1 min', 'STRETCH'),
                createEx('Child\'s Pose', 1, '1 min', 'STRETCH')
            ]
        });

        // Wednesday
        plan.push({
            day: `DAY ${start + 3}`,
            focus: 'SHOULDERS',
            totalDuration: 60,
            exercises: [
                createEx('Treadmill Warmup', 1, '5 min', 'STRETCH'),
                createEx('Shoulder Dislocations', 1, '10 reps', 'STRETCH', 'Use stick or band'),
                createEx('Seated Dumbbell Overhead Press', 3, reps, 'COMPOUND'),
                createEx('Dumbbell Lateral Raises', 3, reps, 'ACCESSORY', 'Lead with elbows'),
                createEx('Face Pulls', 3, reps, 'ACCESSORY', 'Rope attachment'),
                createEx('Dumbbell Front Raises', 3, reps, 'ACCESSORY', 'Controlled drop'),
                createEx('Dumbbell Shrugs', 3, reps, 'ACCESSORY', 'Trap builder'),
                createEx('Cross-Body Shoulder Stretch', 1, '1 min', 'STRETCH'),
                createEx('Neck Tilts', 1, '1 min', 'STRETCH')
            ]
        });

        // Thursday
        plan.push({
            day: `DAY ${start + 4}`,
            focus: 'ARMS',
            totalDuration: 60,
            exercises: [
                createEx('Treadmill Warmup', 1, '5 min', 'STRETCH'),
                createEx('Arm Circles', 1, '1 min', 'STRETCH'),
                createEx('Close Grip Bench Press', 3, reps, 'COMPOUND', 'Tucked elbows'),
                createEx('Barbell Bicep Curl', 3, reps, 'COMPOUND', 'Strict form'),
                createEx('Overhead Cable Extension', 3, reps, 'ACCESSORY', 'Rope'),
                createEx('Incline Dumbbell Curl', 3, reps, 'ACCESSORY', 'Deep stretch focus'),
                createEx('Tricep Pushdowns', 3, reps, 'ACCESSORY', 'Bar or Rope'),
                createEx('Hammer Curls', 3, reps, 'ACCESSORY', 'Forearm & width builder'),
                createEx('Wrist/Forearm Stretches', 1, '1 min', 'STRETCH'),
                createEx('Bicep Wall Stretch', 1, '1 min', 'STRETCH')
            ]
        });

        // Friday
        plan.push({
            day: `DAY ${start + 5}`,
            focus: 'REST',
            totalDuration: 0,
            isRecovery: true,
            exercises: [createEx('Active Recovery Walk', 1, '30 min', 'STRETCH', 'Flush out lactic acid')]
        });

        // Saturday
        plan.push({
            day: `DAY ${start + 6}`,
            focus: 'LEGS',
            totalDuration: 70,
            exercises: [
                createEx('Treadmill Warmup', 1, '5 min', 'STRETCH'),
                createEx('Leg Swings', 1, 'Full', 'STRETCH', 'Front/Back & Side/Side'),
                createEx('Barbell Squats', 3, reps, 'COMPOUND', 'The foundation lift'),
                createEx('Romanian Deadlifts', 3, reps, 'COMPOUND', 'Hamstring stretch'),
                createEx('Leg Press', 3, reps, 'COMPOUND', 'Load up the plates'),
                createEx('Leg Extensions', 3, reps, 'ACCESSORY', 'Quad focus'),
                createEx('Lying Leg Curls', 3, reps, 'ACCESSORY', 'Hamstring focus'),
                createEx('Standing Calf Raises', 3, reps, 'ACCESSORY', 'Deep stretch at bottom'),
                createEx('Lying Quad Stretch', 1, '1 min', 'STRETCH'),
                createEx('Pigeon Pose', 1, '1 min', 'STRETCH')
            ]
        });

        // Sunday
        plan.push({
            day: `DAY ${start + 7}`,
            focus: 'REST',
            totalDuration: 0,
            isRecovery: true,
            exercises: [createEx('Full Recovery', 1, 'Full Day', 'STRETCH', 'Sleep and eat well')]
        });
    });

    return plan;
};

// --- BODYWEIGHT REGULAR MASTER DATA ---
const generateBodyweightRegular = (): WorkoutDay[] => {
    const plan: WorkoutDay[] = [];
    const weeks = [
        { label: 'WEEK 1: INITIALIZATION', reps: '10' },
        { label: 'WEEK 2: PROGRESSION', reps: '12' },
        { label: 'WEEK 3: ADAPTATION', reps: '12' },
        { label: 'WEEK 4: MASTERY', reps: '12-15' }
    ];

    weeks.forEach((w, wIdx) => {
        const reps = w.reps;
        const isMastery = w.label.includes('MASTERY');
        const useKneeVars = wIdx === 1 || wIdx === 3; // W2 and W4 use the knee-based progression for volume
        const start = wIdx * 7;

        // Day 1
        plan.push({
            day: `DAY ${start + 1}`,
            focus: 'CHEST',
            totalDuration: 30,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx(useKneeVars ? 'Knee Pushups' : 'Standard Pushups', 3, reps, 'COMPOUND', 'Focus on full range of motion'),
                createEx(useKneeVars ? 'Wide Grip Knee Pushups' : 'Wide Grip Pushups', 3, reps, 'COMPOUND'),
                createEx('Stepper Push-ups', 3, reps, 'ACCESSORY', 'One hand on step/book'),
                createEx(useKneeVars ? 'Reverse Crunch' : 'Crunches', 3, reps, 'ACCESSORY'),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Day 2
        plan.push({
            day: `DAY ${start + 2}`,
            focus: 'BACK',
            totalDuration: 30,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx(useKneeVars ? 'Prone Cobra (Hands Interlocked)' : 'Superman', 3, reps, 'COMPOUND'),
                createEx('Reverse Snow Angels', 3, reps, 'ACCESSORY', 'Lying on stomach, rotate arms'),
                createEx('Glute Bridge', 3, reps, 'ACCESSORY'),
                createEx(useKneeVars ? 'Table Body Row' : 'Bent Over T-Raises', 3, reps, 'COMPOUND', useKneeVars ? 'Pull from under sturdy table' : 'Hinge at hips, raise arms to T'),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Day 3
        plan.push({
            day: `DAY ${start + 3}`,
            focus: 'SHOULDERS',
            totalDuration: 30,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx(useKneeVars ? 'Shoulder Tap Straight Arm Plank' : 'Pike Pushups', 3, useKneeVars ? reps : reps, 'COMPOUND'),
                createEx('Arm Lift Front Plank', 3, reps, 'ACCESSORY', '10 reps per side'),
                createEx(useKneeVars ? 'Reverse Snow Angels' : 'Prone Cobra Hands Interlocked', 3, reps, 'ACCESSORY'),
                createEx(useKneeVars ? 'Side Plank' : 'Russian Twist', 3, useKneeVars ? (isMastery ? '20s' : '15s') : reps, 'ACCESSORY'),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Day 4
        plan.push({
            day: `DAY ${start + 4}`,
            focus: 'REST',
            totalDuration: 0,
            isRecovery: true,
            exercises: [createEx('Active Recovery Stretch', 1, '20 min', 'STRETCH')]
        });

        // Day 5
        plan.push({
            day: `DAY ${start + 5}`,
            focus: 'LEGS',
            totalDuration: 35,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx(useKneeVars ? 'Wall Sit Holds' : 'Squats', 3, useKneeVars ? (isMastery ? '20s' : '15s') : reps, 'COMPOUND'),
                createEx(useKneeVars ? 'Step-Ups' : 'Reverse Lunges', 3, reps, 'COMPOUND'),
                createEx('Glute Bridge', 3, reps, 'ACCESSORY', '30s rest'),
                createEx(useKneeVars ? 'Single Leg Calf Raises' : 'Calf Raises', 3, useKneeVars ? '1 min' : reps, 'ACCESSORY'),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Day 6
        plan.push({
            day: `DAY ${start + 6}`,
            focus: 'ARMS',
            totalDuration: 35,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx(useKneeVars ? 'Diamond Pushups' : 'Tricep Dips on Chair', 3, reps, 'COMPOUND'),
                createEx(useKneeVars ? 'Bench Dip on Floor' : 'Diamond Pushups', 3, useKneeVars ? '15' : reps, 'COMPOUND'),
                createEx('Towel Bicep Curl', 3, reps, 'ACCESSORY', 'Use towel for self-resistance'),
                createEx('Hammer Curl with Towel', 3, reps, 'ACCESSORY'),
                createEx(useKneeVars ? 'Diamond Pushups' : 'Leg Raises', 3, reps, 'ACCESSORY'),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Day 7
        plan.push({
            day: `DAY ${start + 7}`,
            focus: 'REST',
            totalDuration: 0,
            isRecovery: true,
            exercises: [createEx('Full System Recovery', 1, 'Full Day', 'STRETCH')]
        });
    });

    return plan;
};

// --- BODYWEIGHT PPL MASTER DATA ---
const generateBodyweightPpl = (): WorkoutDay[] => {
    const plan: WorkoutDay[] = [];
    const weeks = [
        { label: 'WEEK 1: INITIALIZATION', reps: '10-12', rest: '60s' },
        { label: 'WEEK 2: INTENSITY FOCUS', reps: '10-12', rest: '45s' },
        { label: 'WEEK 3: VOLUME OVERLOAD', reps: '15-20', rest: '45-60s' },
        { label: 'WEEK 4: TEMPO MASTERY', reps: '8-12', rest: '60s', tempo: '3-1-1' }
    ];

    weeks.forEach((w, wIdx) => {
        const restNote = `REST: ${w.rest}`;
        const tempoNote = w.tempo ? `TEMPO: ${w.tempo}` : '';
        const globalNote = `${restNote} | ${tempoNote}`.trim();
        const start = wIdx * 7;

        // Monday
        plan.push({
            day: `DAY ${start + 1}`,
            focus: 'PUSH',
            totalDuration: 45,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx('Standard Pushups', 3, wIdx === 2 ? '15' : wIdx === 3 ? '10' : '12', 'COMPOUND', globalNote),
                createEx('Pike Pushups', 3, wIdx === 2 ? '12' : wIdx === 3 ? '8' : '10', 'COMPOUND', globalNote),
                createEx('Wide Grip Pushups', 3, wIdx === 2 ? '15' : wIdx === 3 ? '10' : '12', 'ACCESSORY', globalNote),
                createEx('Tricep Dips (Chair)', 3, wIdx === 2 ? '15' : wIdx === 3 ? '10' : '12', 'ACCESSORY', globalNote),
                createEx('Decline Pushups', 3, wIdx === 2 ? '12' : wIdx === 3 ? '8' : '10', 'ACCESSORY', globalNote),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Tuesday
        plan.push({
            day: `DAY ${start + 2}`,
            focus: 'PULL',
            totalDuration: 45,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx('Doorframe Rows', 4, wIdx === 2 ? '15' : '12', 'COMPOUND', globalNote),
                createEx('Towel Rows (Floor)', 3, wIdx === 2 ? '18' : '15', 'COMPOUND', globalNote),
                createEx('Superman Pulses', 3, wIdx === 2 ? '20' : '15', 'ACCESSORY', globalNote),
                createEx('Towel Bicep Curls', 3, wIdx === 2 ? '15' : '12', 'ACCESSORY', globalNote),
                createEx('Reverse Snow Angels', 3, wIdx === 2 ? '15' : '12', 'ACCESSORY', globalNote),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Wednesday
        plan.push({
            day: `DAY ${start + 3}`,
            focus: 'LEGS',
            totalDuration: 45,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx('Bodyweight Squats', 3, wIdx === 2 ? '20' : wIdx === 3 ? '12' : '15', 'COMPOUND', globalNote),
                createEx('Reverse Lunges', 3, wIdx === 2 ? '15' : wIdx === 3 ? '10' : '12', 'COMPOUND', globalNote),
                createEx('Glute Bridges', 3, wIdx === 2 ? '20' : 15 ? '12' : '15', 'ACCESSORY', globalNote),
                createEx('Side Lunges', 3, wIdx === 2 ? '12' : '10', 'ACCESSORY', globalNote),
                createEx('Calf Raises', 4, wIdx === 2 ? '25' : '20', 'ACCESSORY', globalNote),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Thursday
        plan.push({
            day: `DAY ${start + 4}`,
            focus: 'UPPER BODY',
            totalDuration: 50,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx('Pushups', 3, wIdx === 2 ? '18' : '15', 'COMPOUND', globalNote),
                createEx('Doorframe Rows', 3, wIdx === 2 ? '18' : '15', 'COMPOUND', globalNote),
                createEx('Pike Pushups', 3, wIdx === 2 ? '12' : '10', 'COMPOUND', globalNote),
                createEx('Prone Cobra', 3, wIdx === 1 ? '35s' : wIdx === 2 ? '40s' : wIdx === 3 ? '45s' : '30s', 'STRETCH', 'Static hold focus'),
                createEx('Tricep Bench Dips', 3, wIdx === 2 ? '18' : '15', 'ACCESSORY', globalNote),
                createEx('Towel Hammer Curls', 3, wIdx === 2 ? '15' : '12', 'ACCESSORY', globalNote),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Friday
        plan.push({
            day: `DAY ${start + 5}`,
            focus: 'LOWER BODY + ABS',
            totalDuration: 50,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx('Sumo Squats', 3, wIdx === 2 ? '20' : '15', 'COMPOUND', globalNote),
                createEx('Bulgarian Split Squats', 3, wIdx === 2 ? '10' : '8', 'COMPOUND', 'One foot on chair'),
                createEx('Wall Sit', 3, wIdx === 1 ? '50s' : wIdx === 2 ? '60s' : wIdx === 3 ? 'Max Effort' : '45s', 'STRETCH', 'Quad burnout'),
                createEx('Plank', 3, wIdx === 1 ? '50s' : wIdx === 2 ? '60s' : wIdx === 3 ? 'Max Effort' : '45s', 'ACCESSORY'),
                createEx('Lying Leg Raises', 3, wIdx === 2 ? '18' : '15', 'ACCESSORY', globalNote),
                createEx('Russian Twists', 3, wIdx === 2 ? '30' : '20', 'ACCESSORY', 'Total reps'),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Saturday
        plan.push({
            day: `DAY ${start + 6}`,
            focus: 'REST',
            totalDuration: 0,
            isRecovery: true,
            exercises: [createEx('Active Recovery Stretch', 1, '20 min', 'STRETCH')]
        });

        // Sunday
        plan.push({
            day: `DAY ${start + 7}`,
            focus: 'REST',
            totalDuration: 0,
            isRecovery: true,
            exercises: [createEx('System Maintenance', 1, 'Full Day', 'STRETCH')]
        });
    });

    return plan;
};

// --- DUMBBELL PPL MASTER DATA ---
const generateDumbbellPpl = (): WorkoutDay[] => {
    const plan: WorkoutDay[] = [];
    const weeks = [
        { label: 'WEEK 1: FOUNDATION', reps: '10-12', rest: '60-90s', note: 'Form Mastery' },
        { label: 'WEEK 2: VOLUME PHASE', reps: '12-15', rest: '60s', note: 'Higher Intensity' },
        { label: 'WEEK 3: INTENSITY PHASE', reps: 'Superset', rest: '90s', note: 'Back-to-back pairings' },
        { label: 'WEEK 4: STRENGTH & DENSITY', reps: '8-10', rest: '90s', note: 'Slow Tempo (3-1-1)' }
    ];

    weeks.forEach((w, wIdx) => {
        const reps = w.reps;
        const rest = w.rest;
        const isSuperset = reps === 'Superset';
        const globalNote = `REST: ${rest} | ${w.note}`;
        const start = wIdx * 7;

        // Day 1
        plan.push({
            day: `DAY ${start + 1}`,
            focus: 'PUSH',
            totalDuration: 55,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx('Dumbbell Floor Press', wIdx === 3 ? 4 : 3, isSuperset ? '12' : wIdx === 3 ? '8' : '12', 'COMPOUND', isSuperset ? 'SUPERSET A: Press into Pushups' : globalNote),
                createEx('Pushups', 3, isSuperset ? 'AMRAP' : wIdx === 3 ? '8' : '10', 'COMPOUND', isSuperset ? 'SUPERSET B' : globalNote),
                createEx('Dumbbell Overhead Press', wIdx === 3 ? 4 : 3, isSuperset ? '10' : wIdx === 3 ? '8' : '10', 'COMPOUND', isSuperset ? 'SUPERSET A: Press into Lateral Raise' : globalNote),
                createEx('Dumbbell Lateral Raises', 3, isSuperset ? '12' : wIdx === 3 ? '10' : '12', 'ACCESSORY', isSuperset ? 'SUPERSET B' : globalNote),
                createEx('Dumbbell Tricep Extension', 3, wIdx === 3 ? '10' : '12', 'ACCESSORY', globalNote),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Day 2
        plan.push({
            day: `DAY ${start + 2}`,
            focus: 'PULL',
            totalDuration: 55,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx(wIdx === 3 ? 'Heavy Dumbbell Rows' : 'Dumbbell Bent-Over Rows', wIdx === 3 ? 4 : 3, isSuperset ? '12' : wIdx === 3 ? '8' : '12', 'COMPOUND', isSuperset ? 'SUPERSET A: Rows into Superman' : globalNote),
                createEx(isSuperset ? 'Superman Pulses' : 'Single-Arm Dumbbell Row', 3, isSuperset ? '15' : '10', 'COMPOUND', isSuperset ? 'SUPERSET B' : globalNote),
                createEx('Dumbbell Bicep Curls', wIdx === 3 ? 4 : 3, isSuperset ? '10' : wIdx === 3 ? '8' : '12', 'ACCESSORY', isSuperset ? 'SUPERSET A' : globalNote),
                createEx('Hammer Curls', 3, isSuperset ? '12' : wIdx === 3 ? '8' : '12', 'ACCESSORY', isSuperset ? 'SUPERSET B' : globalNote),
                createEx('Rear Delt Flys', 4, '10', 'ACCESSORY', 'Focus on upper back squeeze'),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Day 3
        plan.push({
            day: `DAY ${start + 3}`,
            focus: 'LEGS',
            totalDuration: 60,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx('Goblet Squats', wIdx === 3 ? 4 : 3, isSuperset ? '12' : wIdx === 3 ? '8' : '12', 'COMPOUND', isSuperset ? 'SUPERSET A: Into Squat Jumps' : globalNote),
                createEx(isSuperset ? 'Squat Jumps' : 'Dumbbell Reverse Lunges', 3, isSuperset ? '10' : '10', 'COMPOUND', isSuperset ? 'SUPERSET B (Explosive)' : globalNote),
                createEx('Dumbbell Romanian Deadlifts', wIdx === 3 ? 4 : 3, isSuperset ? '12' : wIdx === 3 ? '8' : '10', 'COMPOUND', isSuperset ? 'SUPERSET A: Into Step-Ups' : globalNote),
                createEx(isSuperset ? 'Weighted Step-Ups' : 'Calf Raises', 4, isSuperset ? '10' : '15', 'ACCESSORY', isSuperset ? 'SUPERSET B' : globalNote),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Day 4
        plan.push({
            day: `DAY ${start + 4}`,
            focus: 'UPPER BODY',
            totalDuration: 55,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx('Pushups', 3, '12-15', 'COMPOUND', isSuperset ? 'SUPERSET A: Into Rows' : globalNote),
                createEx('Dumbbell Bent-Over Rows', 3, '12', 'COMPOUND', isSuperset ? 'SUPERSET B' : globalNote),
                createEx(wIdx === 3 ? 'Arnold Press' : 'Dumbbell Shoulder Press', 3, '10', 'COMPOUND', isSuperset ? 'SUPERSET A: Into Curls' : globalNote),
                createEx('Dumbbell Bicep Curls', 3, '12', 'ACCESSORY', isSuperset ? 'SUPERSET B' : globalNote),
                createEx('Dumbbell Shrugs', 3, wIdx === 3 ? '10' : '15', 'ACCESSORY', globalNote),
                createEx('Plank', 3, wIdx === 1 ? '50s' : wIdx === 2 ? '60s' : '45s', 'ACCESSORY'),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Day 5
        plan.push({
            day: `DAY ${start + 5}`,
            focus: 'LOWER BODY',
            totalDuration: 60,
            exercises: [
                ...UNIVERSAL_WARMUP,
                createEx(wIdx === 3 ? 'Dumbbell Thrusters' : 'Dumbbell Sumo Squats', 3, '10-12', 'COMPOUND', isSuperset ? 'SUPERSET A: Into Glute Bridges' : globalNote),
                createEx('Weighted Glute Bridges', 3, '12-15', 'ACCESSORY', isSuperset ? 'SUPERSET B' : globalNote),
                createEx('Weighted Forward Lunges', 3, '10', 'COMPOUND', isSuperset ? 'SUPERSET A: Into Wall Sit' : globalNote),
                createEx(isSuperset ? 'Wall Sit' : 'Russian Twists', 3, isSuperset ? '45s' : '20', 'ACCESSORY', isSuperset ? 'SUPERSET B' : globalNote),
                createEx('Lying Leg Raises', 3, '12-15', 'ACCESSORY', globalNote),
                ...UNIVERSAL_COOLDOWN
            ]
        });

        // Day 6
        plan.push({
            day: `DAY ${start + 6}`,
            focus: 'REST',
            totalDuration: 0,
            isRecovery: true,
            exercises: [createEx('Active Recovery Stretch', 1, '20 min', 'STRETCH')]
        });

        // Day 7
        plan.push({
            day: `DAY ${start + 7}`,
            focus: 'REST',
            totalDuration: 0,
            isRecovery: true,
            exercises: [createEx('Deep Rest Protocol', 1, 'Full Day', 'STRETCH')]
        });
    });

    return plan;
};

// --- DUMBBELL REGULAR MASTER DATA ---
const generateDumbbellRegular = (): WorkoutDay[] => {
    const plan: WorkoutDay[] = [];
    const weeks = [
        { label: 'WEEK 1: FOUNDATION', reps: '10-12', rest: '60-90s', sets: 3 },
        { label: 'WEEK 2: VOLUME PHASE', reps: '12-15', rest: '60s', sets: 3 },
        { label: 'WEEK 3: INTENSITY PHASE', reps: 'Superset', rest: '90s', sets: 3 },
        { label: 'WEEK 4: STRENGTH & DENSITY', reps: '8', rest: '90s', sets: 4, tempo: '3-1-1' }
    ];

    weeks.forEach((w, wIdx) => {
        const reps = w.reps;
        const rest = w.rest;
        const sets = w.sets;
        const isSuperset = reps === 'Superset';
        const tempoNote = w.tempo ? `TEMPO: ${w.tempo}` : '';
        const globalNote = `REST: ${rest} | ${tempoNote}`.trim();
        const start = wIdx * 7;

        // Day 1
        plan.push({
            day: `DAY ${start + 1}`,
            focus: 'CHEST',
            totalDuration: 50,
            exercises: [
                createEx('Wall Pushups', 1, '20 reps', 'STRETCH', 'Warmup Part 1'),
                createEx('Jumping Jacks', 1, '2 min', 'STRETCH', 'Warmup Part 2'),
                createEx('Dumbbell Floor Press', sets, isSuperset ? '12' : (wIdx === 3 ? '8' : reps), 'COMPOUND', isSuperset ? 'SUPERSET A: Floor Press into Pushups' : globalNote),
                createEx(isSuperset ? 'Standard Pushups' : 'Standard Pushups', sets, isSuperset ? 'AMRAP' : (wIdx === 3 ? '10' : reps), 'COMPOUND', isSuperset ? 'SUPERSET B' : globalNote),
                createEx('Dumbbell Floor Flys', sets, isSuperset ? '12' : reps, 'ACCESSORY', isSuperset ? 'SUPERSET A: Flys into Incline' : globalNote),
                createEx(isSuperset ? 'Incline Pushups' : (wIdx === 3 ? 'Decline Pushups' : 'Incline Pushups'), sets, isSuperset ? '12' : reps, 'ACCESSORY', isSuperset ? 'SUPERSET B' : globalNote),
                createEx('Doorway Chest Stretch', 1, '30-45s', 'STRETCH', 'Cooldown')
            ]
        });

        // Day 2
        plan.push({
            day: `DAY ${start + 2}`,
            focus: 'BACK',
            totalDuration: 50,
            exercises: [
                createEx('High Knees', 1, '2 min', 'STRETCH', 'Warmup'),
                createEx('Dumbbell Bent-Over Row', sets, isSuperset ? '12' : reps, 'COMPOUND', isSuperset ? 'SUPERSET A: Rows into Superman' : globalNote),
                createEx(isSuperset ? 'Superman Pulses' : 'Single-Arm Dumbbell Row', sets, isSuperset ? '15' : reps, 'COMPOUND', isSuperset ? 'SUPERSET B' : globalNote),
                createEx(isSuperset ? 'Single-Arm Dumbbell Row' : 'Superman Lifts', sets, isSuperset ? '10/side' : (wIdx === 3 ? '10' : reps), 'ACCESSORY', isSuperset ? 'SUPERSET A: Rows into Doorframe' : globalNote),
                createEx(isSuperset ? 'Doorframe Rows' : 'Doorframe Rows', sets, isSuperset ? '15' : (wIdx === 3 ? '12' : reps), 'ACCESSORY', isSuperset ? 'SUPERSET B' : globalNote),
                createEx('Child’s Pose', 1, '45-60s', 'STRETCH', 'Cooldown')
            ]
        });

        // Day 3
        plan.push({
            day: `DAY ${start + 3}`,
            focus: 'SHOULDERS',
            totalDuration: 50,
            exercises: [
                createEx('Jog in Place', 1, '2 min', 'STRETCH', 'Warmup'),
                createEx('Seated Dumbbell Overhead Press', sets, isSuperset ? '10' : reps, 'COMPOUND', isSuperset ? 'SUPERSET A: Into Pike Pushups' : globalNote),
                createEx(isSuperset ? 'Pike Pushups' : 'Dumbbell Lateral Raises', sets, isSuperset ? '10' : reps, 'COMPOUND', isSuperset ? 'SUPERSET B' : globalNote),
                createEx(isSuperset ? 'Dumbbell Lateral Raises' : 'Pike Pushups', sets, isSuperset ? '12' : (wIdx === 3 ? '8' : reps), 'ACCESSORY', isSuperset ? 'SUPERSET A: Into Front Raises' : globalNote),
                createEx(isSuperset ? 'Dumbbell Front Raises' : 'Dumbbell Front Raises', sets, isSuperset ? '12' : reps, 'ACCESSORY', isSuperset ? 'SUPERSET B' : globalNote),
                createEx('Cross-Body Shoulder Stretch', 1, '30s/side', 'STRETCH', 'Cooldown')
            ]
        });

        // Day 4
        plan.push({
            day: `DAY ${start + 4}`,
            focus: 'ARMS',
            totalDuration: 50,
            exercises: [
                createEx('Jumping Jacks', 1, '2 min', 'STRETCH', 'Warmup'),
                createEx(wIdx === 3 ? 'Strict Bicep Curls' : 'Dumbbell Bicep Curls', sets, isSuperset ? '12' : reps, 'COMPOUND', isSuperset ? 'SUPERSET A: Curls into Dips' : globalNote),
                createEx(isSuperset ? 'Tricep Dips (Chair)' : 'Tricep Dips (Chair)', sets, isSuperset ? '15' : reps, 'COMPOUND', isSuperset ? 'SUPERSET B' : globalNote),
                createEx('Hammer Curls', sets, isSuperset ? '12' : reps, 'ACCESSORY', isSuperset ? 'SUPERSET A: Into Overhead Ext' : globalNote),
                createEx('Overhead Dumbbell Extension', sets, isSuperset ? '12' : reps, 'ACCESSORY', isSuperset ? 'SUPERSET B' : globalNote),
                createEx(wIdx === 3 ? 'Close Grip Pushups' : 'Diamond Pushups', sets, 'Failure', 'ACCESSORY', 'Finisher'),
                createEx('Overhead Tricep Stretch', 1, '30s/side', 'STRETCH', 'Cooldown')
            ]
        });

        // Day 5
        plan.push({
            day: `DAY ${start + 5}`,
            focus: 'REST',
            totalDuration: 0,
            isRecovery: true,
            exercises: [createEx('Active Recovery Walk', 1, '20 min', 'STRETCH', 'Flush out lactic acid')]
        });

        // Day 6
        plan.push({
            day: `DAY ${start + 6}`,
            focus: 'LEGS',
            totalDuration: 55,
            exercises: [
                createEx('Bodyweight Squats', 1, '20-30 reps', 'STRETCH', 'Warmup'),
                createEx(wIdx === 3 ? 'Heavy Goblet Squats' : 'Goblet Squats', sets, isSuperset ? '12' : reps, 'COMPOUND', isSuperset ? 'SUPERSET A: Into Lunges' : globalNote),
                createEx(isSuperset ? 'Bodyweight Lunges' : 'Dumbbell Lunges', sets, isSuperset ? '10/leg' : reps, 'COMPOUND', isSuperset ? 'SUPERSET B' : globalNote),
                createEx(wIdx === 3 ? 'Heavy RDL' : 'Dumbbell RDL', sets, isSuperset ? '12' : reps, 'ACCESSORY', isSuperset ? 'SUPERSET A: Into Glute Bridges' : globalNote),
                createEx(isSuperset ? 'Glute Bridges' : 'Weighted Calf Raises', sets, isSuperset ? '15' : (wIdx === 3 ? '12' : reps), 'ACCESSORY', isSuperset ? 'SUPERSET B' : globalNote),
                createEx(isSuperset ? 'Weighted Calf Raises' : 'Glute Bridges', sets, isSuperset ? '20' : reps, 'ACCESSORY', 'Final burnout'),
                createEx('Quad Stretch', 1, '30-60s/side', 'STRETCH', 'Cooldown')
            ]
        });

        // Day 7
        plan.push({
            day: `DAY ${start + 7}`,
            focus: 'REST',
            totalDuration: 0,
            isRecovery: true,
            exercises: [createEx('System Recovery', 1, 'Full Day', 'STRETCH', 'Prepare for next cycle')]
        });
    });

    return plan;
};

// registry
export const MASTER_PROTOCOL_REGISTRY: Record<string, WorkoutDay[]> = {
    GYM_PPL: generateGymPpl(),
    GYM_CLASSIC: generateGymClassic(),
    BW_REGULAR: generateBodyweightRegular(),
    BW_PPL: generateBodyweightPpl(),
    DB_PPL: generateDumbbellPpl(),
    DB_REGULAR: generateDumbbellRegular()
};

export const generateSystemProtocol = (profile: HealthProfile): WorkoutDay[] => {
    const equipment = profile.equipment as Equipment; 
    const split = profile.workoutSplit as Split; 
    
    let protocolKey = 'GYM_PPL'; 

    if (equipment === 'GYM') {
        protocolKey = split === 'PPL' ? 'GYM_PPL' : 'GYM_CLASSIC';
    } else if (equipment === 'BODYWEIGHT') {
        protocolKey = split === 'PPL' ? 'BW_PPL' : 'BW_REGULAR';
    } else if (equipment === 'HOME_DUMBBELLS') {
        protocolKey = split === 'PPL' ? 'DB_PPL' : 'DB_REGULAR';
    }

    const plan = MASTER_PROTOCOL_REGISTRY[protocolKey];

    if (!plan || plan.length === 0) {
        return [
            {
                day: 'CALIBRATION DAY',
                focus: 'PENDING PROTOCOL',
                exercises: [
                    createEx('Wait for Deployment', 1, 'N/A', 'STRETCH', 'Admin is currently configuring this specific path.')
                ],
                totalDuration: 10
            }
        ];
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

export const generateDailyWorkout = () => [];