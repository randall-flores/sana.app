import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeOverview } from "@/lib/journalStats";
import { labelFor } from "@/components/journal/BodyPainMap";

// AI recovery summary. Server-only: the Anthropic key never reaches the browser,
// so every generate/regenerate POSTs here. Result is cached in case_summaries so
// we don't call the model on every dashboard view.

export const runtime = "nodejs";

const MIN_ENTRIES = 3;
const MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

type Lang = "en" | "es";

type JournalRow = {
  created_at: string;
  pain_level: number;
  notes: string | null;
  pain_locations: string[] | null;
  mood: string[] | null;
};

const SYSTEM_PROMPT = `You are a calm, warm companion inside Sana, an app that helps people
recovering from a personal injury. You are writing a short summary of
this person's recovery, speaking directly to them ("you"), based ONLY
on the journal data provided below.

Rules you must never break:
- Summarize only what is in the data. Never infer, diagnose, or
  speculate about their health.
- Never give medical advice. Never give legal advice. Do not suggest
  what they "should" do.
- When you reference something they wrote in a note, use their own
  words — do not rewrite, reinterpret, or paraphrase their description
  of their symptoms. Their notes are a record.
- Write directly and naturally in {LANGUAGE}. Do not translate from
  English — write as a native speaker of that language would.
- Keep a calm, reassuring, plain tone. Not clinical, not dramatic, not
  a medical chart.
- If the data shows pain increasing or recovery stalling, state it
  gently and factually, without alarm and without advice. Acknowledge
  the difficulty with warmth.
- Be concise: a few short paragraphs. This is a glance, not a report.

Here is their recovery data: {STRUCTURED_DATA}`;

// MOOD labels for the structured input (kept inline — small, stable enum).
const MOOD_LABELS: Record<string, { en: string; es: string }> = {
  okay: { en: "Okay", es: "Bien" },
  anxious: { en: "Anxious", es: "Ansioso/a" },
  frustrated: { en: "Frustrated", es: "Frustrado/a" },
  down: { en: "Down", es: "Decaído/a" },
  exhausted: { en: "Exhausted", es: "Agotado/a" },
};

// Build STRUCTURED input — not raw rows. Overview stats + a compact per-entry
// list (date, pain, locations, mood, note verbatim) + a one-line doc context
// (count + types only, never contents).
function buildStructuredData(
  entries: JournalRow[],
  lang: Lang,
  docContext: string,
): string {
  const o = computeOverview(entries, new Date());
  const fmt = new Intl.DateTimeFormat(lang, { dateStyle: "medium" });

  const oldest = entries.length
    ? fmt.format(new Date(entries[entries.length - 1]!.created_at))
    : "";
  const newest = entries.length ? fmt.format(new Date(entries[0]!.created_at)) : "";

  const lines = entries.map((e) => {
    const date = fmt.format(new Date(e.created_at));
    const locs = (e.pain_locations ?? []).map((l) => labelFor(l, lang)).join(", ") || "—";
    const moods = (e.mood ?? []).map((m) => MOOD_LABELS[m]?.[lang] ?? m).join(", ") || "—";
    const note = e.notes?.trim() ? e.notes.trim() : "—";
    // Note is VERBATIM — never paraphrased.
    return `- ${date} | pain ${e.pain_level}/10 | areas: ${locs} | mood: ${moods} | note: "${note}"`;
  });

  return JSON.stringify(
    {
      overview: {
        entry_count: o.count,
        average_pain: Number(o.avg.toFixed(1)),
        trend: o.direction, // easing | steady | worsening
        date_range: { from: oldest, to: newest },
      },
      documents: docContext,
      entries_oldest_to_newest: [...lines].reverse(),
    },
    null,
    2,
  );
}

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Resolve the user's case (mirrors Journal/Documents).
    const { data: caseRow } = await supabase
      .from("cases")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!caseRow) {
      return NextResponse.json({ error: "no_case" }, { status: 422 });
    }

    const { data: entryData, error: entryError } = await supabase
      .from("journal_entries")
      .select("created_at, pain_level, notes, pain_locations, mood")
      .eq("case_id", caseRow.id)
      .order("created_at", { ascending: false });
    if (entryError) {
      return NextResponse.json({ error: "generic" }, { status: 500 });
    }
    const entries = (entryData as JournalRow[] | null) ?? [];

    // GATE: fewer than 3 entries → no API call.
    if (entries.length < MIN_ENTRIES) {
      return NextResponse.json({ error: "not_enough_entries" }, { status: 422 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user.id)
      .maybeSingle();
    const lang: Lang = profile?.preferred_language === "es" ? "es" : "en";
    const languageName = lang === "es" ? "Spanish" : "English";

    // Document context — COUNT + types only, never contents.
    const { data: docRows } = await supabase
      .from("documents")
      .select("mime_type")
      .eq("case_id", caseRow.id);
    const docs = (docRows as { mime_type: string }[] | null) ?? [];
    const pdfCount = docs.filter((d) => d.mime_type === "application/pdf").length;
    const imgCount = docs.length - pdfCount;
    const docContext =
      docs.length === 0
        ? "No documents uploaded."
        : `${docs.length} document(s) on file (${imgCount} photo(s), ${pdfCount} PDF(s)). Contents not provided.`;

    const structured = buildStructuredData(entries, lang, docContext);
    const system = SYSTEM_PROMPT.replace("{LANGUAGE}", languageName).replace(
      "{STRUCTURED_DATA}",
      structured,
    );

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "generic" }, { status: 500 });
    }

    // Direct fetch — no SDK. Haiku 4.5: no thinking/effort params (they 400).
    const aiRes = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages: [
          {
            role: "user",
            content: "Write my recovery summary based on the data in your instructions.",
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      // Never leak the key or raw API error to the client.
      return NextResponse.json({ error: "ai_failed" }, { status: 502 });
    }

    const aiJson = (await aiRes.json()) as {
      content?: { type: string; text?: string }[];
    };
    const summaryText =
      aiJson.content
        ?.filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("")
        .trim() ?? "";
    if (!summaryText) {
      return NextResponse.json({ error: "ai_failed" }, { status: 502 });
    }

    // UPSERT — case_id is the PK, so regenerate overwrites.
    const { data: saved, error: upsertError } = await supabase
      .from("case_summaries")
      .upsert(
        {
          case_id: caseRow.id,
          summary_text: summaryText,
          language: lang,
          entry_count_at_generation: entries.length,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "case_id" },
      )
      .select()
      .single();
    if (upsertError || !saved) {
      return NextResponse.json({ error: "save_failed" }, { status: 500 });
    }

    return NextResponse.json({ summary: saved });
  } catch {
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
