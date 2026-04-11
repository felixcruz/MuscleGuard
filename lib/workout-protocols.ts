export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  why: string;
}

export interface WorkoutSession {
  id: string;
  label: string;
  duration: string;
  description: string;
  type: "strength" | "cardio" | "mobility" | "sport";
  exercises?: Exercise[];
}

export interface ActivityProtocol {
  activityType: string;
  displayName: string;
  emoji: string;
  glp1Note: string;
  postWorkoutProteinG: number;
  primarySessions: WorkoutSession[];
  needsComplementaryStrength: boolean;
}

const PROTOCOLS: ActivityProtocol[] = [
  {
    activityType: "strength",
    displayName: "Strength Training",
    emoji: "🏋️",
    glp1Note: "Resistance training is the #1 way to preserve muscle on GLP-1. 3 sessions per week, 20 min each.",
    postWorkoutProteinG: 30,
    needsComplementaryStrength: false,
    primarySessions: [
      {
        id: "A",
        label: "Day A — Upper Body",
        duration: "20 min",
        description: "Push + pull movements to preserve chest, back, and arms.",
        type: "strength",
        exercises: [
          { name: "Push-ups", sets: 3, reps: "10-15", why: "Chest & triceps activation" },
          { name: "Dumbbell rows", sets: 3, reps: "10-12 each", why: "Back & biceps" },
          { name: "Dumbbell shoulder press", sets: 3, reps: "10", why: "Shoulder preservation" },
          { name: "Bicep curls", sets: 3, reps: "12", why: "Direct arm stimulus" },
        ],
      },
      {
        id: "B",
        label: "Day B — Lower Body",
        duration: "20 min",
        description: "Legs and glutes hold most of your body's muscle mass.",
        type: "strength",
        exercises: [
          { name: "Goblet squat", sets: 3, reps: "12", why: "Quad & glute compound" },
          { name: "Hip hinge (RDL)", sets: 3, reps: "10", why: "Hamstrings & posterior chain" },
          { name: "Step-ups", sets: 3, reps: "10 each leg", why: "Single-leg stability" },
          { name: "Calf raises", sets: 3, reps: "15-20", why: "Lower leg retention" },
        ],
      },
      {
        id: "C",
        label: "Day C — Full Body",
        duration: "20 min",
        description: "Compound movements that hit everything in one session.",
        type: "strength",
        exercises: [
          { name: "Deadlift (or KB sumo)", sets: 3, reps: "8", why: "Highest muscle activation" },
          { name: "Dumbbell bench press", sets: 3, reps: "10", why: "Horizontal push pattern" },
          { name: "Band pull-aparts", sets: 3, reps: "15", why: "Rear delt & posture" },
          { name: "Plank", sets: 3, reps: "30-45s", why: "Core & trunk stability" },
        ],
      },
    ],
  },
  {
    activityType: "running",
    displayName: "Running",
    emoji: "🏃",
    glp1Note: "Running is catabolic. Without resistance training, GLP-1 users lose muscle 2x faster. Add 2 strength sessions/week.",
    postWorkoutProteinG: 25,
    needsComplementaryStrength: true,
    primarySessions: [
      {
        id: "run-easy",
        label: "Easy Run",
        duration: "30-40 min",
        description: "Conversational pace — you should be able to speak full sentences.",
        type: "cardio",
      },
      {
        id: "run-tempo",
        label: "Tempo Run",
        duration: "20-25 min",
        description: "Uncomfortable pace — challenging but sustainable. Builds aerobic threshold.",
        type: "cardio",
      },
      {
        id: "run-long",
        label: "Long Run (optional)",
        duration: "45-60 min",
        description: "Easy pace. Build aerobic base. Ensure adequate protein before & after.",
        type: "cardio",
      },
    ],
  },
  {
    activityType: "cycling",
    displayName: "Cycling",
    emoji: "🚴",
    glp1Note: "Cycling builds lower body but neglects upper body and core. 2 strength sessions/week preserve full-body muscle mass.",
    postWorkoutProteinG: 20,
    needsComplementaryStrength: true,
    primarySessions: [
      {
        id: "cycle-aerobic",
        label: "Aerobic Ride",
        duration: "45-60 min",
        description: "Zone 2 — comfortable steady-state. Maximizes fat oxidation while preserving muscle.",
        type: "cardio",
      },
      {
        id: "cycle-interval",
        label: "Interval Session",
        duration: "30 min",
        description: "Include 4-6 hard efforts of 2-3 min. Builds power and increases muscle stimulus.",
        type: "cardio",
      },
    ],
  },
  {
    activityType: "swimming",
    displayName: "Swimming",
    emoji: "🏊",
    glp1Note: "Swimming is excellent for low-impact cardio but provides minimal muscle-building stimulus. Resistance training is essential.",
    postWorkoutProteinG: 25,
    needsComplementaryStrength: true,
    primarySessions: [
      {
        id: "swim-endurance",
        label: "Endurance Swim",
        duration: "40-50 min",
        description: "Steady continuous laps. Focus on technique and breathing rhythm.",
        type: "cardio",
      },
      {
        id: "swim-interval",
        label: "Interval Swim",
        duration: "30 min",
        description: "Alternate hard and easy lengths with rest intervals. Builds lactate threshold.",
        type: "cardio",
      },
    ],
  },
  {
    activityType: "yoga",
    displayName: "Yoga / Pilates",
    emoji: "🧘",
    glp1Note: "Yoga improves flexibility and recovery but won't preserve muscle mass on GLP-1. Strength training 3x/week is critical.",
    postWorkoutProteinG: 15,
    needsComplementaryStrength: true,
    primarySessions: [
      {
        id: "yoga-flow",
        label: "Flow Session",
        duration: "45-60 min",
        description: "Dynamic sequences building strength and mobility through full range of motion.",
        type: "mobility",
      },
      {
        id: "yoga-restorative",
        label: "Restorative Session",
        duration: "30 min",
        description: "Passive holds and deep stretching. Ideal for recovery days.",
        type: "mobility",
      },
    ],
  },
  {
    activityType: "padel",
    displayName: "Padel / Tennis",
    emoji: "🎾",
    glp1Note: "Padel is high-intensity cardio. On GLP-1, add 2 strength sessions/week to prevent muscle loss between matches.",
    postWorkoutProteinG: 28,
    needsComplementaryStrength: true,
    primarySessions: [
      {
        id: "padel-match",
        label: "Match Play",
        duration: "60-90 min",
        description: "Full match. High intensity, explosive movements, excellent calorie burn.",
        type: "sport",
      },
      {
        id: "padel-conditioning",
        label: "Agility & Conditioning",
        duration: "30 min",
        description: "Lateral drills, footwork, and court movement patterns. Builds sport-specific fitness.",
        type: "sport",
      },
    ],
  },
  {
    activityType: "hiit",
    displayName: "HIIT / Hyrox",
    emoji: "🔥",
    glp1Note: "HIIT already includes resistance components. Focus on adequate protein and 1 dedicated strength session/week.",
    postWorkoutProteinG: 30,
    needsComplementaryStrength: false,
    primarySessions: [
      {
        id: "hiit-session",
        label: "HIIT / Hyrox Session",
        duration: "30-45 min",
        description: "Full effort. Combines cardio and resistance. Maximizes calorie burn and muscle stimulus.",
        type: "cardio",
      },
      {
        id: "hiit-recovery",
        label: "Active Recovery",
        duration: "20 min",
        description: "Light mobility work. Essential after intense HIIT to maintain training quality.",
        type: "mobility",
      },
    ],
  },
  {
    activityType: "walking",
    displayName: "Walking",
    emoji: "🚶",
    glp1Note: "Walking alone cannot prevent muscle loss on GLP-1. Strength training 3x/week is the most important thing you can do.",
    postWorkoutProteinG: 15,
    needsComplementaryStrength: true,
    primarySessions: [
      {
        id: "walk-daily",
        label: "Daily Walk",
        duration: "30-45 min",
        description: "Brisk pace — fast enough to elevate heart rate. Aim for 7,000-10,000 steps.",
        type: "cardio",
      },
    ],
  },
];

