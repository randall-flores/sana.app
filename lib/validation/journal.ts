import { z } from "zod";

// Body-map region keys (neutral figure, front view) — see
// components/journal/BodyPainPaths.ts. Left/right split for injury precision.
const BODY_MAP_LOCATIONS = [
  "head",
  "neck",
  "chest",
  "abdomen",
  "shoulder_left",
  "shoulder_right",
  "arm_upper_left",
  "arm_upper_right",
  "arm_lower_left",
  "arm_lower_right",
  "hand_left",
  "hand_right",
  "hip_left",
  "hip_right",
  "thigh_left",
  "thigh_right",
  "knee_left",
  "knee_right",
  "calf_left",
  "calf_right",
  "foot_left",
  "foot_right",
] as const;

// Body-map region keys (neutral figure, BACK view) — see NEUTRAL_BACK in
// components/journal/BodyPainPaths.ts. Distinct keys from the front (and from the
// legacy bare upper_back/lower_back below). Left/right = the client's own side.
const BACK_MAP_LOCATIONS = [
  "head_back",
  "neck_back",
  "shoulder_back_left",
  "shoulder_back_right",
  "upper_back_left",
  "upper_back_right",
  "mid_back",
  "lower_back_left",
  "lower_back_right",
  "glute_left",
  "glute_right",
  "thigh_back_left",
  "thigh_back_right",
  "knee_back_left",
  "knee_back_right",
  "calf_back_left",
  "calf_back_right",
  "heel_left",
  "heel_right",
  "arm_upper_back_left",
  "arm_upper_back_right",
  "elbow_left",
  "elbow_right",
  "arm_lower_back_left",
  "arm_lower_back_right",
  "hand_back_left",
  "hand_back_right",
] as const;

// Legacy keys from the old chip selector. Kept so historical journal_entries
// stay valid and renderable (head/neck/chest already covered above).
const LEGACY_LOCATIONS = [
  "upper_back",
  "lower_back",
  "shoulder",
  "arm",
  "hand_wrist",
  "hip",
  "leg",
  "knee",
  "foot_ankle",
] as const;

export const PAIN_LOCATIONS = [
  ...BODY_MAP_LOCATIONS,
  ...BACK_MAP_LOCATIONS,
  ...LEGACY_LOCATIONS,
] as const;

export const PAIN_QUALITIES = [
  "sharp",
  "dull",
  "burning",
  "throbbing",
  "stiff",
  "numb_tingling",
] as const;

export const MOODS = ["okay", "anxious", "frustrated", "down", "exhausted"] as const;

export type PainLocation = (typeof PAIN_LOCATIONS)[number];
export type PainQuality = (typeof PAIN_QUALITIES)[number];
export type Mood = (typeof MOODS)[number];

export const journalEntrySchema = z.object({
  painLevel: z.number().int().min(1).max(10),
  notes: z.string().max(2000).optional(),
  painLocations: z.array(z.enum(PAIN_LOCATIONS)).optional(),
  painQuality: z.array(z.enum(PAIN_QUALITIES)).optional(),
  dailyImpact: z.string().max(1000).optional(),
  mood: z.array(z.enum(MOODS)).optional(),
  medications: z.string().max(500).optional(),
});

export type JournalEntryInput = z.infer<typeof journalEntrySchema>;
