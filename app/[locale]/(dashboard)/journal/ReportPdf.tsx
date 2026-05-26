"use client";

import {
  Circle,
  Document,
  Font,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { painSeverity } from "@/lib/pain";
import { MIN_TREND_DAYS, type Direction } from "@/lib/journalStats";
import { NEUTRAL_FRONT, NEUTRAL_BACK, type Region } from "@/components/journal/BodyPainPaths";

// Register the app's fonts as static TTFs so accented Spanish (ñ á é í ó ú ü ¿ ¡)
// renders correctly instead of falling back to Helvetica/tofu.
Font.register({
  family: "Inter",
  fonts: [
    { src: "/fonts/Inter-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Inter-SemiBold.ttf", fontWeight: 600 },
  ],
});
Font.register({
  family: "Fraunces",
  fonts: [
    { src: "/fonts/Fraunces-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Fraunces-SemiBold.ttf", fontWeight: 600 },
  ],
});
// Wrap whole words rather than hyphenating — avoids splitting accented words.
Font.registerHyphenationCallback((word) => [word]);

export type ReportField = { label: string; value: string };

export type ReportEntryVM = {
  time: string;
  painLabel: string;
  painLevel: number;
  /** Raw region keys for the figure snapshot (the text labels live in `locations`). */
  locationKeys?: string[];
  locations?: ReportField;
  quality?: ReportField;
  notes?: ReportField;
  impact?: ReportField;
  mood?: ReportField;
  meds?: ReportField;
};

// Mirrors lib/journalStats Overview, flattened + pre-localized for the PDF.
export type ReportOverview = {
  count: number;
  avg: number;
  direction: Direction;
  directionLabel: string;
  dailySeries: (number | null)[]; // 14 daily averages, oldest → newest
  worstIndex: number;
  daysWithData: number;
  labels: { entries: string; avg: string; trend: string; sparse: string };
};

export type ReportData = {
  title: string;
  fullName: string;
  rangeLabel: string;
  generatedLabel: string;
  summary: string;
  footer: string;
  pageLabel: string; // raw template containing {n} and {total}
  overview: ReportOverview;
  groups: Array<{ heading: string; entries: ReportEntryVM[] }>;
};

const INK = "#1F2937";
const MUTED = "#6B7280";
const SAGE = "#436652";
const BORDER = "#E2DDD4";

const painColor = (level: number) => {
  const s = painSeverity(level);
  return s === "low" ? SAGE : s === "mid" ? "#93493B" : "#B3261E";
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    color: INK,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    lineHeight: 1.5,
  },
  title: { fontFamily: "Fraunces", fontWeight: 600, fontSize: 24, color: SAGE },
  name: { fontSize: 12, marginTop: 6, fontWeight: 600 },
  meta: { fontSize: 9, color: MUTED, marginTop: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: BORDER, marginVertical: 16 },
  summary: { fontSize: 10, color: INK, marginBottom: 18 },
  group: { marginBottom: 22 },
  dayHeading: {
    fontFamily: "Fraunces",
    fontWeight: 600,
    fontSize: 12,
    color: INK,
    marginBottom: 8,
  },
  entry: {
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: BORDER,
  },
  entryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#EFEAE1",
    marginVertical: 16,
  },
  entryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  time: { fontSize: 9, color: MUTED },
  pain: { fontSize: 11, fontWeight: 600 },
  field: { marginTop: 4 },
  fieldLabel: { fontSize: 8, color: MUTED, fontWeight: 600, textTransform: "uppercase" },
  fieldValue: { fontSize: 10, color: INK },
  locationRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 4 },
  bodyFigure: { flexDirection: "row", marginRight: 10 },
  bodyFigureFront: { marginRight: 4 },
  locationText: { flex: 1 },
  overview: { marginBottom: 18 },
  overviewStats: { flexDirection: "row", marginBottom: 10 },
  stat: { marginRight: 28 },
  statLabel: { fontSize: 8, color: MUTED, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 },
  statValueRow: { flexDirection: "row", alignItems: "baseline" },
  statValue: { fontSize: 16, fontWeight: 600, color: INK },
  statDir: { fontSize: 9, fontWeight: 600, marginLeft: 6 },
  trendCaption: { fontSize: 8, color: MUTED, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 },
  trendSparse: { fontSize: 9, color: MUTED },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    fontSize: 8,
    color: MUTED,
    textAlign: "center",
  },
});

function Field({ field }: { field: ReportField }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{field.label}</Text>
      <Text style={styles.fieldValue}>{field.value}</Text>
    </View>
  );
}

// Static print snapshot of the body map. Selected regions fill sage; the rest
// render as a faint outline. No interactivity — fill/stroke are Path props
// (react-pdf SVG primitives don't read CSS classes).
function FigureSvg({
  regions,
  on,
  style,
}: {
  regions: Region[];
  on: Set<string>;
  style?: (typeof styles)[keyof typeof styles];
}) {
  return (
    <Svg width={34} height={96} viewBox="0 0 120 340" style={style}>
      {regions.map((r) => {
        const sel = on.has(r.location);
        return (
          <Path
            key={r.location}
            d={r.d}
            fill={SAGE}
            fillOpacity={sel ? 0.28 : 0.05}
            stroke={SAGE}
            strokeOpacity={sel ? 0.9 : 0.45}
            strokeWidth={sel ? 1.8 : 1.4}
          />
        );
      })}
    </Svg>
  );
}

