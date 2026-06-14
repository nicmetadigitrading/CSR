import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

// ─── KPI BASIS FORMULAS (same as weekly) ─────────────────────────────────────

function calcRtsPct(delivered, forReturn, returned) {
  const d = parseFloat(delivered) || 0;
  const f = parseFloat(forReturn) || 0;
  const r = parseFloat(returned) || 0;
  const total = d + f + r;
  if (total === 0) return 0;
  return (f + r) / total;
}
function calcDeliverySuccessRate(delivered, forReturn, returned) {
  const d = parseFloat(delivered) || 0;
  const f = parseFloat(forReturn) || 0;
  const r = parseFloat(returned) || 0;
  const total = d + f + r;
  if (total === 0) return 0;
  return d / total;
}
function calcRtsKpiScore(rtsPct) {
  if (rtsPct <= 0.15) return 1.0;
  if (rtsPct <= 0.16) return 1.0 - (rtsPct - 0.15) * 10;
  if (rtsPct <= 0.17) return 0.9 - (rtsPct - 0.16) * 10;
  if (rtsPct <= 0.18) return 0.8 - (rtsPct - 0.17) * 10;
  return Math.max(0, 0.7 - (rtsPct - 0.18) * 2);
}
function calcEscKpiScore(escPoints) {
  const pts = parseFloat(escPoints);
  if (isNaN(pts) || escPoints === "") return null;
  if (pts === 0) return 0;
  if (pts === 21) return 1;
  if (pts >= 18) return 0.857 + ((pts - 18) / (21 - 18)) * (1 - 0.857);
  if (pts >= 15) return 0.714 + ((pts - 15) / (18 - 15)) * (0.857 - 0.714);
  if (pts >= 12) return 0.571 + ((pts - 12) / (15 - 12)) * (0.714 - 0.571);
  if (pts >= 9)  return 0.428 + ((pts - 9)  / (12 - 9))  * (0.571 - 0.428);
  if (pts >= 1)  return 0.001 + ((pts - 1)  / (9  - 1))  * (0.428 - 0.001);
  return 0;
}
function calcRmoKpiScore(rmoRate) {
  const raw = parseFloat(rmoRate) || 0;
  const h = raw > 1 ? raw / 100 : raw;
  if (h >= 0.85) return 1.0;
  if (h >= 0.75) return 0.90 + (h - 0.75) / (0.85 - 0.75) * 0.10;
  if (h >= 0.65) return 0.80 + (h - 0.65) / (0.75 - 0.65) * 0.10;
  if (h >= 0.55) return 0.70 + (h - 0.55) / (0.65 - 0.55) * 0.10;
  return 0.50;
}
function calcConversionKpiScore(roas) {
  const j = parseFloat(roas) || 0;
  if (j >= 6) return 1.0;
  if (j <= 1) return 0.30;
  return 0.30 + ((j - 1) / (6 - 1)) * 0.70;
}
function calcDeliverySuccessKpiScore(dsr) {
  const g = parseFloat(dsr) || 0;
  if (g >= 0.85) return 1.0;
  if (g >= 0.75) return 0.90 + (g - 0.75) / (0.85 - 0.75) * 0.10;
  if (g >= 0.65) return 0.80 + (g - 0.65) / (0.75 - 0.65) * 0.10;
  if (g >= 0.55) return 0.70 + (g - 0.55) / (0.65 - 0.55) * 0.10;
  return 0.50;
}
function calcUpsellKpiScore(upsellRate) {
  const raw = parseFloat(upsellRate) || 0;
  const k = raw > 1 ? raw / 100 : raw;
  if (k >= 0.40) return 1.0;
  if (k >= 0.35) return 0.90 + (k - 0.35) / (0.40 - 0.35) * 0.10;
  if (k >= 0.30) return 0.80 + (k - 0.30) / (0.35 - 0.30) * 0.10;
  if (k >= 0.25) return 0.70 + (k - 0.25) / (0.30 - 0.25) * 0.10;
  if (k >= 0.20) return 0.60 + (k - 0.20) / (0.25 - 0.20) * 0.10;
  if (k >= 0.15) return 0.50 + (k - 0.15) / (0.20 - 0.15) * 0.10;
  if (k >= 0.10) return 0.40 + (k - 0.10) / (0.15 - 0.10) * 0.10;
  return 0.20;
}
function kpiScoreToGrade(score) {
  const pct = score * 100;
  if (pct >= 100) return 5;
  if (pct >= 90)  return 4;
  if (pct >= 80)  return 3;
  if (pct >= 70)  return 2;
  return 1;
}

// ─── KPI STRUCTURE (same as weekly) ──────────────────────────────────────────

