import { useState, useCallback } from "react";

// ─── KPI STRUCTURE ────────────────────────────────────────────────────────────

const KPI_SECTIONS = [
  {
    type: "BUSINESS PROCESS",
    groups: [
      {
        id: "1.1.0",
        label: "Sales Performance and Order Quality Monitoring",
        weight: 1,
        kpiRef: "ATTENDANCE KPI SCORE",
        subs: [
          { id: "1.1.1", label: "Compliance to approved schedule — 0 incidents of tardiness per month", weight: 0.2 },
          { id: "1.1.2", label: "Compliance to attendance policy — 0 incidents of AWOL or unplanned absence", weight: 0.2 },
          { id: "1.1.3", label: "Compliance to VL Planner — 100% adherence to approved leave schedule", weight: 0.2 },
          { id: "1.1.4", label: "Compliance to breaktime policy — 0 incidents of overbreak", weight: 0.2 },
          { id: "1.1.5", label: "Order Risk Control Compliance — 100% adherence to verification and documentation standards", weight: 0.2 },
        ],
      },
      {
        id: "2.1.0",
        label: "Documentation & System Compliance",
        weight: 1,
        subs: [
          { id: "2.1.1", label: "Customer order documentation accuracy — 100% complete records in system", weight: 0.2 },
          { id: "2.1.2", label: "Customer verification documentation — 100% documented verification calls", weight: 0.2 },
          { id: "2.1.3", label: "Policy and process compliance — 100% adherence to order processing guidelines", weight: 0.2 },
          { id: "2.1.4", label: "Data confidentiality and accuracy — 0 incidents of data breach or incorrect customer information", weight: 0.2 },
        ],
      },
      {
        id: "3.1.0",
        label: "Order Processing & Workflow Integrity",
        weight: 1,
        subs: [
          { id: "3.1.1", label: "Order processing accuracy — ≥99% correct order handling", weight: 0.2 },
          { id: "3.1.2", label: "Processing timeliness — Orders processed within required timeline", weight: 0.2 },
          { id: "3.1.3", label: "RTS prevention compliance — All high-risk orders verified before processing", weight: 0.2 },
          { id: "3.1.4", label: "Escalation compliance — 100% escalation of high-risk or uncertain cases to Team Leader", weight: 0.2 },
        ],
      },
    ],
  },
  {
    type: "CUSTOMER",
    groups: [
      {
        id: "4.1.0",
        label: "Customer Engagement & Retention Performance",
        weight: 1,
        subs: [
          { id: "4.1.1", label: "Conversion Rate — Meet daily conversion target", weight: 0.25, kpiRef: "CONVERSION KPI SCORE" },
          { id: "4.1.2", label: "Consistent Follow-Ups — 100% daily follow-up completion", weight: 0.25, kpiRef: "RMO" },
          { id: "4.1.3", label: "Customer Retention Tracking — All follow-ups and reorders logged in retention tracker", weight: 0.25 },
          { id: "4.1.4", label: "Verified Calls — 100% verified customer information", weight: 0.25 },
        ],
      },
    ],
  },
  {
    type: "PEOPLE DEVELOPMENT",
    groups: [
      {
        id: "5.1.0",
        label: "Team & Skill Development",
        weight: 1,
        subs: [
          { id: "5.1.1", label: "Participation in Team Huddles — 100% attendance", weight: 0.3334 },
          { id: "5.1.2", label: "Collaboration with Team Members — Consistent coordination and support", weight: 0.3333 },
          { id: "5.1.3", label: "Adaptability & Continuous Learning — Active adoption of feedback", weight: 0.3333 },
        ],
      },
    ],
  },
  {
    type: "FINANCIALS",
    groups: [
      {
        id: "6.1.0",
        label: "Sales & Profit Contribution",
        weight: 1,
        subs: [
          { id: "6.1.1", label: "Sales Encoding Accuracy — 100% accurate encoding", weight: 0.5 },
          { id: "6.1.2", label: "Upselling Conversion Rate — Meet upselling target", weight: 0.5, kpiRef: "UPSELL RATE KPI SCORE" },
          { id: "6.1.3", label: "ROAS Performance — Maintain required ROAS level", weight: 0.5 },
          { id: "6.1.4", label: "RTS Rate Compliance — Maintain RTS ≤ 15%", weight: 0.5, kpiRef: "RTS KPI SCORE" },
        ],
      },
    ],
  },
];

