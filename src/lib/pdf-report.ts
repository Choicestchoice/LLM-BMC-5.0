import { jsPDF } from "jspdf";
import { type BusinessInput } from "@/lib/artefact";
import { type StrategicReport } from "@/lib/strategic";

type ReportOpts = {
  input: BusinessInput;
  report: StrategicReport;
  submissionId: string;
};

const MARGIN = 48;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;

export function generateStrategicReportPdf(opts: ReportOpts) {
  const { input, report, submissionId } = opts;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const state = { y: MARGIN };

  const ensureSpace = (need: number) => {
    if (state.y + need > PAGE_H - MARGIN) {
      doc.addPage();
      state.y = MARGIN;
      drawHeader();
    }
  };

  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("BMC · Studio — Strategic Recommendations Report", MARGIN, 28);
    doc.setDrawColor(220);
    doc.line(MARGIN, 36, PAGE_W - MARGIN, 36);
    doc.setTextColor(0);
  };

  const heading = (text: string, size = 18) => {
    ensureSpace(size + 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(20);
    doc.text(text, MARGIN, state.y);
    state.y += size + 6;
  };

  const subheading = (text: string) => {
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(text, MARGIN, state.y);
    state.y += 16;
  };

  const para = (text: string, size = 10, color = 60) => {
    if (!text) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    for (const line of lines) {
      ensureSpace(size + 4);
      doc.text(line, MARGIN, state.y);
      state.y += size + 4;
    }
  };

  const bullets = (items: string[], indent = 8) => {
    for (const it of items) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(40);
      const lines = doc.splitTextToSize(`•  ${it}`, CONTENT_W - indent);
      for (const line of lines) {
        ensureSpace(14);
        doc.text(line, MARGIN + indent, state.y);
        state.y += 13;
      }
      state.y += 2;
    }
  };

  const spacer = (h = 10) => {
    state.y += h;
  };

  const rule = () => {
    ensureSpace(12);
    doc.setDrawColor(225);
    doc.line(MARGIN, state.y, PAGE_W - MARGIN, state.y);
    state.y += 12;
  };

  const labelValue = (label: string, value: string, color: [number, number, number]) => {
    ensureSpace(18);
    doc.setFillColor(color[0], color[1], color[2]);
    const w = doc.getTextWidth(value) + 14;
    doc.roundedRect(MARGIN, state.y - 10, w, 16, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255);
    doc.text(value.toUpperCase(), MARGIN + 7, state.y + 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(label, MARGIN + w + 8, state.y + 1);
    state.y += 18;
  };

  // ---------- Cover ----------
  drawHeader();
  state.y = 120;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text("STRATEGIC RECOMMENDATIONS REPORT", MARGIN, state.y);
  state.y += 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(15);
  const titleLines = doc.splitTextToSize(input.businessName, CONTENT_W);
  titleLines.forEach((l: string) => {
    doc.text(l, MARGIN, state.y);
    state.y += 32;
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(90);
  doc.text(`${input.industry} · ${input.size} · ${input.region}`, MARGIN, state.y);
  state.y += 36;

  doc.setDrawColor(220);
  doc.line(MARGIN, state.y, PAGE_W - MARGIN, state.y);
  state.y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, MARGIN, state.y);
  state.y += 12;
  doc.text(`Submission ID: ${submissionId}`, MARGIN, state.y);
  state.y += 30;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(90);
  para(
    "This report distils the Business Model Canvas and Industry 5.0 assessment carried out for the business into actionable strategic recommendations for decision-making.",
    10,
    90,
  );

  // ---------- Executive summary ----------
  doc.addPage();
  state.y = MARGIN;
  drawHeader();
  heading("Executive summary", 18);
  para(report.executiveSummary);
  spacer(10);

  heading("Key findings", 14);
  bullets(report.keyFindings);
  spacer(6);

  // ---------- Strategic recommendations ----------
  doc.addPage();
  state.y = MARGIN;
  drawHeader();
  heading("Strategic recommendations", 18);
  para(
    "Each recommendation is prioritised and time-framed based on the assessment. Use them to guide investment, sequencing, and accountability.",
    10,
    100,
  );
  spacer(10);

  const priorityColor = (p: string): [number, number, number] => {
    if (p === "High") return [180, 40, 40];
    if (p === "Medium") return [200, 130, 30];
    return [80, 110, 160];
  };

  report.strategicRecommendations.forEach((r, i) => {
    ensureSpace(100);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(120);
    doc.text(String(i + 1).padStart(2, "0"), MARGIN, state.y);
    doc.setFontSize(14);
    doc.setTextColor(15);
    const tLines = doc.splitTextToSize(r.title, CONTENT_W - 30);
    tLines.forEach((l: string, idx: number) => {
      doc.text(l, MARGIN + 28, state.y + idx * 17);
    });
    state.y += Math.max(20, tLines.length * 17) + 6;

    labelValue("Priority", r.priority, priorityColor(r.priority));
    labelValue("Timeframe", r.timeframe, [55, 75, 110]);
    spacer(4);

    subheading("Rationale");
    para(r.rationale);
    spacer(2);

    subheading("Action steps");
    bullets(r.actionSteps);

    subheading("Expected impact");
    para(r.expectedImpact);
    spacer(2);

    subheading("Risks & trade-offs");
    para(r.risks);
    spacer(6);
    rule();
  });

  // ---------- Next steps ----------
  ensureSpace(80);
  heading("Immediate next steps", 16);
  para("Recommended moves to start within the next 30 days.", 10, 100);
  spacer(6);
  bullets(report.nextSteps);

  // ---------- Footer ----------
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`Page ${p} of ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 24, { align: "right" });
    doc.text("BMC · Studio", MARGIN, PAGE_H - 24);
  }

  const safeName = input.businessName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return { doc, filename: `strategic-recommendations-${safeName || "report"}.pdf` };
}

export function generateStrategicReportUrl(opts: ReportOpts) {
  const { doc } = generateStrategicReportPdf(opts);
  return doc.output("dataurlstring");
}