const KPI_SECTIONS = [
  {
    type: "BUSINESS PROCESS", kraKey: "kra_bp",
    groups: [
      {
        id: "1.1.0", label: "Sales Performance and Order Quality Monitoring", weight: 1,
        subs: [
          { id: "1.1.1", dbKey: "g_1_1_1", label: "Compliance to approved schedule — 0 incidents of tardiness per month", weight: 0.2 },
          { id: "1.1.2", dbKey: "g_1_1_2", label: "Compliance to attendance policy — 0 incidents of AWOL or unplanned absence", weight: 0.2 },
          { id: "1.1.3", dbKey: "g_1_1_3", label: "Compliance to VL Planner — 100% adherence to approved leave schedule", weight: 0.2 },
          { id: "1.1.4", dbKey: "g_1_1_4", label: "Compliance to breaktime policy — 0 incidents of overbreak", weight: 0.2 },
          { id: "1.1.5", dbKey: "g_1_1_5", label: "Order Risk Control Compliance — 100% adherence to verification and documentation standards", weight: 0.2, kpiBasisKey: "attendanceKpiScore" },
        ],
      },
      {
        id: "2.1.0", label: "Documentation & System Compliance", weight: 1,
        subs: [
          { id: "2.1.1", dbKey: "g_2_1_1", label: "Customer order documentation accuracy — 100% complete records in system", weight: 0.2 },
          { id: "2.1.2", dbKey: "g_2_1_2", label: "Customer verification documentation — 100% documented verification calls", weight: 0.2 },
          { id: "2.1.3", dbKey: "g_2_1_3", label: "Policy and process compliance — 100% adherence to order processing guidelines", weight: 0.2 },
          { id: "2.1.4", dbKey: "g_2_1_4", label: "Data confidentiality and accuracy — 0 incidents of data breach or incorrect customer information", weight: 0.2 },
        ],
      },
      {
        id: "3.1.0", label: "Order Processing & Workflow Integrity", weight: 1,
        subs: [
          { id: "3.1.1", dbKey: "g_3_1_1", label: "Order processing accuracy — ≥99% correct order handling", weight: 0.2 },
          { id: "3.1.2", dbKey: "g_3_1_2", label: "Processing timeliness — Orders processed within required timeline", weight: 0.2 },
          { id: "3.1.3", dbKey: "g_3_1_3", label: "RTS prevention compliance — All high-risk orders verified before processing", weight: 0.2, kpiBasisKey: "rtsKpiScore" },
          { id: "3.1.4", dbKey: "g_3_1_4", label: "Escalation compliance — 100% escalation of high-risk or uncertain cases to Team Leader", weight: 0.2 },
        ],
      },
    ],
  },
  {
    type: "CUSTOMER", kraKey: "kra_customer",
    groups: [
      {
        id: "4.1.0", label: "Customer Engagement & Retention Performance", weight: 1,
        subs: [
          { id: "4.1.1", dbKey: "g_4_1_1", label: "Conversion Rate — Meet daily conversion target", weight: 0.25, kpiBasisKey: "conversionKpiScore" },
          { id: "4.1.2", dbKey: "g_4_1_2", label: "Consistent Follow-Ups — 100% daily follow-up completion", weight: 0.25, kpiBasisKey: "rmoKpiScore" },
          { id: "4.1.3", dbKey: "g_4_1_3", label: "Customer Retention Tracking — All follow-ups and reorders logged in retention tracker", weight: 0.25 },
          { id: "4.1.4", dbKey: "g_4_1_4", label: "Verified Calls — 100% verified customer information", weight: 0.25 },
        ],
      },
    ],
  },
  {
    type: "PEOPLE DEVELOPMENT", kraKey: "kra_people",
    groups: [
      {
        id: "5.1.0", label: "Team & Skill Development", weight: 1,
        subs: [
          { id: "5.1.1", dbKey: "g_5_1_1", label: "Participation in Team Huddles — 100% attendance", weight: 0.3334 },
          { id: "5.1.2", dbKey: "g_5_1_2", label: "Collaboration with Team Members — Consistent coordination and support", weight: 0.3333 },
          { id: "5.1.3", dbKey: "g_5_1_3", label: "Adaptability & Continuous Learning — Active adoption of feedback", weight: 0.3333, kpiBasisKey: "escKpiScore" },
        ],
      },
    ],
  },
  {
    type: "FINANCIALS", kraKey: "kra_financial",
    groups: [
      {
        id: "6.1.0", label: "Sales & Profit Contribution", weight: 1,
        subs: [
          { id: "6.1.1", dbKey: "g_6_1_1", label: "Sales Encoding Accuracy — 100% accurate encoding", weight: 0.5 },
          { id: "6.1.2", dbKey: "g_6_1_2", label: "Upselling Conversion Rate — Meet upselling target", weight: 0.5, kpiBasisKey: "upsellKpiScore" },
          { id: "6.1.3", dbKey: "g_6_1_3", label: "ROAS Performance — Maintain required ROAS level", weight: 0.5, kpiBasisKey: "conversionKpiScore" },
          { id: "6.1.4", dbKey: "g_6_1_4", label: "RTS Rate Compliance — Maintain RTS ≤ 15%", weight: 0.5, kpiBasisKey: "rtsKpiScore" },
        ],
      },
    ],
  },
];

const BEHAVIOURAL_INDICATORS = [
  { id: "bi1", label: "Attendance & Reliability — Maintains consistent attendance and punctuality", weight: 0.2, kpiBasisKey: "attendanceKpiScore" },
  { id: "bi2", label: "Accountability & Compliance — Follows HR, sales, and company policies diligently", weight: 0.2 },
  { id: "bi3", label: "Initiative & Adaptability — Shows willingness to learn and adjust to operational changes", weight: 0.2 },
  { id: "bi4", label: "Professionalism & Collaboration — Communicates respectfully and maintains teamwork", weight: 0.2 },
  { id: "bi5", label: "Extreme Self-Care & Mindfulness — Practices emotional balance and maintains focus", weight: 0.2, kpiBasisKey: "escKpiScore" },
];

const KRA_WEIGHTS = { "BUSINESS PROCESS": 0.25, CUSTOMER: 0.25, "PEOPLE DEVELOPMENT": 0.25, FINANCIALS: 0.25 };
const SCALE_LABELS = { 0: "0%", 1: "60% Below", 2: "70%", 3: "80%", 4: "90%", 5: "100%" };
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const QUARTERS = { Q1:["January","February","March"], Q2:["April","May","June"], Q3:["July","August","September"], Q4:["October","November","December"] };
const WEEKS = ["Week 1", "Week 2", "Week 3", "Week 4"];
const TEAMS = [
  "Team Keljash","Team Tristan","Team Knathan","Team Lowii",
  "Team Krizia","Team Bryan","Team Wendell","Team Pikutin","Team Mark",
];
const CSR_NAMES = [
  "ALPHE BALAKID","CEDRIC JOSH DENIEGA","CHYNNA TORNO","ERVIN ESCARDA",
  "FRANZGIAN CASTOR","JERALD BYRON CEPE","KATE VALEIZZE HOPE PEDARSE",
  "KENNETH ELBANBUENA","LANCE BORLADO","PRINCESS ALEYAH BORLADO",
  "RACHEL HATE","RAINE CHAVEZ","RAZEL HILA","RHEA MAE TUGADO",
  "ROXANNE SOLIS","VENICE CUATON","YANO HITOSIS","ANGELO PROVIDO",
];
const sectionColors = {
  "BUSINESS PROCESS": "#6366f1", CUSTOMER: "#0ea5e9",
  "PEOPLE DEVELOPMENT": "#10b981", FINANCIALS: "#f59e0b",
};

// ─── SCORING HELPERS ──────────────────────────────────────────────────────────

