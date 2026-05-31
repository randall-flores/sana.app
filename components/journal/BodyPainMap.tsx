"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { NEUTRAL_FRONT, NEUTRAL_BACK, type Region } from "./BodyPainPaths";
// Labels live in a plain module so server code (the summary route) can import
// labelFor without the "use client" boundary turning it into a client proxy.
// Re-exported here so existing client importers (JournalList, reportClient)
// keep their import path unchanged.
import { REGION_LABELS, labelFor } from "@/lib/regionLabels";

export { REGION_LABELS, labelFor };

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
