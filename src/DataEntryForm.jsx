import { useState, useCallback, useMemo } from "react";
import { supabase } from "./supabaseClient";

// ─── KPI BASIS FORMULAS (exact from Excel) ────────────────────────────────────

function calcRtsPct(delivered, forReturn, returned) {
  const d = parseFloat(delivered) || 0;
  const f = parseFloat(forReturn) || 0;
  const r = parseFloat(returned) || 0;
  const total = d + f + r;
  if (total === 0) return 0;
  return (f + r) / total; // as decimal
}

function calcDeliverySuccessRate(delivered, forReturn, returned) {
  const d = parseFloat(delivered) || 0;
  const f = parseFloat(forReturn) || 0;
  const r = parseFloat(returned) || 0;
  const total = d + f + r;
  if (total === 0) return 0;
  return d / total; // as decimal
}

function calcRtsKpiScore(rtsPct) {
  // rtsPct is decimal (e.g. 0.15 = 15%)
  if (rtsPct <= 0.15) return 1.0;
  if (rtsPct <= 0.16) return 1.0 - (rtsPct - 0.15) * 10;
  if (rtsPct <= 0.17) return 0.9 - (rtsPct - 0.16) * 10;
  if (rtsPct <= 0.18) return 0.8 - (rtsPct - 0.17) * 10;
  return Math.max(0, 0.7 - (rtsPct - 0.18) * 2);
}

function calcEscKpiScore(escPoints) {
  const p = parseFloat(escPoints) || 0;
  if (p === 21) return 1;
  if (p >= 18) return 0.85;
  if (p >= 15) return 0.70;
  if (p >= 12) return 0.55;
  if (p >= 9)  return 0.40;
  if (p >= 6)  return 0.25;
  return 0;
}

function calcRmoKpiScore(rmoRate) {
  // rmoRate is decimal (e.g. 0.85 = 85%)
  const h = parseFloat(rmoRate) || 0;
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
  // dsr is decimal
  const g = parseFloat(dsr) || 0;
  if (g >= 0.85) return 1.0;
  if (g >= 0.75) return 0.90 + (g - 0.75) / (0.85 - 0.75) * 0.10;
  if (g >= 0.65) return 0.80 + (g - 0.65) / (0.75 - 0.65) * 0.10;
  if (g >= 0.55) return 0.70 + (g - 0.55) / (0.65 - 0.55) * 0.10;
  return 0.50;
}

function calcUpsellKpiScore(upsellRate) {
  // upsellRate is decimal (e.g. 0.35 = 35%)
  const k = parseFloat(upsellRate) || 0;
  if (k >= 0.40) return 1.0;
  if (k >= 0.35) return 0.90 + (k - 0.35) / (0.40 - 0.35) * 0.10;
  if (k >= 0.30) return 0.80 + (k - 0.30) / (0.35 - 0.30) * 0.10;
  if (k >= 0.25) return 0.70 + (k - 0.25) / (0.30 - 0.25) * 0.10;
  if (k >= 0.20) return 0.60 + (k - 0.20) / (0.25 - 0.20) * 0.10;
  if (k >= 0.15) return 0.50 + (k - 0.15) / (0.20 - 0.15) * 0.10;
  if (k >= 0.10) return 0.40 + (k - 0.10) / (0.15 - 0.10) * 0.10;
  return 0.20;
}

// Convert KPI score (0-1) to 1-5 grade
function kpiScoreToGrade(score) {
  const pct = score * 100;
  if (pct >= 100) return 5;
  if (pct >= 90)  return 4;
  if (pct >= 80)  return 3;
  if (pct >= 70)  return 2;
  return 1;
}

// ─── KPI STRUCTURE ────────────────────────────────────────────────────────────

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
const SCALE_LABELS = { 1: "60% Below", 2: "70%", 3: "80%", 4: "90%", 5: "100%" };
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const QUARTERS = { Q1:["January","February","March"], Q2:["April","May","June"], Q3:["July","August","September"], Q4:["October","November","December"] };
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