function calcSubRating(val) {
  if (val === "" || val === null || val === undefined) return null;
  const num = parseFloat(val);
  if (isNaN(num) || num < 0 || num > 5) return null;
  return num;
}
function calcGroupScore(group, grades) {
  let total = 0, totalW = 0;
  for (const sub of group.subs) {
    const r = calcSubRating(grades[sub.id]);
    if (r === null) return null;
    total += r * sub.weight; totalW += sub.weight;
  }
  return totalW > 0 ? total / totalW : null;
}
function calcKraScore(section, grades) {
  const scores = section.groups.map(g => calcGroupScore(g, grades)).filter(s => s !== null);
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
function calcBehaviouralScore(grades) {
  let total = 0, totalW = 0;
  for (const b of BEHAVIOURAL_INDICATORS) {
    const r = calcSubRating(grades[b.id]);
    if (r === null) return null;
    total += r * b.weight; totalW += b.weight;
  }
  return totalW > 0 ? total / totalW : null;
}
function ratingLabel(score) {
  if (score === null) return "—";
  if (score >= 4.5) return "Outstanding";
  if (score >= 3.5) return "Exceeds Expectations";
  if (score >= 2.5) return "Meets Expectations";
  if (score >= 1.5) return "Needs Improvement";
  return "Unsatisfactory";
}
function ratingColor(score) {
  if (score === null) return "#94a3b8";
  if (score >= 4.5) return "#22c55e";
  if (score >= 3.5) return "#84cc16";
  if (score >= 2.5) return "#f59e0b";
  if (score >= 1.5) return "#f97316";
  if (score >= 0.5) return "#ef4444";
  return "#64748b";
}
function buildInitialGrades() {
  const g = {};
  KPI_SECTIONS.forEach(sec => sec.groups.forEach(grp => grp.subs.forEach(s => { g[s.id] = ""; })));
  BEHAVIOURAL_INDICATORS.forEach(b => { g[b.id] = ""; });
  return g;
}
function buildInitialWeekBasis() {
  return {
    delivered: "", forReturn: "", returned: "",
    attendanceKpiScore: "", weeklyRmoRate: "",
    escPoints: "", conversionRoas: "", upsellRate: "",
  };
}
function getQuarterFromMonth(month) {
  for (const [q, months] of Object.entries(QUARTERS)) {
    if (months.includes(month)) return q;
  }
  return "";
}
function pct(val) { return val !== null && val !== undefined ? (val * 100).toFixed(1) + "%" : "—"; }

// Average a field across all 4 weeks (ignoring empty)
function avgWeekBasis(weekBases, key) {
  const vals = weekBases
  .filter(wb => wb[key] !== "")
  .map(wb => parseFloat(wb[key]))
  .filter(v => !isNaN(v));
  const nonEmpty = WEEKS.map((_, i) => parseFloat(weekBases[i][key])).filter(v => !isNaN(v));
  if (!nonEmpty.length) return 0;
  return nonEmpty.reduce((a, b) => a + b, 0) / nonEmpty.length;
}
function sumWeekBasis(weekBases, key) {
  return WEEKS.map((_, i) => parseFloat(weekBases[i][key]) || 0).reduce((a, b) => a + b, 0);
}

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function GradeSelect({ value, onChange, id, suggested, disabled }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {suggested && !disabled && (
        <span title="Auto-suggested from KPI Basis" style={{
          fontSize: 10, padding: "1px 6px", borderRadius: 4,
          background: "#6366f122", color: "#818cf8", fontWeight: 700, whiteSpace: "nowrap",
        }}>
          💡 {suggested}
        </span>
      )}
      <select
        value={value}
        onChange={e => onChange(id, e.target.value)}
        disabled={disabled}
        style={{
          width: 70, padding: "4px 6px",
          border: value ? "1.5px solid #6366f1" : "1.5px solid #334155",
          borderRadius: 6, background: disabled ? "#0d1729" : "#0f172a",
          color: disabled ? "#475569" : value ? "#e2e8f0" : "#64748b",
          fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", outline: "none",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <option value="">—</option>
        {[0,1,2,3,4,5].map(grade => <option key={grade} value={grade}>{grade} — {SCALE_LABELS[grade]}</option>)}
      </select>
    </div>
  );
}

function ScorePill({ score, size = "sm" }) {
  if (score === null) return <span style={{ color: "#475569", fontSize: 12 }}>—</span>;
  const color = ratingColor(score);
  return (
    <span style={{
      display: "inline-block", padding: size === "lg" ? "4px 14px" : "2px 8px",
      borderRadius: 20, background: color + "22", color, fontWeight: 700,
      fontSize: size === "lg" ? 15 : 12, border: `1px solid ${color}55`,
    }}>
      {score.toFixed(2)}
    </span>
  );
}

function EntryStatusBadge({ status, checking }) {
  if (checking) {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "5px 12px", borderRadius: 20,
        background: "#1e293b", border: "1.5px solid #334155",
        fontSize: 12, color: "#64748b", fontWeight: 600,
      }}>
        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", border: "2px solid #6366f1", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
        Checking…
      </div>
    );
  }
  if (!status) return null;
  const cfg = {
    draft:     { bg: "#f59e0b22", border: "#f59e0b", color: "#f59e0b", icon: "✏️", label: "Draft — In Progress" },
    submitted: { bg: "#22c55e22", border: "#22c55e", color: "#22c55e", icon: "✅", label: "Submitted — Read Only" },
    new:       { bg: "#6366f122", border: "#6366f1", color: "#818cf8", icon: "🆕", label: "New Monthly Entry" },
  }[status] || {};
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 14px", borderRadius: 20,
      background: cfg.bg, border: `1.5px solid ${cfg.border}`,
      fontSize: 12, color: cfg.color, fontWeight: 700,
    }}>
      {cfg.icon} {cfg.label}
    </div>
  );
}

