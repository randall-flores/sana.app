// Neutral body region paths (v3 connected). 120x340 viewBox.
// Front (NEUTRAL_FRONT, 22) + back (NEUTRAL_BACK, 27). Left/right separate for
// injury precision. Add male/female variants later by extending this structure.

export interface Region { location: string; d: string; }

export const NEUTRAL_FRONT: Region[] = [
  { location: "head", d: "M60 10 C50 10 43 18 43 29 C43 39 49 47 55 49 C57 50 63 50 65 49 C71 47 77 39 77 29 C77 18 70 10 60 10 Z" },
  { location: "neck", d: "M55 49 C55 53 54 57 53 60 C56 61 64 61 67 60 C66 57 65 53 65 49 C63 50 57 50 55 49 Z" },
  { location: "shoulder_left", d: "M53 60 C46 60 39 63 34 70 C32 73 31 76 31 79 C34 78 38 76 41 75 C44 71 47 67 50 64 C51 62 52 61 53 60 Z" },
  { location: "shoulder_right", d: "M67 60 C74 60 81 63 86 70 C88 73 89 76 89 79 C86 78 82 76 79 75 C76 71 73 67 70 64 C69 62 68 61 67 60 Z" },
  { location: "chest", d: "M53 60 C52 61 51 62 50 64 C46 67 44 72 43 78 C42 88 43 98 45 108 C49 109 71 109 75 108 C77 98 78 88 77 78 C76 72 74 67 70 64 C69 62 68 61 67 60 C64 61 56 61 53 60 Z" },
  { location: "abdomen", d: "M45 111 C44 122 44 134 46 148 C50 150 70 150 74 148 C76 134 76 122 75 111 C71 112 49 112 45 111 Z" },
  { location: "arm_upper_left", d: "M31 79 C29 90 28 102 28 113 C31 114 35 114 38 112 C39 101 40 90 43 78 C40 76 36 76 33 76 C32 77 31 78 31 79 Z" },
  { location: "arm_upper_right", d: "M89 79 C91 90 92 102 92 113 C89 114 85 114 82 112 C81 101 80 90 77 78 C80 76 84 76 87 76 C88 77 89 78 89 79 Z" },
  { location: "arm_lower_left", d: "M28 116 C27 128 27 141 28 153 C31 154 35 154 38 152 C38 141 38 128 38 115 C35 117 31 117 28 116 Z" },
  { location: "arm_lower_right", d: "M92 116 C93 128 93 141 92 153 C89 154 85 154 82 152 C82 141 82 128 82 115 C85 117 89 117 92 116 Z" },
  { location: "hand_left", d: "M28 156 C27 165 27 174 29 182 C32 183 36 182 38 180 C38 172 38 164 38 155 C35 157 31 157 28 156 Z" },
  { location: "hand_right", d: "M92 156 C93 165 93 174 91 182 C88 183 84 182 82 180 C82 172 82 164 82 155 C85 157 89 157 92 156 Z" },
  { location: "hip_left", d: "M46 151 C44 159 43 169 43 179 C48 182 54 183 59 182 C59 172 59 161 60 151 C55 152 49 152 46 151 Z" },
  { location: "hip_right", d: "M74 151 C76 159 77 169 77 179 C72 182 66 183 61 182 C61 172 61 161 60 151 C65 152 71 152 74 151 Z" },
  { location: "thigh_left", d: "M43 182 C42 200 43 220 46 240 C50 242 55 242 59 240 C59 221 59 201 59 183 C54 184 47 184 43 182 Z" },
  { location: "thigh_right", d: "M77 182 C78 200 77 220 74 240 C70 242 65 242 61 240 C61 221 61 201 61 183 C66 184 73 184 77 182 Z" },
  { location: "knee_left", d: "M46 243 C45 249 45 255 47 260 C51 261 55 261 59 260 C59 254 59 249 59 243 C55 244 49 244 46 243 Z" },
  { location: "knee_right", d: "M74 243 C75 249 75 255 73 260 C69 261 65 261 61 260 C61 254 61 249 61 243 C65 244 71 244 74 243 Z" },
  { location: "calf_left", d: "M47 263 C45 279 46 297 49 312 C52 313 55 313 58 312 C59 297 59 279 59 263 C55 264 50 264 47 263 Z" },
  { location: "calf_right", d: "M73 263 C75 279 74 297 71 312 C68 313 65 313 62 312 C61 297 61 279 61 263 C65 264 70 264 73 263 Z" },
  { location: "foot_left", d: "M49 315 C48 320 48 325 49 329 C45 331 39 331 35 328 C34 324 35 321 39 318 C42 316 46 315 49 315 Z" },
  { location: "foot_right", d: "M71 315 C72 320 72 325 71 329 C75 331 81 331 85 328 C86 324 85 321 81 318 C78 316 74 315 71 315 Z" },
];