function calcSubRating(v) {
  const n = parseFloat(v);
  return isNaN(n) || n < 1 || n > 5 ? null : n;
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
  return "#ef4444";
}
function buildInitialGrades() {
  const g = {};
  KPI_SECTIONS.forEach(sec => sec.groups.forEach(grp => grp.subs.forEach(s => { g[s.id] = ""; })));
  BEHAVIOURAL_INDICATORS.forEach(b => { g[b.id] = ""; });
  return g;
}
function getQuarterFromMonth(month) {
  for (const [q, months] of Object.entries(QUARTERS)) {
    if (months.includes(month)) return q;
  }
  return "";
}
function pct(val) {
  if (val === null || val === undefined) return "—";
  return (val * 100).toFixed(1) + "%";
}
// ─── SUB COMPONENTS ───────────────────────────────────────────────────────────

function GradeSelect({ value, onChange, id, suggested }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {suggested && (
        <span title="Auto-suggested from KPI Basis" style={{
          fontSize: 10, padding: "1px 6px", borderRadius: 4,
          background: "#6366f122", color: "#818cf8", fontWeight: 700, whiteSpace: "nowrap",
        }}>
          💡 {suggested}
        </span>
      )}
      <select value={value} onChange={e => onChange(id, e.target.value)}
        style={{
          width: 70, padding: "4px 6px",
          border: value ? "1.5px solid #6366f1" : "1.5px solid #334155",
          borderRadius: 6, background: "#0f172a",
          color: value ? "#e2e8f0" : "#64748b",
          fontSize: 13, cursor: "pointer", outline: "none",
        }}>
        <option value="">—</option>
        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} — {SCALE_LABELS[n]}</option>)}
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

