"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { NEUTRAL_FRONT } from "./BodyPainPaths";

// ── Plain-language region labels, EN + ES ────────────────────────────
// Feeds tooltips, List View, the selected summary, and the PDF report.
export const REGION_LABELS: Record<string, { en: string; es: string }> = {
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
        selected: "Selected areas", none: "None selected" },
  es: { listView: "Vista de lista", mapView: "Mapa del cuerpo",
        hint: "Toca donde te duele. Puedes elegir más de una.",
        selected: "Zonas seleccionadas", none: "Ninguna seleccionada" },
};

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
          <div className="bg-white rounded-2xl p-2 mx-auto max-w-[280px] shadow-sm">
            <svg viewBox="0 0 120 340" className="w-full h-auto" role="group" aria-label="Body map">
              {NEUTRAL_FRONT.map((r) => {
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
                    onClick={() => onToggleLocation(r.location)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onToggleLocation(r.location);
                      }
                    }}
                    className={cn("body-part", selected && "selected")}
                  />
                );
              })}
            </svg>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {NEUTRAL_FRONT.map((r) => {
            const selected = isSel(r.location);
            return (
              <button
                key={r.location}
                type="button"
                aria-pressed={selected}
                onClick={() => onToggleLocation(r.location)}
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
