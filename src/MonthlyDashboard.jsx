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

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function scalePct(val) { const v = parseFloat(val); return isNaN(v) ? null : (v / 5) * 100; }
function kpiPct(val)   { const v = parseFloat(val); return isNaN(v) ? null : v * 100; }
function gradePct(val) { const v = parseFloat(val); return isNaN(v) ? null : (v / 5) * 100; }
function fmt(val, d=2) { return val !== null && val !== undefined ? parseFloat(val).toFixed(d) : "—"; }
function fmtPct(val, d=2) { return val !== null && val !== undefined ? parseFloat(val).toFixed(d) + "%" : "—"; }

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
  if (value === null) return (
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

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function MonthlyDashboard() {
  const [selectedCSR, setSelectedCSR]     = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [weeklyRecords, setWeeklyRecords] = useState([]);
  const [monthlyRecord, setMonthlyRecord] = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  const fetchRecords = async () => {
    if (!selectedCSR || !selectedMonth) return;
    setLoading(true); setError(null);
    setWeeklyRecords([]); setMonthlyRecord(null);

    // Fetch weekly entries
    const { data: weekly, error: wErr } = await supabase
      .from("performance_entries")
      .select("*")
      .eq("csr_name", selectedCSR)
      .eq("month", selectedMonth)
      .order("created_at", { ascending: true });

    // Fetch monthly entry
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
  };

  useEffect(() => { fetchRecords(); }, [selectedCSR, selectedMonth]);

  // ── Determine data source and compute stats ──
  const { monthly, isMonthlySource, hasAnyData } = useMemo(() => {
    const isMonthlySource = !!monthlyRecord;

    if (!isMonthlySource && !weeklyRecords.length) {
      return { monthly: null, isMonthlySource: false, hasAnyData: false };
    }

    let result;

    if (isMonthlySource) {
      // Use monthly entry directly — no averaging needed
      const r = monthlyRecord;
      result = {
        weeksPresent: 4, // treat as full month
        byWeek: null,    // no per-week breakdown
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
      };
    } else {
      // Weekly entries — average across weeks (original logic)
      const byWeek = {};
      weeklyRecords.forEach(r => {
        if (!byWeek[r.week] || new Date(r.created_at) > new Date(byWeek[r.week].created_at)) {
          byWeek[r.week] = r;
        }
      });
      const weekRecs = Object.values(byWeek);
      const weeksPresent = weekRecs.length;

      const avgF = (key) => {
        const vals = weekRecs.map(r => parseFloat(r[key])).filter(v => !isNaN(v));
        return vals.length > 0 ? vals.reduce((a,b) => a+b, 0) / vals.length : null;
      };

      result = {
        weeksPresent, byWeek,
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
      };
    }

    return { monthly: result, isMonthlySource, hasAnyData: true };
  }, [weeklyRecords, monthlyRecord]);

  // ── Styles ──
  const iStyle = {
    background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:8,
    color:"#1e293b", padding:"8px 12px", fontSize:13, outline:"none",
    fontFamily:"inherit", boxShadow:"0 1px 3px rgba(0,0,0,0.06)",
  };

  const card = (extra={}) => ({
    background:"#fff", border:"1px solid #e2e8f0", borderRadius:14,
    padding:20, boxShadow:"0 1px 4px rgba(0,0,0,0.05)", ...extra,
  });

  const sectionLabel = (color) => ({
    fontSize:11, fontWeight:800, color, letterSpacing:"0.12em",
    textTransform:"uppercase", marginBottom:14, display:"flex", alignItems:"center", gap:6,
  });

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", fontFamily:"'Inter','DM Sans',system-ui,sans-serif", color:"#1e293b", padding:"0 0 80px" }}>

      {/* ── Top Bar ── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"14px 32px", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
        <span style={{ fontSize:16, fontWeight:800, color:"#1e293b", marginRight:4 }}>📅 Monthly Performance Dashboard</span>
        <select value={selectedCSR} onChange={e => setSelectedCSR(e.target.value)} style={{ ...iStyle, minWidth:220 }}>
          <option value="">Select CSR…</option>
          {CSR_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ ...iStyle, minWidth:140 }}>
          <option value="">Select month…</option>
          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {monthly && (
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
            <SourceBadge isMonthly={isMonthlySource} />
            <span style={{ fontSize:11, color:"#64748b" }}>
              {isMonthlySource
                ? `Full month entry · ${selectedMonth}`
                : `${monthly.weeksPresent} week${monthly.weeksPresent !== 1 ? "s" : ""} of data · ${selectedMonth}`}
            </span>
          </div>
        )}
      </div>

      {/* ── Empty / Loading states ── */}
      {!selectedCSR && (
        <div style={{ textAlign:"center", paddingTop:80 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📅</div>
          <p style={{ color:"#64748b", fontSize:16, fontWeight:600 }}>Select a CSR and month to view their monthly scorecard.</p>
        </div>
      )}
      {loading && <div style={{ textAlign:"center", paddingTop:80 }}><p style={{ color:"#64748b" }}>⏳ Loading monthly data…</p></div>}
      {error && !loading && <div style={{ textAlign:"center", paddingTop:80 }}><p style={{ color:"#ef4444", fontWeight:600 }}>{error}</p></div>}
      {!loading && !error && selectedCSR && selectedMonth && !hasAnyData && (
        <div style={{ textAlign:"center", paddingTop:80 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>😕</div>
          <p style={{ color:"#ef4444", fontWeight:600 }}>No data found for {selectedCSR} in {selectedMonth}.</p>
          <p style={{ color:"#94a3b8", fontSize:13, marginTop:8 }}>Enter data using the Data Entry or Monthly Entry tab.</p>
        </div>
      )}

      {/* ── SCORECARD ── */}
      {monthly && !loading && (
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 24px" }}>

          {/* ── HEADER ── */}
          <div style={{
            background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e3a8a 100%)",
            borderRadius:16, padding:"28px 32px",
            marginBottom:20, display:"flex", alignItems:"flex-start", gap:32, flexWrap:"wrap",
          }}>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontSize:11, color:"#a5b4fc", fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:6 }}>
                Monthly Scorecard · {selectedMonth}
              </div>
              <div style={{ fontSize:28, fontWeight:900, color:"#fff", lineHeight:1.1, marginBottom:12 }}>{selectedCSR}</div>

              {/* Week chips — only for weekly source */}
              {!isMonthlySource && monthly.byWeek && (
                <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                  {WEEKS.map(w => {
                    const rec = monthly.byWeek[w];
                    return <WeekChip key={w} week={w} hasData={!!rec} score={rec ? parseFloat(rec.final_score) : null} />;
                  })}
                </div>
              )}

              {/* Monthly source badge */}
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

            {/* Score Ring + KRA/BI cards */}
            <div style={{ display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:10, color:"#a5b4fc", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>
                  {isMonthlySource ? "Monthly Score" : "Monthly Avg Score"}
                </div>
                <ScoreRing score={monthly.finalScore} />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:12, minWidth:160 }}>
                <div style={{ background:"#ffffff15", border:"1px solid #ffffff25", borderRadius:12, padding:"14px 20px" }}>
                  <div style={{ fontSize:10, color:"#86efac", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>KRA Score</div>
                  <div style={{ fontSize:24, fontWeight:900, color:"#86efac" }}>{fmtPct(scalePct(monthly.kraTotal))}</div>
                  <div style={{ fontSize:13, color:"#4ade80", marginTop:2 }}>KRA Scale: <strong>{fmt(monthly.kraTotal)}</strong></div>
                </div>
                <div style={{ background:"#ffffff15", border:"1px solid #ffffff25", borderRadius:12, padding:"14px 20px" }}>
                  <div style={{ fontSize:10, color:"#86efac", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>Behavioral Score</div>
                  <div style={{ fontSize:24, fontWeight:900, color:"#86efac" }}>{fmtPct(scalePct(monthly.biScore))}</div>
                  <div style={{ fontSize:13, color:"#4ade80", marginTop:2 }}>Behavioral Scale: <strong>{fmt(monthly.biScore)}</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* ── MAIN GRID ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>

            {/* KPI Scores */}
            <div style={card()}>
              <div style={sectionLabel("#0ea5e9")}><span>👥</span> Customer</div>
              <KpiBar label="Follow-Ups / RMO" value={monthly.rmoScore} />
              <KpiBar label="Verified Calls"   value={gradePct(monthly.bi1)} />
              <div style={{ borderTop:"1px solid #f1f5f9", margin:"14px 0" }} />
              <div style={sectionLabel("#d97706")}><span>💰</span> Financial</div>
              <KpiBar label="ROAS Performance" value={monthly.convScore} />
              <KpiBar label="RTS Compliance"   value={monthly.rtsScore} />
              <KpiBar label="Upsell Rate"       value={monthly.upsScore} />
              <KpiBar label="Delivery Success"  value={monthly.dsrScore} />
            </div>

            {/* Basis */}
            <div style={card()}>
              <div style={sectionLabel("#64748b")}>Monthly {isMonthlySource ? "Total" : "Avg"} Basis</div>
              {[
                { icon:"🚚", label:"RTS %",             val: monthly.rtsRaw !== null ? (monthly.rtsRaw*100).toFixed(2)+"%" : "—", warn: monthly.rtsRaw > 0.15 },
                { icon:"✅", label:"Delivery Success",  val: monthly.dsrRaw !== null ? (monthly.dsrRaw*100).toFixed(2)+"%" : "—" },
                { icon:"📞", label:"Weekly RMO Rate",   val: monthly.rmoRaw !== null ? (monthly.rmoRaw > 1 ? monthly.rmoRaw.toFixed(2) : (monthly.rmoRaw*100).toFixed(2))+"%" : "—", warn: monthly.rmoRaw < 0.55 },
                { icon:"⭐", label:"ESC Points",        val: monthly.escPoints !== null ? monthly.escPoints.toFixed(1) : "—", warn: monthly.escPoints < 9 },
                { icon:"📈", label:"Conversion (ROAS)", val: monthly.convRoas !== null ? monthly.convRoas.toFixed(2) : "—" },
                { icon:"🏷", label:"Upsell Rate",       val: monthly.upsRaw !== null ? (monthly.upsRaw > 1 ? monthly.upsRaw.toFixed(2) : (monthly.upsRaw*100).toFixed(2))+"%" : "—" },
                { icon:"📦", label: isMonthlySource ? "Total Delivered" : "Avg Delivered", val: monthly.delivered !== null ? monthly.delivered.toFixed(0) : "—" },
                { icon:"↩",  label: isMonthlySource ? "Total Returned"  : "Avg Returned",  val: monthly.returned  !== null ? monthly.returned.toFixed(0)  : "—" },
              ].map(({ icon, label, val, warn }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
                  <span style={{ fontSize:12, color:"#64748b", display:"flex", alignItems:"center", gap:8 }}><span>{icon}</span>{label}</span>
                  <span style={{ fontSize:13, fontWeight:800, color: warn ? "#dc2626" : "#16a34a" }}>{val}</span>
                </div>
              ))}
            </div>

            {/* KRA Breakdown */}
            <div style={card()}>
              <div style={sectionLabel("#64748b")}>KRA Breakdown</div>
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
                <div style={{ fontSize:22, fontWeight:900, color:"#16a34a", marginTop:2 }}>{fmtPct(scalePct(monthly.kraTotal))}</div>
              </div>
            </div>
          </div>

          {/* ── BEHAVIORAL ── */}
          <div style={{ ...card(), marginBottom:16 }}>
            <div style={sectionLabel("#8b5cf6")}>Behavioral Indicators</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:14 }}>
              {[
                { label:"Attendance & Reliability",    val:monthly.bi1, icon:"🗓️" },
                { label:"Accountability & Compliance", val:monthly.bi2, icon:"📋" },
                { label:"Initiative & Adaptability",   val:monthly.bi3, icon:"💡" },
                { label:"Extreme Self-Care",           val:monthly.bi5, icon:"💚" },
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
              <span style={{ fontSize:20, fontWeight:900, color: scalePct(monthly.biScore) >= 80 ? "#16a34a" : scalePct(monthly.biScore) >= 60 ? "#d97706" : "#dc2626" }}>
                {fmtPct(scalePct(monthly.biScore))}
              </span>
            </div>
          </div>

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
            <div style={card()}>
              {(() => {
                const status = getStatus(monthly.finalScore);
                return (
                  <>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                      <div style={{ width:36, height:36, borderRadius:999, background:status.bg, border:`1px solid ${status.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏆</div>
                      <div style={{ fontSize:14, fontWeight:800, color:status.color }}>{status.label}!</div>
                    </div>
                    <p style={{ fontSize:12, color:"#64748b", lineHeight:1.7, marginBottom:14 }}>
                      {autoMonthlyInsight(monthly.finalScore, monthly.weeksPresent, isMonthlySource)}
                    </p>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {[
                        { icon:"⭐", label:"Strengths",     color:"#16a34a", text: autoStrengths(monthly) },
                        { icon:"📈", label:"Opportunities", color:"#d97706", text: autoOpportunities(monthly) },
                        { icon:"🎯", label:"Action Plan",   color:"#0ea5e9", text: autoActionPlan(monthly.finalScore) },
                      ].map(({ icon, label, color, text }) => (
                        <div key={label} style={{ display:"flex", gap:8, padding:"8px 10px", background:"#f8fafc", borderRadius:8 }}>
                          <span style={{ fontSize:14 }}>{icon}</span>
                          <div><span style={{ fontSize:11, fontWeight:700, color }}>{label}: </span><span style={{ fontSize:11, color:"#64748b" }}>{text}</span></div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { icon:"🎯", label:"FOCUS",      color:"#6366f1", text: isMonthlySource ? "Review all KPI scores and identify areas below target for next month." : `Push ${WEEKS.filter(w => !monthly.byWeek[w]).length > 0 ? "missing weeks data entry and " : ""}the lowest KPI consistently above target every week.` },
                { icon:"🏁", label:"GOAL",       color:"#16a34a", text: monthly.finalScore >= 4.5 ? "Maintain Outstanding and mentor teammates." : monthly.finalScore >= 4.0 ? "Break into the Outstanding tier next month." : monthly.finalScore >= 3.5 ? "Achieve Good Performance tier next month." : "Reach the Needs Monitoring tier through coaching." },
                { icon:"🏅", label:"COMMITMENT", color:"#d97706", text:"Discipline today, excellence every day." },
              ].map(({ icon, label, color, text }) => (
                <div key={label} style={{ ...card(), border:`1.5px solid ${color}33`, display:"flex", gap:12, alignItems:"flex-start", flex:1 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:800, color, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>{label}</div>
                    <p style={{ fontSize:12, color:"#64748b", lineHeight:1.5, margin:0 }}>{text}</p>
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  );
}
