import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";

const CSR_NAMES = [
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

// ─── SCALE HELPERS ────────────────────────────────────────────────────────────
// kra_bp, kra_customer, kra_people, kra_financial, kra_total, bi_score, final_score → 1–5 scale
// kpi_scores (rmo_kpi_score, rts_kpi_score, etc.) → 0–1 decimal
function scalePct(val) {
  const v = parseFloat(val);
  return isNaN(v) ? null : (v / 5) * 100;
}
function kpiPct(val) {
  const v = parseFloat(val);
  return isNaN(v) ? null : v * 100;
}
function gradePct(val) {
  const v = parseFloat(val);
  return isNaN(v) ? null : (v / 5) * 100;
}
function avgOf(arr) {
  const clean = arr.filter(v => v !== null && v !== undefined && !isNaN(v));
  return clean.length > 0 ? clean.reduce((a, b) => a + b, 0) / clean.length : null;
}
function fmt(val, decimals = 2) {
  return val !== null ? val.toFixed(decimals) : "—";
}
function fmtPct(val, decimals = 2) {
  return val !== null ? val.toFixed(decimals) + "%" : "—";
}

function getStatus(score) {
  if (score === null) return { label:"No Data", color:"#94a3b8", bg:"#1e293b" };
  if (score >= 4.5) return { label:"Outstanding",      color:"#22c55e", bg:"#052e16" };
  if (score >= 4.0) return { label:"Good Performance", color:"#84cc16", bg:"#1a2e05" };
  if (score >= 3.5) return { label:"Needs Monitoring", color:"#f59e0b", bg:"#2d1b00" };
  if (score >= 3.0) return { label:"For Coaching",     color:"#f97316", bg:"#2d1200" };
  return               { label:"Critical",             color:"#ef4444", bg:"#2d0a0a" };
}

function getStars(score) {
  if (score === null) return { full: 0, empty: 5 };
  const full = Math.round((score / 5) * 5);
  return { full: Math.min(full, 5), empty: Math.max(5 - full, 0) };
}

// ─── AUTO INSIGHTS ────────────────────────────────────────────────────────────
function autoMonthlyInsight(score, weeksPresent) {
  const missing = 4 - weeksPresent;
  const base = score === null ? "Insufficient data for this month." :
    score >= 4.5 ? "Outstanding monthly performance! Consistently excellent across all weeks. This CSR is a model performer." :
    score >= 4.0 ? "Good monthly performance. Strong consistency shown throughout the month. Minor areas for improvement remain." :
    score >= 3.5 ? "Needs monitoring this month. Performance is inconsistent across weeks. Focus on discipline and consistency." :
    score >= 3.0 ? "Below target this month. Coaching intervention is recommended before next month's evaluation period." :
    "Critical monthly performance. Immediate structured coaching plan is required. Daily TL check-ins recommended.";
  return missing > 0 ? `${base} (${missing} week${missing > 1 ? "s" : ""} missing data)` : base;
}

function autoStrengths(avg) {
  const kpis = [
    { name:"ROAS/Conversion",  val: avg.convScore },
    { name:"RMO Follow-ups",   val: avg.rmoScore },
    { name:"RTS Compliance",   val: avg.rtsScore },
    { name:"Delivery Success", val: avg.dsrScore },
    { name:"Upsell Rate",      val: avg.upsScore },
    { name:"ESC",              val: kpiPct(avg.escKpi) },
  ].filter(k => k.val !== null).sort((a, b) => b.val - a.val);
  return kpis.slice(0, 3).map(k => k.name).join(", ") || "Consistent effort across all areas.";
}

function autoOpportunities(avg) {
  const kpis = [
    { name:"ROAS/Conversion",  val: avg.convScore },
    { name:"RMO Follow-ups",   val: avg.rmoScore },
    { name:"RTS Compliance",   val: avg.rtsScore },
    { name:"Delivery Success", val: avg.dsrScore },
    { name:"Upsell Rate",      val: avg.upsScore },
  ].filter(k => k.val !== null && k.val < 80).sort((a, b) => a.val - b.val);
  return kpis.length > 0
    ? `Improve ${kpis.slice(0, 2).map(k => k.name).join(" and ")} to reach the next tier.`
    : "Maintain current performance levels and push for consistency.";
}

function autoActionPlan(score) {
  if (score === null) return "Enter all 4 weeks of data to generate a complete monthly plan.";
  if (score >= 4.5) return "Continue your excellent practices. Consider mentoring lower-performing teammates.";
  if (score >= 4.0) return "Focus on your weakest KPI. Set a weekly target and track progress daily.";
  if (score >= 3.5) return "Schedule a monthly 1-on-1 with your TL. Review call recordings and identify patterns.";
  return "Follow structured coaching plan. Attend daily check-ins with your Team Leader.";
}

// ─── SUB COMPONENTS ───────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const status = getStatus(score);
  const pct = score !== null ? Math.min((score / 5) * 100, 100) : 0;
  const r = 58, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const stars = getStars(score);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
      <div style={{ position:"relative", width:140, height:140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform:"rotate(-90deg)" }}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="#1e293b" strokeWidth="12" />
          <circle cx="70" cy="70" r={r} fill="none" stroke={status.color} strokeWidth="12"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:30, fontWeight:900, color:status.color, lineHeight:1 }}>{score !== null ? score.toFixed(2) : "—"}</span>
          <span style={{ fontSize:11, color:"#64748b", fontWeight:500 }}>/ 5.00</span>
        </div>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:22, letterSpacing:2 }}>
          <span style={{ color:status.color }}>{"★".repeat(stars.full)}</span>
          <span style={{ color:"#334155" }}>{"☆".repeat(stars.empty)}</span>
        </div>
        <div style={{ marginTop:6, padding:"4px 16px", borderRadius:999, background:status.bg, border:`1px solid ${status.color}44`, fontSize:12, fontWeight:700, color:status.color }}>
          {status.label}
        </div>
      </div>
    </div>
  );
}

