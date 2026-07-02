import MonthlyDataEntryForm from './MonthlyDataEntryForm'
import MonthlyDashboard from "./MonthlyDashboard"
import DataEntryForm from './DataEntryForm'
import WeeklyDashboard from './WeeklyDashboard'
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";
import {
  Users, TrendingUp, TrendingDown, AlertTriangle, Star, Award,
  ChevronRight, BarChart2, BookOpen, GitCompare, Home, Search,
  Filter, Calendar, Clock, RefreshCw, Activity, Target,
  UserCheck, AlertCircle, Eye, Download, FileText, FileSpreadsheet,
  CheckCircle, XCircle, ClipboardList, Layers, Flag, Briefcase,
  Info, Package, Rocket, ServerCrash, RotateCcw, LogOut, Lock,
  Unlock, User, Shield, Save, ChevronDown
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import './animations.css';

const QUARTERS = { Q1:["January","February","March"], Q2:["April","May","June"], Q3:["July","August","September"], Q4:["October","November","December"] };
const TL_OPTIONS = ["TL Nic", "TL Regie"];
const CSR_TEAM_MAP = {
  "ALPHE BALAKID":"Team Keljash","CEDRIC JOSH DENIEGA":"Team Pao","CHYNNA TORNO":"Team Pao",
  "ERVIN ESCARDA":"Team Krizia","FRANZGIAN CASTOR":"Team Krizia","JERALD BYRON CEPE":"Team Pikutin",
  "KATE VALEIZZE HOPE PEDARSE":"Team Pikutin","KENNETH ELBANBUENA":"Team Keljash",
  "LANCE BORLADO":"Team Artemis","PRINCESS ALEYAH BORLADO":"Team Artemis","RACHEL HATE":"Team Artemis",
  "RAINE CHAVEZ":"Team Keljash","RAZEL HILA":"Team Pao","RHEA MAE TUGADO":"Team Krizia",
  "ROXANNE SOLIS":"Team Pikutin","VENICE CUATON":"Team Pikutin","YANO HITOSIS":"Team Artemis",
  "ANGELO PROVIDO":"Team Artemis",
};
function resolveTeam(record) {
  if (record.team && typeof record.team === "string" && record.team.trim()) return record.team.trim();
  if (Array.isArray(record.teams) && record.teams.length > 0) return record.teams[0];
  if (typeof record.teams === "string" && record.teams.trim()) return record.teams.trim();
  return CSR_TEAM_MAP[record.csr_name] || "Unknown";
}

const SHARED_PASSWORD = "MetaDigiCSR2026!"; // 👈 change this to whatever password your whole team should use (min 6 chars, required by Supabase)

function useAuth() {
  const [authState, setAuthState] = useState({ user: null, loading: true });
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({ user: session?.user ?? null, loading: false });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({ user: session?.user ?? null, loading: false });
    });
    return () => subscription.unsubscribe();
  }, []);
  const signIn = async (email) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: SHARED_PASSWORD });
    return { user: data?.user, error };
  };
  const signUp = async (email) => {
    const { data, error } = await supabase.auth.signUp({ email, password: SHARED_PASSWORD });
    return { user: data?.user, error };
  };
  const signOut = async () => { await supabase.auth.signOut(); };
  return { ...authState, signIn, signUp, signOut };
}

