import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { isEntryEditor } from "./authHelpers";
import MonthlyDataEntryForm from "./MonthlyDataEntryForm";
import DataEntryForm from "./DataEntryForm";

const DEFAULT_CSR_NAMES = [
  "ALPHE BALAKID","CEDRIC JOSH DENIEGA","CHYNNA TORNO","ERVIN ESCARDA",
  "FRANZGIAN CASTOR","JERALD BYRON CEPE","KATE VALEIZZE HOPE PEDARSE",
  "KENNETH ELBANBUENA","LANCE BORLADO","PRINCESS ALEYAH BORLADO",
  "RACHEL HATE","RAINE CHAVEZ","RAZEL HILA","RHEA MAE TUGADO",
  "ROXANNE SOLIS","VENICE CUATON","YANO HITOSIS","ANGELO PROVIDO",
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const WEEKS = ["Week 1","Week 2","Week 3","Week 4"];

const QUARTERS = {
  Q1: ["January","February","March"],
  Q2: ["April","May","June"],
  Q3: ["July","August","September"],
  Q4: ["October","November","December"],
};
const quarterRange = (q) => `${QUARTERS[q][0].slice(0,3)}–${QUARTERS[q][2].slice(0,3)}`;
const currentQuarter = () => "Q" + (Math.floor(new Date().getMonth() / 3) + 1);

// Inclusive month range by index; wraps past December (e.g. Nov → Feb).
function monthsBetween(fromIdx, toIdx) {
  const out = [];
  let i = fromIdx;
  for (let n = 0; n < 12; n++) {
    out.push(MONTHS[i]);
    if (i === toIdx) break;
    i = (i + 1) % 12;
  }
  return out;
}
const rangeShort = (months) =>
  months.length === 1 ? months[0].slice(0,3) : `${months[0].slice(0,3)}–${months[months.length-1].slice(0,3)}`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function scalePct(val) { const v = parseFloat(val); return isNaN(v) ? null : (v / 5) * 100; }
function kpiPct(val)   { const v = parseFloat(val); return isNaN(v) ? null : v * 100; }
function gradePct(val) { const v = parseFloat(val); return isNaN(v) ? null : (v / 5) * 100; }
function fmt(val, d=2) { return val !== null && val !== undefined ? parseFloat(val).toFixed(d) : "—"; }
function fmtPct(val, d=2) { return val !== null && val !== undefined ? parseFloat(val).toFixed(d) + "%" : "—"; }
const isNum = (v) => v !== null && v !== undefined && !isNaN(v);
const ratePct = (v) => !isNum(v) ? null : (v > 1 ? v : v * 100); // handles 0.62 or 62

// Philippine peso, e.g. ₱1,234,567.89
const PHP_FMT = new Intl.NumberFormat("en-PH", { style:"currency", currency:"PHP", minimumFractionDigits:2, maximumFractionDigits:2 });
const fmtPeso = (v) => isNum(v) ? PHP_FMT.format(v) : "—";

function getStatus(score) {
  if (score === null || score === undefined) return { label:"No Data", color:"#94a3b8", bg:"#f1f5f9", border:"#e2e8f0" };
  if (score >= 4.5) return { label:"Outstanding",      color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0" };
  if (score >= 4.0) return { label:"Good Performance", color:"#65a30d", bg:"#f7fee7", border:"#d9f99d" };
  if (score >= 3.5) return { label:"Needs Monitoring", color:"#d97706", bg:"#fffbeb", border:"#fde68a" };
  if (score >= 3.0) return { label:"For Coaching",     color:"#ea580c", bg:"#fff7ed", border:"#fed7aa" };
  return               { label:"Critical",             color:"#dc2626", bg:"#fef2f2", border:"#fecaca" };
}

function getStars(score) {
  if (score === null) return { full:0, empty:5 };
  const full = Math.round((score / 5) * 5);
  return { full: Math.min(full,5), empty: Math.max(5-full,0) };
}

function autoMonthlyInsight(score, weeksPresent, isMonthly) {
  const missing = isMonthly ? 0 : 4 - weeksPresent;
  const base = score === null ? "Insufficient data for this month." :
    score >= 4.5 ? "Outstanding monthly performance! Consistently excellent. This CSR is a model performer." :
    score >= 4.0 ? "Good monthly performance. Strong consistency shown. Minor areas for improvement remain." :
    score >= 3.5 ? "Needs monitoring this month. Performance is inconsistent. Focus on discipline and consistency." :
    score >= 3.0 ? "Below target. Coaching intervention is recommended before next month's evaluation period." :
    "Critical monthly performance. Immediate structured coaching plan is required.";
  return missing > 0 ? `${base} (${missing} week${missing > 1 ? "s" : ""} missing data)` : base;
}

function autoQuarterlyInsight(score, monthsPresent, totalMonths = 3, noun = "quarter") {
  const missing = totalMonths - monthsPresent;
  const base = score === null ? `Insufficient data for this ${noun}.` :
    score >= 4.5 ? `Outstanding ${noun}! Excellence sustained across the whole period. A model performer.` :
    score >= 4.0 ? `Good performance this ${noun} with solid consistency. A few KPIs can still be lifted.` :
    score >= 3.5 ? `Needs monitoring this ${noun}. Results swing month to month — focus on consistency.` :
    score >= 3.0 ? `Below target for the ${noun}. A structured coaching plan is recommended for the next ${noun}.` :
    `Critical performance this ${noun}. Immediate intervention and close TL follow-up are required.`;
  return missing > 0 ? `${base} (${missing} month${missing > 1 ? "s" : ""} missing data)` : base;
}

function autoStrengths(avg) {
  const kpis = [
    { name:"ROAS/Conversion",  val: avg.convScore },
    { name:"RMO Follow-ups",   val: avg.rmoScore },
    { name:"RTS Compliance",   val: avg.rtsScore },
    { name:"Delivery Success", val: avg.dsrScore },
    { name:"Upsell Rate",      val: avg.upsScore },
  ].filter(k => k.val !== null).sort((a,b) => b.val - a.val);
  return kpis.slice(0,3).map(k => k.name).join(", ") || "Consistent effort across all areas.";
}

function autoOpportunities(avg) {
  const kpis = [
    { name:"ROAS/Conversion",  val: avg.convScore },
    { name:"RMO Follow-ups",   val: avg.rmoScore },
    { name:"RTS Compliance",   val: avg.rtsScore },
    { name:"Delivery Success", val: avg.dsrScore },
    { name:"Upsell Rate",      val: avg.upsScore },
  ].filter(k => k.val !== null && k.val < 80).sort((a,b) => a.val - b.val);
  return kpis.length > 0
    ? `Improve ${kpis.slice(0,2).map(k => k.name).join(" and ")} to reach the next tier.`
    : "Maintain current performance levels and push for consistency.";
}

function autoActionPlan(score) {
  if (score === null) return "Enter monthly data to generate a complete action plan.";
  if (score >= 4.5) return "Continue excellent practices. Consider mentoring lower-performing teammates.";
  if (score >= 4.0) return "Focus on your weakest KPI. Set a weekly target and track progress daily.";
  if (score >= 3.5) return "Schedule a monthly 1-on-1 with your TL. Review call recordings and identify patterns.";
  return "Follow structured coaching plan. Attend daily check-ins with your Team Leader.";
}

// ─── STAT COMPUTATION ─────────────────────────────────────────────────────────
// Computes one month's stats from either the monthly entry (preferred) or weekly entries.
function computeMonthStats(weeklyRecords, monthlyRecord) {
  if (monthlyRecord) {
    const r = monthlyRecord;
    return {
      isMonthlySource: true,
      weeksPresent: 4,
      byWeek: null,
      finalScore:   parseFloat(r.final_score)  || null,
      kraTotal:     parseFloat(r.kra_total)    || null,
      biScore:      parseFloat(r.bi_score)     || null,
      kraBP:        parseFloat(r.kra_bp)       || null,
      kraCust:      parseFloat(r.kra_customer) || null,
      kraPlp:       parseFloat(r.kra_people)   || null,
      kraFin:       parseFloat(r.kra_financial)|| null,
      bi1:          parseFloat(r.bi1)          || null,
      bi2:          parseFloat(r.bi2)          || null,
      bi3:          parseFloat(r.bi3)          || null,
      bi5:          parseFloat(r.bi5)          || null,
      rmoKpi:       parseFloat(r.rmo_kpi_score)              || null,
      rtsKpi:       parseFloat(r.rts_kpi_score)              || null,
      convKpi:      parseFloat(r.conversion_kpi_score)       || null,
      dsrKpi:       parseFloat(r.delivery_success_kpi_score) || null,
      upsKpi:       parseFloat(r.upsell_kpi_score)           || null,
      escKpi:       parseFloat(r.esc_kpi_score)              || null,
      rmoScore:     kpiPct(parseFloat(r.rmo_kpi_score)              || null),
      rtsScore:     kpiPct(parseFloat(r.rts_kpi_score)              || null),
      convScore:    kpiPct(parseFloat(r.conversion_kpi_score)       || null),
      dsrScore:     kpiPct(parseFloat(r.delivery_success_kpi_score) || null),
      upsScore:     kpiPct(parseFloat(r.upsell_kpi_score)           || null),
      delivered:    parseFloat(r.delivered)       || null,
      returned:     parseFloat(r.returned)        || null,
      forReturn:    parseFloat(r.for_return)      || null,
      escPoints:    parseFloat(r.esc_points)      || null,
      convRoas:     parseFloat(r.conversion_roas) || null,
      rtsRaw:       parseFloat(r.rts_pct)                  || null,
      dsrRaw:       parseFloat(r.delivery_success_rate)    || null,
      rmoRaw:       parseFloat(r.weekly_rmo_rate)          || null,
      upsRaw:       parseFloat(r.upsell_rate)              || null,
      // Month totals (used by quarterly roll-up)
      deliveredTotal: parseFloat(r.delivered)  || null,
      returnedTotal:  parseFloat(r.returned)   || null,
      forReturnTotal: parseFloat(r.for_return) || null,
    };
  }

  if (!weeklyRecords || !weeklyRecords.length) return null;

  // Latest record per week
  const byWeek = {};
  weeklyRecords.forEach(r => {
    if (!byWeek[r.week] || new Date(r.created_at) > new Date(byWeek[r.week].created_at)) {
      byWeek[r.week] = r;
    }
  });
  const weekRecs = Object.values(byWeek);

  const vals = (key) => weekRecs.map(r => parseFloat(r[key])).filter(v => !isNaN(v));
  const avgF = (key) => { const v = vals(key); return v.length ? v.reduce((a,b) => a+b, 0) / v.length : null; };
  const sumF = (key) => { const v = vals(key); return v.length ? v.reduce((a,b) => a+b, 0) : null; };

  return {
    isMonthlySource: false,
    weeksPresent: weekRecs.length,
    byWeek,
    finalScore: avgF("final_score"),
    kraTotal:   avgF("kra_total"),
    biScore:    avgF("bi_score"),
    kraBP:      avgF("kra_bp"),
    kraCust:    avgF("kra_customer"),
    kraPlp:     avgF("kra_people"),
    kraFin:     avgF("kra_financial"),
    bi1: avgF("bi1"), bi2: avgF("bi2"), bi3: avgF("bi3"), bi5: avgF("bi5"),
    rmoKpi:  avgF("rmo_kpi_score"),
    rtsKpi:  avgF("rts_kpi_score"),
    convKpi: avgF("conversion_kpi_score"),
    dsrKpi:  avgF("delivery_success_kpi_score"),
    upsKpi:  avgF("upsell_kpi_score"),
    escKpi:  avgF("esc_kpi_score"),
    rmoScore:  kpiPct(avgF("rmo_kpi_score")),
    rtsScore:  kpiPct(avgF("rts_kpi_score")),
    convScore: kpiPct(avgF("conversion_kpi_score")),
    dsrScore:  kpiPct(avgF("delivery_success_kpi_score")),
    upsScore:  kpiPct(avgF("upsell_kpi_score")),
    delivered: avgF("delivered"),
    returned:  avgF("returned"),
    forReturn: avgF("for_return"),
    escPoints: avgF("esc_points"),
    convRoas:  avgF("conversion_roas"),
    rtsRaw:    avgF("rts_pct"),
    dsrRaw:    avgF("delivery_success_rate"),
    rmoRaw:    avgF("weekly_rmo_rate"),
    upsRaw:    avgF("upsell_rate"),
    deliveredTotal: sumF("delivered"),
    returnedTotal:  sumF("returned"),
    forReturnTotal: sumF("for_return"),
  };
}

const AVG_KEYS = [
  "finalScore","kraTotal","biScore","kraBP","kraCust","kraPlp","kraFin",
  "bi1","bi2","bi3","bi5","rmoKpi","rtsKpi","convKpi","dsrKpi","upsKpi","escKpi",
  "rmoScore","rtsScore","convScore","dsrScore","upsScore",
  "escPoints","convRoas","rtsRaw","dsrRaw","rmoRaw","upsRaw",
];
const SUM_KEYS = ["deliveredTotal","returnedTotal","forReturnTotal"];

// Quarter = average of the months that have data (scores/rates), sum for volumes.
function computeQuarterStats(byMonth, months) {
  const present = months.filter(m => byMonth[m]);
  if (!present.length) return null;
  const out = { monthsPresent: present.length, byMonth, months };
  AVG_KEYS.forEach(k => {
    const v = present.map(m => byMonth[m][k]).filter(isNum);
    out[k] = v.length ? v.reduce((a,b) => a+b, 0) / v.length : null;
  });
  SUM_KEYS.forEach(k => {
    const v = present.map(m => byMonth[m][k]).filter(isNum);
    out[k] = v.length ? v.reduce((a,b) => a+b, 0) : null;
  });
  return out;
}

function buildQuarter(weeklyRows, monthlyRows, months) {
  const latestMonthly = {};
  monthlyRows.forEach(r => {
    if (!latestMonthly[r.month] || new Date(r.created_at) > new Date(latestMonthly[r.month].created_at)) {
      latestMonthly[r.month] = r;
    }
  });
  const byMonth = {};
  months.forEach(m => {
    byMonth[m] = computeMonthStats(weeklyRows.filter(r => r.month === m), latestMonthly[m] || null);
  });
  return computeQuarterStats(byMonth, months);
}

const sourceLabel = (s) => !s ? "No data" : s.isMonthlySource ? "Monthly entry" : `Weekly (${s.weeksPresent}/4)`;

// ─── EXPORT ───────────────────────────────────────────────────────────────────
const r2 = (v) => isNum(v) ? Math.round(v * 100) / 100 : "";

const EXPORT_METRICS = [
  { label:"Final Score (/5)",                  get:s => s.finalScore },
  { label:"Status",                            get:s => getStatus(s.finalScore).label, text:true },
  { label:"KRA Scale (/5)",                    get:s => s.kraTotal },
  { label:"KRA Score %",                       get:s => scalePct(s.kraTotal) },
  { label:"Behavioral Scale (/5)",             get:s => s.biScore },
  { label:"Behavioral Score %",                get:s => scalePct(s.biScore) },
  { label:"KRA - Business Process %",          get:s => scalePct(s.kraBP) },
  { label:"KRA - Customer %",                  get:s => scalePct(s.kraCust) },
  { label:"KRA - People Development %",        get:s => scalePct(s.kraPlp) },
  { label:"KRA - Financial %",                 get:s => scalePct(s.kraFin) },
  { label:"BI - Attendance & Reliability %",   get:s => gradePct(s.bi1) },
  { label:"BI - Accountability & Compliance %",get:s => gradePct(s.bi2) },
  { label:"BI - Initiative & Adaptability %",  get:s => gradePct(s.bi3) },
  { label:"BI - Extreme Self-Care %",          get:s => gradePct(s.bi5) },
  { label:"KPI - Follow-Ups / RMO %",          get:s => s.rmoScore },
  { label:"KPI - ROAS Performance %",          get:s => s.convScore },
  { label:"KPI - RTS Compliance %",            get:s => s.rtsScore },
  { label:"KPI - Upsell Rate %",               get:s => s.upsScore },
  { label:"KPI - Delivery Success %",          get:s => s.dsrScore },
  { label:"RTS %",                             get:s => isNum(s.rtsRaw) ? s.rtsRaw * 100 : null },
  { label:"Delivery Success Rate %",           get:s => isNum(s.dsrRaw) ? s.dsrRaw * 100 : null },
  { label:"RMO Rate %",                        get:s => ratePct(s.rmoRaw) },
  { label:"Upsell Rate %",                     get:s => ratePct(s.upsRaw) },
  { label:"ESC Points",                        get:s => s.escPoints },
  { label:"Conversion (ROAS)",                 get:s => s.convRoas },
  { label:"Delivered (PHP total)",             get:s => s.deliveredTotal },
  { label:"Returned (PHP total)",              get:s => s.returnedTotal },
  { label:"For Return (total)",                get:s => s.forReturnTotal },
];
const metricCell = (m, s) => !s ? "" : m.text ? m.get(s) : r2(m.get(s));

function toCSV(rows) {
  return rows.map(row => row.map(c => {
    const s = c === null || c === undefined ? "" : String(c);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\r\n");
}

function downloadCSV(filename, rows) {
  // BOM so Excel opens UTF-8 correctly
  const blob = new Blob(["\uFEFF" + toCSV(rows)], { type:"text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const safeName = (s) => s.replace(/[^\w-]+/g, "_");

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));

// Prints ONLY the given element (the scorecard) in a hidden iframe,
// so the app's nav, top bar, sidebar etc. never appear in the PDF.
function printElement(el, title) {
  if (!el) return;
  const clone = el.cloneNode(true);
  clone.querySelectorAll(".no-print").forEach(n => n.remove());
  clone.style.maxWidth = "none";
  clone.style.margin = "0";
  clone.style.padding = "0";

  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, { position:"fixed", right:"0", bottom:"0", width:"0", height:"0", border:"0", visibility:"hidden" });
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">
<style>
  @page { size: A4 landscape; margin: 8mm; }
  html, body { margin:0; padding:0; background:#fff; }
  body { font-family:'Inter','DM Sans',system-ui,sans-serif; color:#1e293b;
         -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .sheet { width:1060px; margin:0 auto; }
  .sheet > div > div { break-inside: avoid; page-break-inside: avoid; }
  table { break-inside: auto; }
  tr { break-inside: avoid; }
  button { font-family:inherit; }
</style></head><body><div class="sheet"></div></body></html>`);
  doc.close();
  doc.querySelector(".sheet").appendChild(doc.importNode(clone, true));

  const prevTitle = document.title;
  document.title = title; // some browsers name the PDF after the top window
  const cleanup = () => { document.title = prevTitle; iframe.remove(); };
  const win = iframe.contentWindow;
  win.addEventListener("afterprint", () => setTimeout(cleanup, 100));
  setTimeout(() => { if (document.body.contains(iframe)) cleanup(); }, 120000);

  const fontsReady = doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(r => setTimeout(r, 1500))])
    .then(() => setTimeout(() => { win.focus(); win.print(); }, 150));
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const card = (extra={}) => ({
  background:"#fff", border:"1px solid #e2e8f0", borderRadius:14,
  padding:20, boxShadow:"0 1px 4px rgba(0,0,0,0.05)", ...extra,
});

const sectionLabel = (color) => ({
  fontSize:11, fontWeight:800, color, letterSpacing:"0.12em",
  textTransform:"uppercase", marginBottom:14, display:"flex", alignItems:"center", gap:6,
});

const PRINT_CSS = `
@media print {
  .no-print { display:none !important; }
  body { background:#fff !important; }
  .print-area { padding:0 !important; max-width:none !important; }
  .print-area > div { break-inside: avoid; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: A4; margin: 10mm; }
}`;

// ─── SUB COMPONENTS ───────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const status = getStatus(score);
  const pct = score !== null ? Math.min((score/5)*100, 100) : 0;
  const r = 58, circ = 2 * Math.PI * r;
  const dash = (pct/100) * circ;
  const stars = getStars(score);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
      <div style={{ position:"relative", width:140, height:140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform:"rotate(-90deg)" }}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
          <circle cx="70" cy="70" r={r} fill="none" stroke={status.color} strokeWidth="12"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:30, fontWeight:900, color:status.color, lineHeight:1 }}>{score !== null ? score.toFixed(2) : "—"}</span>
          <span style={{ fontSize:11, color:"#94a3b8", fontWeight:500 }}>/ 5.00</span>
        </div>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:22, letterSpacing:2 }}>
          <span style={{ color:status.color }}>{"★".repeat(stars.full)}</span>
          <span style={{ color:"#e2e8f0" }}>{"☆".repeat(stars.empty)}</span>
        </div>
        <div style={{ marginTop:6, padding:"4px 16px", borderRadius:999, background:status.bg, border:`1px solid ${status.border}`, fontSize:12, fontWeight:700, color:status.color }}>
          {status.label}
        </div>
      </div>
    </div>
  );
}

function KpiBar({ label, value, target=80 }) {
  if (value === null || value === undefined) return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:12, color:"#64748b" }}>{label}</span>
        <span style={{ fontSize:12, color:"#cbd5e1" }}>—</span>
      </div>
      <div style={{ height:6, background:"#e2e8f0", borderRadius:999 }} />
    </div>
  );
  const capped = Math.min(value, 100);
  const color = value >= target ? "#16a34a" : value >= target*0.8 ? "#d97706" : "#dc2626";
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:12, color:"#475569" }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:800, color }}>{value.toFixed(2)}%</span>
      </div>
      <div style={{ height:6, background:"#e2e8f0", borderRadius:999, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${capped}%`, background:color, borderRadius:999, transition:"width 0.6s ease" }} />
      </div>
    </div>
  );
}

function WeekChip({ week, hasData, score }) {
  const status = hasData ? getStatus(score) : null;
  return (
    <div style={{
      padding:"8px 12px", borderRadius:10, textAlign:"center", flex:1,
      background: hasData ? status.bg : "#f8fafc",
      border: hasData ? `1.5px solid ${status.border}` : "1.5px solid #e2e8f0",
    }}>
      <div style={{ fontSize:10, color: hasData ? status.color : "#94a3b8", fontWeight:700, marginBottom:4 }}>{week}</div>
      <div style={{ fontSize:18, fontWeight:900, color: hasData ? status.color : "#cbd5e1" }}>
        {hasData ? score.toFixed(2) : "—"}
      </div>
    </div>
  );
}

function MonthChip({ month, stats, onClick }) {
  const has = !!stats && isNum(stats.finalScore);
  const status = has ? getStatus(stats.finalScore) : null;
  return (
    <button
      onClick={stats ? onClick : undefined}
      disabled={!stats}
      title={stats ? `Open ${month} monthly scorecard` : "No data"}
      style={{
        padding:"8px 12px", borderRadius:10, textAlign:"center", flex:1, minWidth:90,
        background: has ? status.bg : "#f8fafc",
        border: has ? `1.5px solid ${status.border}` : "1.5px solid #e2e8f0",
        cursor: stats ? "pointer" : "default", fontFamily:"inherit",
      }}>
      <div style={{ fontSize:10, color: has ? status.color : "#94a3b8", fontWeight:700, marginBottom:4 }}>{month}</div>
      <div style={{ fontSize:18, fontWeight:900, color: has ? status.color : "#cbd5e1" }}>
        {has ? stats.finalScore.toFixed(2) : "—"}
      </div>
      <div style={{ fontSize:9, color:"#94a3b8", marginTop:2 }}>{sourceLabel(stats)}</div>
    </button>
  );
}

function SourceBadge({ isMonthly }) {
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"4px 12px", borderRadius:999, fontSize:11, fontWeight:700,
      background: isMonthly ? "#eff6ff" : "#f0fdf4",
      border: isMonthly ? "1.5px solid #bfdbfe" : "1.5px solid #bbf7d0",
      color: isMonthly ? "#1d4ed8" : "#15803d",
    }}>
      {isMonthly ? "📅 Monthly Entry" : "📆 Weekly Entries"}
    </div>
  );
}

function KpiCard({ s }) {
  return (
    <div style={card()}>
      <div style={sectionLabel("#0ea5e9")}><span>👥</span> Customer</div>
      <KpiBar label="Follow-Ups / RMO" value={s.rmoScore} />
      <KpiBar label="Verified Calls"   value={gradePct(s.bi1)} />
      <div style={{ borderTop:"1px solid #f1f5f9", margin:"14px 0" }} />
      <div style={sectionLabel("#d97706")}><span>💰</span> Financial</div>
      <KpiBar label="ROAS Performance" value={s.convScore} />
      <KpiBar label="RTS Compliance"   value={s.rtsScore} />
      <KpiBar label="Upsell Rate"       value={s.upsScore} />
      <KpiBar label="Delivery Success"  value={s.dsrScore} />
    </div>
  );
}

function BasisCard({ title, items }) {
  return (
    <div style={card()}>
      <div style={sectionLabel("#64748b")}>{title}</div>
      {items.map(({ icon, label, val, warn }) => (
        <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
          <span style={{ fontSize:12, color:"#64748b", display:"flex", alignItems:"center", gap:8 }}><span>{icon}</span>{label}</span>
          <span style={{ fontSize:13, fontWeight:800, color: warn ? "#dc2626" : "#16a34a" }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

function KraBreakdownCard({ s }) {
  return (
    <div style={card()}>
      <div style={sectionLabel("#64748b")}>KRA Breakdown</div>
      {[
        { label:"Business Process",   val:s.kraBP,   icon:"⚙️", color:"#6366f1" },
        { label:"Customer",           val:s.kraCust, icon:"👥", color:"#0ea5e9" },
        { label:"People Development", val:s.kraPlp,  icon:"👤", color:"#10b981" },
        { label:"Financial",          val:s.kraFin,  icon:"💰", color:"#f59e0b" },
      ].map(({ label, val, icon, color }) => {
        const pct = scalePct(val);
        return (
          <div key={label} style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:12, color:"#475569", display:"flex", alignItems:"center", gap:6 }}><span>{icon}</span>{label}</span>
              <span style={{ fontSize:13, fontWeight:800, color: pct !== null ? (pct >= 80 ? "#16a34a" : pct >= 60 ? "#d97706" : "#dc2626") : "#cbd5e1" }}>
                {pct !== null ? pct.toFixed(2)+"%" : "—"}
              </span>
            </div>
            <div style={{ height:8, background:"#f1f5f9", borderRadius:999, overflow:"hidden" }}>
              <div style={{ height:"100%", width: pct !== null ? `${Math.min(pct,100)}%` : "0%", background:color, borderRadius:999, transition:"width 0.6s ease" }} />
            </div>
          </div>
        );
      })}
      <div style={{ marginTop:16, padding:"10px 14px", background:"#f8fafc", borderRadius:8, border:"2px solid #6366f1" }}>
        <div style={{ fontSize:10, color:"#6366f1", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>Overall KRA Score</div>
        <div style={{ fontSize:22, fontWeight:900, color:"#16a34a", marginTop:2 }}>{fmtPct(scalePct(s.kraTotal))}</div>
      </div>
    </div>
  );
}

function BehavioralCard({ s }) {
  const overall = scalePct(s.biScore);
  return (
    <div style={{ ...card(), marginBottom:16 }}>
      <div style={sectionLabel("#8b5cf6")}>Behavioral Indicators</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:14 }}>
        {[
          { label:"Attendance & Reliability",    val:s.bi1, icon:"🗓️" },
          { label:"Accountability & Compliance", val:s.bi2, icon:"📋" },
          { label:"Initiative & Adaptability",   val:s.bi3, icon:"💡" },
          { label:"Extreme Self-Care",           val:s.bi5, icon:"💚" },
        ].map(({ label, val, icon }) => {
          const pct = gradePct(val);
          const color = pct === null ? "#cbd5e1" : pct >= 80 ? "#16a34a" : pct >= 60 ? "#d97706" : "#dc2626";
          return (
            <div key={label} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:"14px 12px", textAlign:"center" }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
              <div style={{ fontSize:11, color:"#64748b", fontWeight:600, marginBottom:4, lineHeight:1.3 }}>{label}</div>
              <div style={{ fontSize:18, fontWeight:900, color }}>{pct !== null ? pct.toFixed(2)+"%" : "—"}</div>
            </div>
          );
        })}
      </div>
      <div style={{ padding:"10px 16px", background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>Overall Behavioral Score</span>
        <span style={{ fontSize:20, fontWeight:900, color: overall >= 80 ? "#16a34a" : overall >= 60 ? "#d97706" : "#dc2626" }}>
          {fmtPct(overall)}
        </span>
      </div>
    </div>
  );
}

function InsightCard({ s, insight }) {
  const status = getStatus(s.finalScore);
  return (
    <div style={card()}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <div style={{ width:36, height:36, borderRadius:999, background:status.bg, border:`1px solid ${status.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏆</div>
        <div style={{ fontSize:14, fontWeight:800, color:status.color }}>{status.label}!</div>
      </div>
      <p style={{ fontSize:12, color:"#64748b", lineHeight:1.7, marginBottom:14 }}>{insight}</p>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {[
          { icon:"⭐", label:"Strengths",     color:"#16a34a", text: autoStrengths(s) },
          { icon:"📈", label:"Opportunities", color:"#d97706", text: autoOpportunities(s) },
          { icon:"🎯", label:"Action Plan",   color:"#0ea5e9", text: autoActionPlan(s.finalScore) },
        ].map(({ icon, label, color, text }) => (
          <div key={label} style={{ display:"flex", gap:8, padding:"8px 10px", background:"#f8fafc", borderRadius:8 }}>
            <span style={{ fontSize:14 }}>{icon}</span>
            <div><span style={{ fontSize:11, fontWeight:700, color }}>{label}: </span><span style={{ fontSize:11, color:"#64748b" }}>{text}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalCards({ items }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {items.map(({ icon, label, color, text }) => (
        <div key={label} style={{ ...card(), border:`1.5px solid ${color}33`, display:"flex", gap:12, alignItems:"flex-start", flex:1 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{icon}</div>
          <div>
            <div style={{ fontSize:10, fontWeight:800, color, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>{label}</div>
            <p style={{ fontSize:12, color:"#64748b", lineHeight:1.5, margin:0 }}>{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HeaderScoreBlock({ label, s, prefix = "" }) {
  return (
    <div style={{ display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:10, color:"#a5b4fc", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>{label}</div>
        <ScoreRing score={s.finalScore} />
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12, minWidth:160 }}>
        <div style={{ background:"#ffffff15", border:"1px solid #ffffff25", borderRadius:12, padding:"14px 20px" }}>
          <div style={{ fontSize:10, color:"#86efac", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{prefix}KRA Score</div>
          <div style={{ fontSize:24, fontWeight:900, color:"#86efac" }}>{fmtPct(scalePct(s.kraTotal))}</div>
          <div style={{ fontSize:13, color:"#4ade80", marginTop:2 }}>{prefix}KRA Scale: <strong>{fmt(s.kraTotal)}</strong></div>
        </div>
        <div style={{ background:"#ffffff15", border:"1px solid #ffffff25", borderRadius:12, padding:"14px 20px" }}>
          <div style={{ fontSize:10, color:"#86efac", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{prefix}Behavioral Score</div>
          <div style={{ fontSize:24, fontWeight:900, color:"#86efac" }}>{fmtPct(scalePct(s.biScore))}</div>
          <div style={{ fontSize:13, color:"#4ade80", marginTop:2 }}>{prefix}Behavioral Scale: <strong>{fmt(s.biScore)}</strong></div>
        </div>
      </div>
    </div>
  );
}

const headerStyle = {
  background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e3a8a 100%)",
  borderRadius:16, padding:"28px 32px",
  marginBottom:20, display:"flex", alignItems:"flex-start", gap:32, flexWrap:"wrap",
};

// ─── QUARTERLY SCORECARD ──────────────────────────────────────────────────────
const TREND_ROWS = [
  { label:"Final Score",            get:s => s.finalScore,          f:v => fmt(v), score:true },
  { label:"KRA Score",              get:s => scalePct(s.kraTotal),  f:fmtPct, highlight:true },
  { label:"KRA Scale (/5)",         get:s => s.kraTotal,            f:v => fmt(v), score:true },
  { label:"Behavioral Score",       get:s => scalePct(s.biScore),   f:fmtPct, highlight:true },
  { label:"Behavioral Scale (/5)",  get:s => s.biScore,             f:v => fmt(v), score:true },
  { label:"Follow-Ups / RMO",  get:s => s.rmoScore,            f:fmtPct },
  { label:"ROAS Performance",  get:s => s.convScore,           f:fmtPct },
  { label:"RTS Compliance",    get:s => s.rtsScore,            f:fmtPct },
  { label:"Upsell Rate",       get:s => s.upsScore,            f:fmtPct },
  { label:"Delivery Success",  get:s => s.dsrScore,            f:fmtPct },
  { label:"Delivered",         get:s => s.deliveredTotal,      f:fmtPeso, money:true },
  { label:"Returned",          get:s => s.returnedTotal,       f:fmtPeso, money:true },
];

function QuarterlyScorecard({ csr, label, shortLabel, isQuarter, q, onOpenMonth }) {
  const months = q.months;
  const total = months.length;
  const noun = isQuarter ? "quarter" : "period";
  const Noun = isQuarter ? "Quarter" : "Period";
  const insight = autoQuarterlyInsight(q.finalScore, q.monthsPresent, total, noun);
  const withData = months.filter(m => q.byMonth[m] && isNum(q.byMonth[m].finalScore));
  const trend = withData.length >= 2
    ? q.byMonth[withData[withData.length-1]].finalScore - q.byMonth[withData[0]].finalScore
    : null;

  const th = { fontSize:10, color:"#94a3b8", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", padding:"8px 10px", textAlign:"right", borderBottom:"1px solid #e2e8f0" };
  const td = { fontSize:12, padding:"8px 10px", textAlign:"right", borderBottom:"1px solid #f1f5f9", fontWeight:700 };

  return (
    <div className="print-area" style={{ maxWidth:1100, margin:"0 auto", padding:"28px 24px" }}>
      {/* ── HEADER ── */}
      <div style={headerStyle}>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontSize:11, color:"#a5b4fc", fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:6 }}>
            {isQuarter ? "Quarterly" : "Period"} Scorecard · {label}
          </div>
          <div style={{ fontSize:28, fontWeight:900, color:"#fff", lineHeight:1.1, marginBottom:12 }}>{csr}</div>

          <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
            {months.map(m => <MonthChip key={m} month={m} stats={q.byMonth[m]} onClick={() => onOpenMonth(m)} />)}
          </div>

          {trend !== null && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:10, background:"#ffffff18", border:"1px solid #ffffff30", marginBottom:14 }}>
              <span style={{ fontSize:13, fontWeight:800, color: trend >= 0 ? "#86efac" : "#fca5a5" }}>
                {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(2)}
              </span>
              <span style={{ fontSize:12, color:"#c7d2fe" }}>
                {withData[0].slice(0,3)} → {withData[withData.length-1].slice(0,3)}
              </span>
            </div>
          )}

          <div style={{ background:"#ffffff12", border:"1px solid #ffffff20", borderRadius:10, padding:"12px 16px", maxWidth:380 }}>
            <div style={{ fontSize:10, color:"#a5b4fc", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>❝ {isQuarter ? "Quarterly" : "Period"} Insight</div>
            <p style={{ fontSize:12, color:"#e0e7ff", lineHeight:1.6, margin:0 }}>{insight}</p>
          </div>
        </div>
        <HeaderScoreBlock label={`${Noun} Avg Score`} s={q} prefix="Avg " />
      </div>

      {/* ── KRA & BEHAVIORAL AVERAGE ── */}
      <div style={{ ...card(), marginBottom:16 }}>
        <div style={sectionLabel("#6366f1")}>KRA &amp; Behavioral Average · {label}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[
            { name:"Average KRA Score",        val:q.kraTotal, key:"kraTotal", color:"#6366f1" },
            { name:"Average Behavioral Score", val:q.biScore,  key:"biScore",  color:"#8b5cf6" },
          ].map(({ name, val, key, color }) => {
            const pct = scalePct(val);
            const pctColor = pct === null ? "#cbd5e1" : pct >= 80 ? "#16a34a" : pct >= 60 ? "#d97706" : "#dc2626";
            const used = months.filter(m => q.byMonth[m] && isNum(q.byMonth[m][key]));
            return (
              <div key={key} style={{ background:"#f8fafc", border:`1.5px solid ${color}40`, borderRadius:12, padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#475569" }}>{name}</span>
                  <span style={{ fontSize:24, fontWeight:900, color:pctColor }}>{fmtPct(pct)}</span>
                </div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>
                  Scale: <strong style={{ color:"#1e293b" }}>{fmt(val)}</strong> / 5.00 · based on {used.length} of {total} month{total > 1 ? "s" : ""}
                </div>
                <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
                  {months.map(m => {
                    const v = q.byMonth[m] ? q.byMonth[m][key] : null;
                    return (
                      <span key={m} style={{ fontSize:11, padding:"3px 8px", borderRadius:999, background:"#fff", border:"1px solid #e2e8f0", color: isNum(v) ? "#334155" : "#cbd5e1", fontWeight:600 }}>
                        {m.slice(0,3)}: {isNum(v) ? fmtPct(scalePct(v)) : "—"}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>
        <KpiCard s={q} />
        <BasisCard title={`${Noun} Basis`} items={[
          { icon:"🚚", label:"Avg RTS %",            val: isNum(q.rtsRaw) ? (q.rtsRaw*100).toFixed(2)+"%" : "—", warn: isNum(q.rtsRaw) && q.rtsRaw > 0.15 },
          { icon:"✅", label:"Avg Delivery Success", val: isNum(q.dsrRaw) ? (q.dsrRaw*100).toFixed(2)+"%" : "—" },
          { icon:"📞", label:"Avg RMO Rate",         val: isNum(q.rmoRaw) ? ratePct(q.rmoRaw).toFixed(2)+"%" : "—", warn: isNum(q.rmoRaw) && ratePct(q.rmoRaw) < 55 },
          { icon:"⭐", label:"Avg ESC Points",       val: isNum(q.escPoints) ? q.escPoints.toFixed(1) : "—", warn: isNum(q.escPoints) && q.escPoints < 9 },
          { icon:"📈", label:"Avg Conversion (ROAS)",val: isNum(q.convRoas) ? q.convRoas.toFixed(2) : "—" },
          { icon:"🏷", label:"Avg Upsell Rate",      val: isNum(q.upsRaw) ? ratePct(q.upsRaw).toFixed(2)+"%" : "—" },
          { icon:"📦", label:"Total Delivered",      val: fmtPeso(q.deliveredTotal) },
          { icon:"↩",  label:"Total Returned",       val: fmtPeso(q.returnedTotal) },
        ]} />
        <KraBreakdownCard s={q} />
      </div>

      <BehavioralCard s={q} />

      {/* ── MONTH-BY-MONTH ── */}
      <div style={{ ...card(), marginBottom:16, overflowX:"auto" }}>
        <div style={sectionLabel("#64748b")}>Month-by-Month Breakdown</div>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth: Math.max(560, 160 + (total + 1) * 72) }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign:"left" }}>Metric</th>
              {months.map(m => <th key={m} style={th}>{total > 4 ? m.slice(0,3) : m}</th>)}
              <th style={{ ...th, color:"#6366f1" }}>{shortLabel} Average</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...td, textAlign:"left", color:"#64748b", fontWeight:600 }}>Data Source</td>
              {months.map(m => <td key={m} style={{ ...td, color:"#94a3b8", fontWeight:500, fontSize:11 }}>{sourceLabel(q.byMonth[m])}</td>)}
              <td style={{ ...td, color:"#94a3b8", fontWeight:500, fontSize:11 }}>{q.monthsPresent}/{total} months</td>
            </tr>
            {TREND_ROWS.map(row => {
              const colorFor = (s) => {
                if (!s) return "#cbd5e1";
                const v = row.get(s);
                if (!isNum(v)) return "#cbd5e1";
                if (row.score) return getStatus(v).color;
                if (row.money) return "#334155";
                return v >= 80 ? "#16a34a" : v >= 64 ? "#d97706" : "#dc2626";
              };
              const rowBg = row.highlight ? { background:"#eef2ff" } : {};
              return (
                <tr key={row.label} style={rowBg}>
                  <td style={{ ...td, textAlign:"left", color:"#475569", fontWeight: row.highlight ? 800 : 600 }}>
                    {row.money ? `${row.label} (₱)` : row.label}
                  </td>
                  {months.map(m => {
                    const s = q.byMonth[m];
                    return <td key={m} style={{ ...td, color: colorFor(s) }}>{s ? row.f(row.get(s)) : "—"}</td>;
                  })}
                  <td style={{ ...td, color: colorFor(q), background: row.highlight ? "#e0e7ff" : "#f8fafc", fontWeight: 900 }}>
                    {row.f(row.get(q))}{row.money && isNum(row.get(q)) ? <span style={{ fontSize:9, color:"#94a3b8", fontWeight:600 }}> total</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ fontSize:11, color:"#94a3b8", marginTop:10 }}>
          {Noun} values are the average of months with data; Delivered/Returned are {noun} totals.
        </div>
      </div>

      {/* ── INSIGHTS ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <InsightCard s={q} insight={insight} />
        <GoalCards items={[
          { icon:"🎯", label:"FOCUS", color:"#6366f1",
            text: `${q.monthsPresent < total ? "Complete missing months' data entry, then target " : "Target "}the lowest KPI consistently above 80% every month next ${noun}.` },
          { icon:"🏁", label:"GOAL", color:"#16a34a",
            text: q.finalScore >= 4.5 ? "Maintain Outstanding and mentor teammates." : q.finalScore >= 4.0 ? `Break into the Outstanding tier next ${noun}.` : q.finalScore >= 3.5 ? `Achieve Good Performance tier next ${noun}.` : "Reach the Needs Monitoring tier through coaching." },
          { icon:"🏅", label:"COMMITMENT", color:"#d97706", text:"Discipline today, excellence every day." },
        ]} />
      </div>

      {/* ── FOOTER ── */}
      <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
        <span>{isQuarter ? "Quarterly" : "Period"} Performance Dashboard · Generated {new Date().toLocaleDateString()}</span>
        <span>{csr} · {label} · {q.monthsPresent}/{total} months</span>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function MonthlyDashboard({ user }) {
  const [csrNames, setCsrNames]           = useState(DEFAULT_CSR_NAMES);
  const [selectedCSR, setSelectedCSR]     = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [weeklyRecords, setWeeklyRecords] = useState([]);
  const [monthlyRecord, setMonthlyRecord] = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  // ── VIEW MODE / QUARTERLY STATE ──
  const [viewMode, setViewMode]               = useState("monthly"); // "monthly" | "quarterly"
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter());
  const [periodType, setPeriodType]           = useState("quarter"); // "quarter" | "range"
  const [rangeFrom, setRangeFrom]             = useState(() => (new Date().getMonth() + 10) % 12); // 2 months back
  const [rangeTo, setRangeTo]                 = useState(() => new Date().getMonth());
  const [quarterly, setQuarterly]             = useState(null);
  const [qLoading, setQLoading]               = useState(false);
  const [qError, setQError]                   = useState(null);
  const [exporting, setExporting]             = useState(false);

  // ── EDIT MODE STATE ──
  const [editMode, setEditMode]           = useState(false);
  const [editWeekTarget, setEditWeekTarget] = useState(null); // null = editing the full-month entry

  useEffect(() => {
    let cancelled = false;

    const loadCSRNames = async () => {
      const [weeklyResult, monthlyResult] = await Promise.all([
        supabase
          .from("performance_entries")
          .select("csr_name")
          .not("csr_name", "is", null),
        supabase
          .from("monthly_performance_entries")
          .select("csr_name")
          .not("csr_name", "is", null),
      ]);

      if (weeklyResult.error && monthlyResult.error) {
        console.error("Unable to load CSR names:", weeklyResult.error, monthlyResult.error);
        return;
      }

      const dbNames = [
        ...(weeklyResult.data ?? []),
        ...(monthlyResult.data ?? []),
      ]
        .map(row => typeof row.csr_name === "string" ? row.csr_name.trim() : "")
        .filter(Boolean);

      if (!cancelled) {
        setCsrNames(prev =>
          Array.from(new Set([...prev, ...dbNames]))
            .sort((a, b) => a.localeCompare(b))
        );
      }
    };

    loadCSRNames();
    window.addEventListener("focus", loadCSRNames);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadCSRNames);
    };
  }, []);

  const fetchRecords = useCallback(async () => {
    if (!selectedCSR || !selectedMonth) return;
    setLoading(true); setError(null);
    setWeeklyRecords([]); setMonthlyRecord(null);

    const { data: weekly, error: wErr } = await supabase
      .from("performance_entries")
      .select("*")
      .eq("csr_name", selectedCSR)
      .eq("month", selectedMonth)
      .order("created_at", { ascending: true });

    const { data: monthly, error: mErr } = await supabase
      .from("monthly_performance_entries")
      .select("*")
      .eq("csr_name", selectedCSR)
      .eq("month", selectedMonth)
      .eq("status", "submitted")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (wErr && mErr) setError(wErr.message);
    else {
      setWeeklyRecords(weekly || []);
      setMonthlyRecord(monthly || null);
    }
    setLoading(false);
  }, [selectedCSR, selectedMonth]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // ── Selected period (a quarter or a custom month range) ──
  const isQuarterPeriod = periodType === "quarter";
  const periodMonths = useMemo(
    () => isQuarterPeriod ? QUARTERS[selectedQuarter] : monthsBetween(rangeFrom, rangeTo),
    [isQuarterPeriod, selectedQuarter, rangeFrom, rangeTo]
  );
  const periodKey   = periodMonths.join(",");
  const periodShort = isQuarterPeriod ? selectedQuarter : rangeShort(periodMonths);
  const periodLabel = isQuarterPeriod
    ? `${selectedQuarter} (${quarterRange(selectedQuarter)})`
    : `${rangeShort(periodMonths)} (${periodMonths.length} month${periodMonths.length > 1 ? "s" : ""})`;

  // ── Period fetch: all months in two queries ──
  const fetchQuarter = useCallback(async () => {
    if (viewMode !== "quarterly" || !selectedCSR || !periodKey) return;
    const months = periodKey.split(",");
    setQLoading(true); setQError(null); setQuarterly(null);

    const [w, m] = await Promise.all([
      supabase.from("performance_entries").select("*")
        .eq("csr_name", selectedCSR).in("month", months)
        .order("created_at", { ascending: true }),
      supabase.from("monthly_performance_entries").select("*")
        .eq("csr_name", selectedCSR).in("month", months)
        .eq("status", "submitted")
        .order("created_at", { ascending: false }),
    ]);

    if (w.error && m.error) setQError(w.error.message);
    else setQuarterly(buildQuarter(w.data || [], m.data || [], months));
    setQLoading(false);
  }, [viewMode, selectedCSR, periodKey]);

  useEffect(() => { fetchQuarter(); }, [fetchQuarter]);

  // Reset any open edit form if the selection or view changes
  useEffect(() => { setEditMode(false); setEditWeekTarget(null); }, [selectedCSR, selectedMonth, viewMode]);

  const monthly = useMemo(() => computeMonthStats(weeklyRecords, monthlyRecord), [weeklyRecords, monthlyRecord]);
  const isMonthlySource = !!monthly?.isMonthlySource;
  const hasAnyData = !!monthly;

  // ── Exports ──
  const exportCsrCSV = () => {
    if (!quarterly) return;
    const months = quarterly.months;
    const rows = [
      [isQuarterPeriod ? "Quarterly Performance Report" : "Period Performance Report"],
      ["CSR", selectedCSR],
      [isQuarterPeriod ? "Quarter" : "Period", `${periodShort} (${months.join(", ")})`],
      ["Months with data", `${quarterly.monthsPresent}/${months.length}`],
      ["Generated", new Date().toLocaleString()],
      [],
      ["Metric", periodShort, ...months],
      ["Data Source", `${quarterly.monthsPresent}/${months.length} months`, ...months.map(m => sourceLabel(quarterly.byMonth[m]))],
      ...EXPORT_METRICS.map(mt => [mt.label, metricCell(mt, quarterly), ...months.map(m => metricCell(mt, quarterly.byMonth[m]))]),
      [],
      ["Insight", autoQuarterlyInsight(quarterly.finalScore, quarterly.monthsPresent, months.length, isQuarterPeriod ? "quarter" : "period")],
      ["Strengths", autoStrengths(quarterly)],
      ["Opportunities", autoOpportunities(quarterly)],
      ["Action Plan", autoActionPlan(quarterly.finalScore)],
    ];
    downloadCSV(`${safeName(selectedCSR)}_${safeName(periodShort)}_${isQuarterPeriod ? "Quarterly" : "Period"}.csv`, rows);
  };

  const printScorecard = () => {
    const title = viewMode === "quarterly"
      ? `${selectedCSR} - ${periodShort} Scorecard`
      : `${selectedCSR} - ${selectedMonth} Scorecard`;
    printElement(document.querySelector(".print-area"), title);
  };

  const exportTeamCSV = async () => {
    const months = periodMonths;
    setExporting(true);
    try {
      const [w, m] = await Promise.all([
        supabase.from("performance_entries").select("*").in("month", months),
        supabase.from("monthly_performance_entries").select("*")
          .in("month", months).eq("status", "submitted"),
      ]);
      if (w.error && m.error) throw w.error;

      const weekly = w.data || [], monthlyRows = m.data || [];
      const norm = (n) => (typeof n === "string" ? n.trim() : "");
      const names = Array.from(new Set([...weekly, ...monthlyRows].map(r => norm(r.csr_name)).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b));

      const header = ["CSR", "Months with data", ...months.map(mo => `${mo} Final Score`), ...EXPORT_METRICS.map(mt => `${periodShort} ${mt.label}`)];
      const finalIdx = 2 + months.length; // column of the period Final Score
      const rows = names.map(name => {
        const q = buildQuarter(
          weekly.filter(r => norm(r.csr_name) === name),
          monthlyRows.filter(r => norm(r.csr_name) === name),
          months,
        );
        if (!q) return null;
        return [
          name,
          `${q.monthsPresent}/${months.length}`,
          ...months.map(mo => q.byMonth[mo] ? r2(q.byMonth[mo].finalScore) : ""),
          ...EXPORT_METRICS.map(mt => metricCell(mt, q)),
        ];
      }).filter(Boolean)
        .sort((a, b) => (Number(b[finalIdx]) || 0) - (Number(a[finalIdx]) || 0)); // rank by period final score

      if (!rows.length) { alert(`No data found for ${periodLabel}.`); return; }
      downloadCSV(`Team_${safeName(periodShort)}_${isQuarterPeriod ? "Quarterly" : "Period"}.csv`, [header, ...rows]);
    } catch (e) {
      alert("Export failed: " + (e?.message || e));
    } finally {
      setExporting(false);
    }
  };

  // ── Styles ──
  const iStyle = {
    background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:8,
    color:"#1e293b", padding:"8px 12px", fontSize:13, outline:"none",
    fontFamily:"inherit", boxShadow:"0 1px 3px rgba(0,0,0,0.06)",
  };

  const canEdit = isEntryEditor(user);

  const editBtnStyle = {
    background:"#c9a84c", border:"none", borderRadius:8, color:"#12101f",
    padding:"6px 14px", fontSize:12, fontWeight:800, cursor:"pointer",
    fontFamily:"inherit", whiteSpace:"nowrap",
  };
  const weekEditBtnStyle = {
    fontSize:10, padding:"3px 8px", borderRadius:6, border:"1px solid #bfdbfe",
    background:"#eff6ff", color:"#1d4ed8", cursor:"pointer", fontWeight:700, fontFamily:"inherit",
  };
  const exportBtnStyle = (primary) => ({
    background: primary ? "#1e3a8a" : "#fff",
    color: primary ? "#fff" : "#1e3a8a",
    border: "1.5px solid #1e3a8a", borderRadius:8,
    padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer",
    fontFamily:"inherit", whiteSpace:"nowrap",
  });
  const toggleBtn = (active) => ({
    padding:"6px 14px", fontSize:12, fontWeight:700, border:"none", cursor:"pointer",
    fontFamily:"inherit", background: active ? "#1e3a8a" : "transparent",
    color: active ? "#fff" : "#475569", borderRadius:6,
  });

  const isQuarterly = viewMode === "quarterly";

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", fontFamily:"'Inter','DM Sans',system-ui,sans-serif", color:"#1e293b", padding:"0 0 80px" }}>
      <style>{PRINT_CSS}</style>

      {/* ── Top Bar ── */}
      <div className="no-print" style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"14px 32px", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
        <span style={{ fontSize:16, fontWeight:800, color:"#1e293b", marginRight:4 }}>
          {isQuarterly
            ? (isQuarterPeriod ? "📊 Quarterly Performance Dashboard" : "📊 Period Performance Dashboard")
            : "📅 Monthly Performance Dashboard"}
        </span>

        <div style={{ display:"inline-flex", padding:3, background:"#f1f5f9", borderRadius:8, border:"1px solid #e2e8f0" }}>
          <button style={toggleBtn(!isQuarterly)} onClick={() => setViewMode("monthly")}>Monthly</button>
          <button style={toggleBtn(isQuarterly)} onClick={() => setViewMode("quarterly")}>Quarterly / Range</button>
        </div>

        <select value={selectedCSR} onChange={e => setSelectedCSR(e.target.value)} style={{ ...iStyle, minWidth:220 }}>
          <option value="">Select CSR…</option>
          {csrNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        {isQuarterly ? (
          <>
            <div style={{ display:"inline-flex", padding:3, background:"#f1f5f9", borderRadius:8, border:"1px solid #e2e8f0" }}>
              <button style={toggleBtn(isQuarterPeriod)} onClick={() => setPeriodType("quarter")}>Quarter</button>
              <button style={toggleBtn(!isQuarterPeriod)} onClick={() => setPeriodType("range")}>Month Range</button>
            </div>
            {isQuarterPeriod ? (
              <select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)} style={{ ...iStyle, minWidth:160 }}>
                {Object.keys(QUARTERS).map(q => <option key={q} value={q}>{q} ({quarterRange(q)})</option>)}
              </select>
            ) : (
              <div style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                <select value={rangeFrom} onChange={e => setRangeFrom(Number(e.target.value))} style={{ ...iStyle, minWidth:130 }}>
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>to</span>
                <select value={rangeTo} onChange={e => setRangeTo(Number(e.target.value))} style={{ ...iStyle, minWidth:130 }}>
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <span style={{ fontSize:11, color:"#94a3b8" }}>
                  {periodMonths.length} month{periodMonths.length > 1 ? "s" : ""}{rangeFrom > rangeTo ? " · crosses year-end" : ""}
                </span>
              </div>
            )}
          </>
        ) : (
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ ...iStyle, minWidth:140 }}>
            <option value="">Select month…</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        )}

        {/* Monthly right-side controls */}
        {!isQuarterly && monthly && !editMode && (
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
            <SourceBadge isMonthly={isMonthlySource} />
            <span style={{ fontSize:11, color:"#64748b" }}>
              {isMonthlySource
                ? `Full month entry · ${selectedMonth}`
                : `${monthly.weeksPresent} week${monthly.weeksPresent !== 1 ? "s" : ""} of data · ${selectedMonth}`}
            </span>
            {canEdit && isMonthlySource && (
              <button onClick={() => { setEditWeekTarget(null); setEditMode(true); }} style={editBtnStyle}>
                ✏️ Edit Monthly Entry
              </button>
            )}
            <button style={exportBtnStyle(false)} onClick={printScorecard}>🖨️ Print / PDF</button>
          </div>
        )}

        {/* Quarterly right-side controls */}
        {isQuarterly && (
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            {quarterly && !qLoading && (
              <>
                <span style={{ fontSize:11, color:"#64748b" }}>{quarterly.monthsPresent}/{quarterly.months.length} months of data</span>
                <button style={exportBtnStyle(true)} onClick={exportCsrCSV}>⬇️ Export CSV</button>
                <button style={exportBtnStyle(false)} onClick={printScorecard}>🖨️ Print / PDF</button>
              </>
            )}
            {canEdit && (
              <button style={exportBtnStyle(false)} onClick={exportTeamCSV} disabled={exporting}>
                {exporting ? "⏳ Exporting…" : `👥 Export Team ${periodShort}`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Empty state ── */}
      {!selectedCSR && (
        <div style={{ textAlign:"center", paddingTop:80 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>{isQuarterly ? "📊" : "📅"}</div>
          <p style={{ color:"#64748b", fontSize:16, fontWeight:600 }}>
            {isQuarterly ? "Select a CSR and a quarter or month range to view their scorecard." : "Select a CSR and month to view their monthly scorecard."}
          </p>
        </div>
      )}

      {/* ════════════════ QUARTERLY VIEW ════════════════ */}
      {isQuarterly && selectedCSR && (
        <>
          {qLoading && <div style={{ textAlign:"center", paddingTop:80 }}><p style={{ color:"#64748b" }}>⏳ Loading quarterly data…</p></div>}
          {qError && !qLoading && <div style={{ textAlign:"center", paddingTop:80 }}><p style={{ color:"#ef4444", fontWeight:600 }}>{qError}</p></div>}
          {!qLoading && !qError && !quarterly && (
            <div style={{ textAlign:"center", paddingTop:80 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>😕</div>
              <p style={{ color:"#ef4444", fontWeight:600 }}>No data found for {selectedCSR} in {periodLabel}.</p>
              <p style={{ color:"#94a3b8", fontSize:13, marginTop:8 }}>Enter data using the Data Entry or Monthly Entry tab.</p>
            </div>
          )}
          {!qLoading && quarterly && (
            <QuarterlyScorecard
              csr={selectedCSR}
              label={periodLabel}
              shortLabel={periodShort}
              isQuarter={isQuarterPeriod}
              q={quarterly}
              onOpenMonth={(m) => { setSelectedMonth(m); setViewMode("monthly"); }}
            />
          )}
        </>
      )}

      {/* ════════════════ MONTHLY VIEW ════════════════ */}
      {!isQuarterly && (
        <>
          {loading && <div style={{ textAlign:"center", paddingTop:80 }}><p style={{ color:"#64748b" }}>⏳ Loading monthly data…</p></div>}
          {error && !loading && <div style={{ textAlign:"center", paddingTop:80 }}><p style={{ color:"#ef4444", fontWeight:600 }}>{error}</p></div>}
          {!loading && !error && selectedCSR && selectedMonth && !hasAnyData && (
            <div style={{ textAlign:"center", paddingTop:80 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>😕</div>
              <p style={{ color:"#ef4444", fontWeight:600 }}>No data found for {selectedCSR} in {selectedMonth}.</p>
              <p style={{ color:"#94a3b8", fontSize:13, marginTop:8 }}>Enter data using the Data Entry or Monthly Entry tab.</p>
            </div>
          )}

          {/* ── EDIT MODE ── */}
          {editMode && monthly && (
            <div style={{ maxWidth:1100, margin:"0 auto", padding:"20px 24px" }}>
              {editWeekTarget ? (
                <DataEntryForm
                  user={user}
                  editEntry={{ csr_name: selectedCSR, month: selectedMonth, week: editWeekTarget }}
                  onSaved={() => { setEditMode(false); setEditWeekTarget(null); fetchRecords(); }}
                  onCancel={() => { setEditMode(false); setEditWeekTarget(null); }}
                />
              ) : (
                <MonthlyDataEntryForm
                  user={user}
                  editEntry={{ csr_name: selectedCSR, month: selectedMonth }}
                  onSaved={() => { setEditMode(false); fetchRecords(); }}
                  onCancel={() => setEditMode(false)}
                />
              )}
            </div>
          )}

          {/* ── SCORECARD ── */}
          {!editMode && monthly && !loading && (
            <div className="print-area" style={{ maxWidth:1100, margin:"0 auto", padding:"28px 24px" }}>

              {/* ── HEADER ── */}
              <div style={headerStyle}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontSize:11, color:"#a5b4fc", fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:6 }}>
                    Monthly Scorecard · {selectedMonth}
                  </div>
                  <div style={{ fontSize:28, fontWeight:900, color:"#fff", lineHeight:1.1, marginBottom:12 }}>{selectedCSR}</div>

                  {!isMonthlySource && monthly.byWeek && (
                    <div style={{ display:"flex", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                      {WEEKS.map(w => {
                        const rec = monthly.byWeek[w];
                        return <WeekChip key={w} week={w} hasData={!!rec} score={rec ? parseFloat(rec.final_score) : null} />;
                      })}
                    </div>
                  )}

                  {!isMonthlySource && monthly.byWeek && canEdit && (
                    <div className="no-print" style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
                      {WEEKS.filter(w => monthly.byWeek[w]).map(w => (
                        <button key={w} onClick={() => { setEditWeekTarget(w); setEditMode(true); }} style={weekEditBtnStyle}>
                          ✏️ Edit {w}
                        </button>
                      ))}
                    </div>
                  )}

                  {isMonthlySource && (
                    <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"8px 16px", borderRadius:10, background:"#ffffff18", border:"1px solid #ffffff30", marginBottom:14 }}>
                      <span style={{ fontSize:16 }}>📋</span>
                      <span style={{ fontSize:12, color:"#c7d2fe", fontWeight:600 }}>Full month evaluation · Weeks 1–4 combined</span>
                    </div>
                  )}

                  <div style={{ background:"#ffffff12", border:"1px solid #ffffff20", borderRadius:10, padding:"12px 16px", maxWidth:380 }}>
                    <div style={{ fontSize:10, color:"#a5b4fc", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>❝ Monthly Insight</div>
                    <p style={{ fontSize:12, color:"#e0e7ff", lineHeight:1.6, margin:0 }}>
                      {autoMonthlyInsight(monthly.finalScore, monthly.weeksPresent, isMonthlySource)}
                    </p>
                  </div>
                </div>
                <HeaderScoreBlock label={isMonthlySource ? "Monthly Score" : "Monthly Avg Score"} s={monthly} />
              </div>

              {/* ── MAIN GRID ── */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>
                <KpiCard s={monthly} />
                <BasisCard title={`Monthly ${isMonthlySource ? "Total" : "Avg"} Basis`} items={[
                  { icon:"🚚", label:"RTS %",             val: isNum(monthly.rtsRaw) ? (monthly.rtsRaw*100).toFixed(2)+"%" : "—", warn: isNum(monthly.rtsRaw) && monthly.rtsRaw > 0.15 },
                  { icon:"✅", label:"Delivery Success",  val: isNum(monthly.dsrRaw) ? (monthly.dsrRaw*100).toFixed(2)+"%" : "—" },
                  { icon:"📞", label:"Weekly RMO Rate",   val: isNum(monthly.rmoRaw) ? (monthly.rmoRaw > 1 ? monthly.rmoRaw.toFixed(2) : (monthly.rmoRaw*100).toFixed(2))+"%" : "—", warn: isNum(monthly.rmoRaw) && monthly.rmoRaw < 0.55 },
                  { icon:"⭐", label:"ESC Points",        val: isNum(monthly.escPoints) ? monthly.escPoints.toFixed(1) : "—", warn: isNum(monthly.escPoints) && monthly.escPoints < 9 },
                  { icon:"📈", label:"Conversion (ROAS)", val: isNum(monthly.convRoas) ? monthly.convRoas.toFixed(2) : "—" },
                  { icon:"🏷", label:"Upsell Rate",       val: isNum(monthly.upsRaw) ? (monthly.upsRaw > 1 ? monthly.upsRaw.toFixed(2) : (monthly.upsRaw*100).toFixed(2))+"%" : "—" },
                  { icon:"📦", label: isMonthlySource ? "Total Delivered" : "Avg Delivered", val: fmtPeso(monthly.delivered) },
                  { icon:"↩",  label: isMonthlySource ? "Total Returned"  : "Avg Returned",  val: fmtPeso(monthly.returned) },
                ]} />
                <KraBreakdownCard s={monthly} />
              </div>

              <BehavioralCard s={monthly} />

              {/* ── WEEK-BY-WEEK TREND — only for weekly source ── */}
              {!isMonthlySource && monthly.byWeek && (
                <div style={{ ...card(), marginBottom:16 }}>
                  <div style={sectionLabel("#64748b")}>Week-by-Week Final Score</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                    {WEEKS.map(w => {
                      const rec = monthly.byWeek[w];
                      const score = rec ? parseFloat(rec.final_score) : null;
                      const status = getStatus(score);
                      return (
                        <div key={w} style={{ background:"#f8fafc", border:`1.5px solid ${score !== null ? status.border : "#e2e8f0"}`, borderRadius:10, padding:"14px 16px", textAlign:"center" }}>
                          <div style={{ fontSize:10, color:"#94a3b8", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>{w}</div>
                          <div style={{ fontSize:26, fontWeight:900, color: score !== null ? status.color : "#cbd5e1" }}>{score !== null ? score.toFixed(2) : "—"}</div>
                          <div style={{ fontSize:10, color: score !== null ? status.color : "#94a3b8", marginTop:4, fontWeight:600 }}>{score !== null ? status.label : "No data"}</div>
                          {rec && <div style={{ fontSize:10, color:"#94a3b8", marginTop:4 }}>KRA: {parseFloat(rec.kra_total||0).toFixed(2)} · BI: {parseFloat(rec.bi_score||0).toFixed(2)}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── INSIGHTS ── */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                <InsightCard s={monthly} insight={autoMonthlyInsight(monthly.finalScore, monthly.weeksPresent, isMonthlySource)} />
                <GoalCards items={[
                  { icon:"🎯", label:"FOCUS", color:"#6366f1", text: isMonthlySource ? "Review all KPI scores and identify areas below target for next month." : `Push ${WEEKS.filter(w => !monthly.byWeek[w]).length > 0 ? "missing weeks data entry and " : ""}the lowest KPI consistently above target every week.` },
                  { icon:"🏁", label:"GOAL", color:"#16a34a", text: monthly.finalScore >= 4.5 ? "Maintain Outstanding and mentor teammates." : monthly.finalScore >= 4.0 ? "Break into the Outstanding tier next month." : monthly.finalScore >= 3.5 ? "Achieve Good Performance tier next month." : "Reach the Needs Monitoring tier through coaching." },
                  { icon:"🏅", label:"COMMITMENT", color:"#d97706", text:"Discipline today, excellence every day." },
                ]} />
              </div>

              {/* ── DATA COMPLETENESS ── */}
              <div style={{ ...card(), marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:800, color:"#64748b", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>Data Source</div>
                {isMonthlySource ? (
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:999, background:"#eff6ff", border:"1.5px solid #bfdbfe" }}>
                      <span>📅</span>
                      <span style={{ fontSize:12, fontWeight:700, color:"#1d4ed8" }}>Full Monthly Entry — Weeks 1–4 Combined</span>
                    </div>
                    <span style={{ fontSize:12, color:"#94a3b8" }}>Submitted via Monthly Data Entry Form</span>
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
                    {WEEKS.map(w => {
                      const has = !!monthly.byWeek[w];
                      return (
                        <div key={w} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:999, background: has ? "#f0fdf4" : "#f8fafc", border: has ? "1px solid #bbf7d0" : "1px solid #e2e8f0" }}>
                          <span style={{ fontSize:12 }}>{has ? "✅" : "⬜"}</span>
                          <span style={{ fontSize:12, fontWeight:600, color: has ? "#16a34a" : "#94a3b8" }}>{w}</span>
                        </div>
                      );
                    })}
                    <span style={{ fontSize:12, color:"#94a3b8", marginLeft:8 }}>
                      {monthly.weeksPresent}/4 weeks · Average based on available data
                    </span>
                  </div>
                )}
              </div>

              {/* ── FOOTER ── */}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderTop:"1px solid #e2e8f0", fontSize:11, color:"#94a3b8" }}>
                <span>Monthly Performance Dashboard · Generated {new Date().toLocaleDateString()}</span>
                <span>{selectedCSR} · {selectedMonth} · {isMonthlySource ? "Monthly Entry" : "Weekly Avg"}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