export const COMPLEMENTARY_STRENGTH_SESSIONS: WorkoutSession[] = [
  {
    id: "comp-A",
    label: "Muscle Preservation A — Upper Body",
    duration: "20 min",
    description: "Essential resistance work to prevent muscle loss on GLP-1.",
    type: "strength",
    exercises: [
      { name: "Push-ups", sets: 3, reps: "10-12", why: "Chest & triceps activation" },
      { name: "Dumbbell rows", sets: 3, reps: "10 each", why: "Back & biceps" },
      { name: "Shoulder press", sets: 3, reps: "10", why: "Shoulder preservation" },
      { name: "Bicep curls", sets: 2, reps: "12", why: "Direct arm stimulus" },
    ],
  },
  {
    id: "comp-B",
    label: "Muscle Preservation B — Lower Body",
    duration: "20 min",
    description: "Lower body strength holds 60% of your muscle mass.",
    type: "strength",
    exercises: [
      { name: "Goblet squat", sets: 3, reps: "12", why: "Quad & glute compound" },
      { name: "Hip hinge (RDL)", sets: 3, reps: "10", why: "Hamstrings & posterior chain" },
      { name: "Step-ups", sets: 2, reps: "10 each", why: "Single-leg stability" },
      { name: "Calf raises", sets: 3, reps: "15", why: "Lower leg retention" },
    ],
  },
];

export function getProtocol(activityType: string): ActivityProtocol {
  return PROTOCOLS.find((p) => p.activityType === activityType) ?? PROTOCOLS[0];
}