function LoginPage({ onLogin, onSignUp }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
const ALLOWED_EMAIL_SUFFIX = ".metadigitrading@gmail.com";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email."); return; }
    setLoading(true); setError(""); setSuccessMsg("");
    if (mode === "signin") {
      const { error: err } = await onLogin(email);
      if (err) setError(err.message);
    } else {
      const { error: err } = await onSignUp(email);
      if (err) setError(err.message);
      else setSuccessMsg("Account created! If email confirmation is required, check your inbox — otherwise switch to Sign In now.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#12101f", display:"flex", alignItems:"center", justifyContent:"center", padding:16, fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ position:"absolute", top:"30%", left:"50%", transform:"translate(-50%,-50%)", width:600, height:400, background:"radial-gradient(ellipse,#c9a84c18 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:72, height:72, borderRadius:20, background:"#1b1832", border:"1px solid #c9a84c44", marginBottom:16, boxShadow:"0 4px 24px #c9a84c22" }}>
            <Activity size={30} color="#c9a84c" />
          </div>
          <div style={{ fontSize:11, color:"#c9a84c", fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:6 }}>Meta Digitrading</div>
          <h1 style={{ fontSize:22, fontWeight:900, color:"#f5ecd4", margin:0 }}>CSR Performance</h1>
          <p style={{ color:"#7a6a50", fontSize:13, marginTop:4 }}>TL Control Panel · {mode === "signin" ? "Sign in to continue" : "Create your account"}</p>
        </div>

        <div style={{ display:"flex", gap:6, marginBottom:16, background:"#1b1832", borderRadius:12, padding:4, border:"1px solid #2e2814" }}>
          {[["signin","Sign In"],["signup","Sign Up"]].map(([id,label]) => (
            <button key={id} onClick={() => { setMode(id); setError(""); setSuccessMsg(""); }} style={{ flex:1, padding:"8px 0", borderRadius:9, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit", background: mode===id ? "#c9a84c" : "transparent", color: mode===id ? "#12101f" : "#8b7a58" }}>{label}</button>
          ))}
        </div>

        <div style={{ background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:20, padding:32, boxShadow:"0 8px 40px #00000040" }}>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:10, fontWeight:700, color:"#7a6a50", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Email</label>
            <div style={{ position:"relative" }}>
              <User size={13} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#c9a84c" }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" autoFocus
                style={{ width:"100%", background:"#fdf8f0", border:"1.5px solid #e8dfc8", borderRadius:10, paddingLeft:36, paddingRight:14, paddingTop:10, paddingBottom:10, fontSize:13, color:"#1a1510", outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
                onFocus={e => { e.target.style.borderColor="#c9a84c"; }}
                onBlur={e => { e.target.style.borderColor="#e8dfc8"; }}
                onKeyDown={e => { if (e.key === "Enter") handleSubmit(e); }}
              />
            </div>
          </div>

          {error && (
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#c0392b", background:"#c0392b10", border:"1px solid #c0392b30", borderRadius:8, padding:"8px 12px", marginBottom:16 }}>
              <AlertTriangle size={13} />{error}
            </div>
          )}
          {successMsg && (
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#2e7d32", background:"#2e7d3210", border:"1px solid #2e7d3230", borderRadius:8, padding:"8px 12px", marginBottom:16 }}>
              <CheckCircle size={13} />{successMsg}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{ width:"100%", padding:"12px", borderRadius:12, border:"none", background: loading ? "#e8dfc8" : "linear-gradient(135deg,#c9a84c,#8a6f28)", color: "#12101f", fontWeight:800, fontSize:14, cursor: loading ? "not-allowed" : "pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow: loading ? "none" : "0 4px 16px #c9a84c44" }}>
            {loading ? <><RefreshCw size={14} style={{ animation:"spin 1s linear infinite" }} /> {mode==="signin" ? "Signing in…" : "Creating account…"}</> : (mode === "signin" ? "Sign In" : "Sign Up")}
          </button>
        </div>
        <p style={{ textAlign:"center", fontSize:11, color:"#3a3020", marginTop:16 }}>
          {mode === "signin" ? "New here? Use the Sign Up tab above." : "Everyone shares the same team password — just enter your email."}
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function useRecordLock(recordKey, userEmail) {
  const [lockState, setLockState] = useState({ locked: false, lockedBy: null, isOwner: false, checking: false });
  const acquireLock = useCallback(async () => {
    if (!recordKey || !userEmail) return false;
    setLockState(s => ({ ...s, checking: true }));
    try {
      const { data: existing } = await supabase.from("record_locks").select("*").eq("record_key", recordKey).single();
      if (existing) {
        const ageMinutes = (Date.now() - new Date(existing.locked_at).getTime()) / 60000;
        if (existing.locked_by_email !== userEmail && ageMinutes < 15) {
          setLockState({ locked: true, lockedBy: existing.locked_by_email, isOwner: false, checking: false });
          return false;
        }
        await supabase.from("record_locks").update({ locked_by_email: userEmail, locked_at: new Date().toISOString() }).eq("record_key", recordKey);
      } else {
        await supabase.from("record_locks").insert({ record_key: recordKey, locked_by_email: userEmail, locked_at: new Date().toISOString() });
      }
      setLockState({ locked: true, lockedBy: userEmail, isOwner: true, checking: false });
      return true;
    } catch { setLockState(s => ({ ...s, checking: false })); return false; }
  }, [recordKey, userEmail]);
  const releaseLock = useCallback(async () => {
    if (!recordKey) return;
    await supabase.from("record_locks").delete().eq("record_key", recordKey).eq("locked_by_email", userEmail);
    setLockState({ locked: false, lockedBy: null, isOwner: false, checking: false });
  }, [recordKey, userEmail]);
  useEffect(() => { return () => { if (lockState.isOwner) releaseLock(); }; }, [lockState.isOwner, releaseLock]);
  return { ...lockState, acquireLock, releaseLock };
}

function useSupabaseData() {
  const [state, setState] = useState({ status: "loading", data: null, error: null, loadedAt: null });
  const load = useCallback(async () => {
    setState(s => ({ ...s, status: "loading", error: null }));
    try {
      const [perfRes, monthlyRes, qaRes, coachingRes] = await Promise.all([
        supabase.from("performance_entries").select("*").eq("status","submitted").order("created_at", { ascending: false }),
        supabase.from("monthly_performance_entries").select("*").eq("status","submitted").order("created_at", { ascending: false }),
        supabase.from("qa_entries").select("*").order("created_at", { ascending: false }),
        supabase.from("coaching_logs").select("*").order("updated_at", { ascending: false }),
      ]);
      if (perfRes.error) throw perfRes.error;
      const weeklyData = (perfRes.data || []).map(r => {
        const team = resolveTeam(r);
        return { ...r, team, csr_id: r.csr_name, source: "weekly", total_rate: r.final_score || 0, kra_scale: r.kra_total || 0, behavioral_scale: r.bi_score || 0, conversion_score: r.conversion_kpi_score ? r.conversion_kpi_score * 100 : 0, rmo_score: r.rmo_kpi_score ? r.rmo_kpi_score * 100 : 0, rts_score: r.rts_kpi_score ? r.rts_kpi_score * 100 : 0, delivery_success_score: r.delivery_success_kpi_score ? r.delivery_success_kpi_score * 100 : 0, upsell_score: r.upsell_kpi_score ? r.upsell_kpi_score * 100 : 0, attendance_score: r.attendance_kpi_score ? r.attendance_kpi_score * 20 : 0, esc_score: r.esc_kpi_score ? r.esc_kpi_score * 100 : 0 };
      });
      const monthlyData = (monthlyRes.data || []).map(r => {
        const team = resolveTeam(r);
        return { ...r, team, csr_id: r.csr_name, source: "monthly", week: "Monthly", total_rate: r.final_score || 0, kra_scale: r.kra_total || 0, behavioral_scale: r.bi_score || 0, conversion_score: r.conversion_kpi_score ? r.conversion_kpi_score * 100 : 0, rmo_score: r.rmo_kpi_score ? r.rmo_kpi_score * 100 : 0, rts_score: r.rts_kpi_score ? r.rts_kpi_score * 100 : 0, delivery_success_score: r.delivery_success_kpi_score ? r.delivery_success_kpi_score * 100 : 0, upsell_score: r.upsell_kpi_score ? r.upsell_kpi_score * 100 : 0, attendance_score: r.attendance_kpi_score ? r.attendance_kpi_score * 20 : 0, esc_score: r.esc_kpi_score ? r.esc_kpi_score * 100 : 0 };
      });
      const performanceData = [...weeklyData, ...monthlyData];
      const qaData = (qaRes.data || []).map(r => ({ ...r, csr_id: r.csr_name, team: resolveTeam(r) }));
      const coachingLogs = coachingRes.data || [];
      const allTeams = [...new Set(performanceData.map(r => r.team).filter(t => t && t !== "Unknown"))].sort();
      setState({ status: "success", data: { performanceData, qaData, coachingLogs, allTeams }, error: null, loadedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      setState({ status: "error", data: null, error: err.message, loadedAt: null });
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { ...state, retry: load };
}

function getStatus(rate) {
  if (rate >= 4.50) return "Excellent";
  if (rate >= 4.00) return "Good";
  if (rate >= 3.50) return "Needs Monitoring";
  if (rate >= 3.00) return "For Coaching";
  return "Critical";
}
const avg = (arr, key) => arr.length ? +(arr.reduce((s, r) => s + (parseFloat(r[key]) || 0), 0) / arr.length).toFixed(2) : 0;

function getAggregated(data) {
  const byCSR = {};
  data.forEach(r => {
    const key = r.csr_name;
    if (!byCSR[key]) { byCSR[key] = { ...r, count: 1 }; }
    else {
      ["total_rate","kra_scale","behavioral_scale","conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score","attendance_score","esc_score"].forEach(k => {
        byCSR[key][k] = (parseFloat(byCSR[key][k]) || 0) + (parseFloat(r[k]) || 0);
      });
      byCSR[key].count++;
      if (byCSR[key].team === "Unknown" && r.team && r.team !== "Unknown") byCSR[key].team = r.team;
    }
  });
  return Object.values(byCSR).map(c => {
    const n = c.count;
    return { ...c, total_rate: +(c.total_rate/n).toFixed(2), kra_scale: +(c.kra_scale/n).toFixed(2), behavioral_scale: +(c.behavioral_scale/n).toFixed(2), conversion_score: +(c.conversion_score/n).toFixed(1), rmo_score: +(c.rmo_score/n).toFixed(1), rts_score: +(c.rts_score/n).toFixed(1), delivery_success_score: +(c.delivery_success_score/n).toFixed(1), upsell_score: +(c.upsell_score/n).toFixed(1), attendance_score: +(c.attendance_score/n).toFixed(1), esc_score: +(c.esc_score/n).toFixed(1) };
  }).sort((a, b) => b.total_rate - a.total_rate);
}
function getQuarterlyAggregated(performanceData, quarter) {
  const METRICS = ["total_rate","kra_scale","behavioral_scale","conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score","attendance_score","esc_score"];

  // Step 1: group raw records by CSR + month
  const byCSRMonth = {};
  performanceData
    .filter(r => quarter === "All" || r.quarter === quarter)
    .forEach(r => {
      const key = `${r.csr_name}__${r.month}`;
      if (!byCSRMonth[key]) byCSRMonth[key] = { csr_name: r.csr_name, team: r.team, quarter: r.quarter, month: r.month, monthly: [], weekly: [] };
      if (r.source === "monthly" || r.week === "Monthly") byCSRMonth[key].monthly.push(r);
      else byCSRMonth[key].weekly.push(r);
      if (byCSRMonth[key].team === "Unknown" && r.team && r.team !== "Unknown") byCSRMonth[key].team = r.team;
    });

  // Step 2: one representative value per CSR per month
  const monthReps = Object.values(byCSRMonth).map(c => {
    const rep = { csr_name: c.csr_name, team: c.team, quarter: c.quarter, month: c.month, entryType: c.monthly.length ? "Monthly" : "Wk avg", weeksUsed: c.weekly.length };
    METRICS.forEach(k => {
      rep[k] = c.monthly.length
        ? +(c.monthly.reduce((s, r) => s + (parseFloat(r[k]) || 0), 0) / c.monthly.length).toFixed(2)
        : +(c.weekly.reduce((s, r) => s + (parseFloat(r[k]) || 0), 0) / c.weekly.length).toFixed(2);
    });
    return rep;
  });

  // Step 3: combine month reps into one row per CSR per quarter — equal weight per month
  const byCSRQuarter = {};
  monthReps.forEach(r => {
    const key = `${r.csr_name}__${r.quarter}`;
    if (!byCSRQuarter[key]) byCSRQuarter[key] = { csr_name: r.csr_name, team: r.team, quarter: r.quarter, months: [] };
    byCSRQuarter[key].months.push(r);
    if (byCSRQuarter[key].team === "Unknown" && r.team && r.team !== "Unknown") byCSRQuarter[key].team = r.team;
  });

  return Object.values(byCSRQuarter).map(c => {
    const n = c.months.length;
    const out = { csr_name: c.csr_name, team: c.team, quarter: c.quarter, monthsIncluded: c.months.map(m => `${m.month} (${m.entryType})`).join(", "), monthCount: n };
    METRICS.forEach(k => { out[k] = +(c.months.reduce((s, m) => s + (parseFloat(m[k]) || 0), 0) / n).toFixed(1); });
    return out;
  }).sort((a, b) => b.total_rate - a.total_rate);
}
function getMonthlyReps(records) {
  const METRICS = ["total_rate","kra_scale","behavioral_scale","conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score","attendance_score","esc_score"];
  const byMonth = {};
  records.forEach(r => {
    const key = r.month || "Unknown";
    if (!byMonth[key]) byMonth[key] = { month: key, quarter: r.quarter, monthly: [], weekly: [] };
    if (r.source === "monthly" || r.week === "Monthly") byMonth[key].monthly.push(r);
    else byMonth[key].weekly.push(r);
  });
  return Object.values(byMonth).map(c => {
    const rep = { month: c.month, quarter: c.quarter, entryType: c.monthly.length ? "Monthly" : "Wk avg", weeksUsed: c.weekly.length };
    METRICS.forEach(k => {
      rep[k] = c.monthly.length
        ? +(c.monthly.reduce((s, r) => s + (parseFloat(r[k]) || 0), 0) / c.monthly.length).toFixed(2)
        : c.weekly.length
          ? +(c.weekly.reduce((s, r) => s + (parseFloat(r[k]) || 0), 0) / c.weekly.length).toFixed(2)
          : 0;
    });
    return rep;
  });
}
const MONTH_ORDER = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getCoachingIssues(r) {
  const issues = [];
  if ((r.total_rate || 0) < 3.50) issues.push({ kpi:"Total Rate", score:r.total_rate, rec:"Structured coaching plan required" });
  if ((r.conversion_score || 0) < 80) issues.push({ kpi:"Conversion", score:r.conversion_score, rec:"Conversion script coaching" });
  if ((r.rmo_score || 0) < 80) issues.push({ kpi:"RMO", score:r.rmo_score, rec:"Follow-up discipline coaching" });
  if ((r.rts_score || 0) < 80) issues.push({ kpi:"RTS", score:r.rts_score, rec:"Order verification coaching" });
  if ((r.delivery_success_score || 0) < 80) issues.push({ kpi:"Delivery Success", score:r.delivery_success_score, rec:"Delivery coaching" });
  if ((r.upsell_score || 0) < 80) issues.push({ kpi:"Upsell", score:r.upsell_score, rec:"Upsell technique coaching" });
  return issues;
}

function exportRankingExcel(agg) {
  const wb = XLSX.utils.book_new();
  const rankingData = agg.map((c, i) => ({ Rank: i+1, "CSR Name": c.csr_name, Team: c.team, Month: c.month||"—", Week: c.week||"—", "Total Rate": c.total_rate, "KRA Scale": c.kra_scale, "Behavioral Scale": c.behavioral_scale, Status: getStatus(c.total_rate) }));
  const ws1 = XLSX.utils.json_to_sheet(rankingData);
  ws1["!cols"] = [{ wch:6 },{ wch:28 },{ wch:16 },{ wch:12 },{ wch:10 },{ wch:12 },{ wch:12 },{ wch:16 },{ wch:18 }];
  XLSX.utils.book_append_sheet(wb, ws1, "CSR Ranking");
  const kpiData = agg.map((c, i) => ({ Rank: i+1, "CSR Name": c.csr_name, Team: c.team, "Conversion %": parseFloat(c.conversion_score).toFixed(1), "RMO %": parseFloat(c.rmo_score).toFixed(1), "RTS %": parseFloat(c.rts_score).toFixed(1), "Delivery %": parseFloat(c.delivery_success_score).toFixed(1), "Upsell %": parseFloat(c.upsell_score).toFixed(1), "ESC %": parseFloat(c.esc_score).toFixed(1), "Attendance %": parseFloat(c.attendance_score).toFixed(1) }));
  const ws2 = XLSX.utils.json_to_sheet(kpiData);
  ws2["!cols"] = [{ wch:6 },{ wch:28 },{ wch:16 },{ wch:14 },{ wch:10 },{ wch:10 },{ wch:12 },{ wch:12 },{ wch:10 },{ wch:14 }];
  XLSX.utils.book_append_sheet(wb, ws2, "KPI Summary");
  XLSX.writeFile(wb, `CSR_Ranking_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function exportCoachingPDF(coachingList, coachingLogs) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const now = new Date().toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" });
  doc.setFillColor(18, 16, 31); doc.rect(0, 0, 297, 22, "F");
  doc.setTextColor(201, 168, 76); doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("Meta Digitrading · CSR Coaching Report", 14, 14);
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(245, 236, 212);
  doc.text(`Generated: ${now}`, 230, 14);
  doc.setTextColor(122, 106, 80); doc.setFontSize(9);
  const critical = coachingList.filter(c => c.priority === "Critical").length;
  const high = coachingList.filter(c => c.priority === "High").length;
  doc.text(`Total CSRs for Coaching: ${coachingList.length}   |   Critical: ${critical}   |   High Priority: ${high}`, 14, 30);
  const tableData = [];
  coachingList.forEach(({ csr, issues, priority }) => {
    const log = coachingLogs.find(l => l.csr_name === csr.csr_name);
    issues.forEach((issue, ii) => {
      tableData.push([ii===0?priority:"", ii===0?csr.csr_name:"", ii===0?csr.team:"", issue.kpi, String(issue.score), issue.rec, ii===0?(log?.coaching_owner||"—"):"", ii===0?(log?.status||"Pending"):"", ii===0?(log?.result_notes||""):"", ii===0?(log?.updated_at?new Date(log.updated_at).toLocaleDateString():"—"):"", ii===0?(log?.updated_by||"—"):""]);
    });
  });
  autoTable(doc, { startY: 35, head: [["Priority","CSR Name","Team","KPI Issue","Score","Recommendation","Coach Owner","Status","Notes","Last Updated","Updated By"]], body: tableData, styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [18, 16, 31], textColor: [201, 168, 76], fontStyle: "bold" }, alternateRowStyles: { fillColor: [253, 248, 240] }, columnStyles: { 0:{cellWidth:18},1:{cellWidth:28},2:{cellWidth:22},3:{cellWidth:20},4:{cellWidth:14},5:{cellWidth:40},6:{cellWidth:22},7:{cellWidth:20},8:{cellWidth:30},9:{cellWidth:22},10:{cellWidth:22} }, didParseCell: (data) => { if (data.section==="body" && data.column.index===0) { const v = data.cell.raw; if (v==="Critical") data.cell.styles.textColor = [192,57,43]; if (v==="High") data.cell.styles.textColor = [201,168,76]; if (v==="Medium") data.cell.styles.textColor = [138,111,40]; } } });
  doc.save(`Coaching_Report_${new Date().toISOString().slice(0,10)}.pdf`);
}

function SkeletonBox({ w="100%", h=16, r=6, mb=0 }) {
  return <div className="shimmer" style={{ width:w, height:h, borderRadius:r, marginBottom:mb, flexShrink:0, background:"#e8dfc8" }} />;
}

function PageLoadingState({ pageName }) {
  return (
    <div className="p-7 space-y-6 fade-in">
      <div className="h-0.5 rounded-full overflow-hidden" style={{ background:"#e8dfc8" }}>
        <div className="h-full rounded-full progress-bar" style={{ background:"linear-gradient(90deg,#c9a84c,#e8c96b)" }} />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-xl border p-5 space-y-3" style={{ background:"#ffffff", borderColor:"#e8dfc8" }}>
            <SkeletonBox w="55%" h={10} /><SkeletonBox w="40%" h={28} />
          </div>
        ))}
      </div>
      <div className="fixed bottom-8 right-8 rounded-2xl shadow-xl px-5 py-3 flex items-center gap-3 z-50" style={{ background:"#ffffff", border:"1px solid #e8dfc8", boxShadow:"0 4px 24px #c9a84c22" }}>
        <div className="relative w-5 h-5">
          <div className="absolute inset-0 rounded-full pulse-ring" style={{ background:"#c9a84c33" }} />
          <div className="relative w-5 h-5 rounded-full border-2 border-t-transparent spin-slow" style={{ borderColor:"#c9a84c", borderTopColor:"transparent" }} />
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color:"#1a1510" }}>Loading {pageName}</p>
          <div className="flex gap-1 mt-0.5">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bounce-dot" style={{ background:"#c9a84c", animationDelay:`${i*0.16}s` }} />)}</div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="p-7 flex items-center justify-center min-h-96">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5" style={{ background:"#c0392b12", border:"2px solid #c0392b33" }}><ServerCrash size={32} color="#c0392b" /></div>
        <h3 className="text-lg font-bold mb-2" style={{ color:"#1a1510" }}>Failed to Load Data</h3>
        <p className="text-xs rounded-lg px-4 py-2 inline-block mb-6 font-mono" style={{ color:"#c0392b", background:"#c0392b10" }}>{error}</p>
        <button onClick={onRetry} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold mx-auto" style={{ background:"linear-gradient(135deg,#c9a84c,#8a6f28)", color:"#12101f" }}><RotateCcw size={14} />Try Again</button>
      </div>
    </div>
  );
}

function EmptyState({ message="No data yet.", sub="Enter data using the Data Entry tab." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background:"#fdf8f0", border:"1px solid #e8dfc8" }}><Clock size={28} color="#c9a84c" /></div>
      <p className="font-semibold text-lg" style={{ color:"#7a6a50" }}>{message}</p>
      <p className="text-sm mt-2" style={{ color:"#a89070" }}>{sub}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    Excellent:          { bg:"#fdf3d8", color:"#7a5c10", border:"#e8c96b" },
    Good:               { bg:"#f5ecd4", color:"#8a6f28", border:"#c9a84c" },
    "Needs Monitoring": { bg:"#fffbeb", color:"#92400e", border:"#fcd34d" },
    "For Coaching":     { bg:"#fff7ed", color:"#9a3412", border:"#fdba74" },
    Critical:           { bg:"#fef2f0", color:"#9b2020", border:"#f5a8a8" },
  }[status] || { bg:"#fdf8f0", color:"#7a6a50", border:"#e8dfc8" };
  return <span style={{ padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:700, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`, whiteSpace:"nowrap" }}>{status}</span>;
}

function MetricCard({ label, value, sub, icon:Icon, color="gold", onClick, alert }) {
  const colors = { gold:{ icon:"#c9a84c", bg:"#fdf3d8", border:"#e8c96b" }, amber:{ icon:"#8a6f28", bg:"#f5ecd4", border:"#c9a84c" }, warm:{ icon:"#a0845a", bg:"#fdf8f0", border:"#e8dfc8" }, red:{ icon:"#c0392b", bg:"#fef2f0", border:"#f5a8a8" }, green:{ icon:"#2e7d32", bg:"#f0faf0", border:"#a5d6a7" }, orange:{ icon:"#c96030", bg:"#fff7ed", border:"#fdba74" } };
  const c = colors[color] || colors.gold;
  return (
    <div onClick={onClick} className="fade-in" style={{ background:"#ffffff", border:`1px solid ${alert ? "#f5a8a8" : "#e8dfc8"}`, borderRadius:14, padding:20, cursor:onClick?"pointer":"default", transition:"all 0.2s", boxShadow: alert ? "0 2px 12px #c0392b11" : "0 1px 4px #c9a84c08" }} onMouseEnter={e => { if(onClick) e.currentTarget.style.borderColor="#c9a84c"; }} onMouseLeave={e => { if(onClick) e.currentTarget.style.borderColor=alert?"#f5a8a8":"#e8dfc8"; }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
        <p style={{ fontSize:10, fontWeight:700, color:"#7a6a50", textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</p>
        {Icon && <div style={{ width:32, height:32, borderRadius:8, background:c.bg, border:`1px solid ${c.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon size={14} color={c.icon} /></div>}
      </div>
      <p style={{ fontSize:26, fontWeight:900, color:"#1a1510" }}>{value}</p>
      {sub && <p style={{ fontSize:11, color:"#a89070", marginTop:4 }}>{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, sub, children }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 style={{ fontSize:18, fontWeight:800, color:"#1a1510", margin:0 }}>{title}</h2>
        {sub && <p style={{ fontSize:13, color:"#7a6a50", marginTop:2 }}>{sub}</p>}
      </div>
      {children && <div className="flex gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ fontSize:13, border:"1px solid #e8dfc8", borderRadius:8, padding:"6px 12px", background:"#ffffff", color:"#1a1510", outline:"none", cursor:"pointer" }}>
      {label && <option value="All">All {label}</option>}
      {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  );
}

function LastTouchBadge({ record }) {
  if (!record?.last_updated_by) return null;
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:11, color:"#7a6a50", background:"#fdf8f0", border:"1px solid #e8dfc8", borderRadius:8, padding:"4px 10px" }}>
      <User size={10} color="#c9a84c" />
      <span>Last edited by <span style={{ fontWeight:700, color:"#8a6f28" }}>{record.last_updated_by}</span></span>
      {record.last_updated_at && <span>· {new Date(record.last_updated_at).toLocaleString("en-PH", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}</span>}
    </div>
  );
}

const NAV_GROUPS = [
  { label: "Overview", items: [{ id:"overview", label:"Executive Overview", icon:Home }] },
  { label: "Performance", items: [{ id:"ranking", label:"CSR Ranking", icon:BarChart2 }, { id:"kpi", label:"KPI Breakdown", icon:Target }, { id:"team", label:"Team Performance", icon:Layers }, { id:"comparison", label:"Quarter Comparison", icon:GitCompare }] },
  { label: "Quality & Coaching", items: [{ id:"coaching", label:"Coaching Tracker", icon:BookOpen }, { id:"qa", label:"QA Audit Log", icon:ClipboardList }] },
  { label: "Data Entry", items: [{ id:"weekly", label:"Weekly Scorecard", icon:Star }, { id:"dataentry", label:"Weekly Entry", icon:ClipboardList }, { id:"monthly", label:"Monthly Dashboard", icon:Calendar }, { id:"monthlyentry", label:"Monthly Entry", icon:Calendar }] },
  { label: "System", items: [{ id:"roadmap", label:"Roadmap", icon:Rocket }] },
];

function Sidebar({ active, onNav, user, onSignOut }) {
  const [collapsed, setCollapsed] = useState({});
  const toggleGroup = (label) => setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  return (
    <div style={{ width:240, minHeight:"100vh", background:"#1b1832", display:"flex", flexDirection:"column", flexShrink:0, borderRight:"1px solid #2e2814" }}>
      <div style={{ padding:"20px 16px 16px", borderBottom:"1px solid #2e2814" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"#c9a84c", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px #c9a84c44" }}><Activity size={16} color="#12101f" /></div>
          <div>
            <p style={{ color:"#c9a84c", fontSize:10, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase" }}>Meta Digitrading</p>
            <p style={{ color:"#f5ecd4", fontSize:11, fontWeight:600 }}>TL Control Panel</p>
          </div>
        </div>
      </div>
      <nav style={{ flex:1, padding:"10px 10px", overflowY:"auto" }}>
        {NAV_GROUPS.map(group => {
          const isGroupCollapsed = collapsed[group.label];
          const hasActive = group.items.some(i => i.id === active || (active === "profile" && i.id === "ranking"));
          return (
            <div key={group.label} style={{ marginBottom:4 }}>
              <button onClick={() => toggleGroup(group.label)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px", borderRadius:8, border:"none", background:"transparent", cursor:"pointer", fontFamily:"inherit", marginBottom:2 }}>
                <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", color: hasActive ? "#c9a84c" : "#4a3f2e" }}>{group.label}</span>
                <ChevronDown size={12} color={hasActive ? "#c9a84c" : "#4a3f2e"} style={{ transform: isGroupCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition:"transform 0.2s", flexShrink:0 }} />
              </button>
              {!isGroupCollapsed && (
                <div style={{ paddingLeft:4 }}>
                  {group.items.map(({ id, label, icon:Icon }) => {
                    const isActive = active === id || (id === "ranking" && active === "profile");
                    return (
                      <button key={id} onClick={() => onNav(id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:8, marginBottom:1, border:"none", textAlign:"left", cursor:"pointer", fontSize:13, fontWeight: isActive ? 700 : 500, background: isActive ? "#f5ecd4" : "transparent", color: isActive ? "#7a5c10" : "#8b7a58", borderLeft: isActive ? "2px solid #c9a84c" : "2px solid transparent", transition:"all 0.15s", fontFamily:"inherit" }}
                        onMouseEnter={e => { if(!isActive) { e.currentTarget.style.background="#2e2814"; e.currentTarget.style.color="#f5ecd4"; }}}
                        onMouseLeave={e => { if(!isActive) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#8b7a58"; }}}>
                        <Icon size={14} style={{ flexShrink:0 }} /><span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div style={{ padding:"12px 14px", borderTop:"1px solid #2e2814" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#c9a84c,#e8c96b)", display:"flex", alignItems:"center", justifyContent:"center", color:"#12101f", fontSize:11, fontWeight:900, flexShrink:0 }}>{(user?.email?.[0] || "U").toUpperCase()}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ color:"#f5ecd4", fontSize:11, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.email}</p>
            <p style={{ color:"#4a3f2e", fontSize:10 }}>Signed in</p>
          </div>
        </div>
        <button onClick={onSignOut} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"6px 10px", borderRadius:8, border:"none", background:"transparent", color:"#c0392b", fontSize:11, cursor:"pointer", fontFamily:"inherit" }} onMouseEnter={e => { e.currentTarget.style.background="#c0392b11"; }} onMouseLeave={e => { e.currentTarget.style.background="transparent"; }}>
          <LogOut size={11} />Sign out
        </button>
        <p style={{ color:"#2e2814", fontSize:10, marginTop:6 }}>v2.1 · Supabase Connected</p>
      </div>
    </div>
  );
}

function Header({ title, subtitle, loadedAt, onRefresh, isRefreshing, user }) {
  return (
    <div style={{ background:"#ffffff", borderBottom:"1px solid #e8dfc8", padding:"12px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, boxShadow:"0 1px 8px #c9a84c10" }}>
      <div>
        <h1 style={{ fontSize:16, fontWeight:800, color:"#1a1510", margin:0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize:11, color:"#7a6a50", marginTop:2 }}>{subtitle}</p>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        {loadedAt && (
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:"#8a6f28", border:"1px solid #e8c96b", background:"#fdf3d8", padding:"6px 12px", borderRadius:8 }}>
            <CheckCircle size={11} />
            <span>Live · {loadedAt}</span>
            <button onClick={onRefresh} disabled={isRefreshing} style={{ background:"none", border:"none", cursor:"pointer", color:"#c9a84c", opacity:isRefreshing?0.5:1, padding:0 }}>
              <RefreshCw size={10} style={{ animation:isRefreshing?"spin 1s linear infinite":"none" }} />
            </button>
          </div>
        )}
        <div style={{ textAlign:"right" }}>
          <p style={{ fontSize:10, color:"#a89070" }}>Current Period</p>
          <p style={{ fontSize:13, fontWeight:700, color:"#c9a84c" }}>2026</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#c9a84c,#e8c96b)", display:"flex", alignItems:"center", justifyContent:"center", color:"#12101f", fontSize:12, fontWeight:900 }}>{(user?.email?.[0] || "U").toUpperCase()}</div>
          <p style={{ fontSize:11, fontWeight:600, color:"#1a1510", maxWidth:128, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.email}</p>
        </div>
      </div>
    </div>
  );
}

const chartGridProps = { strokeDasharray:"3 3", stroke:"#e8dfc8" };
const chartTickStyle = { fontSize:11, fill:"#7a6a50" };
const tooltipStyle = { background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:8, color:"#1a1510", fontSize:12, boxShadow:"0 4px 16px #c9a84c11" };
const TH_STYLE = { padding:"10px 12px", textAlign:"left", fontSize:10, fontWeight:700, color:"#8a6f28", whiteSpace:"nowrap", background:"#fdf8f0", letterSpacing:"0.06em", textTransform:"uppercase" };
const tdBase = (i) => ({ background: i%2===0 ? "#ffffff" : "#fdf8f0", borderBottom:"1px solid #f5ecd4" });

function ExecutiveOverview({ data, onSelectCSR }) {
  const { performanceData } = data;
  if (!performanceData.length) return <div style={{ background:"#fdf8f0", minHeight:"100%" }}><EmptyState /></div>;
  const agg = getAggregated(performanceData);
  const coaching = agg.filter(r => r.total_rate < 3.50);
  const months = [...new Set(performanceData.map(r => r.month).filter(Boolean))];
  const monthlyTrend = months.slice(0,6).map(m => { const rows = performanceData.filter(r => r.month === m); return { month:m?.slice(0,3), avg:avg(rows,"total_rate"), kra:avg(rows,"kra_scale") }; });
  const kpiHealth = [{ name:"Conversion", val:avg(performanceData,"conversion_score") }, { name:"RMO", val:avg(performanceData,"rmo_score") }, { name:"RTS", val:avg(performanceData,"rts_score") }, { name:"Delivery", val:avg(performanceData,"delivery_success_score") }, { name:"Upsell", val:avg(performanceData,"upsell_score") }, { name:"ESC", val:avg(performanceData,"esc_score") }];
  const card = { background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:14, padding:20, boxShadow:"0 1px 4px #c9a84c08" };
  return (
    <div style={{ padding:28, background:"#fdf8f0", minHeight:"100%" }} className="space-y-6">
      <SectionHeader title="Executive Overview" sub="Live data · submitted entries only" />
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total CSRs" value={agg.length} sub="With performance data" icon={Users} color="gold" />
        <MetricCard label="Team Avg Total Rate" value={avg(agg,"total_rate").toFixed(2)} sub="Scale 1.00–5.00" icon={TrendingUp} color="amber" />
        <MetricCard label="Total Entries" value={performanceData.length} sub="Submitted records" icon={Target} color="warm" />
        <MetricCard label="Needs Coaching" value={coaching.length} sub="Below 3.50 threshold" icon={AlertTriangle} color="red" alert={coaching.length>3} />
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div style={card}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}><Award size={14} color="#c9a84c" /><h3 style={{ fontWeight:700, color:"#1a1510", fontSize:13, margin:0 }}>Top 5 Performers</h3></div>
          {agg.slice(0,5).map((c,i) => (
            <div key={c.csr_name} onClick={() => onSelectCSR(c)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, cursor:"pointer", marginBottom:4, transition:"background 0.15s" }} onMouseEnter={e=>e.currentTarget.style.background="#fdf8f0"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ width:22, height:22, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, flexShrink:0, background:i===0?"linear-gradient(135deg,#c9a84c,#e8c96b)":i===1?"#e8dfc8":i===2?"linear-gradient(135deg,#a0845a,#c9a84c)":"#fdf8f0", color:i===0||i===2?"#12101f":"#7a6a50" }}>{i+1}</span>
              <div style={{ flex:1, minWidth:0 }}><p style={{ fontSize:13, fontWeight:600, color:"#1a1510", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.csr_name}</p><p style={{ fontSize:11, color:"#7a6a50" }}>{c.team}</p></div>
              <div style={{ textAlign:"right", flexShrink:0 }}><p style={{ fontSize:13, fontWeight:800, color:"#c9a84c" }}>{c.total_rate}</p><StatusBadge status={getStatus(c.total_rate)} /></div>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}><TrendingDown size={14} color="#c0392b" /><h3 style={{ fontWeight:700, color:"#1a1510", fontSize:13, margin:0 }}>Bottom 5 Performers</h3></div>
          {agg.slice(-5).reverse().map((c,i) => (
            <div key={c.csr_name} onClick={() => onSelectCSR(c)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, cursor:"pointer", marginBottom:4, transition:"background 0.15s" }} onMouseEnter={e=>e.currentTarget.style.background="#fdf8f0"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ width:22, height:22, borderRadius:"50%", background:"#fef2f0", color:"#c0392b", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, flexShrink:0 }}>{agg.length-i}</span>
              <div style={{ flex:1, minWidth:0 }}><p style={{ fontSize:13, fontWeight:600, color:"#1a1510", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.csr_name}</p><p style={{ fontSize:11, color:"#7a6a50" }}>{c.team}</p></div>
              <div style={{ textAlign:"right", flexShrink:0 }}><p style={{ fontSize:13, fontWeight:800, color:"#1a1510" }}>{c.total_rate}</p><StatusBadge status={getStatus(c.total_rate)} /></div>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}><BookOpen size={14} color="#c96030" /><h3 style={{ fontWeight:700, color:"#1a1510", fontSize:13, margin:0 }}>Coaching Priority</h3></div>
          {coaching.length === 0 ? <p style={{ fontSize:13, color:"#7a6a50" }}>No CSRs below 3.50. 🎉</p>
            : coaching.map(c => (
              <div key={c.csr_name} onClick={() => onSelectCSR(c)} style={{ padding:"8px 10px", borderRadius:8, border:"1px solid #fdba74", background:"#fff7ed", cursor:"pointer", marginBottom:8, transition:"background 0.15s" }} onMouseEnter={e=>e.currentTarget.style.background="#ffedd5"} onMouseLeave={e=>e.currentTarget.style.background="#fff7ed"}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}><p style={{ fontSize:13, fontWeight:600, color:"#1a1510", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{c.csr_name}</p><StatusBadge status={getStatus(c.total_rate)} /></div>
                <p style={{ fontSize:11, color:"#7a6a50" }}>{c.team} · Rate: {c.total_rate}</p>
              </div>
            ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div style={card}>
          <h3 style={{ fontWeight:700, color:"#1a1510", fontSize:13, marginBottom:16, marginTop:0 }}>Performance Trend by Month</h3>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyTrend}><CartesianGrid {...chartGridProps} /><XAxis dataKey="month" tick={chartTickStyle} /><YAxis domain={[0,5]} tick={chartTickStyle} /><Tooltip contentStyle={tooltipStyle} formatter={v => v?.toFixed(2)} /><Legend wrapperStyle={{ fontSize:11, color:"#7a6a50" }} /><Line type="monotone" dataKey="avg" name="Total Rate" stroke="#c9a84c" strokeWidth={2.5} dot={{ r:4, fill:"#c9a84c" }} /><Line type="monotone" dataKey="kra" name="KRA Scale" stroke="#e8c96b" strokeWidth={2} dot={{ r:4, fill:"#e8c96b" }} /></LineChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No monthly data yet." sub="" />}
        </div>
        <div style={card}>
          <h3 style={{ fontWeight:700, color:"#1a1510", fontSize:13, marginBottom:16, marginTop:0 }}>KPI Health Summary</h3>
          {kpiHealth.map(k => (
            <div key={k.name} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <span style={{ fontSize:11, color:"#7a6a50", width:76, fontWeight:600 }}>{k.name}</span>
              <div style={{ flex:1, background:"#e8dfc8", borderRadius:99, height:6 }}><div style={{ height:6, borderRadius:99, width:`${Math.min(k.val,100)}%`, background:k.val>=80?"linear-gradient(90deg,#c9a84c,#8a6f28)":k.val>=70?"#e8c96b":"#c0392b", transition:"width 0.5s" }} /></div>
              <span style={{ fontSize:11, fontWeight:800, width:44, textAlign:"right", color:k.val>=80?"#8a6f28":k.val>=70?"#c9a84c":"#c0392b" }}>{k.val?.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CSRRanking({ data, onSelectCSR }) {
  const { performanceData, allTeams } = data;
  const [viewMode, setViewMode] = useState("detail"); // "detail" | "quarter"
  const [f, setF] = useState({ quarter:"All", month:"All", week:"All", team:"All", status:"All", search:"" });

  const quarters = [...new Set(performanceData.map(r => r.quarter).filter(Boolean))];
  const months   = [...new Set(performanceData.map(r => r.month).filter(Boolean))];
  const weeks    = [...new Set(performanceData.map(r => r.week).filter(Boolean))].sort((a, b) => { if (a === "Monthly") return 1; if (b === "Monthly") return -1; return a.localeCompare(b); });

  const filtered = useMemo(() => {
    let d = performanceData;
    if (f.quarter !== "All") d = d.filter(r => r.quarter === f.quarter);
    if (f.month !== "All")   d = d.filter(r => r.month === f.month);
    if (f.week !== "All")    d = d.filter(r => r.week === f.week);
    if (f.team !== "All")    d = d.filter(r => r.team === f.team);
    let agg = getAggregated(d);
    if (f.status !== "All")  agg = agg.filter(r => getStatus(r.total_rate) === f.status);
    if (f.search)            agg = agg.filter(r => r.csr_name?.toLowerCase().includes(f.search.toLowerCase()));
    return agg;
  }, [f, performanceData]);

  const quarterAgg = useMemo(() => {
    let agg = getQuarterlyAggregated(performanceData, f.quarter);
    if (f.team !== "All")   agg = agg.filter(r => r.team === f.team);
    if (f.status !== "All") agg = agg.filter(r => getStatus(r.total_rate) === f.status);
    if (f.search)            agg = agg.filter(r => r.csr_name?.toLowerCase().includes(f.search.toLowerCase()));
    return agg;
  }, [f.quarter, f.team, f.status, f.search, performanceData]);

  if (!performanceData.length) return <div style={{ background:"#fdf8f0", padding:28 }}><EmptyState /></div>;

  const toggleBtn = (id, label) => (
    <button onClick={() => setViewMode(id)} style={{
      padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
      background: viewMode === id ? "#c9a84c" : "#ffffff",
      color: viewMode === id ? "#12101f" : "#7a6a50",
      border: viewMode === id ? "1.5px solid #c9a84c" : "1.5px solid #e8dfc8",
    }}>{label}</button>
  );

  return (
    <div style={{ padding:28, background:"#fdf8f0", minHeight:"100%" }} className="space-y-5">
      <SectionHeader title="CSR Ranking" sub="Ranked by Total Rate · submitted entries only">
        <button onClick={() => exportRankingExcel(viewMode === "quarter" ? quarterAgg : filtered)} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", fontSize:12, fontWeight:700, border:"1px solid #e8c96b", borderRadius:8, color:"#8a6f28", background:"#fdf3d8", cursor:"pointer" }}><FileSpreadsheet size={13} />Export Excel</button>
      </SectionHeader>

      <div style={{ display:"flex", gap:8 }}>
        {toggleBtn("detail", "Week / Month Detail")}
        {toggleBtn("quarter", "Full Quarter Summary")}
      </div>

      <div style={{ background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:12, padding:"12px 16px", display:"flex", flexWrap:"wrap", gap:10, alignItems:"center" }}>
        <Filter size={13} color="#c9a84c" />
        <FilterSelect value={f.quarter} onChange={v=>setF(p=>({...p,quarter:v}))} label="Quarters" options={quarters} />
        {viewMode === "detail" && (
          <>
            <FilterSelect value={f.month} onChange={v=>setF(p=>({...p,month:v}))} label="Months" options={months} />
            <FilterSelect value={f.week}  onChange={v=>setF(p=>({...p,week:v}))}  label="Weeks"  options={weeks} />
          </>
        )}
        <FilterSelect value={f.team}   onChange={v=>setF(p=>({...p,team:v}))}   label="Teams"    options={allTeams} />
        <FilterSelect value={f.status} onChange={v=>setF(p=>({...p,status:v}))} label="Statuses" options={["Excellent","Good","Needs Monitoring","For Coaching","Critical"]} />
        <div style={{ position:"relative", flex:1, minWidth:160 }}>
          <Search size={13} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#c9a84c" }} />
          <input value={f.search} onChange={e=>setF(p=>({...p,search:e.target.value}))} placeholder="Search CSR name…" style={{ width:"100%", background:"#fdf8f0", border:"1px solid #e8dfc8", borderRadius:8, paddingLeft:32, paddingRight:12, paddingTop:6, paddingBottom:6, fontSize:13, color:"#1a1510", outline:"none", boxSizing:"border-box" }} />
        </div>
      </div>

      {viewMode === "detail" ? (
        <div style={{ background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:12, overflow:"hidden" }} className="fade-in">
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", fontSize:12, borderCollapse:"collapse" }}>
              <thead><tr>{["#","CSR Name","Team","Month","Week","Total Rate","KRA Scale","Behavioral","Conv %","RMO %","RTS %","Delivery %","Upsell %","Last Edited By","Status",""].map(h=><th key={h} style={TH_STYLE}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.length===0
                  ? <tr><td colSpan={16} style={{ textAlign:"center", padding:40, color:"#a89070" }}>No CSRs match current filters.</td></tr>
                  : filtered.map((c,i) => (
                    <tr key={c.csr_name+i} style={{ ...tdBase(i), transition:"background 0.1s" }} onMouseEnter={e=>e.currentTarget.style.background="#fdf3d8"} onMouseLeave={e=>e.currentTarget.style.background=tdBase(i).background}>
                      <td style={{ padding:"10px 12px", color:"#a89070", fontWeight:700, fontSize:10 }}>{i+1}</td>
                      <td style={{ padding:"10px 12px" }}><button onClick={() => onSelectCSR(c)} style={{ color:"#c9a84c", fontWeight:700, background:"none", border:"none", cursor:"pointer", fontSize:12, whiteSpace:"nowrap" }}>{c.csr_name}</button></td>
                      <td style={{ padding:"10px 12px", color:"#7a6a50", fontSize:11, whiteSpace:"nowrap" }}>{c.team}</td>
                      <td style={{ padding:"10px 12px", color:"#a89070", fontSize:11 }}>{c.month||"—"}</td>
                      <td style={{ padding:"10px 12px" }}>{c.week === "Monthly" ? <span style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background:"#eff6ff", color:"#1d4ed8", border:"1px solid #bfdbfe", fontWeight:700 }}>Monthly</span> : <span style={{ color:"#a89070", fontSize:11 }}>{c.week||"—"}</span>}</td>
                      <td style={{ padding:"10px 12px", fontWeight:900, color:"#c9a84c", fontSize:14 }}>{c.total_rate}</td>
                      <td style={{ padding:"10px 12px", color:"#1a1510" }}>{c.kra_scale}</td>
                      <td style={{ padding:"10px 12px", color:"#1a1510" }}>{c.behavioral_scale}</td>
                      {["conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score"].map(k=><td key={k} style={{ padding:"10px 12px", fontWeight:700, color:c[k]<80?"#c0392b":"#1a1510" }}>{parseFloat(c[k]).toFixed(1)}%</td>)}
                      <td style={{ padding:"10px 12px" }}>{c.last_updated_by ? <span style={{ fontSize:11, color:"#7a6a50", display:"flex", alignItems:"center", gap:4 }}><User size={10} />{c.last_updated_by}</span> : <span style={{ color:"#e8dfc8" }}>—</span>}</td>
                      <td style={{ padding:"10px 12px" }}><StatusBadge status={getStatus(c.total_rate)} /></td>
                      <td style={{ padding:"10px 12px" }}><button onClick={() => onSelectCSR(c)} style={{ display:"flex", alignItems:"center", gap:4, color:"#c9a84c", background:"none", border:"none", cursor:"pointer", fontSize:11, fontWeight:700 }}><Eye size={12} />View</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding:"8px 14px", borderTop:"1px solid #e8dfc8", fontSize:11, color:"#a89070" }}>Showing {filtered.length} CSRs</div>
        </div>
      ) : (
        <div style={{ background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:12, overflow:"hidden" }} className="fade-in">
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", fontSize:12, borderCollapse:"collapse" }}>
              <thead><tr>{["#","CSR Name","Team","Quarter","Months Included","Total Rate","KRA","Behavioral","Conv %","RMO %","RTS %","Delivery %","Upsell %","Status"].map(h=><th key={h} style={TH_STYLE}>{h}</th>)}</tr></thead>
              <tbody>
                {quarterAgg.length===0
                  ? <tr><td colSpan={14} style={{ textAlign:"center", padding:40, color:"#a89070" }}>No data for this quarter.</td></tr>
                  : quarterAgg.map((c,i) => (
                    <tr key={c.csr_name+c.quarter+i} style={tdBase(i)}>
                      <td style={{ padding:"10px 12px", color:"#a89070", fontWeight:700, fontSize:10 }}>{i+1}</td>
                      <td style={{ padding:"10px 12px" }}><button onClick={() => onSelectCSR(c)} style={{ color:"#c9a84c", fontWeight:700, background:"none", border:"none", cursor:"pointer", fontSize:12, whiteSpace:"nowrap" }}>{c.csr_name}</button></td>
                      <td style={{ padding:"10px 12px", color:"#7a6a50", fontSize:11, whiteSpace:"nowrap" }}>{c.team}</td>
                      <td style={{ padding:"10px 12px", color:"#7a6a50" }}>{c.quarter||"—"}</td>
                      <td style={{ padding:"10px 12px", color:"#a89070", fontSize:10.5 }}>{c.monthsIncluded}</td>
                      <td style={{ padding:"10px 12px", fontWeight:900, color:"#c9a84c", fontSize:14 }}>{c.total_rate}</td>
                      <td style={{ padding:"10px 12px", color:"#1a1510" }}>{c.kra_scale}</td>
                      <td style={{ padding:"10px 12px", color:"#1a1510" }}>{c.behavioral_scale}</td>
                      {["conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score"].map(k=><td key={k} style={{ padding:"10px 12px", fontWeight:700, color:c[k]<80?"#c0392b":"#1a1510" }}>{parseFloat(c[k]).toFixed(1)}%</td>)}
                      <td style={{ padding:"10px 12px" }}><StatusBadge status={getStatus(c.total_rate)} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding:"8px 14px", borderTop:"1px solid #e8dfc8", fontSize:11, color:"#a89070" }}>Showing {quarterAgg.length} CSRs · quarter average = equal weight per month, regardless of weekly vs monthly entry</div>
        </div>
      )}
    </div>
  );
}

function CSRProfile({ csr, data, onBack }) {
  const { performanceData, coachingLogs } = data;
  const csrRecords = performanceData.filter(r => r.csr_name === csr.csr_name);
  const allAgg = getAggregated(performanceData);
  const rank = allAgg.findIndex(r => r.csr_name === csr.csr_name) + 1;
  const csrCoachingLogs = coachingLogs.filter(l => l.csr_name === csr.csr_name).sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
  const trendData = csrRecords.map(r => ({ label:`${r.month?.slice(0,3)||""} ${r.week||""}`.trim(), rate:r.total_rate, kra:r.kra_scale }));
  const kpiData = [{ subject:"Conv", value:csr.conversion_score },{ subject:"RMO", value:csr.rmo_score },{ subject:"RTS", value:csr.rts_score },{ subject:"Deliv", value:csr.delivery_success_score },{ subject:"Upsell", value:csr.upsell_score },{ subject:"ESC", value:csr.esc_score }];
  const monthlyReps = getMonthlyReps(csrRecords).sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month));
  const card = { background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:14, padding:20, boxShadow:"0 1px 4px #c9a84c08" };
  return (
    <div style={{ padding:28, background:"#fdf8f0", minHeight:"100%" }} className="space-y-5">
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:"#c9a84c", fontWeight:700, background:"none", border:"none", cursor:"pointer" }}><ChevronRight size={14} style={{ transform:"rotate(180deg)" }} />Back to Ranking</button>
      <div style={{ ...card, padding:24 }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:20 }}>
          <div style={{ width:60, height:60, borderRadius:16, background:"linear-gradient(135deg,#c9a84c,#e8c96b)", display:"flex", alignItems:"center", justifyContent:"center", color:"#12101f", fontSize:20, fontWeight:900, flexShrink:0 }}>{(csr.csr_name||"").split(" ").map(n=>n[0]).slice(0,2).join("")}</div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}><h2 style={{ fontSize:20, fontWeight:900, color:"#1a1510", margin:0 }}>{csr.csr_name}</h2><StatusBadge status={getStatus(csr.total_rate)} /></div>
            <p style={{ color:"#7a6a50", fontSize:13, marginTop:4 }}>{csr.team} · Rank #{rank} of {allAgg.length}</p>
            {csr.last_updated_by && <div style={{ marginTop:6 }}><LastTouchBadge record={csr} /></div>}
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}><p style={{ fontSize:32, fontWeight:900, color:"#c9a84c", margin:0, lineHeight:1 }}>{csr.total_rate}</p><p style={{ fontSize:11, color:"#7a6a50", marginTop:4 }}>Total Rate (Avg)</p></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginTop:20, paddingTop:20, borderTop:"1px solid #e8dfc8" }}>
          {[["KRA Scale",csr.kra_scale],["Behavioral Scale",csr.behavioral_scale],["Records",csrRecords.length]].map(([l,v])=>(
            <div key={l} style={{ textAlign:"center", padding:12, background:"#fdf8f0", borderRadius:10 }}><p style={{ fontSize:11, color:"#7a6a50", margin:0 }}>{l}</p><p style={{ fontSize:22, fontWeight:900, color:"#1a1510", margin:"4px 0 0" }}>{v}</p></div>
          ))}
        </div>
      </div>
     <div className="grid grid-cols-2 gap-5">
        <div style={card}>
          <h3 style={{ fontWeight:700, color:"#1a1510", fontSize:13, marginBottom:16, marginTop:0 }}>Performance Trend</h3>
          {trendData.length > 0
            ? <ResponsiveContainer width="100%" height={180}>...</ResponsiveContainer>
            : <EmptyState message="Only one record." sub="" />}
        </div>
        <div style={card}>
          <h3 style={{ fontWeight:700, color:"#1a1510", fontSize:13, marginBottom:16, marginTop:0 }}>KPI Radar</h3>
          <ResponsiveContainer width="100%" height={180}>...</ResponsiveContainer>
        </div>
      </div>
      {csrCoachingLogs.length > 0 && (
        <div style={{ ...card, border:"1px solid #fdba74" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}><BookOpen size={14} color="#c96030" /><h3 style={{ fontWeight:700, color:"#1a1510", fontSize:13, margin:0 }}>Coaching History</h3></div>
          {csrCoachingLogs.map((log,i) => (
            <div key={log.id||i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:12, background:"#fff7ed", borderRadius:8, marginBottom:6, fontSize:11 }}>
              <div style={{ flex:1 }}><div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}><span style={{ fontWeight:700, color:"#1a1510" }}>{log.kpi_issue}</span><span style={{ padding:"1px 8px", borderRadius:99, fontWeight:700, fontSize:10, background:log.status==="Done"||log.status==="Improved"?"#f0faf0":"#fff7ed", color:log.status==="Done"||log.status==="Improved"?"#2e7d32":"#c96030" }}>{log.status}</span></div><p style={{ color:"#7a6a50", margin:0 }}>{log.result_notes||"No notes."}</p></div>
              <div style={{ textAlign:"right", color:"#a89070", whiteSpace:"nowrap", flexShrink:0 }}><p>{log.coaching_owner||"—"}</p><p>{log.updated_by||""}</p><p>{log.updated_at?new Date(log.updated_at).toLocaleDateString():""}</p></div>
            </div>
          ))}
        </div>
      )}
      <div style={{ background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"10px 16px", borderBottom:"1px solid #e8dfc8", background:"#fdf8f0" }}><h3 style={{ fontWeight:700, color:"#1a1510", fontSize:13, margin:0 }}>All Records</h3></div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
            <thead><tr>{["Month","Week","Final Score","KRA","Behavioral","Conv%","RMO%","RTS%","Delivery%","Upsell%","Last Edited By"].map(h=><th key={h} style={TH_STYLE}>{h}</th>)}</tr></thead>
            <tbody>
              {csrRecords.map((r,i) => (
                <tr key={i} style={tdBase(i)}>
                  <td style={{ padding:"8px 12px", color:"#7a6a50" }}>{r.month||"—"}</td>
                  <td style={{ padding:"8px 12px", color:"#7a6a50" }}>{r.week||"—"}</td>
                  <td style={{ padding:"8px 12px", fontWeight:900, color:"#c9a84c" }}>{parseFloat(r.final_score||0).toFixed(2)}</td>
                  <td style={{ padding:"8px 12px", color:"#1a1510" }}>{parseFloat(r.kra_total||0).toFixed(2)}</td>
                  <td style={{ padding:"8px 12px", color:"#1a1510" }}>{parseFloat(r.bi_score||0).toFixed(2)}</td>
                  {["conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score"].map(k=><td key={k} style={{ padding:"8px 12px", fontWeight:700, color:r[k]<80?"#c0392b":"#1a1510" }}>{parseFloat(r[k]||0).toFixed(1)}%</td>)}
                  <td style={{ padding:"8px 12px", color:"#7a6a50" }}>{r.last_updated_by||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPIBreakdown({ data }) {
  const { performanceData, allTeams } = data;
  const [f, setF] = useState({ quarter:"All", month:"All", team:"All" });
  const filtData = useMemo(() => { let d = performanceData; if (f.quarter !== "All") d = d.filter(r => r.quarter === f.quarter); if (f.month !== "All") d = d.filter(r => r.month === f.month); if (f.team !== "All") d = d.filter(r => r.team === f.team); return d; }, [f, performanceData]);
  const quarters = [...new Set(performanceData.map(r=>r.quarter).filter(Boolean))];
  const months   = [...new Set(performanceData.map(r=>r.month).filter(Boolean))];
  const cats = [{ name:"Conversion", key:"conversion_score", target:80 }, { name:"RMO", key:"rmo_score", target:80 }, { name:"RTS", key:"rts_score", target:80 }, { name:"Delivery", key:"delivery_success_score", target:80 }, { name:"Upsell", key:"upsell_score", target:80 }, { name:"ESC", key:"esc_score", target:80 }];
  if (!performanceData.length) return <div style={{ background:"#fdf8f0", padding:28 }}><EmptyState /></div>;
  const chartData = cats.map(c => ({ name:c.name, avg:avg(filtData,c.key), target:c.target }));
  const card = { background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:14, padding:20, boxShadow:"0 1px 4px #c9a84c08" };
  return (
    <div style={{ padding:28, background:"#fdf8f0", minHeight:"100%" }} className="space-y-5">
      <SectionHeader title="KPI Breakdown" sub="Category-level performance analysis" />
      <div style={{ ...card, display:"flex", flexWrap:"wrap", gap:10, alignItems:"center" }}>
        <Filter size={13} color="#c9a84c" />
        <FilterSelect value={f.quarter} onChange={v=>setF(p=>({...p,quarter:v}))} label="Quarters" options={quarters} />
        <FilterSelect value={f.month}   onChange={v=>setF(p=>({...p,month:v}))}   label="Months"   options={months} />
        <FilterSelect value={f.team}    onChange={v=>setF(p=>({...p,team:v}))}    label="Teams"    options={allTeams} />
      </div>
      <div style={card}>
        <h3 style={{ fontWeight:700, color:"#1a1510", fontSize:13, marginBottom:16, marginTop:0 }}>KPI Average vs Target</h3>
        <ResponsiveContainer width="100%" height={240}><BarChart data={chartData} barCategoryGap="30%"><CartesianGrid {...chartGridProps} /><XAxis dataKey="name" tick={chartTickStyle} /><YAxis domain={[0,100]} tick={chartTickStyle} /><Tooltip contentStyle={tooltipStyle} formatter={v=>`${v?.toFixed(1)}%`} /><Legend wrapperStyle={{ fontSize:11, color:"#7a6a50" }} /><Bar dataKey="avg" name="Team Avg" fill="#c9a84c" radius={[4,4,0,0]} /><Bar dataKey="target" name="Target" fill="#e8dfc8" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>
      </div>
      <div style={{ background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:12, overflow:"hidden" }} className="fade-in">
        <table style={{ width:"100%", fontSize:12, borderCollapse:"collapse" }}>
          <thead><tr>{["KPI","Target","Team Avg","Below Target","Health","Progress"].map(h=><th key={h} style={TH_STYLE}>{h}</th>)}</tr></thead>
          <tbody>
            {cats.map((c,i) => {
              const a = avg(filtData,c.key);
              const below = [...new Set(filtData.filter(r=>(r[c.key]||0)<c.target).map(r=>r.csr_name))].length;
              const health = a>=c.target?"On Target":a>=c.target-10?"Near Target":"Below Target";
              const hColor = health==="On Target"?"#8a6f28":health==="Near Target"?"#c9a84c":"#c0392b";
              return (
                <tr key={c.name} style={tdBase(i)}>
                  <td style={{ padding:"10px 14px", fontWeight:700, color:"#1a1510" }}>{c.name}</td>
                  <td style={{ padding:"10px 14px", color:"#7a6a50" }}>{c.target}%</td>
                  <td style={{ padding:"10px 14px", fontWeight:800, color:a>=c.target?"#8a6f28":a>=c.target-10?"#c9a84c":"#c0392b" }}>{a?.toFixed(1)}%</td>
                  <td style={{ padding:"10px 14px" }}>{below>0?<span style={{ color:"#c0392b", fontWeight:700 }}>{below} CSR{below!==1?"s":""}</span>:<span style={{ color:"#8a6f28", fontWeight:700 }}>None</span>}</td>
                  <td style={{ padding:"10px 14px" }}><span style={{ padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:700, background:hColor+"18", color:hColor, border:`1px solid ${hColor}44` }}>{health}</span></td>
                  <td style={{ padding:"10px 14px", width:140 }}><div style={{ background:"#e8dfc8", borderRadius:99, height:6 }}><div style={{ height:6, borderRadius:99, width:`${Math.min(a,100)}%`, background:`linear-gradient(90deg,${hColor},${hColor}99)` }} /></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const COACHING_STATUS_OPTIONS = ["Pending","Ongoing","Done","Improved","No Improvement","Escalated"];

function CoachingTracker({ data, user }) {
  const { performanceData, coachingLogs: initialLogs } = data;
  const agg = getAggregated(performanceData);
  const [logs, setLogs] = useState({});
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  useEffect(() => { const init = {}; (initialLogs||[]).forEach(l => { init[l.csr_name] = { coaching_owner:l.coaching_owner||"", status:l.status||"Pending", result_notes:l.result_notes||"" }; }); setLogs(init); }, [initialLogs]);
  const coachingList = useMemo(() =>
  agg
    .filter(c => getCoachingIssues(c).length > 0)
    .map(csr => ({
      csr,
      issues: getCoachingIssues(csr),
      priority: csr.total_rate < 3.00 ? "Critical" : csr.total_rate < 3.50 ? "High" : "Medium",
    }))
    .filter(({ csr }) => {
      const log = logs[csr.csr_name];
      return !(log?.status === "Done" || log?.status === "Improved");
    })
    .sort((a, b) => ({ Critical: 0, High: 1, Medium: 2 }[a.priority] - { Critical: 0, High: 1, Medium: 2 }[b.priority])),
  [agg, logs]
);
  const updateLog = (csrName,field,value) => setLogs(prev=>({...prev,[csrName]:{...prev[csrName],[field]:value}}));
  const saveLog = async (csr) => {
    const logData = logs[csr.csr_name]||{};
    setSaving(p=>({...p,[csr.csr_name]:true}));
    try {
      const payload = { csr_name:csr.csr_name, kpi_issues:getCoachingIssues(csr).map(i=>i.kpi).join(", "), coaching_owner:logData.coaching_owner||"", status:logData.status||"Pending", result_notes:logData.result_notes||"", updated_by:user?.email||"unknown", updated_at:new Date().toISOString() };
      await supabase.from("coaching_logs").upsert(payload,{onConflict:"csr_name"});
      setSaved(p=>({...p,[csr.csr_name]:true}));
      setTimeout(()=>setSaved(p=>({...p,[csr.csr_name]:false})),2000);
    } catch(err) { console.error(err); }
    setSaving(p=>({...p,[csr.csr_name]:false}));
  };
  if (!performanceData.length) return <div style={{ background:"#fdf8f0", padding:28 }}><EmptyState /></div>;
  const pColor = { Critical:{ bg:"#fef2f0",color:"#9b2020",border:"#f5a8a8" }, High:{ bg:"#fff7ed",color:"#9a3412",border:"#fdba74" }, Medium:{ bg:"#fdf3d8",color:"#7a5c10",border:"#e8c96b" } };
  return (
    <div style={{ padding:28, background:"#fdf8f0", minHeight:"100%" }} className="space-y-5">
      <SectionHeader title="Coaching Tracker" sub="Auto-generated from KPI data · changes saved to database">
        <button onClick={()=>exportCoachingPDF(coachingList,initialLogs)} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", fontSize:12, fontWeight:700, border:"1px solid #f5a8a8", borderRadius:8, color:"#9b2020", background:"#fef2f0", cursor:"pointer" }}><FileText size={13} />Export PDF</button>
      </SectionHeader>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Need Coaching" value={coachingList.length} icon={BookOpen} color="orange" />
        <MetricCard label="Critical" value={coachingList.filter(c=>c.priority==="Critical").length} icon={AlertTriangle} color="red" />
        <MetricCard label="High Priority" value={coachingList.filter(c=>c.priority==="High").length} icon={TrendingDown} color="amber" />
        <MetricCard label="On Track" value={agg.length-coachingList.length} icon={CheckCircle} color="gold" />
      </div>
      {coachingList.length===0 ? <EmptyState message="No CSRs need coaching!" sub="All CSRs are above the 3.50 threshold." /> : (
        <div style={{ background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:12, overflow:"hidden" }} className="fade-in">
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
              <thead><tr>{["Priority","CSR Name","Team","KPI Issue","Score","Recommendation","Coaching Owner","Status","Notes / Result","Last Updated By","Save"].map(h=><th key={h} style={TH_STYLE}>{h}</th>)}</tr></thead>
              <tbody>
                {coachingList.map(({csr,issues,priority},idx)=>{
                  const log=logs[csr.csr_name]||{};
                  const dbLog=initialLogs.find(l=>l.csr_name===csr.csr_name);
                  const pc=pColor[priority];
                  const selectStyle = { fontSize:11, border:"1px solid #e8dfc8", borderRadius:6, padding:"4px 8px", background:"#fdf8f0", color:"#1a1510", outline:"none", cursor:"pointer" };
                  return issues.map((issue,ii)=>(
                    <tr key={`${csr.csr_name}-${ii}`} style={tdBase(idx)}>
                      {ii===0&&<td rowSpan={issues.length} style={{ padding:"10px 12px", verticalAlign:"top" }}><span style={{ padding:"2px 10px", borderRadius:99, fontSize:10, fontWeight:800, background:pc.bg, color:pc.color, border:`1px solid ${pc.border}` }}>{priority}</span></td>}
                      {ii===0&&<td rowSpan={issues.length} style={{ padding:"10px 12px", verticalAlign:"top", fontWeight:700, color:"#1a1510", whiteSpace:"nowrap" }}>{csr.csr_name}</td>}
                      {ii===0&&<td rowSpan={issues.length} style={{ padding:"10px 12px", verticalAlign:"top", color:"#7a6a50", whiteSpace:"nowrap" }}>{csr.team}</td>}
                      <td style={{ padding:"10px 12px", fontWeight:700, color:"#1a1510" }}>{issue.kpi}</td>
                      <td style={{ padding:"10px 12px", fontWeight:800, color:"#c0392b" }}>{issue.score}</td>
                      <td style={{ padding:"10px 12px", color:"#7a6a50", maxWidth:140 }}>{issue.rec}</td>
                      {ii===0&&<td rowSpan={issues.length} style={{ padding:"10px 12px", verticalAlign:"top" }}><select value={log.coaching_owner||""} onChange={e=>updateLog(csr.csr_name,"coaching_owner",e.target.value)} style={{ ...selectStyle, minWidth:100 }}><option value="">Select TL…</option>{TL_OPTIONS.map(tl=><option key={tl}>{tl}</option>)}</select></td>}
                      {ii===0&&<td rowSpan={issues.length} style={{ padding:"10px 12px", verticalAlign:"top" }}><select value={log.status||"Pending"} onChange={e=>updateLog(csr.csr_name,"status",e.target.value)} style={selectStyle}>{COACHING_STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}</select></td>}
                      {ii===0&&<td rowSpan={issues.length} style={{ padding:"10px 12px", verticalAlign:"top" }}><input placeholder="Add notes…" value={log.result_notes||""} onChange={e=>updateLog(csr.csr_name,"result_notes",e.target.value)} style={{ fontSize:11, border:"1px solid #e8dfc8", borderRadius:6, padding:"4px 8px", background:"#fdf8f0", color:"#1a1510", outline:"none", width:120 }} /></td>}
                      {ii===0&&<td rowSpan={issues.length} style={{ padding:"10px 12px", verticalAlign:"top", color:"#a89070" }}>{dbLog?(<div><p style={{ fontWeight:700, color:"#7a6a50", margin:0 }}>{dbLog.updated_by||"—"}</p><p style={{ margin:0, fontSize:10 }}>{dbLog.updated_at?new Date(dbLog.updated_at).toLocaleDateString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):""}</p></div>):<span>—</span>}</td>}
                      {ii===0&&<td rowSpan={issues.length} style={{ padding:"10px 12px", verticalAlign:"top" }}><button onClick={()=>saveLog(csr)} disabled={saving[csr.csr_name]} style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 12px", borderRadius:8, border:"none", fontSize:11, fontWeight:700, cursor:"pointer", background:saved[csr.csr_name]?"#fdf3d8":"linear-gradient(135deg,#c9a84c,#8a6f28)", color:saved[csr.csr_name]?"#8a6f28":"#12101f", opacity:saving[csr.csr_name]?0.5:1 }}>{saving[csr.csr_name]?<RefreshCw size={10} style={{animation:"spin 1s linear infinite"}} />:saved[csr.csr_name]?<CheckCircle size={10} />:<Save size={10} />}{saving[csr.csr_name]?"Saving…":saved[csr.csr_name]?"Saved!":"Save"}</button></td>}
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function QuarterComparison({ data }) {
  const { performanceData } = data;
  const quarters = [...new Set(performanceData.map(r => r.quarter).filter(Boolean))];
  const [selectedQ, setSelectedQ] = useState("All");
  if (!performanceData.length) return <div style={{ background:"#fdf8f0", padding:28 }}><EmptyState /></div>;
  const buildQuarterlySummary = (qFilter) => {
    const filtered = qFilter === "All" ? performanceData : performanceData.filter(r => r.quarter === qFilter);
    const byCSRQuarter = {};
    filtered.forEach(r => {
      const key = `${r.csr_name}__${r.quarter}`;
      if (!byCSRQuarter[key]) byCSRQuarter[key] = { csr_name: r.csr_name, team: r.team, quarter: r.quarter, month: r.month, weekly: [], monthly: [] };
      if (r.source === "monthly" || r.week === "Monthly") { byCSRQuarter[key].monthly.push(r); }
      else { byCSRQuarter[key].weekly.push(r); }
    });
    return Object.values(byCSRQuarter).map(c => {
      const weeklyAvg = (key) => c.weekly.length ? +(c.weekly.reduce((s, r) => s + (parseFloat(r[key]) || 0), 0) / c.weekly.length).toFixed(2) : null;
      const monthlyEntry = c.monthly.length ? c.monthly[0] : null;
      const source = monthlyEntry ? "monthly" : c.weekly.length ? "weekly" : null;
      if (!source) return null;
      const total_rate             = monthlyEntry ? +parseFloat(monthlyEntry.total_rate).toFixed(2)             : weeklyAvg("total_rate");
      const kra_scale              = monthlyEntry ? +parseFloat(monthlyEntry.kra_scale).toFixed(2)              : weeklyAvg("kra_scale");
      const behavioral_scale       = monthlyEntry ? +parseFloat(monthlyEntry.behavioral_scale).toFixed(2)       : weeklyAvg("behavioral_scale");
      const conversion_score       = monthlyEntry ? +parseFloat(monthlyEntry.conversion_score).toFixed(1)       : weeklyAvg("conversion_score");
      const rmo_score              = monthlyEntry ? +parseFloat(monthlyEntry.rmo_score).toFixed(1)              : weeklyAvg("rmo_score");
      const rts_score              = monthlyEntry ? +parseFloat(monthlyEntry.rts_score).toFixed(1)              : weeklyAvg("rts_score");
      const delivery_success_score = monthlyEntry ? +parseFloat(monthlyEntry.delivery_success_score).toFixed(1) : weeklyAvg("delivery_success_score");
      const upsell_score           = monthlyEntry ? +parseFloat(monthlyEntry.upsell_score).toFixed(1)           : weeklyAvg("upsell_score");
      return { ...c, source, weeklyCount: c.weekly.length, total_rate, kra_scale, behavioral_scale, conversion_score, rmo_score, rts_score, delivery_success_score, upsell_score };
    }).filter(Boolean).sort((a, b) => b.total_rate - a.total_rate);
  };
  const summary = buildQuarterlySummary(selectedQ);
  const teamAvg = summary.length ? +(summary.reduce((s, r) => s + r.total_rate, 0) / summary.length).toFixed(2) : 0;
  return (
    <div style={{ padding:28, background:"#fdf8f0", minHeight:"100%" }} className="space-y-5">
      <SectionHeader title="Quarter Comparison" sub="Weekly data averaged · Monthly data used as-is" />
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontSize:11, color:"#7a6a50", fontWeight:700 }}>Quarter:</span>
        {["All", ...quarters].map(q => (
          <button key={q} onClick={() => setSelectedQ(q)} style={{
            padding:"5px 14px", borderRadius:99, fontSize:12, fontWeight:700,
            cursor:"pointer", fontFamily:"inherit",
            background: selectedQ === q ? "#c9a84c" : "#ffffff",
            color: selectedQ === q ? "#12101f" : "#7a6a50",
            border: selectedQ === q ? "1.5px solid #c9a84c" : "1.5px solid #e8dfc8",
          }}>{q}</button>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, padding:"6px 14px", background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:10, fontSize:12 }}>
          <span style={{ color:"#7a6a50" }}>Team Avg:</span>
          <span style={{ fontWeight:900, color:"#c9a84c", fontSize:16 }}>{teamAvg}</span>
          <StatusBadge status={getStatus(teamAvg)} />
        </div>
      </div>
      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#7a6a50" }}><span style={{ width:10, height:10, borderRadius:"50%", background:"#0ea5e9", display:"inline-block" }} />Monthly entry (pre-averaged)</div>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#7a6a50" }}><span style={{ width:10, height:10, borderRadius:"50%", background:"#c9a84c", display:"inline-block" }} />Weekly average (Wk 1–4)</div>
      </div>
      {selectedQ === "All" && (
        <div className="grid grid-cols-4 gap-4">
          {quarters.map(q => {
            const qSummary = buildQuarterlySummary(q);
            const qAvg = qSummary.length ? +(qSummary.reduce((s, r) => s + r.total_rate, 0) / qSummary.length).toFixed(2) : 0;
            return (
              <div key={q} onClick={() => setSelectedQ(q)} style={{ background:"#ffffff", border:"1px solid #e8c96b", borderRadius:14, padding:20, boxShadow:"0 2px 12px #c9a84c11", cursor:"pointer", transition:"all 0.15s" }} onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 20px #c9a84c33"} onMouseLeave={e => e.currentTarget.style.boxShadow="0 2px 12px #c9a84c11"}>
                <p style={{ fontSize:10, color:"#c9a84c", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", margin:0 }}>{q} · {QUARTERS[q]?.join(", ")}</p>
                <p style={{ fontSize:28, fontWeight:900, color:"#c9a84c", margin:"8px 0 0" }}>{qAvg}</p>
                <p style={{ fontSize:11, color:"#7a6a50", margin:"4px 0 0" }}>{qSummary.length} CSRs · click to filter</p>
                <StatusBadge status={getStatus(qAvg)} />
              </div>
            );
          })}
        </div>
      )}
      <div style={{ background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:12, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", fontSize:12, borderCollapse:"collapse" }}>
            <thead><tr>{["#","CSR Name","Team","Quarter","Source","Weeks","Total Rate","KRA","Behavioral","Conv %","RMO %","RTS %","Delivery %","Upsell %","Status"].map(h => <th key={h} style={TH_STYLE}>{h}</th>)}</tr></thead>
            <tbody>
              {summary.length === 0
                ? <tr><td colSpan={15} style={{ textAlign:"center", padding:40, color:"#a89070" }}>No data for this quarter.</td></tr>
                : summary.map((c, i) => (
                  <tr key={c.csr_name + c.quarter + i} style={{ ...tdBase(i), transition:"background 0.1s" }} onMouseEnter={e => e.currentTarget.style.background="#fdf3d8"} onMouseLeave={e => e.currentTarget.style.background=tdBase(i).background}>
                    <td style={{ padding:"10px 12px", color:"#a89070", fontWeight:700, fontSize:10 }}>{i+1}</td>
                    <td style={{ padding:"10px 12px", fontWeight:700, color:"#1a1510", whiteSpace:"nowrap" }}>{c.csr_name}</td>
                    <td style={{ padding:"10px 12px", color:"#7a6a50", fontSize:11, whiteSpace:"nowrap" }}>{c.team}</td>
                    <td style={{ padding:"10px 12px", color:"#7a6a50" }}>{c.quarter||"—"}</td>
                    <td style={{ padding:"10px 12px" }}>{c.source === "monthly" ? <span style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background:"#eff6ff", color:"#1d4ed8", border:"1px solid #bfdbfe", fontWeight:700 }}>Monthly</span> : <span style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background:"#fdf3d8", color:"#8a6f28", border:"1px solid #e8c96b", fontWeight:700 }}>Wk avg</span>}</td>
                    <td style={{ padding:"10px 12px", color:"#a89070", fontSize:11 }}>{c.source === "monthly" ? "Monthly" : `${c.weeklyCount} wk${c.weeklyCount !== 1 ? "s" : ""}`}</td>
                    <td style={{ padding:"10px 12px", fontWeight:900, color:"#c9a84c", fontSize:14 }}>{c.total_rate}</td>
                    <td style={{ padding:"10px 12px", color:"#1a1510" }}>{c.kra_scale}</td>
                    <td style={{ padding:"10px 12px", color:"#1a1510" }}>{c.behavioral_scale}</td>
                    {["conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score"].map(k => <td key={k} style={{ padding:"10px 12px", fontWeight:700, color:c[k]<80?"#c0392b":"#1a1510" }}>{parseFloat(c[k]).toFixed(1)}%</td>)}
                    <td style={{ padding:"10px 12px" }}><StatusBadge status={getStatus(c.total_rate)} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:"8px 14px", borderTop:"1px solid #e8dfc8", fontSize:11, color:"#a89070" }}>
          Showing {summary.length} CSRs · {summary.filter(r => r.source === "monthly").length} monthly · {summary.filter(r => r.source === "weekly").length} weekly-averaged
        </div>
      </div>
    </div>
  );
}

function TeamPerformance({ data }) {
  const { performanceData, allTeams } = data;
  if (!performanceData.length) return <div style={{ background:"#fdf8f0", padding:28 }}><EmptyState /></div>;
  const agg = getAggregated(performanceData);
  const teamStats = allTeams.map(team=>{ const members=agg.filter(c=>c.team===team); return { team, members:members.length, avgRate:avg(members,"total_rate"), avgConv:avg(members,"conversion_score"), avgRMO:avg(members,"rmo_score"), avgDel:avg(members,"delivery_success_score"), coaching:members.filter(c=>getCoachingIssues(c).length>0).length, top:[...members].sort((a,b)=>b.total_rate-a.total_rate)[0]?.csr_name?.split(" ")[0]||"—" }; }).filter(t=>t.members>0);
  const barData = teamStats.map(t=>({ name:t.team.replace("Team ",""), rate:t.avgRate }));
  const BAR_COLORS = ["#c9a84c","#e8c96b","#8a6f28","#a0845a","#d4b870","#6b5520"];
  return (
    <div style={{ padding:28, background:"#fdf8f0", minHeight:"100%" }} className="space-y-5">
      <SectionHeader title="Team Performance" sub="Team-level comparison" />
      <div style={{ background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:14, padding:20, boxShadow:"0 1px 4px #c9a84c08" }}>
        <h3 style={{ fontWeight:700, color:"#1a1510", fontSize:13, marginBottom:16, marginTop:0 }}>Team Average Total Rate</h3>
        <ResponsiveContainer width="100%" height={200}><BarChart data={barData}><CartesianGrid {...chartGridProps} /><XAxis dataKey="name" tick={chartTickStyle} /><YAxis domain={[0,5]} tick={chartTickStyle} /><Tooltip contentStyle={tooltipStyle} formatter={v=>v?.toFixed(2)} /><Bar dataKey="rate" name="Avg Rate" radius={[4,4,0,0]}>{barData.map((e,i)=><Cell key={i} fill={BAR_COLORS[i%BAR_COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer>
      </div>
      <div style={{ background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:12, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", fontSize:12, borderCollapse:"collapse" }}>
            <thead><tr>{["Team","CSRs","Avg Rate","Conv%","RMO%","Delivery%","Coaching","Top CSR","Status"].map(h=><th key={h} style={TH_STYLE}>{h}</th>)}</tr></thead>
            <tbody>
              {teamStats.map((t,i)=>(
                <tr key={t.team} style={tdBase(i)}>
                  <td style={{ padding:"10px 14px", fontWeight:800, color:"#1a1510" }}>{t.team}</td>
                  <td style={{ padding:"10px 14px", color:"#7a6a50" }}>{t.members}</td>
                  <td style={{ padding:"10px 14px", fontWeight:900, color:t.avgRate>=4.50?"#8a6f28":t.avgRate>=4.00?"#c9a84c":t.avgRate>=3.50?"#d97706":"#c0392b" }}>{t.avgRate.toFixed(2)}</td>
                  <td style={{ padding:"10px 14px", fontWeight:700, color:t.avgConv<80?"#c0392b":"#1a1510" }}>{t.avgConv.toFixed(1)}%</td>
                  <td style={{ padding:"10px 14px", fontWeight:700, color:t.avgRMO<80?"#c0392b":"#1a1510" }}>{t.avgRMO.toFixed(1)}%</td>
                  <td style={{ padding:"10px 14px", fontWeight:700, color:t.avgDel<80?"#c0392b":"#1a1510" }}>{t.avgDel.toFixed(1)}%</td>
                  <td style={{ padding:"10px 14px" }}>{t.coaching>0?<span style={{ color:"#c96030", fontWeight:800 }}>{t.coaching}</span>:<span style={{ color:"#8a6f28", fontWeight:700 }}>0</span>}</td>
                  <td style={{ padding:"10px 14px", color:"#c9a84c", fontWeight:700, fontSize:11 }}>{t.top}</td>
                  <td style={{ padding:"10px 14px" }}><StatusBadge status={getStatus(t.avgRate)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function QAAuditLog({ data }) {
  const { qaData } = data;
  const [f, setF] = useState({ week:"All", month:"All", team:"All", csr:"All" });
  const filtered = useMemo(() => { let d = qaData; if (f.week!=="All") d=d.filter(r=>r.week===f.week); if (f.month!=="All") d=d.filter(r=>r.month===f.month); if (f.team!=="All") d=d.filter(r=>r.team===f.team); if (f.csr!=="All") d=d.filter(r=>r.csr_name===f.csr); return d; }, [f, qaData]);
  const months = [...new Set(qaData.map(r=>r.month).filter(Boolean))];
  const allNames = [...new Set(qaData.map(r=>r.csr_name).filter(Boolean))].sort();
  const qaTeams = [...new Set(qaData.map(r=>r.team).filter(t=>t&&t!=="Unknown"))].sort();
  if (!qaData.length) return <div style={{ background:"#fdf8f0", padding:28 }}><EmptyState message="No QA data yet." sub="Add QA entries using the Data Entry tab." /></div>;
  return (
    <div style={{ padding:28, background:"#fdf8f0", minHeight:"100%" }} className="space-y-5">
      <SectionHeader title="QA Audit Log" sub="Minimum 2 QA audits per CSR per week" />
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total QA Audits" value={filtered.length} icon={ClipboardList} color="gold" />
        <MetricCard label="Average QA Score" value={avg(filtered,"qa_score").toFixed(1)} icon={Target} color="amber" />
        <MetricCard label="Coaching Needed" value={filtered.filter(q=>q.coaching_needed).length} icon={BookOpen} color="orange" />
        <MetricCard label="Passed" value={filtered.filter(q=>(q.qa_score||0)>=90).length} icon={CheckCircle} color="green" />
      </div>
      <div style={{ background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:12, padding:"12px 16px", display:"flex", flexWrap:"wrap", gap:10, alignItems:"center" }}>
        <Filter size={13} color="#c9a84c" />
        <FilterSelect value={f.week}  onChange={v=>setF(p=>({...p,week:v}))}  label="Weeks"  options={["Week 1","Week 2","Week 3","Week 4"]} />
        <FilterSelect value={f.month} onChange={v=>setF(p=>({...p,month:v}))} label="Months" options={months} />
        <FilterSelect value={f.team}  onChange={v=>setF(p=>({...p,team:v}))}  label="Teams"  options={qaTeams} />
        <FilterSelect value={f.csr}   onChange={v=>setF(p=>({...p,csr:v}))}   label="CSRs"   options={allNames} />
      </div>
      <div style={{ background:"#ffffff", border:"1px solid #e8dfc8", borderRadius:12, overflow:"hidden" }} className="fade-in">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
            <thead><tr>{["CSR Name","Team","Week","Month","Chat Ref","QA Score","Script%","Order Acc%","Tone%","Escalation%","Issue","Audited By","Coaching?","Status"].map(h=><th key={h} style={TH_STYLE}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={14} style={{ textAlign:"center", padding:40, color:"#a89070" }}>No QA records match filters.</td></tr>
                : filtered.map((q,i)=>{
                    const qaStatusLabel = (q.qa_score||0)>=90?"Passed":(q.qa_score||0)>=80?"Needs Monitoring":"Needs Coaching";
                    const qc=(q.qa_score||0)>=90?"#8a6f28":(q.qa_score||0)>=80?"#c9a84c":"#c0392b";
                    return (
                      <tr key={q.id||i} style={tdBase(i)}>
                        <td style={{ padding:"8px 12px", fontWeight:700, color:"#1a1510", whiteSpace:"nowrap" }}>{q.csr_name}</td>
                        <td style={{ padding:"8px 12px", color:"#7a6a50", whiteSpace:"nowrap" }}>{q.team}</td>
                        <td style={{ padding:"8px 12px", color:"#7a6a50" }}>{q.week}</td>
                        <td style={{ padding:"8px 12px", color:"#7a6a50" }}>{q.month}</td>
                        <td style={{ padding:"8px 12px", color:"#a89070", fontFamily:"monospace" }}>{q.chat_ref||"—"}</td>
                        <td style={{ padding:"8px 12px", fontWeight:800, color:qc }}>{q.qa_score}</td>
                        <td style={{ padding:"8px 12px", color:"#1a1510" }}>{q.script_compliance}%</td>
                        <td style={{ padding:"8px 12px", color:"#1a1510" }}>{q.order_accuracy}%</td>
                        <td style={{ padding:"8px 12px", color:"#1a1510" }}>{q.tone_score}%</td>
                        <td style={{ padding:"8px 12px", color:"#1a1510" }}>{q.escalation_handling}%</td>
                        <td style={{ padding:"8px 12px", color:"#7a6a50", maxWidth:100 }}>{q.issue_found||"—"}</td>
                        <td style={{ padding:"8px 12px", color:"#7a6a50", whiteSpace:"nowrap" }}>{q.audited_by||"—"}</td>
                        <td style={{ padding:"8px 12px" }}>{q.coaching_needed?<span style={{ padding:"1px 8px", borderRadius:99, fontSize:10, fontWeight:700, background:"#fff7ed", color:"#c96030", border:"1px solid #fdba74" }}>Yes</span>:<span style={{ padding:"1px 8px", borderRadius:99, fontSize:10, fontWeight:700, background:"#fdf3d8", color:"#8a6f28", border:"1px solid #e8c96b" }}>No</span>}</td>
                        <td style={{ padding:"8px 12px" }}><StatusBadge status={qaStatusLabel} /></td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
        <div style={{ padding:"6px 14px", borderTop:"1px solid #e8dfc8", fontSize:11, color:"#a89070" }}>Showing {filtered.length} QA records</div>
      </div>
    </div>
  );
}

function RoadmapCard() {
  const features = [
    { icon:FileSpreadsheet, label:"Excel Export", desc:"CSR ranking + KPI summaries (done ✓)", done:true },
    { icon:FileText, label:"PDF Coaching Report", desc:"One-click coaching report export (done ✓)", done:true },
    { icon:UserCheck, label:"Login by TL", desc:"Supabase Auth — email/password (done ✓)", done:true },
    { icon:Lock, label:"Draft & Lock System", desc:"Save drafts, lock submitted entries (done ✓)", done:true },
    { icon:RefreshCw, label:"Real-time Sync", desc:"Live data updates without page refresh", done:false },
    { icon:BarChart2, label:"Advanced Analytics", desc:"Trend forecasting and benchmarking", done:false },
  ];
  return (
    <div style={{ padding:28, background:"#fdf8f0", minHeight:"100%" }} className="space-y-6">
      <div><h2 style={{ fontSize:20, fontWeight:900, color:"#1a1510", margin:0 }}>Roadmap</h2><p style={{ fontSize:13, color:"#7a6a50", marginTop:4 }}>Version 2.1 — What's been done & what's next</p></div>
      <div className="grid grid-cols-2 gap-4">
        {features.map(({ icon:Icon, label, desc, done }) => (
          <div key={label} style={{ background:"#ffffff", border:`1px solid ${done?"#e8c96b":"#e8dfc8"}`, borderRadius:14, padding:16, display:"flex", alignItems:"flex-start", gap:12 }} className="fade-in">
            <div style={{ width:38, height:38, borderRadius:10, background:done?"#fdf3d8":"#fdf8f0", border:`1px solid ${done?"#e8c96b":"#e8dfc8"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon size={17} color={done?"#c9a84c":"#a89070"} /></div>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}><p style={{ fontWeight:700, color:done?"#1a1510":"#7a6a50", fontSize:13, margin:0 }}>{label}</p>{done && <span style={{ fontSize:10, fontWeight:800, padding:"1px 7px", borderRadius:99, background:"#fdf3d8", color:"#8a6f28", border:"1px solid #e8c96b" }}>DONE</span>}</div>
              <p style={{ fontSize:12, color:"#a89070", marginTop:3 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PAGE_CONFIG = {
  overview:     { title:"Executive Overview",      subtitle:"Live data · submitted entries only" },
  ranking:      { title:"CSR Ranking",             subtitle:"Ranked by Total Rate · 1.00–5.00 scale" },
  kpi:          { title:"KPI Breakdown",           subtitle:"Category-level KPI analysis" },
  coaching:     { title:"Coaching Tracker",        subtitle:"Auto-generated · changes saved to database" },
  comparison:   { title:"Quarter Comparison",      subtitle:"All quarters with data" },
  team:         { title:"Team Performance",        subtitle:"Team-level comparison and rankings" },
  qa:           { title:"QA Audit Log",            subtitle:"Minimum 2 QA audits per CSR per week" },
  weekly:       { title:"Weekly Scorecard",        subtitle:"Individual CSR weekly scorecard" },
  dataentry:    { title:"Performance Data Entry",  subtitle:"Weekly KPI data input · CSR performance evaluation" },
  roadmap:      { title:"Roadmap",                 subtitle:"Version 2.1 features" },
  profile:      { title:"CSR Profile",             subtitle:"Individual performance details" },
  monthly:      { title:"Monthly Dashboard",       subtitle:"Monthly scorecard per CSR" },
  monthlyentry: { title:"Monthly Data Entry",      subtitle:"Monthly CSR performance evaluation · Week 1–4" },
};

export default function App() {
  const [page, setPage] = useState("overview");
  const [selectedCSR, setSelectedCSR] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
 const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { status, data, error, retry, loadedAt } = useSupabaseData();
  const handleSelectCSR = (csr) => { setSelectedCSR(csr); setPage("profile"); };
  const handleNav = (id) => { setPage(id); if (id !== "profile") setSelectedCSR(null); };
  const handleRefresh = useCallback(() => { setIsRefreshing(true); retry(); setTimeout(() => setIsRefreshing(false), 1500); }, [retry]);

  if (authLoading) {
    return (
      <div style={{ minHeight:"100vh", background:"#12101f", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"#c9a84c", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}><Activity size={20} color="#12101f" /></div>
          <div style={{ width:24, height:24, borderRadius:"50%", border:"2px solid #c9a84c", borderTopColor:"transparent", animation:"spin 0.8s linear infinite", margin:"0 auto" }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={signIn} onSignUp={signUp} />;
  
  const cfg = PAGE_CONFIG[page] || PAGE_CONFIG.overview;
  const sidebarActive = page === "profile" ? "ranking" : page;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#12101f", fontFamily:"'Inter',system-ui,sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>
      <Sidebar active={sidebarActive} onNav={handleNav} user={user} onSignOut={signOut} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
        <Header title={page==="profile"&&selectedCSR?selectedCSR.csr_name:cfg.title} subtitle={cfg.subtitle} loadedAt={status==="success"?loadedAt:null} onRefresh={handleRefresh} isRefreshing={isRefreshing} user={user} />
        <div style={{ flex:1, overflowY:"auto", background:"#fdf8f0" }}>
          {page==="weekly"       && <WeeklyDashboard user={user} />}
          {page==="dataentry"    && <DataEntryForm user={user} />}
          {page==="monthly"      && <MonthlyDashboard />}
          {page==="monthlyentry" && <MonthlyDataEntryForm user={user} />}
          {page==="roadmap"      && <RoadmapCard />}
          {page!=="dataentry" && page!=="roadmap" && page!=="weekly" && page!=="monthly" && page!=="monthlyentry" && (
            <>
              {status==="loading" && <PageLoadingState pageName={cfg.title} />}
              {status==="error"   && <ErrorState error={error} onRetry={retry} />}
              {status==="success" && (
                <>
                  {page==="overview"   && <ExecutiveOverview   data={data} onSelectCSR={handleSelectCSR} />}
                  {page==="ranking"    && <CSRRanking          data={data} onSelectCSR={handleSelectCSR} />}
                  {page==="profile"    && selectedCSR && <CSRProfile csr={selectedCSR} data={data} onBack={() => handleNav("ranking")} />}
                  {page==="kpi"        && <KPIBreakdown        data={data} />}
                  {page==="coaching"   && <CoachingTracker     data={data} user={user} />}
                  {page==="comparison" && <QuarterComparison   data={data} />}
                  {page==="team"       && <TeamPerformance     data={data} />}
                  {page==="qa"         && <QAAuditLog          data={data} />}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
