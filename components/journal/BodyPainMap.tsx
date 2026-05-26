"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { NEUTRAL_FRONT, NEUTRAL_BACK, type Region } from "./BodyPainPaths";

// ── Plain-language region labels, EN + ES ────────────────────────────
// Feeds tooltips, List View, the selected summary, and the PDF report.
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

interface BodyPainMapProps {
  /** Selected region locations (controlled by the journal form). */
  selectedLocations: string[];
  /** Toggle a region on/off. */
  onToggleLocation: (location: string) => void;
  /** UI language. */
  lang: "en" | "es";
}

const T = {
  en: { listView: "List view", mapView: "Body map",
        hint: "Tap where it hurts. You can select more than one.",
        selected: "Selected areas", none: "None selected",
        front: "Front", back: "Back" },
  es: { listView: "Vista de lista", mapView: "Mapa del cuerpo",
        hint: "Toca donde te duele. Puedes elegir más de una.",
        selected: "Zonas seleccionadas", none: "Ninguna seleccionada",
        front: "Frente", back: "Espalda" },
};

// One interactive figure (front or back). `mirrored` places the client-LEFT "L"
// marker on the viewer's right, matching the back view's anatomy.
function Figure({
  caption,
  regions,
  mirrored,
  isSel,
  onToggle,
  lang,
}: {
  caption: string;
  regions: Region[];
  mirrored: boolean;
  isSel: (loc: string) => boolean;
  onToggle: (loc: string) => void;
  lang: "en" | "es";
}) {
  const lx = mirrored ? 106 : 14; // client-left marker x
  const rx = mirrored ? 14 : 106; // client-right marker x
  return (
    <div className="flex-1 min-w-0">
      <p className="text-center text-xs font-medium text-muted-foreground mb-1">{caption}</p>
      <svg
        viewBox="0 0 120 340"
        className="w-full h-auto"
        role="group"
        aria-label={caption}
      >
        <text x={lx} y={20} textAnchor="middle" className="body-map-marker">L</text>
        <text x={rx} y={20} textAnchor="middle" className="body-map-marker">R</text>
        {regions.map((r) => {
          const selected = isSel(r.location);
          return (
            <path
              key={r.location}
              d={r.d}
              data-location={r.location}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={labelFor(r.location, lang)}
              onClick={() => onToggle(r.location)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggle(r.location);
                }
              }}
              className={cn("body-part", selected && "selected")}
            />
          );
        })}
      </svg>
    </div>
  );
}

function ListSection({
  caption,
  regions,
  isSel,
  onToggle,
  lang,
}: {
  caption: string;
  regions: Region[];
  isSel: (loc: string) => boolean;
  onToggle: (loc: string) => void;
  lang: "en" | "es";
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {caption}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {regions.map((r) => {
          const selected = isSel(r.location);
          return (
            <button
              key={r.location}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(r.location)}
              className={cn(
                "min-h-[48px] px-3 rounded-xl text-base text-left transition ring-1",
                selected
                  ? "bg-[hsl(151,21%,33%)] text-white ring-[hsl(151,21%,33%)]"
                  : "bg-white text-foreground ring-[hsl(151,15%,80%)]"
              )}
            >
              {labelFor(r.location, lang)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BodyPainMap({ selectedLocations, onToggleLocation, lang }: BodyPainMapProps) {
  const [useList, setUseList] = useState(false);
  const t = T[lang];
  const isSel = (loc: string) => selectedLocations.includes(loc);

  return (
    <div className="w-full">
      {/* Map vs List toggle */}
      <div className="flex items-center justify-end mb-3">
        <button
          type="button"
          onClick={() => setUseList((s) => !s)}
          className="min-h-[44px] px-4 rounded-xl text-sm font-medium text-[hsl(151,21%,33%)] underline-offset-2 hover:underline"
        >
          {useList ? t.mapView : t.listView}
        </button>
      </div>

      {!useList ? (
        <>
          <p className="text-sm text-muted-foreground mb-2">{t.hint}</p>
          <div className="bg-white rounded-2xl p-3 mx-auto max-w-[420px] shadow-sm">
            <div className="flex justify-center gap-3">
              <Figure
                caption={t.front}
                regions={NEUTRAL_FRONT}
                mirrored={false}
                isSel={isSel}
                onToggle={onToggleLocation}
                lang={lang}
              />
              <Figure
                caption={t.back}
                regions={NEUTRAL_BACK}
                mirrored
                isSel={isSel}
                onToggle={onToggleLocation}
                lang={lang}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <ListSection caption={t.front} regions={NEUTRAL_FRONT} isSel={isSel} onToggle={onToggleLocation} lang={lang} />
          <ListSection caption={t.back} regions={NEUTRAL_BACK} isSel={isSel} onToggle={onToggleLocation} lang={lang} />
        </div>
      )}

      {/* Selected summary — reads in user's language, feeds the PDF */}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          {t.selected}
        </p>
        {selectedLocations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.none}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedLocations.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => onToggleLocation(loc)}
                className="px-3 py-2 rounded-full text-sm font-medium bg-[hsl(151,30%,92%)] text-[hsl(151,21%,33%)]"
                aria-label={`${labelFor(loc, lang)} — remove`}
              >
                {labelFor(loc, lang)} ✕
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