// Posterior (back) view. Same Region shape, same 0 0 120 340 viewBox, spine at x=60.
// MIRRORED from the front: client-LEFT regions (_left) are drawn on the VIEWER'S
// RIGHT (x>60); client-RIGHT (_right) on the VIEWER'S LEFT (x<60). Matches the
// front's _left/_right convention as a proper anterior/posterior pair.
// Regions stacked in non-overlapping y-bands with touching seams (no shared area).
export const NEUTRAL_BACK: Region[] = [
  { location: "head_back", d: "M60 10 C50 10 43 18 43 29 C43 39 49 47 55 49 C57 50 63 50 65 49 C71 47 77 39 77 29 C77 18 70 10 60 10 Z" },
  { location: "neck_back", d: "M55 49 C55 53 54 57 53 60 C56 61 64 61 67 60 C66 57 65 53 65 49 C63 50 57 50 55 49 Z" },
  // Posterior shoulders / upper-trap caps (own region; seated above upper_back).
  { location: "shoulder_back_left", d: "M67 60 C74 61 82 65 89 74 C85 73 81 72 77 72 C73 67 70 63 67 60 Z" },
  { location: "shoulder_back_right", d: "M53 60 C46 61 38 65 31 74 C35 73 39 72 43 72 C47 67 50 63 53 60 Z" },
  // Upper back — trimmed at the top-outer corner so shoulders seat without overlap.
  { location: "upper_back_left", d: "M60 60 L67 60 C70 63 73 67 77 72 C77 85 77 98 77 111 L60 111 Z" },
  { location: "upper_back_right", d: "M60 60 L53 60 C50 63 47 67 43 72 C43 85 43 98 43 111 L60 111 Z" },
  { location: "mid_back", d: "M45 111 L75 111 C76 119 76 126 75 133 L45 133 C44 126 44 119 45 111 Z" },
  { location: "lower_back_left", d: "M60 133 L75 133 C75 140 74 146 73 151 L60 151 Z" },
  { location: "lower_back_right", d: "M60 133 L45 133 C45 140 46 146 47 151 L60 151 Z" },
  { location: "glute_left", d: "M60 151 L74 151 C77 159 78 170 77 181 C74 185 66 186 60 185 Z" },
  { location: "glute_right", d: "M60 151 L46 151 C43 159 42 170 43 181 C46 185 54 186 60 185 Z" },
  { location: "thigh_back_left", d: "M61 186 L77 185 C78 205 77 230 75 256 L61 256 Z" },
  { location: "thigh_back_right", d: "M59 186 L43 185 C42 205 43 230 45 256 L59 256 Z" },
  { location: "knee_back_left", d: "M61 256 L75 256 C75 259 74 261 73 263 L61 263 Z" },
  { location: "knee_back_right", d: "M59 256 L45 256 C45 259 46 261 47 263 L59 263 Z" },
  { location: "calf_back_left", d: "M61 263 L73 263 C75 279 74 297 71 312 C68 313 64 313 61 312 Z" },
  { location: "calf_back_right", d: "M59 263 L47 263 C45 279 46 297 49 312 C52 313 56 313 59 312 Z" },
  { location: "heel_left", d: "M61 315 L71 315 C72 320 73 326 72 330 C69 332 64 332 61 330 Z" },
  { location: "heel_right", d: "M59 315 L49 315 C48 320 47 326 48 330 C51 332 56 332 59 330 Z" },
  // Back arms — three segments per side (elbow is its own landmark from behind),
  // each its own y-band with flat touching seams: upper 74–110, elbow 110–122,
  // forearm 122–154, hand 156–183. Inner edge meets torso at x77 / x43 (no overlap).
  { location: "arm_upper_back_left", d: "M77 74 C83 74 89 75 92 77 L92 110 L82 110 C80 98 79 86 77 74 Z" },
  { location: "arm_upper_back_right", d: "M43 74 C37 74 31 75 28 77 L28 110 L38 110 C40 98 41 86 43 74 Z" },
  { location: "elbow_left", d: "M82 110 L92 110 L92 122 L82 122 C82 118 82 114 82 110 Z" },
  { location: "elbow_right", d: "M38 110 L28 110 L28 122 L38 122 C38 118 38 114 38 110 Z" },
  { location: "arm_lower_back_left", d: "M82 122 L92 122 L91 154 L83 154 C82 144 82 133 82 122 Z" },
  { location: "arm_lower_back_right", d: "M38 122 L28 122 L29 154 L37 154 C38 144 38 133 38 122 Z" },
  { location: "hand_back_left", d: "M83 156 C82 164 82 172 83 181 C85 183 89 183 91 181 C92 172 92 164 91 156 C89 157 85 157 83 156 Z" },
  { location: "hand_back_right", d: "M37 156 C38 164 38 172 37 181 C35 183 31 183 29 181 C28 172 28 164 29 156 C31 157 35 157 37 156 Z" },
];