function SectionBlock({ section, grades, onChange, suggestedGrades, disabled }) {
  const [collapsed, setCollapsed] = useState(false);
  const color = sectionColors[section.type] || "#6366f1";
  const kraScore = calcKraScore(section, grades);
  return (
    <div style={{ marginBottom: 24 }}>
      <div onClick={() => setCollapsed(c => !c)} style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px", background: color + "18",
        borderLeft: `4px solid ${color}`, borderRadius: "0 8px 8px 0",
        marginBottom: collapsed ? 0 : 12, cursor: "pointer", userSelect: "none",
      }}>
        <span style={{ fontWeight: 800, color, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", flex: 1 }}>{section.type}</span>
        <span style={{ fontSize: 11, color: "#94a3b8", marginRight: 6 }}>KRA Score</span>
        <ScorePill score={kraScore} />
        <span style={{ color: "#475569", fontSize: 12, marginLeft: 8 }}>{collapsed ? "▸" : "▾"}</span>
      </div>
      {!collapsed && section.groups.map(group => {
        const grpScore = calcGroupScore(group, grades);
        return (
          <div key={group.id} style={{ marginBottom: 16, marginLeft: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#1e293b", borderRadius: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 10, color, fontWeight: 700, minWidth: 36 }}>{group.id}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{group.label}</span>
              <span style={{ fontSize: 11, color: "#64748b", marginRight: 6 }}>Score</span>
              <ScorePill score={grpScore} />
            </div>
            {group.subs.map(sub => (
              <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px 7px 24px", borderBottom: "1px solid #1e293b" }}>
                <span style={{ fontSize: 10, color: "#475569", minWidth: 36 }}>{sub.id}</span>
                <span style={{ flex: 1, fontSize: 12, color: "#94a3b8", lineHeight: 1.4 }}>{sub.label}</span>
                <span style={{ fontSize: 10, color: "#475569", minWidth: 55, textAlign: "right" }}>W: {(sub.weight * 100).toFixed(0)}%</span>
                <GradeSelect
                  value={grades[sub.id]}
                  onChange={onChange}
                  id={sub.id}
                  suggested={sub.kpiBasisKey && suggestedGrades[sub.kpiBasisKey] ? suggestedGrades[sub.kpiBasisKey] : null}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── MONTHLY KPI BASIS PANEL ──────────────────────────────────────────────────
// Per-week columns for raw numbers, auto-averages for KPI scores

function MonthlyKpiBasisPanel({ weekBases, setWeekBases, computed, onApplySuggested, disabled }) {
  const inputStyle = (dis) => ({
    background: dis ? "#0d1729" : "#0f172a",
    border: "1.5px solid #334155", borderRadius: 6,
    color: dis ? "#475569" : "#e2e8f0",
    padding: "5px 8px", fontSize: 12, outline: "none",
    width: "100%", boxSizing: "border-box", fontFamily: "inherit",
    cursor: dis ? "not-allowed" : "text",
    opacity: dis ? 0.6 : 1,
  });

  const fields = [
    { key: "delivered",          label: "Delivered" },
    { key: "forReturn",          label: "For Return" },
    { key: "returned",           label: "Returned" },
    { key: "attendanceKpiScore", label: "Attendance Score (1–5)" },
    { key: "weeklyRmoRate",      label: "RMO Rate (decimal)" },
    { key: "escPoints",          label: "ESC Points (max 21)" },
    { key: "conversionRoas",     label: "Conversion ROAS" },
    { key: "upsellRate",         label: "Upsell Rate (decimal)" },
  ];

  const updateWeek = (weekIdx, key, val) => {
    setWeekBases(prev => prev.map((wb, i) => i === weekIdx ? { ...wb, [key]: val } : wb));
  };

  const scoreRow = (label, value, grade) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1e293b" }}>
      <span style={{ fontSize: 12, color: "#94a3b8" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: "#64748b" }}>{value}</span>
        {grade !== undefined && grade !== null && (
          <span style={{ fontSize: 12, fontWeight: 700, padding: "1px 8px", borderRadius: 4, background: ratingColor(grade) + "22", color: ratingColor(grade) }}>
            Grade {grade}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ background: "#0d1729", border: "1px solid #1e293b", borderRadius: 12, padding: "24px 20px", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            📊 Monthly KPI Basis — Raw Numbers per Week
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
            {disabled ? "This entry is read-only (submitted)." : "Enter raw data per week. Monthly averages/totals are auto-computed for KPI scoring."}
          </div>
        </div>
        {!disabled && (
          <button onClick={onApplySuggested} style={{
            padding: "8px 18px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg,#6366f1,#4f46e5)",
            color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}>
            ⚡ Apply All Suggested Grades
          </button>
        )}
      </div>

      {/* Per-week table */}
      <div style={{ overflowX: "auto", marginBottom: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 10px", color: "#64748b", fontWeight: 700, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", background: "#080f1f", borderBottom: "1px solid #1e293b", minWidth: 180 }}>Field</th>
              {WEEKS.map(w => (
                <th key={w} style={{ textAlign: "center", padding: "8px 10px", color: "#6366f1", fontWeight: 700, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", background: "#080f1f", borderBottom: "1px solid #1e293b", minWidth: 110 }}>{w}</th>
              ))}
              <th style={{ textAlign: "center", padding: "8px 10px", color: "#94a3b8", fontWeight: 700, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", background: "#080f1f", borderBottom: "1px solid #1e293b", minWidth: 90 }}>Monthly Total / Avg</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f, fi) => {
              const isSum = ["delivered", "forReturn", "returned"].includes(f.key);
              const vals = WEEKS.map((_, i) => parseFloat(weekBases[i][f.key])).filter(v => !isNaN(v));
              const agg = vals.length
                ? isSum
                  ? vals.reduce((a, b) => a + b, 0)
                  : vals.reduce((a, b) => a + b, 0) / vals.length
                : null;
              return (
                <tr key={f.key} style={{ background: fi % 2 === 0 ? "#0f172a" : "#0d1729" }}>
                  <td style={{ padding: "6px 10px", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>{f.label}</td>
                  {WEEKS.map((_, wi) => (
                    <td key={wi} style={{ padding: "4px 6px", textAlign: "center" }}>
                      <input
                        type="number"
                        step="any"
                        placeholder="—"
                        value={weekBases[wi][f.key]}
                        onChange={e => updateWeek(wi, f.key, e.target.value)}
                        disabled={disabled}
                        style={inputStyle(disabled)}
                      />
                    </td>
                  ))}
                  <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: 700, color: agg !== null ? "#e2e8f0" : "#334155", fontSize: 13 }}>
                    {agg !== null ? (isSum ? agg.toFixed(0) : agg.toFixed(3)) : "—"}
                    <span style={{ fontSize: 9, color: "#475569", display: "block" }}>{isSum ? "total" : "avg"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Auto-computed scores */}
      <div style={{ background: "#080f1f", border: "1px solid #1e293b", borderRadius: 10, padding: "16px 20px" }}>
        <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
          Monthly Auto-Computed KPI Scores → Suggested Grades
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          {scoreRow("Monthly RTS %", pct(computed.rtsPct), computed.rtsGrade)}
          {scoreRow("Monthly Delivery Success Rate", pct(computed.dsr), computed.dsrGrade)}
          {scoreRow("RTS KPI Score", pct(computed.rtsKpiScore), computed.rtsGrade)}
          {scoreRow("Delivery Success KPI Score", pct(computed.dsrKpiScore), computed.dsrGrade)}
          {scoreRow("Avg RMO KPI Score", pct(computed.rmoKpiScore), computed.rmoGrade)}
          {scoreRow("Avg Conversion KPI Score", pct(computed.conversionKpiScore), computed.conversionGrade)}
          {scoreRow("Avg ESC KPI Score", pct(computed.escKpiScore), computed.escGrade)}
          {scoreRow("Avg Upsell Rate KPI Score", pct(computed.upsellKpiScore), computed.upsellGrade)}
        </div>
        {!disabled && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: "#1e293b", borderRadius: 8, fontSize: 11, color: "#64748b" }}>
            💡 Click <strong style={{ color: "#818cf8" }}>⚡ Apply All Suggested Grades</strong> to automatically fill relevant KPI fields from these monthly averages.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function MonthlyDataEntryForm({ user }) {
  const [employeeName, setEmployeeName] = useState("");
  const [customName, setCustomName] = useState("");
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [supervisorRemarks, setSupervisorRemarks] = useState("");
  const [employeeComments, setEmployeeComments] = useState("");
  const [grades, setGrades] = useState(buildInitialGrades);
  const [toast, setToast] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  // Per-week KPI basis (4 weeks)
  const [weekBases, setWeekBases] = useState([
    buildInitialWeekBasis(),
    buildInitialWeekBasis(),
    buildInitialWeekBasis(),
    buildInitialWeekBasis(),
  ]);

  // Entry lock state
  const [entryStatus, setEntryStatus]     = useState(null);
  const [existingId, setExistingId]       = useState(null);
  const [checkingEntry, setCheckingEntry] = useState(false);

  // Pending monthly drafts
  const [pendingDrafts, setPendingDrafts]     = useState([]);
  const [draftsLoading, setDraftsLoading]     = useState(false);
  const [draftsCollapsed, setDraftsCollapsed] = useState(false);

  const resolvedName = employeeName === "__custom__" ? customName : employeeName;
  const isReadOnly   = entryStatus === "submitted";

  // Fetch monthly drafts
  useEffect(() => {
    const fetchDrafts = async () => {
      setDraftsLoading(true);
      const { data } = await supabase
        .from("monthly_performance_entries")
        .select("id, csr_name, month, final_score, last_updated_at, last_updated_by")
        .eq("status", "draft")
        .order("last_updated_at", { ascending: false });
      setPendingDrafts(data || []);
      setDraftsLoading(false);
    };
    fetchDrafts();
  }, []);

  const refreshDrafts = async () => {
    const { data } = await supabase
      .from("monthly_performance_entries")
      .select("id, csr_name, month, final_score, last_updated_at, last_updated_by")
      .eq("status", "draft")
      .order("last_updated_at", { ascending: false });
    setPendingDrafts(data || []);
  };

  const handleContinueDraft = (draft) => {
    const nameInList = CSR_NAMES.includes(draft.csr_name);
    if (nameInList) { setEmployeeName(draft.csr_name); setCustomName(""); }
    else { setEmployeeName("__custom__"); setCustomName(draft.csr_name); }
    setSelectedMonth(draft.month);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleTeam = (team) => {
    if (isReadOnly) return;
    setSelectedTeams(prev => {
      if (prev.includes(team)) return prev.filter(t => t !== team);
      if (prev.length >= 2) return prev;
      return [...prev, team];
    });
  };

  // ── Auto-check for existing monthly entry ──
  const checkTimeoutRef = useRef(null);
  useEffect(() => {
    if (!resolvedName || !selectedMonth) {
      setEntryStatus(null); setExistingId(null); return;
    }
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    checkTimeoutRef.current = setTimeout(async () => {
      setCheckingEntry(true);
      try {
        const { data, error } = await supabase
          .from("monthly_performance_entries")
          .select("*")
          .eq("csr_name", resolvedName)
          .eq("month", selectedMonth)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setExistingId(data.id);
          setEntryStatus(data.status || "draft");
          loadEntryIntoForm(data);
        } else {
          setExistingId(null);
          setEntryStatus("new");
        }
      } catch (err) {
        console.error("Entry check error:", err);
        setEntryStatus("new");
      } finally {
        setCheckingEntry(false);
      }
    }, 350);
    return () => { if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current); };
  }, [resolvedName, selectedMonth]);

  const loadEntryIntoForm = (row) => {
    if (Array.isArray(row.teams)) setSelectedTeams(row.teams);
    else if (row.teams) setSelectedTeams([row.teams]);
    else if (row.team) setSelectedTeams([row.team]);
    else setSelectedTeams([]);

    setPeriodFrom(row.period_from || "");
    setPeriodTo(row.period_to || "");
    setSupervisorRemarks(row.supervisor_remarks || "");
    setEmployeeComments(row.employee_comments || "");

    // Load per-week basis from JSON column
    if (row.week_bases && Array.isArray(row.week_bases)) {
      setWeekBases(row.week_bases.map(wb => ({
        delivered:           wb.delivered           ?? "",
        forReturn:           wb.forReturn           ?? "",
        returned:            wb.returned            ?? "",
        attendanceKpiScore:  wb.attendanceKpiScore  ?? "",
        weeklyRmoRate:       wb.weeklyRmoRate       ?? "",
        escPoints:           wb.escPoints           ?? "",
        conversionRoas:      wb.conversionRoas      ?? "",
        upsellRate:          wb.upsellRate          ?? "",
      })));
    } else {
      setWeekBases([buildInitialWeekBasis(), buildInitialWeekBasis(), buildInitialWeekBasis(), buildInitialWeekBasis()]);
    }

    // Load grades
    const newGrades = buildInitialGrades();
    KPI_SECTIONS.forEach(sec =>
      sec.groups.forEach(grp =>
        grp.subs.forEach(sub => {
          const v = row[sub.dbKey];
          newGrades[sub.id] = v !== null && v !== undefined ? String(v) : "";
        })
      )
    );
    BEHAVIOURAL_INDICATORS.forEach(b => {
      const v = row[b.id];
      newGrades[b.id] = v !== null && v !== undefined ? String(v) : "";
    });
    setGrades(newGrades);
  };

  const handleGrade = useCallback((id, val) => {
    setGrades(prev => ({ ...prev, [id]: val }));
  }, []);

  // ── Compute monthly KPI scores from aggregated week data ──
  const computed = useMemo(() => {
    // For delivered/forReturn/returned: SUM across weeks (total month)
    const totalDelivered = sumWeekBasis(weekBases, "delivered");
    const totalForReturn = sumWeekBasis(weekBases, "forReturn");
    const totalReturned  = sumWeekBasis(weekBases, "returned");

    // For rates: AVG across weeks
    const avgRmoRate    = avgWeekBasis(weekBases, "weeklyRmoRate");
    const avgConvRoas   = avgWeekBasis(weekBases, "conversionRoas");
    const avgEscPoints  = avgWeekBasis(weekBases, "escPoints");
    const avgUpsellRate = avgWeekBasis(weekBases, "upsellRate");
    const avgAttScore   = avgWeekBasis(weekBases, "attendanceKpiScore");

    const rtsPct = calcRtsPct(totalDelivered, totalForReturn, totalReturned);
    const dsr    = calcDeliverySuccessRate(totalDelivered, totalForReturn, totalReturned);
    const rtsKpiScore         = calcRtsKpiScore(rtsPct);
    const dsrKpiScore         = calcDeliverySuccessKpiScore(dsr);
    const rmoKpiScore         = calcRmoKpiScore(avgRmoRate);
    const conversionKpiScore  = calcConversionKpiScore(avgConvRoas);
    const escKpiScore         = calcEscKpiScore(avgEscPoints);
    const upsellKpiScore      = calcUpsellKpiScore(avgUpsellRate);

    return {
      rtsPct, dsr,
      rtsKpiScore, dsrKpiScore, rmoKpiScore, conversionKpiScore, escKpiScore, upsellKpiScore,
      rtsGrade:        kpiScoreToGrade(rtsKpiScore),
      dsrGrade:        kpiScoreToGrade(dsrKpiScore),
      rmoGrade:        kpiScoreToGrade(rmoKpiScore),
      conversionGrade: kpiScoreToGrade(conversionKpiScore),
      escGrade:        kpiScoreToGrade(escKpiScore),
      upsellGrade:     kpiScoreToGrade(upsellKpiScore),
      attendanceGrade: avgAttScore || null,
      // aggregated raw (for payload)
      totalDelivered, totalForReturn, totalReturned,
      avgRmoRate, avgConvRoas, avgEscPoints, avgUpsellRate, avgAttScore,
    };
  }, [weekBases]);

  const suggestedGrades = useMemo(() => ({
    rtsKpiScore:        computed.rtsGrade,
    dsrKpiScore:        computed.dsrGrade,
    rmoKpiScore:        computed.rmoGrade,
    conversionKpiScore: computed.conversionGrade,
    escKpiScore:        computed.escGrade,
    upsellKpiScore:     computed.upsellGrade,
    attendanceKpiScore: computed.attendanceGrade,
  }), [computed]);

  const handleApplySuggested = useCallback(() => {
    if (isReadOnly) return;
    setGrades(prev => {
      const next = { ...prev };
      KPI_SECTIONS.forEach(sec =>
        sec.groups.forEach(grp =>
          grp.subs.forEach(sub => {
            if (sub.kpiBasisKey && suggestedGrades[sub.kpiBasisKey]) {
              next[sub.id] = String(suggestedGrades[sub.kpiBasisKey]);
            }
          })
        )
      );
      BEHAVIOURAL_INDICATORS.forEach(bi => {
        if (bi.kpiBasisKey && suggestedGrades[bi.kpiBasisKey]) {
          next[bi.id] = String(suggestedGrades[bi.kpiBasisKey]);
        }
      });
      return next;
    });
  }, [suggestedGrades, isReadOnly]);

  // ── KRA / Final scores ──
  const kraScores = {};
  KPI_SECTIONS.forEach(sec => { kraScores[sec.type] = calcKraScore(sec, grades); });
  const kraTypes = Object.keys(KRA_WEIGHTS);
  let kraTotal = null;
  if (kraTypes.every(t => kraScores[t] !== null)) {
    kraTotal = kraTypes.reduce((sum, t) => sum + kraScores[t] * KRA_WEIGHTS[t], 0);
  }
  const biScore    = calcBehaviouralScore(grades);
  let finalScore   = null;
  if (kraTotal !== null && biScore !== null) {
    finalScore = kraTotal * 0.7 + biScore * 0.3;
  }

  const showToast = (type, msg) => {
    setToast(type); setToastMsg(msg);
    if (type !== "saving") setTimeout(() => setToast(null), 4000);
  };

  // ── Build payload ──
  const buildPayload = (status) => {
    const gradePayload = {};
    KPI_SECTIONS.forEach(sec => sec.groups.forEach(grp => grp.subs.forEach(sub => {
      gradePayload[sub.dbKey] = grades[sub.id] !== "" ? parseFloat(grades[sub.id]) : null;
    })));
    BEHAVIOURAL_INDICATORS.forEach(b => {
      gradePayload[b.id] = grades[b.id] !== "" ? parseFloat(grades[b.id]) : null;
    });
    const kraPayload = {};
    KPI_SECTIONS.forEach(sec => {
      kraPayload[sec.kraKey] = kraScores[sec.type] !== null ? +kraScores[sec.type].toFixed(4) : null;
    });
    const quarter = getQuarterFromMonth(selectedMonth);
    const year    = periodFrom ? new Date(periodFrom).getFullYear() : new Date().getFullYear();

    return {
      csr_name: resolvedName,
      teams: selectedTeams,
      period_from: periodFrom || null,
      period_to:   periodTo   || null,
      month: selectedMonth,
      week: "Monthly", // mark as monthly entry
      year, quarter,
      // store per-week raw data as JSON
      week_bases: weekBases,
      // aggregated KPI basis (monthly totals/avgs)
      delivered:              computed.totalDelivered || null,
      for_return:             computed.totalForReturn || null,
      returned:               computed.totalReturned  || null,
      attendance_kpi_score:   computed.avgAttScore    || null,
      weekly_rmo_rate:        computed.avgRmoRate      || null,
      esc_points:             computed.avgEscPoints    || null,
      conversion_roas:        computed.avgConvRoas     || null,
      upsell_rate:            computed.avgUpsellRate   || null,
      // computed KPI scores
      rts_pct:                       +computed.rtsPct.toFixed(4),
      delivery_success_rate:         +computed.dsr.toFixed(4),
      rts_kpi_score:                 +computed.rtsKpiScore.toFixed(4),
      esc_kpi_score:                 +computed.escKpiScore.toFixed(4),
      rmo_kpi_score:                 +computed.rmoKpiScore.toFixed(4),
      conversion_kpi_score:          +computed.conversionKpiScore.toFixed(4),
      delivery_success_kpi_score:    +computed.dsrKpiScore.toFixed(4),
      upsell_kpi_score:              +computed.upsellKpiScore.toFixed(4),
      ...gradePayload, ...kraPayload,
      kra_total:    kraTotal   !== null ? +kraTotal.toFixed(4)   : null,
      bi_score:     biScore    !== null ? +biScore.toFixed(4)    : null,
      final_score:  finalScore !== null ? +finalScore.toFixed(4) : null,
      supervisor_remarks:  supervisorRemarks,
      employee_comments:   employeeComments,
      last_updated_by:     user?.email || "unknown",
      last_updated_at:     new Date().toISOString(),
      status,
    };
  };

  const handleSave = async (saveStatus) => {
    if (!resolvedName)   { showToast("error", "Please select an employee name."); return; }
    if (!selectedMonth)  { showToast("error", "Please select a month."); return; }
    if (saveStatus === "submitted" && (kraTotal === null || biScore === null)) {
      showToast("error", "Please complete all grades before submitting."); return;
    }

    showToast("saving", "Saving…");
    const payload = buildPayload(saveStatus);

    let error;
    if (existingId) {
      const result = await supabase.from("monthly_performance_entries").update(payload).eq("id", existingId);
      error = result.error;
    } else {
      const result = await supabase.from("monthly_performance_entries").insert([payload]).select("id").single();
      error = result.error;
      if (!error && result.data) setExistingId(result.data.id);
    }

    if (error) {
      console.error(error);
      showToast("error", `Save failed: ${error.message}`);
    } else {
      setEntryStatus(saveStatus);
      await refreshDrafts();
      if (saveStatus === "draft") {
        showToast("success", `📝 Monthly draft saved for ${resolvedName} — ${selectedMonth}`);
      } else {
        showToast("success", `✅ Monthly entry submitted for ${resolvedName} — ${selectedMonth}`);
      }
    }
  };

  const handleReset = () => {
    if (isReadOnly) return;
    if (!window.confirm("Reset all fields? This will clear unsaved changes.")) return;
    setGrades(buildInitialGrades());
    setWeekBases([buildInitialWeekBasis(), buildInitialWeekBasis(), buildInitialWeekBasis(), buildInitialWeekBasis()]);
    setEmployeeName(""); setCustomName(""); setSelectedTeams([]);
    setPeriodFrom(""); setPeriodTo(""); setSelectedMonth("");
    setSupervisorRemarks(""); setEmployeeComments("");
    setEntryStatus(null); setExistingId(null);
  };

  const inputStyle = {
    background: "#0f172a", border: "1.5px solid #334155", borderRadius: 8,
    color: "#e2e8f0", padding: "8px 12px", fontSize: 13, outline: "none",
    width: "100%", boxSizing: "border-box", fontFamily: "inherit",
  };
  const inputStyleDisabled = { ...inputStyle, background: "#0d1729", color: "#475569", cursor: "not-allowed", opacity: 0.6 };
  const labelStyle = { fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4, display: "block" };

  const isBusy = toast === "saving" || checkingEntry;

  return (
    <div style={{ minHeight: "100vh", background: "#080f1f", fontFamily: "'Inter','DM Sans',system-ui,sans-serif", color: "#e2e8f0", padding: "0 0 80px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Top bar ── */}
      <div style={{ background: "linear-gradient(90deg,#1e1b4b 0%,#0c1445 100%)", borderBottom: "1px solid #312e81", padding: "16px 32px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📅</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#e0e7ff" }}>Monthly CSR Performance Entry</div>
          <div style={{ fontSize: 11, color: "#818cf8" }}>Covers Week 1–4 · Enter raw data per week, grade the month</div>
        </div>
        <div style={{ flex: 1 }} />
        <EntryStatusBadge status={entryStatus} checking={checkingEntry} />
        {finalScore !== null && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#818cf8", marginBottom: 2 }}>Monthly Final Score</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: ratingColor(finalScore) }}>
              {finalScore.toFixed(2)}
              <span style={{ fontSize: 12, fontWeight: 400, color: "#818cf8", marginLeft: 6 }}>{ratingLabel(finalScore)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Pending Drafts Panel ── */}
      {(pendingDrafts.length > 0 || draftsLoading) && (
        <div style={{ maxWidth: 980, margin: "16px auto 0", padding: "0 24px" }}>
          <div style={{ background: "#0d1729", border: "1.5px solid #f59e0b55", borderRadius: 12, overflow: "hidden" }}>
            <div onClick={() => setDraftsCollapsed(c => !c)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", cursor: "pointer", userSelect: "none", background: "#f59e0b12" }}>
              <span style={{ fontSize: 16 }}>📝</span>
              <span style={{ fontWeight: 700, color: "#f59e0b", fontSize: 13, flex: 1 }}>
                Pending Monthly Drafts
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 800, padding: "1px 8px", borderRadius: 10, background: "#f59e0b", color: "#000" }}>
                  {draftsLoading ? "…" : pendingDrafts.length}
                </span>
              </span>
              <span style={{ fontSize: 11, color: "#64748b" }}>{draftsCollapsed ? "▸ Show" : "▾ Hide"}</span>
            </div>
            {!draftsCollapsed && (
              <div style={{ padding: "4px 0 8px" }}>
                {draftsLoading ? (
                  <div style={{ padding: "12px 18px", fontSize: 12, color: "#64748b" }}>Loading drafts…</div>
                ) : (
                  pendingDrafts.map((draft, i) => (
                    <div key={draft.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderBottom: i < pendingDrafts.length - 1 ? "1px solid #1e293b" : "none" }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 13 }}>{draft.csr_name}</span>
                        <span style={{ fontSize: 12, color: "#64748b", marginLeft: 10 }}>{draft.month} · Monthly</span>
                        {draft.final_score && <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>Score so far: {parseFloat(draft.final_score).toFixed(2)}</span>}
                      </div>
                      {draft.last_updated_at && (
                        <span style={{ fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>
                          {new Date(draft.last_updated_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          {draft.last_updated_by && ` · ${draft.last_updated_by.split("@")[0]}`}
                        </span>
                      )}
                      <button onClick={() => handleContinueDraft(draft)} style={{ padding: "5px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                        Continue →
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px 0" }}>

        {/* ── Banners ── */}
        {isReadOnly && (
          <div style={{ marginBottom: 20, padding: "12px 18px", background: "#22c55e18", border: "1.5px solid #22c55e55", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>🔒</span>
            <div>
              <div style={{ fontWeight: 700, color: "#22c55e", fontSize: 13 }}>This monthly entry has been submitted and is now read-only.</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>To make changes, contact your administrator or create a new entry for a different period.</div>
            </div>
          </div>
        )}
        {entryStatus === "draft" && !isReadOnly && (
          <div style={{ marginBottom: 20, padding: "12px 18px", background: "#f59e0b18", border: "1.5px solid #f59e0b55", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>📝</span>
            <div>
              <div style={{ fontWeight: 700, color: "#f59e0b", fontSize: 13 }}>Monthly draft loaded — continue where you left off.</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>All previously saved data has been restored. Save Draft anytime, or Submit when complete.</div>
            </div>
          </div>
        )}

        {/* ── Employee Info ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28, background: "#0d1729", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
          <div style={{ gridColumn: "1 / 2" }}>
            <label style={labelStyle}>Employee Name *</label>
            <select value={employeeName} onChange={e => { setEmployeeName(e.target.value); setCustomName(""); }} disabled={isReadOnly} style={isReadOnly ? inputStyleDisabled : inputStyle}>
              <option value="">Select CSR...</option>
              {CSR_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
              <option value="__custom__">Other (type below)</option>
            </select>
            {employeeName === "__custom__" && (
              <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Enter full name" disabled={isReadOnly} style={{ ...(isReadOnly ? inputStyleDisabled : inputStyle), marginTop: 6 }} />
            )}
          </div>
          <div>
            <label style={labelStyle}>Month * <span style={{ color: "#6366f1", fontWeight: 700, fontSize: 10 }}>(covers Week 1–4)</span></label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} disabled={isReadOnly} style={isReadOnly ? inputStyleDisabled : inputStyle}>
              <option value="">Select month…</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <div style={{ padding: "10px 14px", background: "#6366f118", border: "1.5px solid #6366f144", borderRadius: 8, fontSize: 12, color: "#818cf8", fontWeight: 600, width: "100%" }}>
              📅 Scope: <strong>Week 1 · Week 2 · Week 3 · Week 4</strong>
            </div>
          </div>

          {checkingEntry && (
            <div style={{ gridColumn: "1 / 4", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#1e293b", borderRadius: 8, fontSize: 12, color: "#64748b" }}>
              <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", border: "2px solid #6366f1", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              Checking for existing monthly entry…
            </div>
          )}

          <div>
            <label style={labelStyle}>Period From</label>
            <input type="date" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} disabled={isReadOnly} style={isReadOnly ? inputStyleDisabled : inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Period To</label>
            <input type="date" value={periodTo} onChange={e => setPeriodTo(e.target.value)} disabled={isReadOnly} style={isReadOnly ? inputStyleDisabled : inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Immediate Superior</label>
            <input type="text" defaultValue="NICOLE A. SAN JUAN / REGINALD BAYALAN" disabled={isReadOnly} style={isReadOnly ? inputStyleDisabled : inputStyle} />
          </div>
          <div style={{ gridColumn: "1 / 4" }}>
            <label style={labelStyle}>Team/s * <span style={{ color: "#475569", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(select up to 2)</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TEAMS.map(team => {
                const isSelected = selectedTeams.includes(team);
                const isDisabled = isReadOnly || (!isSelected && selectedTeams.length >= 2);
                return (
                  <button key={team} type="button" onClick={() => !isDisabled && toggleTeam(team)}
                    style={{ padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: isDisabled ? "not-allowed" : "pointer", fontFamily: "inherit", border: isSelected ? "1.5px solid #6366f1" : "1.5px solid #334155", background: isSelected ? "#6366f1" : "#0f172a", color: isSelected ? "#fff" : isDisabled ? "#334155" : "#94a3b8", opacity: isDisabled ? 0.4 : 1, transition: "all 0.15s" }}>
                    {isSelected ? "✓ " : ""}{team.replace("Team ", "")}
                  </button>
                );
              })}
            </div>
            {selectedTeams.length > 0 && <p style={{ fontSize: 11, color: "#6366f1", marginTop: 6 }}>Selected: {selectedTeams.join(" + ")}</p>}
          </div>
          <div style={{ gridColumn: "1 / 4" }}>
            <label style={labelStyle}>Scale Reference</label>
            <div style={{ display: "flex", gap: 6, padding: "8px 10px", background: "#0f172a", border: "1.5px solid #334155", borderRadius: 8 }}>
              {[0,1,2,3,4,5].map(grade => (
                <span key={grade} style={{ flex: 1, textAlign: "center", fontSize: 11, padding: "4px 0", borderRadius: 4, background: ratingColor(grade) + "22", color: ratingColor(grade), fontWeight: 700 }}>
                  {grade} = {SCALE_LABELS[grade]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Monthly KPI Basis Panel ── */}
        <MonthlyKpiBasisPanel
          weekBases={weekBases}
          setWeekBases={setWeekBases}
          computed={computed}
          onApplySuggested={handleApplySuggested}
          disabled={isReadOnly}
        />

        {/* ── Score Summary Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 28 }}>
          {KPI_SECTIONS.map(sec => {
            const score = kraScores[sec.type];
            const color = sectionColors[sec.type] || "#6366f1";
            return (
              <div key={sec.type} style={{ background: "#0d1729", border: `1px solid ${color}33`, borderRadius: 10, padding: "12px 14px", borderTop: `3px solid ${color}` }}>
                <div style={{ fontSize: 9, color, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{sec.type}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: score ? ratingColor(score) : "#334155" }}>{score ? score.toFixed(2) : "—"}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{score ? ratingLabel(score) : "Not scored"}</div>
              </div>
            );
          })}
          <div style={{ background: "#0d1729", border: "1px solid #334155", borderRadius: 10, padding: "12px 14px", borderTop: "3px solid #8b5cf6" }}>
            <div style={{ fontSize: 9, color: "#8b5cf6", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>BEHAVIOURAL</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: biScore ? ratingColor(biScore) : "#334155" }}>{biScore ? biScore.toFixed(2) : "—"}</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{biScore ? ratingLabel(biScore) : "Not scored"}</div>
          </div>
        </div>

        {/* ── KRA Sections ── */}
        <div style={{ background: "#0d1729", border: "1px solid #1e293b", borderRadius: 12, padding: "24px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            KRA — Key Results Area &nbsp;·&nbsp; Monthly Grades
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 20 }}>
            Grade each KPI based on the CSR's overall performance for the entire month (Week 1–4 combined).
          </div>
          {KPI_SECTIONS.map(section => (
            <SectionBlock key={section.type} section={section} grades={grades} onChange={handleGrade} suggestedGrades={suggestedGrades} disabled={isReadOnly} />
          ))}
        </div>

        {/* ── Behavioural Indicators ── */}
        <div style={{ background: "#0d1729", border: "1px solid #1e293b", borderRadius: 12, padding: "24px 20px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "#8b5cf618", borderLeft: "4px solid #8b5cf6", borderRadius: "0 8px 8px 0", marginBottom: 16 }}>
            <span style={{ fontWeight: 800, color: "#8b5cf6", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", flex: 1 }}>Behavioural Indicators</span>
            <span style={{ fontSize: 11, color: "#94a3b8", marginRight: 6 }}>Score</span>
            <ScorePill score={biScore} />
          </div>
          {BEHAVIOURAL_INDICATORS.map(bi => (
            <div key={bi.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid #1e293b" }}>
              <span style={{ flex: 1, fontSize: 12, color: "#94a3b8", lineHeight: 1.4 }}>{bi.label}</span>
              <span style={{ fontSize: 10, color: "#475569", minWidth: 40, textAlign: "right" }}>W: {(bi.weight * 100).toFixed(0)}%</span>
              <GradeSelect value={grades[bi.id]} onChange={handleGrade} id={bi.id} suggested={bi.kpiBasisKey && suggestedGrades[bi.kpiBasisKey] ? suggestedGrades[bi.kpiBasisKey] : null} disabled={isReadOnly} />
            </div>
          ))}
        </div>

        {/* ── Performance Rating Summary ── */}
        <div style={{ background: "#0d1729", border: "1px solid #1e293b", borderRadius: 12, padding: "24px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Monthly Performance Rating Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 180px" }}>
            {["","Weight","Total Score","Assessment"].map(h => (
              <div key={h} style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "6px 12px", borderBottom: "1px solid #1e293b" }}>{h}</div>
            ))}
            {[
              { label:"KRA (Key Results Area)", weight:"70%", score: kraTotal },
              { label:"Behavioural Indicator",  weight:"30%", score: biScore  },
            ].map(row => (
              <>
                <div key={row.label} style={{ padding: "12px", borderBottom: "1px solid #1e293b", color: "#cbd5e1", fontWeight: 600, fontSize: 13 }}>{row.label}</div>
                <div style={{ padding: "12px", borderBottom: "1px solid #1e293b", color: "#64748b", fontSize: 13 }}>{row.weight}</div>
                <div style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>{row.score !== null ? <ScorePill score={row.score} /> : <span style={{ color: "#334155", fontSize: 12 }}>—</span>}</div>
                <div style={{ padding: "12px", borderBottom: "1px solid #1e293b", color: row.score ? ratingColor(row.score) : "#334155", fontSize: 12 }}>{row.score ? ratingLabel(row.score) : "—"}</div>
              </>
            ))}
            <div style={{ padding: "14px 12px", color: "#e2e8f0", fontWeight: 800, fontSize: 14 }}>MONTHLY TOTAL RATE</div>
            <div style={{ padding: "14px 12px" }} />
            <div style={{ padding: "14px 12px" }}>{finalScore !== null ? <ScorePill score={finalScore} size="lg" /> : <span style={{ color: "#334155" }}>—</span>}</div>
            <div style={{ padding: "14px 12px", color: finalScore ? ratingColor(finalScore) : "#334155", fontWeight: 700, fontSize: 13 }}>{finalScore ? ratingLabel(finalScore) : "—"}</div>
          </div>
        </div>

        {/* ── Remarks ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {[
            { label:"Supervisor's Remarks", val: supervisorRemarks, set: setSupervisorRemarks, placeholder: "Enter monthly remarks…" },
            { label:"Employee Comments / Reactions", val: employeeComments, set: setEmployeeComments, placeholder: "Employee may comment in support of or disagreement with the monthly appraisal…" },
          ].map(({ label, val, set, placeholder }) => (
            <div key={label} style={{ background: "#0d1729", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>{label}</label>
              <textarea value={val} onChange={e => set(e.target.value)} rows={3} placeholder={placeholder} disabled={isReadOnly} style={{ ...(isReadOnly ? inputStyleDisabled : inputStyle), resize: "vertical", minHeight: 80, lineHeight: 1.6 }} />
            </div>
          ))}
        </div>

        {/* ── Actions ── */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", alignItems: "center" }}>
          {!isReadOnly && (
            <button onClick={handleReset} disabled={isBusy} style={{ padding: "10px 24px", borderRadius: 8, border: "1.5px solid #334155", background: "transparent", color: "#94a3b8", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: isBusy ? 0.5 : 1 }}>
              Reset Form
            </button>
          )}
          {isReadOnly ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, background: "#22c55e18", border: "1.5px solid #22c55e55", color: "#22c55e", fontWeight: 700, fontSize: 13 }}>
              ✅ Monthly Entry Submitted — Read Only
            </div>
          ) : (
            <>
              <button
                onClick={() => handleSave("draft")}
                disabled={isBusy || !resolvedName || !selectedMonth}
                style={{ padding: "10px 24px", borderRadius: 8, border: "1.5px solid #f59e0b", background: "transparent", color: "#f59e0b", fontWeight: 700, fontSize: 13, cursor: (isBusy || !resolvedName || !selectedMonth) ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: (isBusy || !resolvedName || !selectedMonth) ? 0.4 : 1, transition: "all 0.15s" }}>
                {toast === "saving" ? "Saving…" : "📝 Save Draft"}
              </button>
              <button
                onClick={() => handleSave("submitted")}
                disabled={isBusy || !resolvedName || !selectedMonth}
                style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: (isBusy || !resolvedName || !selectedMonth) ? "#334155" : "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: (isBusy || !resolvedName || !selectedMonth) ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                {toast === "saving" ? "Saving…" : "💾 Submit Monthly Evaluation"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && toast !== "saving" && (
        <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 9999, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", ...(toast === "success" ? { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" } : { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }) }}>
          {toastMsg}
        </div>
      )}
      {toast === "saving" && (
        <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 9999, background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          ⏳ Saving to database…
        </div>
      )}
    </div>
  );
}
