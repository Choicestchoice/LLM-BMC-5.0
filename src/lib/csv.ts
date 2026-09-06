import { EVAL_DIMS } from "./artefact";
import type { FeedbackRow } from "./admin.functions";

export function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildFeedbackCsv(rows: FeedbackRow[]): string {
  const headers = [
    "Feedback ID",
    "Submitted at",
    "Business",
    "Industry",
    "Size",
    "Region",
    "Description",
    ...EVAL_DIMS.map((d) => d.label),
    "Comment",
  ];
  const lines = [headers.map(csvEscape).join(",")];
  for (const r of rows) {
    const sub = r.submission;
    lines.push(
      [
        r.id,
        new Date(r.createdAt).toISOString(),
        sub?.businessName ?? "",
        sub?.industry ?? "",
        sub?.size ?? "",
        sub?.region ?? "",
        sub?.description ?? "",
        ...EVAL_DIMS.map((d) => r.scores[d.key] ?? ""),
        r.comment ?? "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return "\ufeff" + lines.join("\r\n");
}
