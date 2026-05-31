// Plain-language region labels, EN + ES. Lives in a non-"use client" module so
// it can be imported from BOTH client code (BodyPainMap, JournalList, the PDF
// report) AND server code (the /api/summary route). Importing a function out of
// a "use client" module into a server handler yields a client-reference proxy
// that throws when called — keep this dependency-free and framework-neutral.

export const REGION_LABELS: Record<string, { en: string; es: string }> = {
  // Front view
  head: { en: "Head", es: "Cabeza" },
  neck: { en: "Neck", es: "Cuello" },
  chest: { en: "Chest", es: "Pecho" },
  abdomen: { en: "Abdomen", es: "Abdomen" },
  shoulder_left: { en: "Left shoulder", es: "Hombro izquierdo" },
  shoulder_right: { en: "Right shoulder", es: "Hombro derecho" },
  arm_upper_left: { en: "Left upper arm", es: "Brazo superior izquierdo" },
  arm_upper_right: { en: "Right upper arm", es: "Brazo superior derecho" },
  arm_lower_left: { en: "Left forearm", es: "Antebrazo izquierdo" },
  arm_lower_right: { en: "Right forearm", es: "Antebrazo derecho" },
  hand_left: { en: "Left hand", es: "Mano izquierda" },
  hand_right: { en: "Right hand", es: "Mano derecha" },
  hip_left: { en: "Left hip", es: "Cadera izquierda" },
  hip_right: { en: "Right hip", es: "Cadera derecha" },
  thigh_left: { en: "Left thigh", es: "Muslo izquierdo" },
  thigh_right: { en: "Right thigh", es: "Muslo derecho" },
  knee_left: { en: "Left knee", es: "Rodilla izquierda" },
  knee_right: { en: "Right knee", es: "Rodilla derecha" },
  calf_left: { en: "Left calf", es: "Pantorrilla izquierda" },
  calf_right: { en: "Right calf", es: "Pantorrilla derecha" },
  foot_left: { en: "Left foot", es: "Pie izquierdo" },
  foot_right: { en: "Right foot", es: "Pie derecho" },
  // Back view (NEUTRAL_BACK). Left/right = the client's own anatomical side.
  head_back: { en: "Back of head", es: "Parte posterior de la cabeza" },
  neck_back: { en: "Back of neck", es: "Nuca" },
  shoulder_back_left: { en: "Left shoulder (back)", es: "Hombro posterior izquierdo" },
  shoulder_back_right: { en: "Right shoulder (back)", es: "Hombro posterior derecho" },
  upper_back_left: { en: "Left upper back", es: "Espalda alta izquierda" },
  upper_back_right: { en: "Right upper back", es: "Espalda alta derecha" },
  mid_back: { en: "Mid back", es: "Espalda media" },
  lower_back_left: { en: "Left lower back", es: "Espalda baja izquierda" },
  lower_back_right: { en: "Right lower back", es: "Espalda baja derecha" },
  glute_left: { en: "Left glute", es: "Glúteo izquierdo" },
  glute_right: { en: "Right glute", es: "Glúteo derecho" },
  thigh_back_left: { en: "Left thigh (back)", es: "Muslo posterior izquierdo" },
  thigh_back_right: { en: "Right thigh (back)", es: "Muslo posterior derecho" },
  knee_back_left: { en: "Left knee (back)", es: "Rodilla posterior izquierda" },
  knee_back_right: { en: "Right knee (back)", es: "Rodilla posterior derecha" },
  calf_back_left: { en: "Left calf (back)", es: "Pantorrilla posterior izquierda" },
  calf_back_right: { en: "Right calf (back)", es: "Pantorrilla posterior derecha" },
  heel_left: { en: "Left heel", es: "Talón izquierdo" },
  heel_right: { en: "Right heel", es: "Talón derecho" },
  arm_upper_back_left: { en: "Left upper arm (back)", es: "Brazo superior posterior izquierdo" },
  arm_upper_back_right: { en: "Right upper arm (back)", es: "Brazo superior posterior derecho" },
  elbow_left: { en: "Left elbow", es: "Codo izquierdo" },
  elbow_right: { en: "Right elbow", es: "Codo derecho" },
  arm_lower_back_left: { en: "Left forearm (back)", es: "Antebrazo posterior izquierdo" },
  arm_lower_back_right: { en: "Right forearm (back)", es: "Antebrazo posterior derecho" },
  hand_back_left: { en: "Back of left hand", es: "Dorso de la mano izquierda" },
  hand_back_right: { en: "Back of right hand", es: "Dorso de la mano derecha" },
  // Legacy keys from the old chip selector — keep historical entries readable.
  upper_back: { en: "Upper back", es: "Espalda alta" },
  lower_back: { en: "Lower back", es: "Espalda baja" },
  shoulder: { en: "Shoulder", es: "Hombro" },
  arm: { en: "Arm", es: "Brazo" },
  hand_wrist: { en: "Hand / wrist", es: "Mano/muñeca" },
  hip: { en: "Hip", es: "Cadera" },
  leg: { en: "Leg", es: "Pierna" },
  knee: { en: "Knee", es: "Rodilla" },
  foot_ankle: { en: "Foot / ankle", es: "Pie/tobillo" },
};

export function labelFor(location: string, lang: "en" | "es"): string {
  return REGION_LABELS[location]?.[lang] ?? location;
}