function KpiBar({ label, value, target=80 }) {
  if (value === null) return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:12, color:"#94a3b8" }}>{label}</span>
        <span style={{ fontSize:12, color:"#334155" }}>—</span>
      </div>
      <div style={{ height:6, background:"#1e293b", borderRadius:999 }} />
    </div>
  );
  const capped = Math.min(value, 100);
  const color = value >= target ? "#22c55e" : value >= target * 0.8 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:12, color:"#94a3b8" }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:800, color }}>{value.toFixed(2)}%</span>
      </div>
      <div style={{ height:6, background:"#1e293b", borderRadius:999, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${capped}%`, background:color, borderRadius:999 }} />
      </div>
    </div>
  );
}

function WeekChip({ week, hasData, score }) {
  const status = hasData ? getStatus(score) : null;
  return (
    <div style={{
      padding:"8px 12px", borderRadius:10, textAlign:"center", flex:1,
      background: hasData ? status.bg : "#0f172a",
      border: hasData ? `1px solid ${status.color}44` : "1px solid #1e293b",
    }}>
      <div style={{ fontSize:10, color: hasData ? status.color : "#334155", fontWeight:700, marginBottom:4 }}>{week}</div>
      <div style={{ fontSize:18, fontWeight:900, color: hasData ? status.color : "#334155" }}>
        {hasData ? score.toFixed(2) : "—"}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function MonthlyDashboard() {
  const [selectedCSR, setSelectedCSR] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecords = async () => {
    if (!selectedCSR || !selectedMonth) return;
    setLoading(true); setError(null); setRecords([]);
    const { data, error: err } = await supabase
      .from("performance_entries")
      .select("*")
      .eq("csr_name", selectedCSR)
      .eq("month", selectedMonth)
      .order("created_at", { ascending: true });
    if (err) setError(err.message);
    else setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, [selectedCSR, selectedMonth]);

  // ── Compute monthly averages across all weeks ──
  const monthly = useMemo(() => {
    if (!records.length) return null;

    // Get latest record per week
    const byWeek = {};
    records.forEach(r => {
      if (!byWeek[r.week] || new Date(r.created_at) > new Date(byWeek[r.week].created_at)) {
        byWeek[r.week] = r;
      }
    });

    const weekRecords = Object.values(byWeek);
    const weeksPresent = weekRecords.length;

    const avgField = (key, transform = v => parseFloat(v)) => {
      const vals = weekRecords.map(r => {
        const v = transform(r[key]);
        return isNaN(v) ? null : v;
      }).filter(v => v !== null);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };

    // 1–5 scale fields
    const finalScore    = avgField("final_score");
    const kraTotal      = avgField("kra_total");
    const biScore       = avgField("bi_score");
    const kraBP         = avgField("kra_bp");
    const kraCust       = avgField("kra_customer");
    const kraPlp        = avgField("kra_people");
    const kraFin        = avgField("kra_financial");
    const bi1           = avgField("bi1");
    const bi2           = avgField("bi2");
    const bi3           = avgField("bi3");
    const bi5           = avgField("bi5");

    // 0–1 kpi score fields
    const rmoKpi  = avgField("rmo_kpi_score");
    const rtsKpi  = avgField("rts_kpi_score");
    const convKpi = avgField("conversion_kpi_score");
    const dsrKpi  = avgField("delivery_success_kpi_score");
    const upsKpi  = avgField("upsell_kpi_score");
    const escKpi  = avgField("esc_kpi_score");

    // Raw basis
    const delivered   = avgField("delivered");
    const returned    = avgField("returned");
    const forReturn   = avgField("for_return");
    const escPoints   = avgField("esc_points");
    const convRoas    = avgField("conversion_roas");
    const rtsRaw      = avgField("rts_pct");
    const dsrRaw      = avgField("delivery_success_rate");
    const rmoRaw      = avgField("weekly_rmo_rate");
    const upsRaw      = avgField("upsell_rate");

    // Convert to display %
    const rmoScore  = kpiPct(rmoKpi);
    const rtsScore  = kpiPct(rtsKpi);
    const convScore = kpiPct(convKpi);
    const dsrScore  = kpiPct(dsrKpi);
    const upsScore  = kpiPct(upsKpi);

    return {
      weeksPresent,
      byWeek,
      finalScore, kraTotal, biScore,
      kraBP, kraCust, kraPlp, kraFin,
      bi1, bi2, bi3, bi5,
      rmoKpi, rtsKpi, convKpi, dsrKpi, upsKpi, escKpi,
      rmoScore, rtsScore, convScore, dsrScore, upsScore,
      delivered, returned, forReturn, escPoints, convRoas,
      rtsRaw, dsrRaw, rmoRaw, upsRaw,
    };
  }, [records]);

  const iStyle = {
    background:"#0d1729", border:"1.5px solid #334155", borderRadius:8,
    color:"#e2e8f0", padding:"8px 12px", fontSize:13, outline:"none", fontFamily:"inherit",
  };

  return (
    <div style={{ minHeight:"100vh", background:"#080f1f", fontFamily:"'Inter','DM Sans',system-ui,sans-serif", color:"#e2e8f0", padding:"0 0 80px" }}>

      {/* ── Filters ── */}
      <div style={{ background:"#0d1729", borderBottom:"1px solid #1e293b", padding:"16px 32px", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", position:"sticky", top:0, zIndex:50 }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#64748b", marginRight:4 }}>📅 Monthly Performance Dashboard</span>
        <select value={selectedCSR} onChange={e => setSelectedCSR(e.target.value)} style={{ ...iStyle, minWidth:220 }}>
          <option value="">Select CSR…</option>
          {CSR_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ ...iStyle, minWidth:140 }}>
          <option value="">Select month…</option>
          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {monthly && (
          <span style={{ marginLeft:"auto", fontSize:11, color:"#22c55e", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", display:"inline-block" }} />
            {monthly.weeksPresent} week{monthly.weeksPresent !== 1 ? "s" : ""} of data · {selectedMonth}
          </span>
        )}
      </div>

      {/* ── Empty states ── */}
      {!selectedCSR && (
        <div style={{ textAlign:"center", paddingTop:80 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📅</div>
          <p style={{ color:"#64748b", fontSize:16, fontWeight:600 }}>Select a CSR and month to view their monthly scorecard.</p>
        </div>
      )}
      {loading && <div style={{ textAlign:"center", paddingTop:80 }}><p style={{ color:"#64748b" }}>⏳ Loading monthly data…</p></div>}
      {error && !loading && <div style={{ textAlign:"center", paddingTop:80 }}><p style={{ color:"#ef4444", fontWeight:600 }}>{error}</p></div>}
      {!loading && !error && selectedCSR && selectedMonth && records.length === 0 && (
        <div style={{ textAlign:"center", paddingTop:80 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>😕</div>
          <p style={{ color:"#ef4444", fontWeight:600 }}>No data found for {selectedCSR} in {selectedMonth}.</p>
          <p style={{ color:"#475569", fontSize:13, marginTop:8 }}>Enter weekly data first using the Data Entry tab.</p>
        </div>
      )}

      {/* ── SCORECARD ── */}
      {monthly && !loading && (
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px" }}>

          {/* ── HEADER ── */}
          <div style={{
            background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0c1445 100%)",
            border:"1px solid #312e81", borderRadius:16, padding:"28px 32px",
            marginBottom:20, display:"flex", alignItems:"flex-start", gap:32, flexWrap:"wrap",
          }}>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontSize:11, color:"#818cf8", fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:6 }}>
                Monthly Scorecard · {selectedMonth}
              </div>
              <div style={{ fontSize:28, fontWeight:900, color:"#fff", lineHeight:1.1, marginBottom:8 }}>{selectedCSR}</div>
              {/* Week chips */}
              <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                {WEEKS.map(w => {
                  const rec = monthly.byWeek[w];
                  return <WeekChip key={w} week={w} hasData={!!rec} score={rec ? parseFloat(rec.final_score) : null} />;
                })}
              </div>
              <div style={{ background:"#0f172a88", border:"1px solid #334155", borderRadius:10, padding:"12px 16px", maxWidth:360 }}>
                <div style={{ fontSize:10, color:"#64748b", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>❝ Monthly Insight</div>
                <p style={{ fontSize:12, color:"#cbd5e1", lineHeight:1.6, margin:0 }}>
                  {autoMonthlyInsight(monthly.finalScore, monthly.weeksPresent)}
                </p>
              </div>
            </div>

            {/* Score + KRA/BI cards */}
            <div style={{ display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:10, color:"#64748b", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>Monthly Avg Score</div>
                <ScoreRing score={monthly.finalScore} />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:12, minWidth:160 }}>
                <div style={{ background:"#052e16", border:"1px solid #166534", borderRadius:12, padding:"14px 20px" }}>
                  <div style={{ fontSize:10, color:"#22c55e", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>KRA Score</div>
                  <div style={{ fontSize:24, fontWeight:900, color:"#22c55e" }}>{fmtPct(scalePct(monthly.kraTotal))}</div>
                  <div style={{ fontSize:13, color:"#16a34a", marginTop:2 }}>KRA Scale: <strong>{fmt(monthly.kraTotal)}</strong></div>
                </div>
                <div style={{ background:"#052e16", border:"1px solid #166534", borderRadius:12, padding:"14px 20px" }}>
                  <div style={{ fontSize:10, color:"#22c55e", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Behavioral Score</div>
                  <div style={{ fontSize:24, fontWeight:900, color:"#22c55e" }}>{fmtPct(scalePct(monthly.biScore))}</div>
                  <div style={{ fontSize:13, color:"#16a34a", marginTop:2 }}>Behavioral Scale: <strong>{fmt(monthly.biScore)}</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* ── MAIN GRID ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>

            {/* KPI Scores */}
            <div style={{ background:"#0d1729", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#0ea5e9", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
                <span>👥</span> Customer
              </div>
              <KpiBar label="Follow-Ups / RMO" value={monthly.rmoScore} />
              <KpiBar label="Verified Calls"   value={gradePct(monthly.g_4_1_4)} />
              <div style={{ borderTop:"1px solid #1e293b", margin:"14px 0" }} />
              <div style={{ fontSize:11, fontWeight:800, color:"#f59e0b", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
                <span>💰</span> Financial
              </div>
              <KpiBar label="ROAS Performance"         value={monthly.convScore} />
              <KpiBar label="RTS Compliance"           value={monthly.rtsScore} />
              <KpiBar label="Upsell Rate"              value={monthly.upsScore} />
              <KpiBar label="Delivery Success"         value={monthly.dsrScore} />
            </div>

            {/* Performance Basis */}
            <div style={{ background:"#0d1729", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#94a3b8", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>Monthly Avg Basis</div>
              {[
                { icon:"🚚", label:"RTS %",             val: monthly.rtsRaw !== null ? (monthly.rtsRaw * 100).toFixed(2) + "%" : "—",   warn: monthly.rtsRaw > 0.15 },
                { icon:"✅", label:"Delivery Success",  val: monthly.dsrRaw !== null ? (monthly.dsrRaw * 100).toFixed(2) + "%" : "—" },
                { icon:"📞", label:"Weekly RMO Rate",   val: monthly.rmoRaw !== null ? (monthly.rmoRaw > 1 ? monthly.rmoRaw.toFixed(2) : (monthly.rmoRaw * 100).toFixed(2)) + "%" : "—", warn: monthly.rmoRaw < 0.55 },
                { icon:"⭐", label:"ESC Points (avg)",  val: monthly.escPoints !== null ? monthly.escPoints.toFixed(1) : "—", warn: monthly.escPoints < 9 },
                { icon:"📈", label:"Conversion (ROAS)", val: monthly.convRoas !== null ? monthly.convRoas.toFixed(2) : "—" },
                { icon:"🏷", label:"Upsell Rate",       val: monthly.upsRaw !== null ? (monthly.upsRaw > 1 ? monthly.upsRaw.toFixed(2) : (monthly.upsRaw * 100).toFixed(2)) + "%" : "—" },
                { icon:"📦", label:"Avg Delivered",     val: monthly.delivered !== null ? monthly.delivered.toFixed(0) : "—" },
                { icon:"↩",  label:"Avg Returned",     val: monthly.returned  !== null ? monthly.returned.toFixed(0)  : "—" },
              ].map(({ icon, label, val, warn }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #1e293b22" }}>
                  <span style={{ fontSize:12, color:"#94a3b8", display:"flex", alignItems:"center", gap:8 }}><span>{icon}</span>{label}</span>
                  <span style={{ fontSize:13, fontWeight:800, color: warn ? "#ef4444" : "#22c55e" }}>{val}</span>
                </div>
              ))}
            </div>

            {/* KRA Breakdown */}
            <div style={{ background:"#0d1729", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#94a3b8", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>KRA Breakdown</div>
              {[
                { label:"Business Process",   val:monthly.kraBP,   icon:"⚙️", color:"#6366f1" },
                { label:"Customer",           val:monthly.kraCust, icon:"👥", color:"#0ea5e9" },
                { label:"People Development", val:monthly.kraPlp,  icon:"👤", color:"#10b981" },
                { label:"Financial",          val:monthly.kraFin,  icon:"💰", color:"#f59e0b" },
              ].map(({ label, val, icon, color }) => {
                const pct = scalePct(val);
                return (
                  <div key={label} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:12, color:"#94a3b8", display:"flex", alignItems:"center", gap:6 }}><span>{icon}</span>{label}</span>
                      <span style={{ fontSize:13, fontWeight:800, color: pct !== null ? (pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444") : "#334155" }}>
                        {pct !== null ? pct.toFixed(2) + "%" : "—"}
                      </span>
                    </div>
                    <div style={{ height:8, background:"#1e293b", borderRadius:999, overflow:"hidden" }}>
                      <div style={{ height:"100%", width: pct !== null ? `${Math.min(pct, 100)}%` : "0%", background:color, borderRadius:999 }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop:16, padding:"10px 14px", background:"#080f1f", borderRadius:8, borderTop:"2px solid #6366f1" }}>
                <div style={{ fontSize:10, color:"#6366f1", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>Overall KRA Score</div>
                <div style={{ fontSize:22, fontWeight:900, color:"#22c55e", marginTop:2 }}>{fmtPct(scalePct(monthly.kraTotal))}</div>
              </div>
            </div>
          </div>

          {/* ── BEHAVIORAL ── */}
          <div style={{ background:"#0d1729", border:"1px solid #1e293b", borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#8b5cf6", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>Behavioral (Monthly Average)</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:14 }}>
              {[
                { label:"Attendance & Reliability",    val:monthly.bi1, icon:"🗓️" },
                { label:"Accountability & Compliance", val:monthly.bi2, icon:"📋" },
                { label:"Initiative & Adaptability",   val:monthly.bi3, icon:"💡" },
                { label:"Extreme Self-Care",           val:monthly.bi5, icon:"💚" },
              ].map(({ label, val, icon }) => {
                const pct = gradePct(val);
                const color = pct === null ? "#334155" : pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={label} style={{ background:"#0d1729", border:"1px solid #1e293b", borderRadius:12, padding:"14px 12px", textAlign:"center" }}>
                    <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
                    <div style={{ fontSize:11, color:"#64748b", fontWeight:600, marginBottom:4, lineHeight:1.3 }}>{label}</div>
                    <div style={{ fontSize:18, fontWeight:900, color }}>{pct !== null ? pct.toFixed(2) + "%" : "—"}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding:"10px 16px", background:"#080f1f", borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>Overall Behavioral Score</span>
              <span style={{ fontSize:20, fontWeight:900, color: scalePct(monthly.biScore) >= 80 ? "#22c55e" : scalePct(monthly.biScore) >= 60 ? "#f59e0b" : "#ef4444" }}>
                {fmtPct(scalePct(monthly.biScore))}
              </span>
            </div>
          </div>

          {/* ── WEEK-BY-WEEK TREND ── */}
          <div style={{ background:"#0d1729", border:"1px solid #1e293b", borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#94a3b8", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>Week-by-Week Final Score</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
              {WEEKS.map(w => {
                const rec = monthly.byWeek[w];
                const score = rec ? parseFloat(rec.final_score) : null;
                const status = getStatus(score);
                return (
                  <div key={w} style={{ background:"#080f1f", border:`1px solid ${score !== null ? status.color + "44" : "#1e293b"}`, borderRadius:10, padding:"14px 16px", textAlign:"center" }}>
                    <div style={{ fontSize:10, color:"#64748b", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>{w}</div>
                    <div style={{ fontSize:26, fontWeight:900, color: score !== null ? status.color : "#334155" }}>{score !== null ? score.toFixed(2) : "—"}</div>
                    <div style={{ fontSize:10, color: score !== null ? status.color : "#334155", marginTop:4, fontWeight:600 }}>{score !== null ? status.label : "No data"}</div>
                    {rec && <div style={{ fontSize:10, color:"#475569", marginTop:4 }}>KRA: {parseFloat(rec.kra_total || 0).toFixed(2)} · BI: {parseFloat(rec.bi_score || 0).toFixed(2)}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── INSIGHTS ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
            <div style={{ background:"#0d1729", border:"1px solid #1e293b", borderRadius:12, padding:20 }}>
              {(() => {
                const status = getStatus(monthly.finalScore);
                return (
                  <>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                      <div style={{ width:36, height:36, borderRadius:999, background:status.bg, border:`1px solid ${status.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏆</div>
                      <div style={{ fontSize:14, fontWeight:800, color:status.color }}>{status.label}!</div>
                    </div>
                    <p style={{ fontSize:12, color:"#94a3b8", lineHeight:1.7, marginBottom:14 }}>
                      {autoMonthlyInsight(monthly.finalScore, monthly.weeksPresent)}
                    </p>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {[
                        { icon:"⭐", label:"Strengths",    color:"#22c55e", text: autoStrengths(monthly) },
                        { icon:"📈", label:"Opportunities", color:"#f59e0b", text: autoOpportunities(monthly) },
                        { icon:"🎯", label:"Action Plan",   color:"#0ea5e9", text: autoActionPlan(monthly.finalScore) },
                      ].map(({ icon, label, color, text }) => (
                        <div key={label} style={{ display:"flex", gap:8 }}>
                          <span style={{ fontSize:14 }}>{icon}</span>
                          <div><span style={{ fontSize:11, fontWeight:700, color }}>{label}: </span><span style={{ fontSize:11, color:"#94a3b8" }}>{text}</span></div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { icon:"🎯", label:"FOCUS",      color:"#6366f1", text:`Push ${WEEKS.filter(w => !monthly.byWeek[w]).length > 0 ? "missing weeks data entry and " : ""}the lowest KPI consistently above target every week.` },
                { icon:"🏁", label:"GOAL",       color:"#22c55e", text: monthly.finalScore >= 4.5 ? "Maintain Outstanding and mentor teammates." : monthly.finalScore >= 4.0 ? "Break into the Outstanding tier next month." : monthly.finalScore >= 3.5 ? "Achieve Good Performance tier next month." : "Reach the Needs Monitoring tier through coaching." },
                { icon:"🏅", label:"COMMITMENT", color:"#f59e0b", text:"Discipline today, excellence every day." },
              ].map(({ icon, label, color, text }) => (
                <div key={label} style={{ background:"#0d1729", border:`1px solid ${color}33`, borderRadius:12, padding:"14px 18px", display:"flex", gap:12, alignItems:"flex-start", flex:1 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:color + "22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:800, color, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>{label}</div>
                    <p style={{ fontSize:12, color:"#94a3b8", lineHeight:1.5, margin:0 }}>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── DATA COMPLETENESS ── */}
          <div style={{ background:"#0d1729", border:"1px solid #1e293b", borderRadius:12, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#94a3b8", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>Data Completeness</div>
            <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
              {WEEKS.map(w => {
                const has = !!monthly.byWeek[w];
                return (
                  <div key={w} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:999, background: has ? "#052e16" : "#1e293b", border: has ? "1px solid #166534" : "1px solid #334155" }}>
                    <span style={{ fontSize:12 }}>{has ? "✅" : "⬜"}</span>
                    <span style={{ fontSize:12, fontWeight:600, color: has ? "#22c55e" : "#475569" }}>{w}</span>
                  </div>
                );
              })}
              <span style={{ fontSize:12, color:"#64748b", marginLeft:8 }}>
                {monthly.weeksPresent}/4 weeks · Average based on available data
              </span>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderTop:"1px solid #1e293b", fontSize:11, color:"#475569" }}>
            <span>Monthly Performance Dashboard · Generated {new Date().toLocaleDateString()}</span>
            <span>{selectedCSR} · {selectedMonth}</span>
          </div>
        </div>
      )}
    </div>
  );
}
