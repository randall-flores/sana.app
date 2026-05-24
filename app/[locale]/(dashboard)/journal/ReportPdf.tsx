"use client";

import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { painSeverity } from "@/lib/pain";

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
  locations?: ReportField;
  quality?: ReportField;
  notes?: ReportField;
  impact?: ReportField;
  mood?: ReportField;
  meds?: ReportField;
};

export type ReportData = {
  title: string;
  fullName: string;
  rangeLabel: string;
  generatedLabel: string;
  summary: string;
  footer: string;
  pageLabel: string; // raw template containing {n} and {total}
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
                  {e.locations ? <Field field={e.locations} /> : null}
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