function SectionBlock({ section, grades, onChange, suggestedGrades }) {
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
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── KPI BASIS PANEL ──────────────────────────────────────────────────────────

function KpiBasisPanel({ basis, setBasis, computed, onApplySuggested }) {
  const inputStyle = {
    background: "#0f172a", border: "1.5px solid #334155", borderRadius: 8,
    color: "#e2e8f0", padding: "7px 10px", fontSize: 13, outline: "none",
    width: "100%", boxSizing: "border-box", fontFamily: "inherit",
  };
  const labelStyle = { fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4, display: "block" };

  const fields = [
    { key: "delivered",         label: "Delivered",              placeholder: "e.g. 120" },
    { key: "forReturn",         label: "For Return",             placeholder: "e.g. 10" },
    { key: "returned",          label: "Returned",               placeholder: "e.g. 5" },
    { key: "attendanceKpiScore",label: "Attendance KPI Score",   placeholder: "e.g. 5 (1–5 scale)" },
    { key: "weeklyRmoRate",     label: "Weekly RMO Rate",        placeholder: "e.g. 0.80 (decimal)" },
    { key: "escPoints",         label: "ESC Points",             placeholder: "e.g. 18 (max 21)" },
    { key: "conversionRoas",    label: "Conversion (ROAS)",      placeholder: "e.g. 4.5" },
    { key: "upsellRate",        label: "Upsell Rate",            placeholder: "e.g. 0.35 (decimal)" },
  ];

  const scoreRow = (label, value, grade) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1e293b" }}>
      <span style={{ fontSize: 12, color: "#94a3b8" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: "#64748b" }}>{value}</span>
        {grade && (
          <span style={{ fontSize: 12, fontWeight: 700, padding: "1px 8px", borderRadius: 4, background: ratingColor(grade) + "22", color: ratingColor(grade) }}>
            Grade {grade}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ background: "#0d1729", border: "1px solid #1e293b", borderRadius: 12, padding: "24px 20px", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            📊 KPI Basis — Raw Numbers
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
            Enter raw data below. KPI scores and suggested grades will auto-compute.
          </div>
        </div>
        <button onClick={onApplySuggested} style={{
          padding: "8px 18px", borderRadius: 8, border: "none",
          background: "linear-gradient(135deg,#6366f1,#4f46e5)",
          color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer",
        }}>
          ⚡ Apply All Suggested Grades
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {fields.map(f => (
          <div key={f.key}>
            <label style={labelStyle}>{f.label}</label>
            <input
              type="number"
              step="any"
              placeholder={f.placeholder}
              value={basis[f.key] ?? ""}
              onChange={e => setBasis(p => ({ ...p, [f.key]: e.target.value }))}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {/* Computed scores */}
      <div style={{ background: "#080f1f", border: "1px solid #1e293b", borderRadius: 10, padding: "16px 20px" }}>
        <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
          Auto-Computed KPI Scores → Suggested Grades
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          {scoreRow("RTS %", pct(computed.rtsPct), computed.rtsGrade)}
          {scoreRow("Delivery Success Rate", pct(computed.dsr), computed.dsrGrade)}
          {scoreRow("RTS KPI Score", pct(computed.rtsKpiScore), computed.rtsGrade)}
          {scoreRow("Delivery Success KPI Score", pct(computed.dsrKpiScore), computed.dsrGrade)}
          {scoreRow("RMO KPI Score", pct(computed.rmoKpiScore), computed.rmoGrade)}
          {scoreRow("Conversion KPI Score", pct(computed.conversionKpiScore), computed.conversionGrade)}
          {scoreRow("ESC KPI Score", pct(computed.escKpiScore), computed.escGrade)}
          {scoreRow("Upsell Rate KPI Score", pct(computed.upsellKpiScore), computed.upsellGrade)}
        </div>
        <div style={{ marginTop: 12, padding: "8px 12px", background: "#1e293b", borderRadius: 8, fontSize: 11, color: "#64748b" }}>
          💡 Suggested grades are auto-filled as hints next to relevant KPI fields. Click <strong style={{ color: "#818cf8" }}>⚡ Apply All Suggested Grades</strong> to automatically fill those fields.
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function DataEntryForm() {
  const [employeeName, setEmployeeName] = useState("");
  const [customName, setCustomName] = useState("");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [week, setWeek] = useState("");
  const [supervisorRemarks, setSupervisorRemarks] = useState("");
  const [employeeComments, setEmployeeComments] = useState("");
  const [grades, setGrades] = useState(buildInitialGrades);
  const [toast, setToast] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  // KPI Basis raw inputs
  const [basis, setBasis] = useState({
    delivered: "", forReturn: "", returned: "",
    attendanceKpiScore: "", weeklyRmoRate: "",
    escPoints: "", conversionRoas: "", upsellRate: "",
  });

  const handleGrade = useCallback((id, val) => {
    setGrades(prev => ({ ...prev, [id]: val }));
  }, []);

  const resolvedName = employeeName === "__custom__" ? customName : employeeName;

  // ── Compute KPI Basis scores ──
  const computed = useMemo(() => {
    const rtsPct = calcRtsPct(basis.delivered, basis.forReturn, basis.returned);
    const dsr = calcDeliverySuccessRate(basis.delivered, basis.forReturn, basis.returned);
    const rtsKpiScore = calcRtsKpiScore(rtsPct);
    const dsrKpiScore = calcDeliverySuccessKpiScore(dsr);
    const rmoKpiScore = calcRmoKpiScore(parseFloat(basis.weeklyRmoRate) || 0);
    const conversionKpiScore = calcConversionKpiScore(parseFloat(basis.conversionRoas) || 0);
    const escKpiScore = calcEscKpiScore(parseFloat(basis.escPoints) || 0);
    const upsellKpiScore = calcUpsellKpiScore(parseFloat(basis.upsellRate) || 0);
    const attScore = parseFloat(basis.attendanceKpiScore) || null;

    return {
      rtsPct, dsr, rtsKpiScore, dsrKpiScore,
      rmoKpiScore, conversionKpiScore, escKpiScore, upsellKpiScore,
      rtsGrade: kpiScoreToGrade(rtsKpiScore),
      dsrGrade: kpiScoreToGrade(dsrKpiScore),
      rmoGrade: kpiScoreToGrade(rmoKpiScore),
      conversionGrade: kpiScoreToGrade(conversionKpiScore),
      escGrade: kpiScoreToGrade(escKpiScore),
      upsellGrade: kpiScoreToGrade(upsellKpiScore),
      attendanceGrade: attScore,
    };
  }, [basis]);

  // Map kpiBasisKey → suggested grade
  const suggestedGrades = useMemo(() => ({
    rtsKpiScore: computed.rtsGrade,
    dsrKpiScore: computed.dsrGrade,
    rmoKpiScore: computed.rmoGrade,
    conversionKpiScore: computed.conversionGrade,
    escKpiScore: computed.escGrade,
    upsellKpiScore: computed.upsellGrade,
    attendanceKpiScore: computed.attendanceGrade,
  }), [computed]);

  // Apply all suggested grades to relevant KPI sub fields
  const handleApplySuggested = useCallback(() => {
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
  }, [suggestedGrades]);

  // ── Compute KRA / Final scores ──
  const kraScores = {};
  KPI_SECTIONS.forEach(sec => { kraScores[sec.type] = calcKraScore(sec, grades); });
  const kraTypes = Object.keys(KRA_WEIGHTS);
  let kraTotal = null;
  if (kraTypes.every(t => kraScores[t] !== null)) {
    kraTotal = kraTypes.reduce((sum, t) => sum + kraScores[t] * KRA_WEIGHTS[t], 0);
  }
  const biScore = calcBehaviouralScore(grades);
  let finalScore = null;
  if (kraTotal !== null && biScore !== null) {
    finalScore = kraTotal * 0.7 + biScore * 0.3;
  }

  const showToast = (type, msg) => {
    setToast(type); setToastMsg(msg);
    if (type !== "saving") setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async () => {
    if (!resolvedName) { showToast("error", "Please select an employee name."); return; }
    if (!selectedMonth) { showToast("error", "Please select a month."); return; }
    if (!week) { showToast("error", "Please select a week."); return; }
    showToast("saving", "Saving…");

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
    const year = periodFrom ? new Date(periodFrom).getFullYear() : new Date().getFullYear();

    const payload = {
      csr_name: resolvedName,
      period_from: periodFrom || null, period_to: periodTo || null,
      month: selectedMonth, week, year, quarter,
      ...gradePayload, ...kraPayload,
      kra_total: kraTotal !== null ? +kraTotal.toFixed(4) : null,
      bi_score: biScore !== null ? +biScore.toFixed(4) : null,
      final_score: finalScore !== null ? +finalScore.toFixed(4) : null,
      // KPI Basis raw values
      delivered: parseFloat(basis.delivered) || null,
      for_return: parseFloat(basis.forReturn) || null,
      returned: parseFloat(basis.returned) || null,
      attendance_kpi_score: parseFloat(basis.attendanceKpiScore) || null,
      weekly_rmo_rate: parseFloat(basis.weeklyRmoRate) || null,
      esc_points: parseFloat(basis.escPoints) || null,
      conversion_roas: parseFloat(basis.conversionRoas) || null,
      upsell_rate: parseFloat(basis.upsellRate) || null,
      rts_pct: computed.rtsPct !== null ? +computed.rtsPct.toFixed(4) : null,
      delivery_success_rate: computed.dsr !== null ? +computed.dsr.toFixed(4) : null,
      rts_kpi_score: +computed.rtsKpiScore.toFixed(4),
      esc_kpi_score: +computed.escKpiScore.toFixed(4),
      rmo_kpi_score: +computed.rmoKpiScore.toFixed(4),
      conversion_kpi_score: +computed.conversionKpiScore.toFixed(4),
      delivery_success_kpi_score: +computed.dsrKpiScore.toFixed(4),
      upsell_kpi_score: +computed.upsellKpiScore.toFixed(4),
      supervisor_remarks: supervisorRemarks,
      employee_comments: employeeComments,
    };

    const { error } = await supabase.from("performance_entries").insert([payload]);
    if (error) {
      console.error(error);
      showToast("error", `Save failed: ${error.message}`);
    } else {
      showToast("success", `✅ Entry saved for ${resolvedName} — ${selectedMonth} ${week}`);
      setGrades(buildInitialGrades());
      setBasis({ delivered:"", forReturn:"", returned:"", attendanceKpiScore:"", weeklyRmoRate:"", escPoints:"", conversionRoas:"", upsellRate:"" });
      setEmployeeName(""); setCustomName(""); setPeriodFrom(""); setPeriodTo("");
      setSelectedMonth(""); setWeek(""); setSupervisorRemarks(""); setEmployeeComments("");
    }
  };

  const handleReset = () => {
    if (!window.confirm("Reset all fields?")) return;
    setGrades(buildInitialGrades());
    setBasis({ delivered:"", forReturn:"", returned:"", attendanceKpiScore:"", weeklyRmoRate:"", escPoints:"", conversionRoas:"", upsellRate:"" });
    setEmployeeName(""); setCustomName(""); setPeriodFrom(""); setPeriodTo("");
    setSelectedMonth(""); setWeek(""); setSupervisorRemarks(""); setEmployeeComments("");
  };

  const inputStyle = {
    background: "#0f172a", border: "1.5px solid #334155", borderRadius: 8,
    color: "#e2e8f0", padding: "8px 12px", fontSize: 13, outline: "none",
    width: "100%", boxSizing: "border-box", fontFamily: "inherit",
  };
  const labelStyle = {
    fontSize: 11, color: "#64748b", fontWeight: 600,
    letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4, display: "block",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080f1f", fontFamily: "'Inter','DM Sans',system-ui,sans-serif", color: "#e2e8f0", padding: "0 0 80px" }}>

      {/* ── Top bar ── */}
      <div style={{ background: "linear-gradient(90deg,#1e1b4b 0%,#0c1445 100%)", borderBottom: "1px solid #312e81", padding: "16px 32px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📋</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#e0e7ff" }}>CSR Performance Data Entry</div>
          <div style={{ fontSize: 11, color: "#818cf8" }}>KPI Basis → Auto-Compute → Grade</div>
        </div>
        <div style={{ flex: 1 }} />
        {finalScore !== null && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#818cf8", marginBottom: 2 }}>Final Score Preview</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: ratingColor(finalScore) }}>
              {finalScore.toFixed(2)}
              <span style={{ fontSize: 12, fontWeight: 400, color: "#818cf8", marginLeft: 6 }}>{ratingLabel(finalScore)}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px 0" }}>

        {/* ── Employee Info ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 28, background: "#0d1729", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
          <div style={{ gridColumn: "1 / 3" }}>
            <label style={labelStyle}>Employee Name *</label>
            <select value={employeeName} onChange={e => setEmployeeName(e.target.value)} style={inputStyle}>
              <option value="">Select CSR...</option>
              {CSR_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
              <option value="__custom__">Other (type below)</option>
            </select>
            {employeeName === "__custom__" && (
              <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Enter full name" style={{ ...inputStyle, marginTop: 6 }} />
            )}
          </div>
          <div>
            <label style={labelStyle}>Month *</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={inputStyle}>
              <option value="">Select month…</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Week *</label>
            <select value={week} onChange={e => setWeek(e.target.value)} style={inputStyle}>
              <option value="">Select week…</option>
              {["Week 1","Week 2","Week 3","Week 4"].map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Period From</label>
            <input type="date" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Period To</label>
            <input type="date" value={periodTo} onChange={e => setPeriodTo(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ gridColumn: "3 / 5" }}>
            <label style={labelStyle}>Immediate Superior</label>
            <input type="text" defaultValue="NICOLE A. SAN JUAN / REGINALD BAYALAN" style={inputStyle} />
          </div>
          <div style={{ gridColumn: "1 / 5" }}>
            <label style={labelStyle}>Scale Reference</label>
            <div style={{ display: "flex", gap: 6, padding: "8px 10px", background: "#0f172a", border: "1.5px solid #334155", borderRadius: 8 }}>
              {[1,2,3,4,5].map(n => (
                <span key={n} style={{ flex: 1, textAlign: "center", fontSize: 11, padding: "4px 0", borderRadius: 4, background: ratingColor(n) + "22", color: ratingColor(n), fontWeight: 700 }}>
                  {n} = {SCALE_LABELS[n]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── KPI BASIS PANEL ── */}
        <KpiBasisPanel
          basis={basis}
          setBasis={setBasis}
          computed={computed}
          onApplySuggested={handleApplySuggested}
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
          <div style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
            KRA — Key Results Area &nbsp;·&nbsp; Grade each sub-KPI (1–5)
          </div>
          {KPI_SECTIONS.map(section => (
            <SectionBlock key={section.type} section={section} grades={grades} onChange={handleGrade} suggestedGrades={suggestedGrades} />
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
              <GradeSelect value={grades[bi.id]} onChange={handleGrade} id={bi.id} suggested={bi.kpiBasisKey && suggestedGrades[bi.kpiBasisKey] ? suggestedGrades[bi.kpiBasisKey] : null} />
            </div>
          ))}
        </div>

        {/* ── Performance Rating Summary ── */}
        <div style={{ background: "#0d1729", border: "1px solid #1e293b", borderRadius: 12, padding: "24px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Performance Rating Summary</div>
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
            <div style={{ padding: "14px 12px", color: "#e2e8f0", fontWeight: 800, fontSize: 14 }}>TOTAL RATE</div>
            <div style={{ padding: "14px 12px" }} />
            <div style={{ padding: "14px 12px" }}>{finalScore !== null ? <ScorePill score={finalScore} size="lg" /> : <span style={{ color: "#334155" }}>—</span>}</div>
            <div style={{ padding: "14px 12px", color: finalScore ? ratingColor(finalScore) : "#334155", fontWeight: 700, fontSize: 13 }}>{finalScore ? ratingLabel(finalScore) : "—"}</div>
          </div>
        </div>

        {/* ── Remarks ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {[
            { label:"Supervisor's Remarks", val: supervisorRemarks, set: setSupervisorRemarks, placeholder: "Enter remarks…" },
            { label:"Employee Comments / Reactions", val: employeeComments, set: setEmployeeComments, placeholder: "Employee may comment in support of or disagreement with the appraisal…" },
          ].map(({ label, val, set, placeholder }) => (
            <div key={label} style={{ background: "#0d1729", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>{label}</label>
              <textarea value={val} onChange={e => set(e.target.value)} rows={3} placeholder={placeholder}
                style={{ ...inputStyle, resize: "vertical", minHeight: 80, lineHeight: 1.6 }} />
            </div>
          ))}
        </div>

        {/* ── Actions ── */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={handleReset} style={{ padding: "10px 24px", borderRadius: 8, border: "1.5px solid #334155", background: "transparent", color: "#94a3b8", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Reset Form
          </button>
          <button onClick={handleSubmit} disabled={toast === "saving"} style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: toast === "saving" ? "#334155" : "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: toast === "saving" ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {toast === "saving" ? "Saving…" : "💾 Submit Evaluation"}
          </button>
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