// Front + back snapshot side by side, so back-only selections still show.
function BodyFigure({ selected }: { selected: string[] }) {
  const on = new Set(selected);
  return (
    <View style={styles.bodyFigure}>
      <FigureSvg regions={NEUTRAL_FRONT} on={on} style={styles.bodyFigureFront} />
      <FigureSvg regions={NEUTRAL_BACK} on={on} />
    </View>
  );
}

const dirColor = (d: Direction) => (d === "easing" ? SAGE : d === "worsening" ? "#B3261E" : MUTED);

// 14-day trend, drawn with react-pdf SVG primitives (Path/Circle). Breaks the
// line on no-entry days; isolated days render as a dot; worst day marked.
function TrendChart({ ov }: { ov: ReportOverview }) {
  const W = 240;
  const H = 44;
  const pad = 4;
  const n = ov.dailySeries.length;
  const x = (i: number) => pad + (i / (n - 1)) * (W - 2 * pad);
  const y = (v: number) => H - pad - (v / 10) * (H - 2 * pad);
  const color = painColor(ov.avg);

  const segs: { i: number; v: number }[][] = [];
  let cur: { i: number; v: number }[] = [];
  ov.dailySeries.forEach((v, i) => {
    if (v === null) {
      if (cur.length) segs.push(cur);
      cur = [];
    } else {
      cur.push({ i, v });
    }
  });
  if (cur.length) segs.push(cur);

  const worstV = ov.worstIndex >= 0 ? ov.dailySeries[ov.worstIndex] : null;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {segs.map((seg, si) =>
        seg.length === 1 ? (
          <Circle key={si} cx={x(seg[0]!.i)} cy={y(seg[0]!.v)} r={2} fill={color} />
        ) : (
          <Path
            key={si}
            d={"M " + seg.map((p) => `${x(p.i)} ${y(p.v)}`).join(" L ")}
            stroke={color}
            strokeWidth={1.5}
            fill="none"
          />
        )
      )}
      {ov.worstIndex >= 0 && worstV != null && (
        <Circle cx={x(ov.worstIndex)} cy={y(worstV)} r={3} fill={color} stroke="white" strokeWidth={1} />
      )}
    </Svg>
  );
}

function OverviewBlock({ ov }: { ov: ReportOverview }) {
  const hasTrend = ov.daysWithData >= MIN_TREND_DAYS;
  return (
    <View style={styles.overview}>
      <View style={styles.overviewStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{ov.labels.entries}</Text>
          <Text style={styles.statValue}>{ov.count}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{ov.labels.avg}</Text>
          <View style={styles.statValueRow}>
            <Text style={[styles.statValue, { color: painColor(ov.avg) }]}>{ov.avg.toFixed(1)}</Text>
            <Text style={[styles.statDir, { color: dirColor(ov.direction) }]}>{ov.directionLabel}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.trendCaption}>{ov.labels.trend}</Text>
      {hasTrend ? (
        <TrendChart ov={ov} />
      ) : (
        <Text style={styles.trendSparse}>{ov.labels.sparse}</Text>
      )}
    </View>
  );
}

export function ReportDocument({ data }: { data: ReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.title}>{data.title}</Text>
          {data.fullName ? <Text style={styles.name}>{data.fullName}</Text> : null}
          <Text style={styles.meta}>{data.rangeLabel}</Text>
          <Text style={styles.meta}>{data.generatedLabel}</Text>
        </View>

        <View style={styles.divider} />
        <Text style={styles.summary}>{data.summary}</Text>

        <OverviewBlock ov={data.overview} />

        {data.groups.map((group, gi) => (
          <View key={gi} style={styles.group}>
            <Text style={styles.dayHeading}>{group.heading}</Text>
            {group.entries.flatMap((e, ei) => {
              const card = (
                <View key={`e-${ei}`} style={styles.entry} wrap={false}>
                  <View style={styles.entryTop}>
                    <Text style={styles.time}>{e.time}</Text>
                    <Text style={[styles.pain, { color: painColor(e.painLevel) }]}>
                      {e.painLabel}: {e.painLevel}
                    </Text>
                  </View>
                  {e.locationKeys && e.locationKeys.length > 0 ? (
                    <View style={styles.locationRow}>
                      <BodyFigure selected={e.locationKeys} />
                      {e.locations ? (
                        <View style={styles.locationText}>
                          <Text style={styles.fieldLabel}>{e.locations.label}</Text>
                          <Text style={styles.fieldValue}>{e.locations.value}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : e.locations ? (
                    <Field field={e.locations} />
                  ) : null}
                  {e.quality ? <Field field={e.quality} /> : null}
                  {e.notes ? <Field field={e.notes} /> : null}
                  {e.impact ? <Field field={e.impact} /> : null}
                  {e.mood ? <Field field={e.mood} /> : null}
                  {e.meds ? <Field field={e.meds} /> : null}
                </View>
              );
              return ei === 0
                ? [card]
                : [<View key={`d-${ei}`} style={styles.entryDivider} />, card];
            })}
          </View>
        ))}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `${data.footer}    ·    ${data.pageLabel
              .replace("{n}", String(pageNumber))
              .replace("{total}", String(totalPages))}`
          }
        />
      </Page>
    </Document>
  );
}

export async function buildReportBlob(data: ReportData): Promise<Blob> {
  return pdf(<ReportDocument data={data} />).toBlob();
}
