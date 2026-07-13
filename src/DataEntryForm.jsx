import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";
import { isEntryEditor } from "./authHelpers";
import DataEntryForm from "./DataEntryForm";

const CSR_NAMES = [
  "ALPHE BALAKID","CEDRIC JOSH DENIEGA","CHYNNA TORNO","ERVIN ESCARDA",
  "FRANZGIAN CASTOR","JERALD BYRON CEPE","KATE VALEIZZE HOPE PEDARSE",
  "KENNETH ELBANBUENA","LANCE BORLADO","PRINCESS ALEYAH BORLADO",
  "RACHEL HATE","RAINE CHAVEZ","RAZEL HILA","RHEA MAE TUGADO",
  "ROXANNE SOLIS","VENICE CUATON","YANO HITOSIS","ANGELO PROVIDO",
];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── THEME ──────────────────────────────────────────────────────────────────────
const T = {
  bg:       "#fdf8f0",
  surface:  "#ffffff",
  surface2: "#fdf8f0",
  surface3: "#faf4e8",
  border:   "#e8dfc8",
  border2:  "#d9cdb0",
  accent:   "#c9a84c",
  accent2:  "#8a6f28",
  accentBg: "#fdf3d8",
  text:     "#1a1510",
  muted:    "#7a6a50",
  faint:    "#a89070",
  header:   "#1b1832",
};

// ── KPI HELPERS ────────────────────────────────────────────────────────────────
function kpiPct(val)   { if (val == null || isNaN(val)) return null; return parseFloat(val) * 100; }
function scalePct(val) { if (val == null || isNaN(val)) return null; return (parseFloat(val) / 5) * 100; }
function gradePct(val) { if (val == null || isNaN(val)) return null; return (parseFloat(val) / 5) * 100; }

function getStatus(score) {
  if (score >= 4.5) return { label:"Outstanding",      color:"#2e7d32", bg:"#f0faf0", border:"#a5d6a7" };
  if (score >= 4.0) return { label:"Good Performance", color:"#558b2f", bg:"#f9fbe7", border:"#c5e1a5" };
  if (score >= 3.5) return { label:"Needs Monitoring", color:"#e65100", bg:"#fff3e0", border:"#ffcc80" };
  if (score >= 3.0) return { label:"For Coaching",     color:"#bf360c", bg:"#fbe9e7", border:"#ffab91" };
  return               { label:"Critical",             color:"#b71c1c", bg:"#fef2f0", border:"#f5a8a8" };
}

function getStars(score) {
  const full = Math.round((score / 5) * 5);
  return { full: Math.min(full, 5), empty: Math.max(5 - full, 0) };
}

function scoreColor(val, threshold = 80) {
  if (val == null) return T.faint;
  return val >= threshold ? "#2e7d32" : val >= threshold * 0.85 ? "#e65100" : "#b71c1c";
}

function autoInsight(score) {
  if (score >= 4.5) return "Exceptional performance this week! All KPIs are above target. Keep up the excellent work and continue setting the standard for the team.";
  if (score >= 4.0) return "Good performance this week. Keep up the good work and stay consistent. Focus on improving follow-ups and ESC to reach your full potential!";
  if (score >= 3.5) return "You're in the monitoring zone. Some KPIs need attention. Focus on consistency and discipline to move up to the Good tier next week.";
  if (score >= 3.0) return "Performance is below target this week. Immediate coaching and structured improvement plan is needed to get back on track.";
  return "Critical performance level. Urgent intervention required. Please coordinate with your Team Leader immediately for a coaching session.";
}

function autoStrengths(record) {
  const kpis = [
    { name:"Conversion/ROAS",  val: kpiPct(record.conversion_kpi_score) },
    { name:"RMO Follow-ups",   val: kpiPct(record.rmo_kpi_score) },
    { name:"RTS Compliance",   val: kpiPct(record.rts_kpi_score) },
    { name:"Delivery Success", val: kpiPct(record.delivery_success_kpi_score) },
    { name:"Upsell Rate",      val: kpiPct(record.upsell_kpi_score) },
    { name:"ESC",              val: kpiPct(record.esc_kpi_score) },
  ].filter(k => k.val !== null && !isNaN(k.val)).sort((a, b) => b.val - a.val);
  return kpis.slice(0, 3).map(k => k.name).join(", ") || "Consistent effort shown across all areas.";
}