const BEHAVIOURAL_INDICATORS = [
  { id: "bi1", label: "Attendance & Reliability — Maintains consistent attendance and punctuality", weight: 0.2 },
  { id: "bi2", label: "Accountability & Compliance — Follows HR, sales, and company policies diligently", weight: 0.2 },
  { id: "bi3", label: "Initiative & Adaptability — Shows willingness to learn and adjust to operational changes", weight: 0.2 },
  { id: "bi4", label: "Professionalism & Collaboration — Communicates respectfully and maintains teamwork", weight: 0.2 },
  { id: "bi5", label: "Extreme Self-Care & Mindfulness — Practices emotional balance and maintains focus and energy for performance", weight: 0.2, kpiRef: "ESC KPI SCORE" },
];

const KRA_WEIGHTS = { "BUSINESS PROCESS": 0.25, CUSTOMER: 0.25, "PEOPLE DEVELOPMENT": 0.25, FINANCIALS: 0.25 };

const SCALE_LABELS = { 1: "60% Below", 2: "70%", 3: "80%", 4: "90%", 5: "100%" };

const CSR_NAMES = [
  "ALPHE BALAKID", "CEDRIC JOSH DENIEGA", "CHYNNA TORNO", "ERVIN ESCARDA",
  "FRANZGIAN CASTOR", "JERALD BYRON CEPE", "KATE VALEIZZE HOPE PEDARSE",
  "KENNETH ELBANBUENA", "LANCE BORLADO", "PRINCESS ALEYAH BORLADO",
  "RACHEL HATE", "RAINE CHAVEZ", "RAZEL HILA", "RHEA MAE TUGADO",
  "ROXANNE SOLIS", "VENICE CUATON", "YANO HITOSIS", "ANGELO PROVIDO",
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function buildInitialGrades() {
  const g = {};
  KPI_SECTIONS.forEach((sec) =>
    sec.groups.forEach((grp) =>
      grp.subs.forEach((s) => { g[s.id] = ""; })
    )
  );
  BEHAVIOURAL_INDICATORS.forEach((b) => { g[b.id] = ""; });
  return g;
}

function calcSubRating(gradeStr) {
  const v = parseFloat(gradeStr);
  if (isNaN(v) || v < 1 || v > 5) return null;
  return v;
}

function calcGroupScore(group, grades) {
  let total = 0, totalW = 0;
  for (const sub of group.subs) {
    const r = calcSubRating(grades[sub.id]);
    if (r === null) return null;
    total += r * sub.weight;
    totalW += sub.weight;
  }
  return totalW > 0 ? total / totalW : null;
}

function calcKraScore(section, grades) {
  const scores = section.groups.map((g) => calcGroupScore(g, grades)).filter((s) => s !== null);
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function calcBehaviouralScore(grades) {
  let total = 0, totalW = 0;
  for (const b of BEHAVIOURAL_INDICATORS) {
    const r = calcSubRating(grades[b.id]);
    if (r === null) return null;
    total += r * b.weight;
    totalW += b.weight;
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

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

const sectionColors = {
  "BUSINESS PROCESS": "#6366f1",
  CUSTOMER: "#0ea5e9",
  "PEOPLE DEVELOPMENT": "#10b981",
  FINANCIALS: "#f59e0b",
};

function GradeSelect({ value, onChange, id }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(id, e.target.value)}
      style={{
        width: 64,
        padding: "4px 6px",
        border: value ? "1.5px solid #6366f1" : "1.5px solid #334155",
        borderRadius: 6,
        background: "#0f172a",
        color: value ? "#e2e8f0" : "#64748b",
        fontSize: 13,
        cursor: "pointer",
        outline: "none",
      }}
    >
      <option value="">—</option>
      {[1, 2, 3, 4, 5].map((n) => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
  );
}

function ScorePill({ score, size = "sm" }) {
  if (score === null) return <span style={{ color: "#475569", fontSize: 12 }}>—</span>;
  const color = ratingColor(score);
  return (
    <span
      style={{
        display: "inline-block",
        padding: size === "lg" ? "4px 14px" : "2px 8px",
        borderRadius: 20,
        background: color + "22",
        color,
        fontWeight: 700,
        fontSize: size === "lg" ? 15 : 12,
        border: `1px solid ${color}55`,
        letterSpacing: "0.01em",
      }}
    >
      {score.toFixed(2)}
    </span>
  );
}

function SectionBlock({ section, grades, onChange }) {
  const color = sectionColors[section.type] || "#6366f1";
  const kraScore = calcKraScore(section, grades);

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 16px",
          background: color + "18",
          borderLeft: `4px solid ${color}`,
          borderRadius: "0 8px 8px 0",
          marginBottom: 12,
        }}
      >
        <span style={{ fontWeight: 800, color, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", flex: 1 }}>
          {section.type}
        </span>
        <span style={{ fontSize: 11, color: "#94a3b8", marginRight: 6 }}>KRA Score</span>
        <ScorePill score={kraScore} />
      </div>

      {section.groups.map((group) => {
        const grpScore = calcGroupScore(group, grades);
        return (
          <div key={group.id} style={{ marginBottom: 16, marginLeft: 4 }}>
            {/* Main KPI row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: "#1e293b",
                borderRadius: 8,
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 10, color, fontWeight: 700, minWidth: 36 }}>{group.id}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{group.label}</span>
              <span style={{ fontSize: 11, color: "#64748b", marginRight: 6 }}>Score</span>
              <ScorePill score={grpScore} />
            </div>

            {/* Sub KPI rows */}
            {group.subs.map((sub) => (
              <div
                key={sub.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 12px 7px 24px",
                  borderBottom: "1px solid #1e293b",
                }}
              >
                <span style={{ fontSize: 10, color: "#475569", minWidth: 36 }}>{sub.id}</span>
                <span style={{ flex: 1, fontSize: 12, color: "#94a3b8", lineHeight: 1.4 }}>{sub.label}</span>
                <span style={{ fontSize: 10, color: "#475569", minWidth: 40, textAlign: "right" }}>
                  W: {(sub.weight * 100).toFixed(0)}%
                </span>
                <GradeSelect value={grades[sub.id]} onChange={onChange} id={sub.id} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function PerformanceEvaluation() {
  const [employeeName, setEmployeeName] = useState("");
  const [customName, setCustomName] = useState("");
  const [periodFrom, setPeriodFrom] = useState("2026-04-01");
  const [periodTo, setPeriodTo] = useState("2026-04-30");
  const [supervisorRemarks, setSupervisorRemarks] = useState("");
  const [employeeComments, setEmployeeComments] = useState("");
  const [grades, setGrades] = useState(buildInitialGrades);
  const [submitted, setSubmitted] = useState(false);

  const handleGrade = useCallback((id, val) => {
    setGrades((prev) => ({ ...prev, [id]: val }));
  }, []);

  const resolvedName = employeeName === "__custom__" ? customName : employeeName;

  // Compute section KRA scores
  const kraScores = {};
  KPI_SECTIONS.forEach((sec) => {
    kraScores[sec.type] = calcKraScore(sec, grades);
  });

  // KRA total (weighted average of sections)
  const kraTypes = Object.keys(KRA_WEIGHTS);
  let kraTotal = null;
  if (kraTypes.every((t) => kraScores[t] !== null)) {
    kraTotal = kraTypes.reduce((sum, t) => sum + kraScores[t] * KRA_WEIGHTS[t], 0);
  }

  const biScore = calcBehaviouralScore(grades);

  // Final: KRA 70% + BI 30%
  let finalScore = null;
  if (kraTotal !== null && biScore !== null) {
    finalScore = kraTotal * 0.7 + biScore * 0.3;
  }

  const inputStyle = {
    background: "#0f172a",
    border: "1.5px solid #334155",
    borderRadius: 8,
    color: "#e2e8f0",
    padding: "8px 12px",
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 4,
    display: "block",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080f1f",
        fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
        color: "#e2e8f0",
        padding: "0 0 60px",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          background: "linear-gradient(90deg, #1e1b4b 0%, #0c1445 100%)",
          borderBottom: "1px solid #312e81",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #818cf8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          📋
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#e0e7ff", letterSpacing: "-0.01em" }}>
            CSR Performance Evaluation
          </div>
          <div style={{ fontSize: 11, color: "#818cf8" }}>Customer Sales Representative · KRA Assessment Form</div>
        </div>
        <div style={{ flex: 1 }} />
        {finalScore !== null && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#818cf8", marginBottom: 2 }}>Final Score</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: ratingColor(finalScore) }}>
              {finalScore.toFixed(2)}
              <span style={{ fontSize: 12, fontWeight: 400, color: "#818cf8", marginLeft: 6 }}>
                {ratingLabel(finalScore)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 0" }}>
        {/* Header info */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 12,
            marginBottom: 32,
            background: "#0d1729",
            border: "1px solid #1e293b",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ gridColumn: "1 / 3" }}>
            <label style={labelStyle}>Employee Name</label>
            <select
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select CSR...</option>
              {CSR_NAMES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
              <option value="__custom__">Other (type below)</option>
            </select>
            {employeeName === "__custom__" && (
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter full name"
                style={{ ...inputStyle, marginTop: 6 }}
              />
            )}
          </div>
          <div>
            <label style={labelStyle}>Period From</label>
            <input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Period To</label>
            <input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ gridColumn: "1 / 3" }}>
            <label style={labelStyle}>Immediate Superior</label>
            <input
              type="text"
              defaultValue="NICOLE A. SAN JUAN / REGINALD BAYALAN"
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: "3 / 5", display: "flex", alignItems: "flex-end", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Scale Reference</label>
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  padding: "8px 10px",
                  background: "#0f172a",
                  border: "1.5px solid #334155",
                  borderRadius: 8,
                }}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      fontSize: 10,
                      padding: "2px 0",
                      borderRadius: 4,
                      background: ratingColor(n) + "22",
                      color: ratingColor(n),
                      fontWeight: 700,
                    }}
                  >
                    {n} = {SCALE_LABELS[n]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Score Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 28 }}>
          {KPI_SECTIONS.map((sec) => {
            const score = kraScores[sec.type];
            const color = sectionColors[sec.type] || "#6366f1";
            return (
              <div
                key={sec.type}
                style={{
                  background: "#0d1729",
                  border: `1px solid ${color}33`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  borderTop: `3px solid ${color}`,
                }}
              >
                <div style={{ fontSize: 9, color, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                  {sec.type}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: score ? ratingColor(score) : "#334155" }}>
                  {score ? score.toFixed(2) : "—"}
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                  {score ? ratingLabel(score) : "Not scored"}
                </div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>Weight: {(KRA_WEIGHTS[sec.type] * 100).toFixed(0)}%</div>
              </div>
            );
          })}
          <div
            style={{
              background: "#0d1729",
              border: "1px solid #334155",
              borderRadius: 10,
              padding: "12px 14px",
              borderTop: "3px solid #8b5cf6",
            }}
          >
            <div style={{ fontSize: 9, color: "#8b5cf6", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
              BEHAVIOURAL
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: biScore ? ratingColor(biScore) : "#334155" }}>
              {biScore ? biScore.toFixed(2) : "—"}
            </div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
              {biScore ? ratingLabel(biScore) : "Not scored"}
            </div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>Weight: 30%</div>
          </div>
        </div>

        {/* KPI Sections */}
        <div
          style={{
            background: "#0d1729",
            border: "1px solid #1e293b",
            borderRadius: 12,
            padding: "24px 20px",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
            KRA — Key Results Area
          </div>

          {KPI_SECTIONS.map((section) => (
            <SectionBlock key={section.type} section={section} grades={grades} onChange={handleGrade} />
          ))}
        </div>

        {/* Behavioural Indicators */}
        <div
          style={{
            background: "#0d1729",
            border: "1px solid #1e293b",
            borderRadius: 12,
            padding: "24px 20px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              background: "#8b5cf618",
              borderLeft: "4px solid #8b5cf6",
              borderRadius: "0 8px 8px 0",
              marginBottom: 16,
            }}
          >
            <span style={{ fontWeight: 800, color: "#8b5cf6", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", flex: 1 }}>
              Behavioural Indicators
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8", marginRight: 6 }}>Score</span>
            <ScorePill score={biScore} />
          </div>

          {BEHAVIOURAL_INDICATORS.map((bi) => (
            <div
              key={bi.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderBottom: "1px solid #1e293b",
              }}
            >
              <span style={{ flex: 1, fontSize: 12, color: "#94a3b8", lineHeight: 1.4 }}>{bi.label}</span>
              <span style={{ fontSize: 10, color: "#475569", minWidth: 40, textAlign: "right" }}>
                W: {(bi.weight * 100).toFixed(0)}%
              </span>
              <GradeSelect value={grades[bi.id]} onChange={handleGrade} id={bi.id} />
            </div>
          ))}
        </div>

        {/* Performance Rating Summary */}
        <div
          style={{
            background: "#0d1729",
            border: "1px solid #1e293b",
            borderRadius: 12,
            padding: "24px 20px",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
            Performance Rating Summary
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 180px", gap: 0 }}>
            {/* Header */}
            {["", "Weight", "Total Score", "Assessment"].map((h) => (
              <div key={h} style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "6px 12px", borderBottom: "1px solid #1e293b" }}>
                {h}
              </div>
            ))}

            {/* KRA row */}
            <div style={{ padding: "12px 12px", borderBottom: "1px solid #1e293b", color: "#cbd5e1", fontWeight: 600, fontSize: 13 }}>KRA (Key Results Area)</div>
            <div style={{ padding: "12px 12px", borderBottom: "1px solid #1e293b", color: "#64748b", fontSize: 13 }}>70%</div>
            <div style={{ padding: "12px 12px", borderBottom: "1px solid #1e293b" }}>
              {kraTotal !== null ? (
                <ScorePill score={kraTotal} />
              ) : <span style={{ color: "#334155", fontSize: 12 }}>—</span>}
            </div>
            <div style={{ padding: "12px 12px", borderBottom: "1px solid #1e293b", color: kraTotal ? ratingColor(kraTotal) : "#334155", fontSize: 12 }}>
              {kraTotal ? ratingLabel(kraTotal) : "—"}
            </div>

            {/* BI row */}
            <div style={{ padding: "12px 12px", borderBottom: "1px solid #1e293b", color: "#cbd5e1", fontWeight: 600, fontSize: 13 }}>Behavioural Indicator</div>
            <div style={{ padding: "12px 12px", borderBottom: "1px solid #1e293b", color: "#64748b", fontSize: 13 }}>30%</div>
            <div style={{ padding: "12px 12px", borderBottom: "1px solid #1e293b" }}>
              {biScore !== null ? <ScorePill score={biScore} /> : <span style={{ color: "#334155", fontSize: 12 }}>—</span>}
            </div>
            <div style={{ padding: "12px 12px", borderBottom: "1px solid #1e293b", color: biScore ? ratingColor(biScore) : "#334155", fontSize: 12 }}>
              {biScore ? ratingLabel(biScore) : "—"}
            </div>

            {/* Total row */}
            <div style={{ padding: "14px 12px", color: "#e2e8f0", fontWeight: 800, fontSize: 14 }}>TOTAL RATE</div>
            <div style={{ padding: "14px 12px" }} />
            <div style={{ padding: "14px 12px" }}>
              {finalScore !== null ? <ScorePill score={finalScore} size="lg" /> : <span style={{ color: "#334155" }}>—</span>}
            </div>
            <div style={{ padding: "14px 12px", color: finalScore ? ratingColor(finalScore) : "#334155", fontWeight: 700, fontSize: 13 }}>
              {finalScore ? ratingLabel(finalScore) : "—"}
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div
            style={{
              background: "#0d1729",
              border: "1px solid #1e293b",
              borderRadius: 12,
              padding: "20px",
            }}
          >
            <label style={{ ...labelStyle, marginBottom: 10 }}>Supervisor's Remarks</label>
            <textarea
              value={supervisorRemarks}
              onChange={(e) => setSupervisorRemarks(e.target.value)}
              rows={4}
              placeholder="Enter remarks..."
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: 90,
                lineHeight: 1.6,
              }}
            />
          </div>
          <div
            style={{
              background: "#0d1729",
              border: "1px solid #1e293b",
              borderRadius: 12,
              padding: "20px",
            }}
          >
            <label style={{ ...labelStyle, marginBottom: 10 }}>Employee Comments / Reactions</label>
            <textarea
              value={employeeComments}
              onChange={(e) => setEmployeeComments(e.target.value)}
              rows={4}
              placeholder="Employee may comment in support of or disagreement with the appraisal..."
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: 90,
                lineHeight: 1.6,
              }}
            />
          </div>
        </div>

        {/* Signatories */}
        <div
          style={{
            background: "#0d1729",
            border: "1px solid #1e293b",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 28,
          }}
        >
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
            Signatories
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {[
              { role: "Rated by", name: "Reginald G. Bayalan / Nicole A. San Juan", title: "Immediate Superior/Head" },
              { role: "Reviewed by", name: "Ricarose D. Aurin", title: "Admin / Operations Manager" },
              { role: "Verified by", name: "Jannie Marie C. Laurio", title: "HR Generalist" },
              { role: "Noted by", name: "Wendy R. Palisoc", title: "COO" },
            ].map((sig) => (
              <div key={sig.role}>
                <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{sig.role}</div>
                <div style={{ borderBottom: "1px solid #334155", paddingBottom: 4, marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1" }}>{sig.name}</div>
                </div>
                <div style={{ fontSize: 10, color: "#64748b" }}>{sig.title}</div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 8 }}>Date: ___________</div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 20,
              padding: "14px 16px",
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 8,
              fontSize: 11,
              color: "#64748b",
              fontStyle: "italic",
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: "#94a3b8", fontStyle: "normal" }}>Conforme:</strong> I have read and discussed this KRA result with my immediate head and I understand fully its contents. My signature means that I have been advised of the results and agree on means for improvement/sustainability.
            <div style={{ marginTop: 14, borderBottom: "1px solid #334155", width: 280, paddingBottom: 4, color: "#94a3b8" }}>
              Signature Over Printed Name / Date
            </div>
          </div>
        </div>

        {/* Submit / Print */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              setGrades(buildInitialGrades());
              setEmployeeName("");
              setCustomName("");
              setSupervisorRemarks("");
              setEmployeeComments("");
              setSubmitted(false);
            }}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "1.5px solid #334155",
              background: "transparent",
              color: "#94a3b8",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Reset Form
          </button>
          <button
            onClick={() => {
              if (!resolvedName) { alert("Please select or enter the employee name."); return; }
              setSubmitted(true);
              setTimeout(() => setSubmitted(false), 3000);
            }}
            style={{
              padding: "10px 28px",
              borderRadius: 8,
              border: "none",
              background: submitted
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              transition: "background 0.3s",
            }}
          >
            {submitted ? "✓ Saved!" : "Submit Evaluation"}
          </button>
          <button
            onClick={() => window.print()}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "1.5px solid #334155",
              background: "#1e293b",
              color: "#e2e8f0",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            🖨 Print
          </button>
        </div>
      </div>
    </div>
  );
}
