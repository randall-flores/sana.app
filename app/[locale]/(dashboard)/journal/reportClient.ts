import { createTranslator } from "next-intl";
import enMessages from "@/messages/en.json";
import esMessages from "@/messages/es.json";
import { labelFor, REGION_LABELS } from "@/components/journal/BodyPainMap";
import type { ReportResult, ReportRow } from "./report-actions";
import type { ReportData, ReportEntryVM } from "./ReportPdf";

type OkResult = Extract<ReportResult, { ok: true }>;

// Loose translator signature: createTranslator infers strict literal keys from the
// imported JSON, which rejects dynamic keys like `locations.${value}`.
type Translate = (key: string, values?: Record<string, string | number>) => string;

const fmtDot = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}.${d.getFullYear()}`;

// Strip characters that are illegal in filenames on common filesystems.
const sanitizeName = (name: string) => name.replace(/[/\\:*?"<>|]/g, "").trim();

export function buildFilename(fromDate: Date, toDate: Date, fullName: string): string {
  const name = sanitizeName(fullName);
  if (!name) return "Sana Recovery Journal.pdf";
  const from = fmtDot(fromDate);
  const to = fmtDot(toDate);
  const datePart = from === to ? from : `${from}-${to}`;
  return `${datePart} - Sana Recovery Journal - ${name}.pdf`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Build the fully-resolved PDF view model in the user's preferred language.
// createTranslator works outside React context, so labels are independent of the
// current UI locale (a doctor reading an ES report gets ES labels even if the app is EN).
export function buildReportData(res: OkResult): ReportData {
  const lang = res.language;
  const messages = lang === "es" ? esMessages : enMessages;
  const tr = createTranslator({ locale: lang, messages, namespace: "report" }) as unknown as Translate;
  const tj = createTranslator({ locale: lang, messages, namespace: "journal" }) as unknown as Translate;

  const dateFmt = new Intl.DateTimeFormat(lang, { year: "numeric", month: "long", day: "numeric" });
  const dayFmt = new Intl.DateTimeFormat(lang, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat(lang, { hour: "numeric", minute: "2-digit" });

  const entries = res.entries;
  const first = new Date(entries[0]!.created_at);
  const last = new Date(entries[entries.length - 1]!.created_at);

  const count = entries.length;
  const avg = entries.reduce((s, e) => s + e.pain_level, 0) / count;
  const max = Math.max(...entries.map((e) => e.pain_level));
  const summary = [
    tr("summaryCount", { count }),
    tr("summaryAvg", { avg: avg.toFixed(1) }),
    tr("summaryHigh", { max }),
  ].join("    ·    ");

  const entryVM = (e: ReportRow): ReportEntryVM => {
    const vm: ReportEntryVM = {
      time: timeFmt.format(new Date(e.created_at)),
      painLabel: tj("painLabel"),
      painLevel: e.pain_level,
    };
    if (e.pain_locations && e.pain_locations.length > 0) {
      vm.locationKeys = e.pain_locations;
      vm.locations = {
        label: tj("locationsLabel"),
        // Hybrid: body-map region keys → labelFor; legacy chip keys → messages JSON.
        value: e.pain_locations
          .map((l) => (l in REGION_LABELS ? labelFor(l, lang) : tj(`locations.${l}`)))
          .join(", "),
      };
    }
    if (e.pain_quality && e.pain_quality.length > 0) {
      vm.quality = {
        label: tj("detail.quality"),
        value: e.pain_quality.map((q) => tj(`quality.${q}`)).join(", "),
      };
    }
    if (e.notes && e.notes.trim()) vm.notes = { label: tj("notesLabel"), value: e.notes };
    if (e.daily_impact && e.daily_impact.trim())
      vm.impact = { label: tj("detail.impact"), value: e.daily_impact };
    if (e.mood && e.mood.length > 0)
      vm.mood = {
        label: tj("detail.mood"),
        value: e.mood.map((m) => tj(`mood.${m}`)).join(", "),
      };
    if (e.medications && e.medications.trim())
      vm.meds = { label: tj("detail.medications"), value: e.medications };
    return vm;
  };

  // Group by calendar day (entries already chronological).
  const groups: ReportData["groups"] = [];
  let currentKey = "";
  for (const e of entries) {
    const d = new Date(e.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (key !== currentKey) {
      groups.push({ heading: dayFmt.format(d), entries: [] });
      currentKey = key;
    }
    groups[groups.length - 1]!.entries.push(entryVM(e));
  }

  return {
    title: tr("reportTitle"),
    fullName: res.fullName,
    rangeLabel: `${dateFmt.format(first)} – ${dateFmt.format(last)}`,
    generatedLabel: tr("generatedOn", { date: dateFmt.format(new Date()) }),
    summary,
    footer: tr("footer"),
    pageLabel: (messages.report as Record<string, string>).pageNumber ?? "Page {n} of {total}",
    groups,
  };
}

// Builds the PDF (lazy-loading react-pdf so it never enters the SSR bundle) and
// triggers the download. useGeneratedDate=true names the file by today's date
// (for "all entries" and cherry-picked sets); otherwise by the entries' span.
export async function generateAndDownload(res: OkResult, opts: { useGeneratedDate: boolean }) {
  const data = buildReportData(res);
  const { buildReportBlob } = await import("./ReportPdf");
  const blob = await buildReportBlob(data);

  let fromDate: Date;
  let toDate: Date;
  if (opts.useGeneratedDate || res.entries.length === 0) {
    fromDate = toDate = new Date();
  } else {
    fromDate = new Date(res.entries[0]!.created_at);
    toDate = new Date(res.entries[res.entries.length - 1]!.created_at);
  }
  downloadBlob(blob, buildFilename(fromDate, toDate, res.fullName));
}