function autoOpportunities(record) {
  const kpis = [
    { name:"Conversion/ROAS",  val: kpiPct(record.conversion_kpi_score) },
    { name:"RMO Follow-ups",   val: kpiPct(record.rmo_kpi_score) },
    { name:"RTS Compliance",   val: kpiPct(record.rts_kpi_score) },
    { name:"Delivery Success", val: kpiPct(record.delivery_success_kpi_score) },
    { name:"Upsell Rate",      val: kpiPct(record.upsell_kpi_score) },
    { name:"ESC",              val: kpiPct(record.esc_kpi_score) },
  ].filter(k => k.val !== null && !isNaN(k.val) && k.val < 80).sort((a, b) => a.val - b.val);
  return kpis.length > 0
    ? `Improve ${kpis.slice(0, 2).map(k => k.name).join(" and ")} to reach the next performance tier.`
    : "Maintain current performance levels and push for consistency.";
}

function autoActionPlan(score) {
  if (score >= 4.5) return "Continue your excellent practices and help mentor lower-performing team members.";
  if (score >= 4.0) return "Focus on your weakest KPI this week. Set a daily target and track your progress consistently.";
  if (score >= 3.5) return "Schedule a 1-on-1 with your TL. Review your call recordings and identify specific improvement areas.";
  return "Attend structured coaching sessions daily. Follow the improvement plan set by your Team Leader.";
}

function autoFocus(record) {
  const kpis = [
    { name:"RMO Follow-ups",   val: kpiPct(record.rmo_kpi_score) || 0 },
    { name:"Conversion/ROAS",  val: kpiPct(record.conversion_kpi_score) || 0 },
    { name:"RTS Compliance",   val: kpiPct(record.rts_kpi_score) || 0 },
    { name:"Upsell Rate",      val: kpiPct(record.upsell_kpi_score) || 0 },
    { name:"Delivery Success", val: kpiPct(record.delivery_success_kpi_score) || 0 },
    { name:"ESC",              val: kpiPct(record.esc_kpi_score) || 0 },
  ].sort((a, b) => a.val - b.val);
  return `Improve ${kpis[0].name} rate and maintain all other KPI targets consistently.`;
}

function autoGoal(score) {
  if (score >= 4.5) return "Maintain Outstanding performance and be a model for the team.";
  if (score >= 4.0) return "Achieve higher scores consistently and break into the Outstanding tier.";
  if (score >= 3.5) return "Hit all KPI targets and move up to the Good performance tier.";
  return "Recover to Needs Monitoring tier through structured coaching and daily discipline.";
}

// ── SUB-COMPONENTS ─────────────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const status = getStatus(score);
  const pct = Math.min((score / 5) * 100, 100);
  const r = 58, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const stars = getStars(score);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
      <div style={{ position:"relative", width:140, height:140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform:"rotate(-90deg)" }}>
          <circle cx="70" cy="70" r={r} fill="none" stroke={T.border} strokeWidth="12" />
          <circle cx="70" cy="70" r={r} fill="none" stroke={status.color} strokeWidth="12"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:30, fontWeight:900, color:status.color, lineHeight:1 }}>{score.toFixed(2)}</span>
          <span style={{ fontSize:11, color:T.faint, fontWeight:500 }}>/ 5.00</span>
        </div>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:22, letterSpacing:2 }}>
          <span style={{ color:T.accent }}>{"★".repeat(stars.full)}</span>
          <span style={{ color:T.border }}>{"☆".repeat(stars.empty)}</span>
        </div>
        <div style={{ marginTop:6, padding:"4px 16px", borderRadius:999, background:status.bg, border:`1px solid ${status.border}`, fontSize:12, fontWeight:700, color:status.color }}>
          {status.label}
        </div>
      </div>
    </div>
  );
}

