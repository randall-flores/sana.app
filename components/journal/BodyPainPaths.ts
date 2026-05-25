// Neutral body region paths (v3 connected). 120x340 viewBox.
// Front view only for now. Left/right separate for injury precision.
// Add back view + male/female later by extending this structure.

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