function KpiBar({ label, value, target = 80 }) {
  if (value == null || isNaN(value)) return null;
  const capped = Math.min(value, 100);
  const color = scoreColor(value, target);
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:12, color:T.muted, fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:800, color }}>{value.toFixed(2)}%</span>
      </div>
      <div style={{ height:6, background:T.border, borderRadius:999, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${capped}%`, background:color, borderRadius:999, transition:"width 0.8s ease" }} />
      </div>
    </div>
  );
}

function BehavioralCard({ label, value, icon }) {
  const pct = value !== null && !isNaN(value) ? gradePct(value) : null;
  const color = pct === null ? T.border : scoreColor(pct);
  return (
    <div style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 12px", textAlign:"center" }}>
      <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:11, color:T.muted, fontWeight:600, marginBottom:4, lineHeight:1.3 }}>{label}</div>
      <div style={{ fontSize:18, fontWeight:900, color }}>
        {pct !== null ? `${pct.toFixed(2)}%` : "—"}
      </div>
    </div>
  );
}

function SectionLabel({ color, icon, children }) {
  return (
    <div style={{ fontSize:11, fontWeight:800, color, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
      <span style={{ fontSize:14 }}>{icon}</span>{children}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20, boxShadow:"0 1px 4px #c9a84c08", ...style }}>
      {children}
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
export default function WeeklyDashboard({ user }) {
  const [selectedCSR,   setSelectedCSR]   = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedWeek,  setSelectedWeek]  = useState("");
  const [record,   setRecord]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [downloading, setDownloading] = useState(false);
  const scorecardRef = useRef(null);

  // ── EDIT MODE STATE ──
  const [editMode, setEditMode] = useState(false);

  const handleDownload = async () => {
    if (!scorecardRef.current || !record) return;
    setDownloading(true);
    try {
      const h2cModule = await import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js");
      const html2canvas = h2cModule.default;
      const canvas = await html2canvas(scorecardRef.current, {
        scale: 2, useCORS: true, backgroundColor: T.bg, logging: false, windowWidth: 1100,
      });
      const link = document.createElement("a");
      link.download = `scorecard_${record.csr_name.replace(/\s+/g,"_")}_${record.month}_${record.week.replace(/\s+/g,"_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error(err);
      alert("Screenshot failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const fetchRecord = useCallback(async () => {
    if (!selectedCSR || !selectedMonth || !selectedWeek) return;
    setLoading(true); setError(null); setRecord(null);
    const { data, error: err } = await supabase
      .from("performance_entries").select("*")
      .eq("csr_name", selectedCSR).eq("month", selectedMonth).eq("week", selectedWeek)
      .order("created_at", { ascending: false }).limit(1);
    if (err) setError(err.message);
    else if (!data || data.length === 0) setError("No record found for this selection.");
    else setRecord(data[0]);
    setLoading(false);
  }, [selectedCSR, selectedMonth, selectedWeek]);

  useEffect(() => { fetchRecord(); }, [fetchRecord]);

  // Close the edit form if the CSR/month/week selection changes
  useEffect(() => { setEditMode(false); }, [selectedCSR, selectedMonth, selectedWeek]);

  const selStyle = {
    background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 8,
    color: T.text, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "inherit",
    cursor: "pointer",
  };

  const canEdit = isEntryEditor(user);

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Inter','DM Sans',system-ui,sans-serif", color:T.text, padding:"0 0 80px" }}>

      {/* ── FILTER BAR ── */}
      <div
        data-html2canvas-ignore="true"
        style={{ background:T.header, borderBottom:`1px solid #2e2814`, padding:"14px 32px", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", position:"sticky", top:0, zIndex:50, boxShadow:"0 2px 12px #00000020" }}
      >
        <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${T.accent},${T.accent2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>📊</div>
        <span style={{ fontSize:13, fontWeight:800, color:"#f5ecd4", marginRight:4 }}>Weekly Scorecard</span>

        <select value={selectedCSR} onChange={e => setSelectedCSR(e.target.value)} style={{ ...selStyle, minWidth:220, background:T.surface2 }}>
          <option value="">Select CSR…</option>
          {CSR_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ ...selStyle, minWidth:140, background:T.surface2 }}>
          <option value="">Select month…</option>
          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} style={{ ...selStyle, minWidth:120, background:T.surface2 }}>
          <option value="">Select week…</option>
          {["Week 1","Week 2","Week 3","Week 4"].map(w => <option key={w} value={w}>{w}</option>)}
        </select>

        {record && !editMode && (
          <span style={{ marginLeft:"auto", fontSize:11, color:"#c9a84c", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:T.accent, display:"inline-block" }} />
            Record found · {record.month} {record.week}
          </span>
        )}

        {record && !editMode && canEdit && (
          <button onClick={() => setEditMode(true)} style={{
            background:"#c9a84c", border:"none", borderRadius:8, color:"#12101f",
            padding:"6px 14px", fontSize:12, fontWeight:800, cursor:"pointer",
            fontFamily:"inherit", whiteSpace:"nowrap",
          }}>✏️ Edit Entry</button>
        )}

        {record && !editMode && (
          <button onClick={handleDownload} disabled={downloading} style={{
            background: downloading ? "#2e2814" : "#c9a84c22",
            border: `1px solid ${T.accent}55`, borderRadius:8,
            color: downloading ? T.faint : T.accent, padding:"6px 14px", fontSize:12, fontWeight:700,
            cursor: downloading ? "not-allowed" : "pointer", display:"flex", alignItems:"center", gap:6,
            fontFamily:"inherit", whiteSpace:"nowrap",
          }}>
            {downloading ? "⏳ Capturing…" : "⬇ Download Image"}
          </button>
        )}
      </div>

      {/* ── EMPTY STATE ── */}
      {!selectedCSR && (
        <div style={{ textAlign:"center", paddingTop:80 }}>
          <div style={{ width:72, height:72, borderRadius:20, background:T.accentBg, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 16px" }}>📋</div>
          <p style={{ color:T.muted, fontSize:16, fontWeight:600 }}>Select a CSR, month, and week to view their scorecard.</p>
        </div>
      )}
      {loading && <div style={{ textAlign:"center", paddingTop:80 }}><p style={{ color:T.muted }}>⏳ Loading scorecard…</p></div>}
      {error && !loading && (
        <div style={{ textAlign:"center", paddingTop:80 }}>
          <p style={{ color:"#b71c1c", fontWeight:600 }}>{error}</p>
          <p style={{ color:T.faint, fontSize:13, marginTop:8 }}>Try a different CSR, month, or week.</p>
        </div>
      )}

      {/* ── EDIT MODE ── */}
      {editMode && record && (
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"20px 24px" }}>
          <DataEntryForm
            user={user}
            editEntry={{ csr_name: record.csr_name, month: record.month, week: record.week }}
            onSaved={() => { setEditMode(false); fetchRecord(); }}
            onCancel={() => setEditMode(false)}
          />
        </div>
      )}

      {!editMode && record && !loading && (() => {
        const finalScore = parseFloat(record.final_score) || 0;
        const kraTotal   = parseFloat(record.kra_total)   || 0;
        const biScore    = parseFloat(record.bi_score)    || 0;
        const status     = getStatus(finalScore);

        const kraBP   = scalePct(record.kra_bp);
        const kraCust = scalePct(record.kra_customer);
        const kraPlp  = scalePct(record.kra_people);
        const kraFin  = scalePct(record.kra_financial);
        const kraOverall = scalePct(kraTotal);

        const rmoScore  = kpiPct(record.rmo_kpi_score);
        const rtsScore  = kpiPct(record.rts_kpi_score);
        const convScore = kpiPct(record.conversion_kpi_score);
        const dsrScore  = kpiPct(record.delivery_success_kpi_score);
        const upsScore  = kpiPct(record.upsell_kpi_score);
        const biOverall = scalePct(biScore);

        const divider = <div style={{ borderTop:`1px solid ${T.border}`, margin:"14px 0" }} />;

        return (
          <div ref={scorecardRef} style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px" }}>

            {/* ── HEADER CARD ── */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:"28px 32px", marginBottom:20, display:"flex", alignItems:"flex-start", gap:32, flexWrap:"wrap", boxShadow:"0 2px 12px #c9a84c10", borderTop:`4px solid ${T.accent}` }}>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontSize:11, color:T.accent2, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:6 }}>
                  {record.quarter || ""} · {record.month} · {record.week}
                </div>
                <div style={{ fontSize:26, fontWeight:900, color:T.text, lineHeight:1.1, marginBottom:8 }}>{record.csr_name}</div>
                {record.teams && record.teams.length > 0 && (
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                    {record.teams.map(t => (
                      <span key={t} style={{ padding:"2px 10px", borderRadius:999, background:T.accentBg, border:`1px solid ${T.border}`, fontSize:11, color:T.accent2, fontWeight:600 }}>{t}</span>
                    ))}
                  </div>
                )}
                <div style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 16px", marginTop:8, maxWidth:340 }}>
                  <div style={{ fontSize:10, color:T.faint, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>❝ Weekly Insight</div>
                  <p style={{ fontSize:12, color:T.muted, lineHeight:1.6, margin:0 }}>{autoInsight(finalScore)}</p>
                </div>
              </div>

              <div style={{ display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:10, color:T.faint, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>Final Score</div>
                  <ScoreRing score={finalScore} />
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:12, minWidth:160 }}>
                  <div style={{ background:T.accentBg, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 20px" }}>
                    <div style={{ fontSize:10, color:T.accent2, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>KRA Score</div>
                    <div style={{ fontSize:24, fontWeight:900, color:T.accent2 }}>{kraOverall !== null ? kraOverall.toFixed(2) + "%" : "—"}</div>
                    <div style={{ fontSize:13, color:T.muted, marginTop:2 }}>KRA Scale: <strong style={{ color:T.text }}>{kraTotal.toFixed(2)}</strong></div>
                  </div>
                  <div style={{ background:T.accentBg, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 20px" }}>
                    <div style={{ fontSize:10, color:T.accent2, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Behavioral Score</div>
                    <div style={{ fontSize:24, fontWeight:900, color:T.accent2 }}>{biOverall !== null ? biOverall.toFixed(2) + "%" : "—"}</div>
                    <div style={{ fontSize:13, color:T.muted, marginTop:2 }}>Behavioral Scale: <strong style={{ color:T.text }}>{biScore.toFixed(2)}</strong></div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── MAIN 3-COL GRID ── */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>

              {/* Customer + Financial KPIs */}
              <Card>
                <SectionLabel color="#0ea5e9" icon="👥">Customer</SectionLabel>
                <KpiBar label="Follow-Ups / RMO"  value={rmoScore} />
                <KpiBar label="Verified Calls"    value={gradePct(record.g_4_1_4)} />
                {divider}
                <SectionLabel color="#c96030" icon="💰">Financial</SectionLabel>
                <KpiBar label="ROAS Performance"        value={convScore} />
                <KpiBar label="RTS Compliance"          value={rtsScore} />
                <KpiBar label="Sales Encoding Accuracy" value={gradePct(record.g_6_1_1)} />
                <KpiBar label="Upsell Rate"             value={upsScore} />
              </Card>

              {/* Performance Basis */}
              <Card>
                <div style={{ fontSize:11, fontWeight:800, color:T.muted, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:16 }}>Performance Basis</div>
                {[
                  { icon:"🚚", label:"RTS %",             val: record.rts_pct !== null ? (record.rts_pct * 100).toFixed(2)+"%" : "—",                                                    warn: parseFloat(record.rts_pct) > 0.15 },
                  { icon:"✅", label:"Delivery Success",  val: record.delivery_success_rate !== null ? (record.delivery_success_rate * 100).toFixed(2)+"%" : "—" },
                  { icon:"📞", label:"Weekly RMO Rate",   val: record.weekly_rmo_rate !== null ? (parseFloat(record.weekly_rmo_rate) > 1 ? parseFloat(record.weekly_rmo_rate).toFixed(2) : (parseFloat(record.weekly_rmo_rate)*100).toFixed(2))+"%" : "—", warn: parseFloat(record.weekly_rmo_rate) < 0.55 },
                  { icon:"⭐", label:"ESC Points",        val: record.esc_points !== null ? record.esc_points : "—",                                                                      warn: parseFloat(record.esc_points) < 9 },
                  { icon:"📈", label:"Conversion (ROAS)", val: record.conversion_roas !== null ? record.conversion_roas : "—" },
                  { icon:"🏷", label:"Upsell Rate",       val: record.upsell_rate !== null ? (parseFloat(record.upsell_rate) > 1 ? parseFloat(record.upsell_rate).toFixed(2) : (parseFloat(record.upsell_rate)*100).toFixed(2))+"%" : "—" },
                  { icon:"📦", label:"Delivered Orders",  val: record.delivered !== null ? "₱" + Number(record.delivered).toLocaleString("en-PH") : "—" },
                  { icon:"↩",  label:"Returned Orders",  val: record.returned  !== null ? "₱" + Number(record.returned).toLocaleString("en-PH")  : "—" },
                ].map(({ icon, label, val, warn }) => (
                  <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ fontSize:12, color:T.muted, display:"flex", alignItems:"center", gap:8 }}><span>{icon}</span>{label}</span>
                    <span style={{ fontSize:13, fontWeight:800, color: warn ? "#b71c1c" : "#2e7d32" }}>{val}</span>
                  </div>
                ))}
              </Card>

              {/* KRA Breakdown */}
              <Card>
                <div style={{ fontSize:11, fontWeight:800, color:T.muted, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:16 }}>KRA Breakdown</div>
                {[
                  { label:"Business Process",   pct: kraBP,   icon:"⚙️", color:"#6366f1" },
                  { label:"Customer",           pct: kraCust, icon:"👥", color:"#0ea5e9" },
                  { label:"People Development", pct: kraPlp,  icon:"👤", color:"#2e7d32" },
                  { label:"Financial",          pct: kraFin,  icon:"💰", color:"#c96030" },
                ].map(({ label, pct, icon, color }) => (
                  <div key={label} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:12, color:T.muted, display:"flex", alignItems:"center", gap:6 }}><span>{icon}</span>{label}</span>
                      <span style={{ fontSize:13, fontWeight:800, color: pct !== null ? scoreColor(pct) : T.border }}>
                        {pct !== null ? pct.toFixed(2)+"%" : "—"}
                      </span>
                    </div>
                    <div style={{ height:8, background:T.border, borderRadius:999, overflow:"hidden" }}>
                      <div style={{ height:"100%", width: pct !== null ? `${Math.min(pct,100)}%` : "0%", background:color, borderRadius:999 }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:16, padding:"10px 14px", background:T.accentBg, borderRadius:8, borderTop:`2px solid ${T.accent}` }}>
                  <div style={{ fontSize:10, color:T.accent2, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>Overall KRA Score</div>
                  <div style={{ fontSize:22, fontWeight:900, color:T.accent2, marginTop:2 }}>
                    {kraOverall !== null ? kraOverall.toFixed(2)+"%" : "—"}
                  </div>
                </div>
              </Card>
            </div>

            {/* ── BEHAVIORAL ── */}
            <Card style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#6d28d9", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:16 }}>Behavioral Indicators</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:14 }}>
                <BehavioralCard label="Attendance & Reliability"    value={record.bi1} icon="🗓️" />
                <BehavioralCard label="Accountability & Compliance" value={record.bi2} icon="📋" />
                <BehavioralCard label="Initiative & Adaptability"   value={record.bi3} icon="💡" />
                <BehavioralCard label="Extreme Self-Care"           value={record.bi5} icon="💚" />
              </div>
              <div style={{ padding:"10px 16px", background:T.surface2, borderRadius:8, border:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:T.muted, fontWeight:600 }}>Overall Behavioral Score</span>
                <span style={{ fontSize:20, fontWeight:900, color: biOverall !== null ? scoreColor(biOverall) : T.border }}>
                  {biOverall !== null ? biOverall.toFixed(2)+"%" : "—"}
                </span>
              </div>
            </Card>

            {/* ── INSIGHTS ── */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
              <Card>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <div style={{ width:36, height:36, borderRadius:999, background:status.bg, border:`1px solid ${status.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏆</div>
                  <div style={{ fontSize:14, fontWeight:800, color:status.color }}>{status.label}!</div>
                </div>
                <p style={{ fontSize:12, color:T.muted, lineHeight:1.7, marginBottom:14 }}>{autoInsight(finalScore)}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    { icon:"⭐", label:"Strengths",    color:"#2e7d32", text: autoStrengths(record) },
                    { icon:"📈", label:"Opportunities", color:"#e65100", text: autoOpportunities(record) },
                    { icon:"🎯", label:"Action Plan",   color:"#0ea5e9", text: autoActionPlan(finalScore) },
                  ].map(({ icon, label, color, text }) => (
                    <div key={label} style={{ display:"flex", gap:8, padding:"8px 10px", background:T.surface2, borderRadius:8 }}>
                      <span style={{ fontSize:14 }}>{icon}</span>
                      <div><span style={{ fontSize:11, fontWeight:700, color }}>{label}: </span><span style={{ fontSize:11, color:T.muted }}>{text}</span></div>
                    </div>
                  ))}
                </div>
              </Card>

              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[
                  { icon:"🎯", label:"FOCUS",      color:"#6366f1", text: autoFocus(record) },
                  { icon:"🏁", label:"GOAL",       color:"#2e7d32", text: autoGoal(finalScore) },
                  { icon:"🏅", label:"COMMITMENT", color:T.accent2, text: "Discipline today, excellence every day." },
                ].map(({ icon, label, color, text }) => (
                  <div key={label} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 18px", display:"flex", gap:12, alignItems:"flex-start", flex:1, boxShadow:"0 1px 4px #c9a84c08", borderLeft:`3px solid ${color}` }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize:10, fontWeight:800, color, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>{label}</div>
                      <p style={{ fontSize:12, color:T.muted, lineHeight:1.5, margin:0 }}>{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 4px", borderTop:`1px solid ${T.border}`, fontSize:11, color:T.faint }}>
              <span>Generated by CSR Performance Dashboard · {new Date().toLocaleDateString()}</span>
              <span>{record.teams?.join(" + ") || ""} · {record.quarter} {record.year}</span>
            </div>

          </div>
        );
      })()}
    </div>
  );
}
