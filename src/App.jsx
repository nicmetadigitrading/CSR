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

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
const QUARTERS = { Q1:["January","February","March"], Q2:["April","May","June"], Q3:["July","August","September"], Q4:["October","November","December"] };

// All TLs — used in coaching owner dropdown
const TL_OPTIONS = ["TL Nic","TL Regie","TL Keljash","TL Pao","TL Krizia","TL Pikutin","TL Artemis"];

const TL_MAP = {
  "Team Keljash":"TL Keljash","Team Pao":"TL Pao","Team Krizia":"TL Krizia",
  "Team Pikutin":"TL Pikutin","Team Artemis":"TL Artemis","Team Tristan":"TL Tristan",
  "Team Knathan":"TL Knathan","Team Lowii":"TL Lowii","Team Bryan":"TL Bryan",
  "Team Wendell":"TL Wendell","Team Mark":"TL Mark"
};

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

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH HOOK
// ═══════════════════════════════════════════════════════════════════════════════
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

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: data?.user, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...authState, signIn, signOut };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true); setError("");
    const { user, error: err } = await onLogin(email, password);
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#080f1f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <Activity size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">CSR Performance</h1>
          <p className="text-blue-400 text-sm mt-1">TL Control Panel · Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0d1729] border border-[#1e293b] rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Email</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" autoFocus
                className="w-full bg-[#080f1f] border border-[#334155] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Password</label>
            <div className="relative">
              <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#080f1f] border border-[#334155] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertTriangle size={13} /> {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><RefreshCw size={14} className="spin-slow" /> Signing in…</> : "Sign In"}
          </button>
        </form>
        <p className="text-center text-xs text-slate-600 mt-4">Contact your admin to create an account.</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECORD LOCK HOOK — prevents two users editing same entry simultaneously
// Uses a `record_locks` table in Supabase:
//   id (uuid), record_key (text unique), locked_by (text), locked_by_email (text), locked_at (timestamptz)
// ═══════════════════════════════════════════════════════════════════════════════
function useRecordLock(recordKey, userEmail) {
  const [lockState, setLockState] = useState({ locked: false, lockedBy: null, isOwner: false, checking: false });

  const acquireLock = useCallback(async () => {
    if (!recordKey || !userEmail) return false;
    setLockState(s => ({ ...s, checking: true }));
    try {
      // Check if lock exists
      const { data: existing } = await supabase.from("record_locks").select("*").eq("record_key", recordKey).single();
      if (existing) {
        const ageMinutes = (Date.now() - new Date(existing.locked_at).getTime()) / 60000;
        // If locked by same user or lock is stale (>15 min), allow
        if (existing.locked_by_email !== userEmail && ageMinutes < 15) {
          setLockState({ locked: true, lockedBy: existing.locked_by_email, isOwner: false, checking: false });
          return false;
        }
        // Override stale/own lock
        await supabase.from("record_locks").update({ locked_by_email: userEmail, locked_at: new Date().toISOString() }).eq("record_key", recordKey);
      } else {
        await supabase.from("record_locks").insert({ record_key: recordKey, locked_by_email: userEmail, locked_at: new Date().toISOString() });
      }
      setLockState({ locked: true, lockedBy: userEmail, isOwner: true, checking: false });
      return true;
    } catch {
      setLockState(s => ({ ...s, checking: false }));
      return false;
    }
  }, [recordKey, userEmail]);

  const releaseLock = useCallback(async () => {
    if (!recordKey) return;
    await supabase.from("record_locks").delete().eq("record_key", recordKey).eq("locked_by_email", userEmail);
    setLockState({ locked: false, lockedBy: null, isOwner: false, checking: false });
  }, [recordKey, userEmail]);

  // Auto-release on unmount
  useEffect(() => { return () => { if (lockState.isOwner) releaseLock(); }; }, [lockState.isOwner, releaseLock]);

  return { ...lockState, acquireLock, releaseLock };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE FETCH HOOK
// ═══════════════════════════════════════════════════════════════════════════════
function useSupabaseData() {
  const [state, setState] = useState({ status: "loading", data: null, error: null, loadedAt: null });

  const load = useCallback(async () => {
    setState(s => ({ ...s, status: "loading", error: null }));
    try {
      const [perfRes, qaRes, coachingRes] = await Promise.all([
        supabase.from("performance_entries").select("*").order("created_at", { ascending: false }),
        supabase.from("qa_entries").select("*").order("created_at", { ascending: false }),
        supabase.from("coaching_logs").select("*").order("updated_at", { ascending: false }),
      ]);
      if (perfRes.error) throw perfRes.error;

      const performanceData = (perfRes.data || []).map(r => {
        const team = resolveTeam(r);
        return {
          ...r, team, csr_id: r.csr_name,
          total_rate: r.final_score || 0,
          kra_scale: r.kra_total || 0,
          behavioral_scale: r.bi_score || 0,
          conversion_score: r.conversion_kpi_score ? r.conversion_kpi_score * 100 : 0,
          rmo_score: r.rmo_kpi_score ? r.rmo_kpi_score * 100 : 0,
          rts_score: r.rts_kpi_score ? r.rts_kpi_score * 100 : 0,
          delivery_success_score: r.delivery_success_kpi_score ? r.delivery_success_kpi_score * 100 : 0,
          upsell_score: r.upsell_kpi_score ? r.upsell_kpi_score * 100 : 0,
          attendance_score: r.attendance_kpi_score ? r.attendance_kpi_score * 20 : 0,
          esc_score: r.esc_kpi_score ? r.esc_kpi_score * 100 : 0,
        };
      });

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

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
function getStatus(rate) {
  if (rate >= 4.50) return "Excellent";
  if (rate >= 4.00) return "Good";
  if (rate >= 3.50) return "Needs Monitoring";
  if (rate >= 3.00) return "For Coaching";
  return "Critical";
}
function statusColor(s) {
  return { Excellent:"bg-emerald-100 text-emerald-800", Good:"bg-blue-100 text-blue-800", "Needs Monitoring":"bg-amber-100 text-amber-800", "For Coaching":"bg-orange-100 text-orange-800", Critical:"bg-red-100 text-red-800" }[s] || "bg-gray-100 text-gray-700";
}
function qaStatus(score) {
  if (score >= 90) return "Passed";
  if (score >= 80) return "Needs Monitoring";
  return "Needs Coaching";
}
function qaStatusColor(s) {
  return { Passed:"bg-emerald-100 text-emerald-800", "Needs Monitoring":"bg-amber-100 text-amber-800", "Needs Coaching":"bg-orange-100 text-orange-800" }[s] || "bg-gray-100 text-gray-700";
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

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Export CSR Ranking + KPI to Excel
function exportRankingExcel(agg) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: CSR Ranking
  const rankingData = agg.map((c, i) => ({
    Rank: i + 1,
    "CSR Name": c.csr_name,
    Team: c.team,
    Month: c.month || "—",
    Week: c.week || "—",
    "Total Rate": c.total_rate,
    "KRA Scale": c.kra_scale,
    "Behavioral Scale": c.behavioral_scale,
    Status: getStatus(c.total_rate),
  }));
  const ws1 = XLSX.utils.json_to_sheet(rankingData);
  ws1["!cols"] = [{ wch:6 },{ wch:28 },{ wch:16 },{ wch:12 },{ wch:10 },{ wch:12 },{ wch:12 },{ wch:16 },{ wch:18 }];
  XLSX.utils.book_append_sheet(wb, ws1, "CSR Ranking");

  // Sheet 2: KPI Summary
  const kpiData = agg.map((c, i) => ({
    Rank: i + 1,
    "CSR Name": c.csr_name,
    Team: c.team,
    "Conversion %": parseFloat(c.conversion_score).toFixed(1),
    "RMO %": parseFloat(c.rmo_score).toFixed(1),
    "RTS %": parseFloat(c.rts_score).toFixed(1),
    "Delivery % ": parseFloat(c.delivery_success_score).toFixed(1),
    "Upsell %": parseFloat(c.upsell_score).toFixed(1),
    "ESC %": parseFloat(c.esc_score).toFixed(1),
    "Attendance %": parseFloat(c.attendance_score).toFixed(1),
  }));
  const ws2 = XLSX.utils.json_to_sheet(kpiData);
  ws2["!cols"] = [{ wch:6 },{ wch:28 },{ wch:16 },{ wch:14 },{ wch:10 },{ wch:10 },{ wch:12 },{ wch:12 },{ wch:10 },{ wch:14 }];
  XLSX.utils.book_append_sheet(wb, ws2, "KPI Summary");

  XLSX.writeFile(wb, `CSR_Ranking_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// Export Coaching Report to PDF
function exportCoachingPDF(coachingList, coachingLogs) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const now = new Date().toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" });

  // Header
  doc.setFillColor(13, 27, 54);
  doc.rect(0, 0, 297, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("CSR Performance · Coaching Report", 14, 14);
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${now}`, 230, 14);

  // Summary stats
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  const critical = coachingList.filter(c => c.priority === "Critical").length;
  const high = coachingList.filter(c => c.priority === "High").length;
  doc.text(`Total CSRs for Coaching: ${coachingList.length}   |   Critical: ${critical}   |   High Priority: ${high}`, 14, 30);

  // Table
  const tableData = [];
  coachingList.forEach(({ csr, issues, priority }) => {
    const log = coachingLogs.find(l => l.csr_name === csr.csr_name);
    issues.forEach((issue, ii) => {
      tableData.push([
        ii === 0 ? priority : "",
        ii === 0 ? csr.csr_name : "",
        ii === 0 ? csr.team : "",
        issue.kpi,
        String(issue.score),
        issue.rec,
        ii === 0 ? (log?.coaching_owner || TL_MAP[csr.team] || "—") : "",
        ii === 0 ? (log?.status || "Pending") : "",
        ii === 0 ? (log?.result_notes || "") : "",
        ii === 0 ? (log?.updated_at ? new Date(log.updated_at).toLocaleDateString() : "—") : "",
        ii === 0 ? (log?.updated_by || "—") : "",
      ]);
    });
  });

  autoTable(doc, {
    startY: 35,
    head: [["Priority","CSR Name","Team","KPI Issue","Score","Recommendation","Coach Owner","Status","Notes","Last Updated","Updated By"]],
    body: tableData,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [13, 27, 54], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 18 }, 1: { cellWidth: 28 }, 2: { cellWidth: 22 },
      3: { cellWidth: 20 }, 4: { cellWidth: 14 }, 5: { cellWidth: 40 },
      6: { cellWidth: 22 }, 7: { cellWidth: 20 }, 8: { cellWidth: 30 },
      9: { cellWidth: 22 }, 10: { cellWidth: 22 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const v = data.cell.raw;
        if (v === "Critical") data.cell.styles.textColor = [220, 38, 38];
        if (v === "High") data.cell.styles.textColor = [234, 88, 12];
        if (v === "Medium") data.cell.styles.textColor = [217, 119, 6];
      }
    },
  });

  doc.save(`Coaching_Report_${new Date().toISOString().slice(0,10)}.pdf`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════════════════════
function SkeletonBox({ w="100%", h=16, r=6, mb=0 }) {
  return <div className="shimmer" style={{ width:w, height:h, borderRadius:r, marginBottom:mb, flexShrink:0 }} />;
}
function PageLoadingState({ pageName }) {
  return (
    <div className="p-7 space-y-6 fade-in">
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full progress-bar" /></div>
      <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => (<div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3"><SkeletonBox w="55%" h={10} /><SkeletonBox w="40%" h={28} /></div>))}</div>
      <div className="fixed bottom-8 right-8 bg-white rounded-2xl shadow-xl border border-gray-100 px-5 py-3 flex items-center gap-3 z-50">
        <div className="relative w-5 h-5"><div className="absolute inset-0 rounded-full bg-blue-200 pulse-ring" /><div className="relative w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent spin-slow" /></div>
        <div><p className="text-xs font-semibold text-gray-700">Loading {pageName}</p><div className="flex gap-1 mt-0.5">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 bounce-dot" style={{ animationDelay:`${i*0.16}s` }} />)}</div></div>
      </div>
    </div>
  );
}
function ErrorState({ error, onRetry }) {
  return (
    <div className="p-7 flex items-center justify-center min-h-96">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-5"><ServerCrash size={32} className="text-red-400" /></div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to Load Data</h3>
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-4 py-2 inline-block mb-6 font-mono">{error}</p>
        <button onClick={onRetry} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 mx-auto"><RotateCcw size={14} />Try Again</button>
      </div>
    </div>
  );
}
function EmptyState({ message="No data yet.", sub="Enter data using the Data Entry tab." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><Clock size={28} className="text-gray-300" /></div>
      <p className="text-gray-600 font-semibold text-lg">{message}</p>
      <p className="text-gray-400 text-sm mt-2">{sub}</p>
    </div>
  );
}
function StatusBadge({ status }) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${statusColor(status)}`}>{status}</span>;
}
function MetricCard({ label, value, sub, icon:Icon, color="blue", onClick, alert }) {
  const colors = { blue:"bg-blue-50 text-blue-600", emerald:"bg-emerald-50 text-emerald-600", amber:"bg-amber-50 text-amber-600", red:"bg-red-50 text-red-600", purple:"bg-purple-50 text-purple-600", orange:"bg-orange-50 text-orange-600" };
  return (
    <div onClick={onClick} className={`bg-white rounded-xl border ${alert?"border-red-300":"border-gray-100"} p-5 ${onClick?"cursor-pointer hover:border-blue-300 hover:shadow-md transition-all":""} fade-in`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
        {Icon && <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}><Icon size={15} /></div>}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
function SectionHeader({ title, sub, children }) {
  return (
    <div className="flex items-start justify-between">
      <div><h2 className="text-lg font-bold text-gray-900">{title}</h2>{sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}</div>
      {children && <div className="flex gap-2 flex-wrap">{children}</div>}
    </div>
  );
}
function FilterSelect({ label, value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-400">
      {label && <option value="All">All {label}</option>}
      {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  );
}

// Last-touch badge
function LastTouchBadge({ record }) {
  if (!record?.last_updated_by) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
      <User size={11} />
      <span>Last edited by <span className="font-semibold text-slate-700">{record.last_updated_by}</span></span>
      {record.last_updated_at && <span>· {new Date(record.last_updated_at).toLocaleString("en-PH", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR & HEADER
// ═══════════════════════════════════════════════════════════════════════════════
const NAV = [
  { id:"overview",   label:"Executive Overview", icon:Home },
  { id:"ranking",    label:"CSR Ranking",         icon:BarChart2 },
  { id:"kpi",        label:"KPI Breakdown",       icon:Target },
  { id:"coaching",   label:"Coaching Tracker",    icon:BookOpen },
  { id:"comparison", label:"Quarter Comparison",  icon:GitCompare },
  { id:"team",       label:"Team Performance",    icon:Layers },
  { id:"qa",         label:"QA Audit Log",        icon:ClipboardList },
  { id:"weekly",     label:"Weekly Scorecard",    icon:Star },
  { id:"dataentry",  label:"Data Entry",          icon:ClipboardList },
  { id:"roadmap",    label:"Roadmap",             icon:Rocket },
  { id:"monthly",    label:"Monthly Dashboard",   icon:Calendar },  // ← add this
  { id:"roadmap",    label:"Roadmap",             icon:Rocket },
];

function Sidebar({ active, onNav, user, onSignOut }) {
  return (
    <div className="w-60 min-h-screen bg-[#0d1b36] flex flex-col flex-shrink-0">
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center"><Activity size={16} className="text-white" /></div>
          <div><p className="text-white text-sm font-bold leading-tight">CSR Performance</p><p className="text-blue-300 text-xs">TL Control Panel</p></div>
        </div>
      </div>
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, icon:Icon }) => (
          <button key={id} onClick={() => onNav(id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${active===id ? "bg-blue-600 text-white font-semibold" : "text-blue-200 hover:bg-white/10 hover:text-white"}`}>
            <Icon size={15} className="flex-shrink-0" /><span className="truncate">{label}</span>
          </button>
        ))}
      </nav>
      {/* User info + sign out */}
      <div className="px-4 py-3 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(user?.email?.[0] || "U").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0"><p className="text-white text-xs font-semibold truncate">{user?.email}</p><p className="text-blue-400 text-xs">Signed in</p></div>
        </div>
        <button onClick={onSignOut} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
          <LogOut size={12} />Sign out
        </button>
        <p className="text-blue-500 text-xs">v2.1 · Supabase Connected</p>
      </div>
    </div>
  );
}

function Header({ title, subtitle, loadedAt, onRefresh, isRefreshing, user }) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-3.5 flex items-center justify-between flex-shrink-0">
      <div><h1 className="text-lg font-bold text-gray-900">{title}</h1>{subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}</div>
      <div className="flex items-center gap-4">
        {loadedAt && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-lg">
            <CheckCircle size={12} /><span>Live · {loadedAt}</span>
            <button onClick={onRefresh} disabled={isRefreshing} className="ml-1 text-emerald-700 hover:text-emerald-900 disabled:opacity-50"><RefreshCw size={11} className={isRefreshing?"spin-slow":""} /></button>
          </div>
        )}
        <div className="text-right"><p className="text-xs text-gray-400">Current Period</p><p className="text-sm font-semibold text-gray-700">2026</p></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold">{(user?.email?.[0] || "U").toUpperCase()}</div>
          <div className="hidden sm:block"><p className="text-xs font-semibold text-gray-700 max-w-32 truncate">{user?.email}</p></div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUTIVE OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function ExecutiveOverview({ data, onSelectCSR }) {
  const { performanceData } = data;
  if (!performanceData.length) return <EmptyState />;
  const agg = getAggregated(performanceData);
  const coaching = agg.filter(r => r.total_rate < 3.50);
  const months = [...new Set(performanceData.map(r => r.month).filter(Boolean))];
  const monthlyTrend = months.slice(0, 6).map(m => {
    const rows = performanceData.filter(r => r.month === m);
    return { month:m?.slice(0,3), avg:avg(rows,"total_rate"), kra:avg(rows,"kra_scale") };
  });
  const kpiHealth = [
    { name:"Conversion", val:avg(performanceData,"conversion_score") },
    { name:"RMO",        val:avg(performanceData,"rmo_score") },
    { name:"RTS",        val:avg(performanceData,"rts_score") },
    { name:"Delivery",   val:avg(performanceData,"delivery_success_score") },
    { name:"Upsell",     val:avg(performanceData,"upsell_score") },
    { name:"ESC",        val:avg(performanceData,"esc_score") },
  ];
  return (
    <div className="p-7 space-y-7">
      <SectionHeader title="Executive Overview" sub="Live data from Supabase" />
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total CSRs"          value={agg.length}              sub="With performance data"    icon={Users}         color="blue" />
        <MetricCard label="Team Avg Total Rate" value={avg(agg,"total_rate").toFixed(2)} sub="Scale 1.00–5.00" icon={TrendingUp}    color="emerald" />
        <MetricCard label="Total Entries"       value={performanceData.length}  sub="All records"             icon={Target}        color="purple" />
        <MetricCard label="Needs Coaching"      value={coaching.length}         sub="Below 3.50 threshold"    icon={AlertTriangle} color="orange" alert={coaching.length>3} />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4"><Award size={15} className="text-emerald-500" /><h3 className="font-bold text-gray-800 text-sm">Top 5 Performers</h3></div>
          {agg.slice(0,5).map((c,i) => (
            <div key={c.csr_name} onClick={() => onSelectCSR(c)} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer mb-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i===0?"bg-amber-400 text-white":i===1?"bg-gray-300 text-gray-700":i===2?"bg-orange-300 text-white":"bg-gray-100 text-gray-600"}`}>{i+1}</span>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{c.csr_name}</p><p className="text-xs text-gray-500">{c.team}</p></div>
              <div className="text-right flex-shrink-0"><p className="text-sm font-bold text-gray-900">{c.total_rate}</p><StatusBadge status={getStatus(c.total_rate)} /></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4"><TrendingDown size={15} className="text-red-500" /><h3 className="font-bold text-gray-800 text-sm">Bottom 5 Performers</h3></div>
          {agg.slice(-5).reverse().map((c,i) => (
            <div key={c.csr_name} onClick={() => onSelectCSR(c)} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer mb-1.5">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{agg.length-i}</span>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{c.csr_name}</p><p className="text-xs text-gray-500">{c.team}</p></div>
              <div className="text-right flex-shrink-0"><p className="text-sm font-bold">{c.total_rate}</p><StatusBadge status={getStatus(c.total_rate)} /></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4"><BookOpen size={15} className="text-orange-500" /><h3 className="font-bold text-gray-800 text-sm">Coaching Priority</h3></div>
          {coaching.length === 0
            ? <p className="text-sm text-gray-400">No CSRs below 3.50. 🎉</p>
            : coaching.map(c => (
              <div key={c.csr_name} onClick={() => onSelectCSR(c)} className="p-2.5 rounded-lg border border-orange-100 bg-orange-50 hover:bg-orange-100 cursor-pointer mb-2">
                <div className="flex items-center justify-between mb-1"><p className="text-sm font-semibold text-gray-800 truncate pr-2">{c.csr_name}</p><StatusBadge status={getStatus(c.total_rate)} /></div>
                <p className="text-xs text-gray-600">{c.team} · Rate: {c.total_rate}</p>
              </div>
            ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">Performance Trend by Month</h3>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize:12 }} />
                <YAxis domain={[0,5]} tick={{ fontSize:12 }} />
                <Tooltip formatter={v => v?.toFixed(2)} />
                <Legend />
                <Line type="monotone" dataKey="avg" name="Total Rate" stroke="#3b82f6" strokeWidth={2.5} dot={{ r:4 }} />
                <Line type="monotone" dataKey="kra" name="KRA Scale" stroke="#10b981" strokeWidth={2} dot={{ r:4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No monthly data yet." sub="" />}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">KPI Health Summary</h3>
          {kpiHealth.map(k => (
            <div key={k.name} className="flex items-center gap-3 mb-3">
              <span className="text-xs text-gray-600 w-20 font-medium">{k.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2"><div className={`h-2 rounded-full ${k.val>=80?"bg-emerald-500":k.val>=70?"bg-amber-400":"bg-red-500"}`} style={{ width:`${Math.min(k.val,100)}%` }} /></div>
              <span className={`text-xs font-bold w-12 text-right ${k.val>=80?"text-emerald-600":k.val>=70?"text-amber-600":"text-red-600"}`}>{k.val?.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSR RANKING  (with Excel export)
// ═══════════════════════════════════════════════════════════════════════════════
function CSRRanking({ data, onSelectCSR }) {
  const { performanceData, allTeams } = data;
  const [f, setF] = useState({ quarter:"All", month:"All", team:"All", status:"All", search:"" });

  const filtered = useMemo(() => {
    let d = performanceData;
    if (f.quarter !== "All") d = d.filter(r => r.quarter === f.quarter);
    if (f.month !== "All") d = d.filter(r => r.month === f.month);
    if (f.team !== "All") d = d.filter(r => r.team === f.team);
    let agg = getAggregated(d);
    if (f.status !== "All") agg = agg.filter(r => getStatus(r.total_rate) === f.status);
    if (f.search) agg = agg.filter(r => r.csr_name?.toLowerCase().includes(f.search.toLowerCase()));
    return agg;
  }, [f, performanceData]);

  const quarters = [...new Set(performanceData.map(r => r.quarter).filter(Boolean))];
  const months   = [...new Set(performanceData.map(r => r.month).filter(Boolean))];
  if (!performanceData.length) return <div className="p-7"><EmptyState /></div>;

  return (
    <div className="p-7 space-y-6">
      <SectionHeader title="CSR Ranking" sub="Ranked by Total Rate (1.00–5.00 scale)">
        <button onClick={() => exportRankingExcel(filtered)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-emerald-300 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors">
          <FileSpreadsheet size={13} />Export Excel
        </button>
      </SectionHeader>
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter size={13} className="text-gray-400" />
          <FilterSelect value={f.quarter} onChange={v => setF(p=>({...p,quarter:v}))} label="Quarters" options={quarters} />
          <FilterSelect value={f.month}   onChange={v => setF(p=>({...p,month:v}))}   label="Months"   options={months} />
          <FilterSelect value={f.team}    onChange={v => setF(p=>({...p,team:v}))}    label="Teams"    options={allTeams} />
          <FilterSelect value={f.status}  onChange={v => setF(p=>({...p,status:v}))}  label="Statuses" options={["Excellent","Good","Needs Monitoring","For Coaching","Critical"]} />
          <div className="relative flex-1 min-w-44">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={f.search} onChange={e => setF(p=>({...p,search:e.target.value}))} placeholder="Search CSR name..." className="w-full text-sm border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-400" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0d1b36] text-white text-xs">
                {["#","CSR Name","Team","Month","Week","Total Rate","KRA Scale","Behavioral","Conv %","RMO %","RTS %","Delivery %","Upsell %","Last Edited By","Status",""].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={16} className="text-center py-12 text-gray-400">No CSRs match current filters.</td></tr>
                : filtered.map((c,i) => (
                  <tr key={c.csr_name+i} className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${i%2===0?"bg-white":"bg-gray-50/30"}`}>
                    <td className="px-3 py-2.5 font-bold text-gray-400 text-xs">{i+1}</td>
                    <td className="px-3 py-2.5"><button onClick={() => onSelectCSR(c)} className="text-blue-700 font-semibold hover:underline text-left whitespace-nowrap">{c.csr_name}</button></td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap text-xs">{c.team}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{c.month||"—"}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{c.week||"—"}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-900">{c.total_rate}</td>
                    <td className="px-3 py-2.5 text-gray-700">{c.kra_scale}</td>
                    <td className="px-3 py-2.5 text-gray-700">{c.behavioral_scale}</td>
                    {["conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score"].map(k => (
                      <td key={k} className={`px-3 py-2.5 font-semibold ${c[k]<80?"text-red-600":"text-gray-700"}`}>{parseFloat(c[k]).toFixed(1)}%</td>
                    ))}
                    {/* Last touch */}
                    <td className="px-3 py-2.5">
                      {c.last_updated_by
                        ? <span className="text-xs text-slate-500 flex items-center gap-1"><User size={10} />{c.last_updated_by}</span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5"><StatusBadge status={getStatus(c.total_rate)} /></td>
                    <td className="px-3 py-2.5"><button onClick={() => onSelectCSR(c)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold"><Eye size={12} />View</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">Showing {filtered.length} CSRs</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSR PROFILE
// ═══════════════════════════════════════════════════════════════════════════════
function CSRProfile({ csr, data, onBack }) {
  const { performanceData, coachingLogs } = data;
  const csrRecords = performanceData.filter(r => r.csr_name === csr.csr_name);
  const allAgg = getAggregated(performanceData);
  const rank = allAgg.findIndex(r => r.csr_name === csr.csr_name) + 1;
  const issues = getCoachingIssues(csr);
  const csrCoachingLogs = coachingLogs.filter(l => l.csr_name === csr.csr_name).sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));

  const trendData = csrRecords.map(r => ({ label:`${r.month?.slice(0,3)||""} ${r.week||""}`.trim(), rate:r.total_rate, kra:r.kra_scale }));
  const kpiData = [
    { subject:"Conv",   value:csr.conversion_score },
    { subject:"RMO",    value:csr.rmo_score },
    { subject:"RTS",    value:csr.rts_score },
    { subject:"Deliv",  value:csr.delivery_success_score },
    { subject:"Upsell", value:csr.upsell_score },
    { subject:"ESC",    value:csr.esc_score },
  ];

  return (
    <div className="p-7 space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-semibold"><ChevronRight size={15} className="rotate-180" />Back to Ranking</button>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {(csr.csr_name||"").split(" ").map(n=>n[0]).slice(0,2).join("")}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap"><h2 className="text-xl font-bold text-gray-900">{csr.csr_name}</h2><StatusBadge status={getStatus(csr.total_rate)} /></div>
            <p className="text-gray-500 text-sm mt-1">{csr.team} · Rank #{rank} of {allAgg.length}</p>
            {csr.last_updated_by && <LastTouchBadge record={csr} />}
          </div>
          <div className="text-right flex-shrink-0"><p className="text-3xl font-black text-gray-900">{csr.total_rate}</p><p className="text-xs text-gray-500">Total Rate (Avg)</p></div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">KRA Scale</p><p className="text-2xl font-bold text-gray-900">{csr.kra_scale}</p></div>
          <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Behavioral Scale</p><p className="text-2xl font-bold text-gray-900">{csr.behavioral_scale}</p></div>
          <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Records</p><p className="text-2xl font-bold text-gray-900">{csrRecords.length}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">Performance Trend</h3>
          {trendData.length > 0
            ? <ResponsiveContainer width="100%" height={190}><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="label" tick={{ fontSize:11 }} /><YAxis domain={[0,5]} tick={{ fontSize:11 }} /><Tooltip formatter={v=>v?.toFixed(2)} /><Legend /><Line type="monotone" dataKey="rate" name="Total Rate" stroke="#3b82f6" strokeWidth={2.5} dot={{ r:4 }} /><Line type="monotone" dataKey="kra" name="KRA" stroke="#10b981" strokeWidth={2} dot={{ r:3 }} strokeDasharray="5 5" /></LineChart></ResponsiveContainer>
            : <EmptyState message="Only one record." sub="" />}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">KPI Radar</h3>
          <ResponsiveContainer width="100%" height={190}><RadarChart data={kpiData}><PolarGrid /><PolarAngleAxis dataKey="subject" tick={{ fontSize:10 }} /><PolarRadiusAxis domain={[0,100]} tick={{ fontSize:9 }} /><Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} /></RadarChart></ResponsiveContainer>
        </div>
      </div>

      {/* Coaching history from coaching_logs */}
      {csrCoachingLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 p-5">
          <div className="flex items-center gap-2 mb-4"><BookOpen size={14} className="text-orange-500" /><h3 className="font-bold text-gray-800 text-sm">Coaching History</h3></div>
          <div className="space-y-2">
            {csrCoachingLogs.map((log, i) => (
              <div key={log.id||i} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg text-xs">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-800">{log.kpi_issue}</span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${log.status==="Done"||log.status==="Improved"?"bg-emerald-100 text-emerald-800":log.status==="Escalated"?"bg-red-100 text-red-800":"bg-amber-100 text-amber-800"}`}>{log.status}</span>
                  </div>
                  <p className="text-gray-600">{log.result_notes || "No notes."}</p>
                </div>
                <div className="text-right text-gray-400 whitespace-nowrap flex-shrink-0">
                  <p>{log.coaching_owner || "—"}</p>
                  <p>{log.updated_by || ""}</p>
                  <p>{log.updated_at ? new Date(log.updated_at).toLocaleDateString() : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800 text-sm">All Records</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-[#0d1b36] text-white">{["Month","Week","Final Score","KRA","Behavioral","Conv%","RMO%","RTS%","Delivery%","Upsell%","Last Edited By"].map(h=><th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {csrRecords.map((r,i) => (
                <tr key={i} className={`border-b border-gray-50 ${i%2===0?"bg-white":"bg-gray-50/30"}`}>
                  <td className="px-3 py-2">{r.month||"—"}</td>
                  <td className="px-3 py-2">{r.week||"—"}</td>
                  <td className="px-3 py-2 font-bold text-blue-700">{parseFloat(r.final_score||0).toFixed(2)}</td>
                  <td className="px-3 py-2">{parseFloat(r.kra_total||0).toFixed(2)}</td>
                  <td className="px-3 py-2">{parseFloat(r.bi_score||0).toFixed(2)}</td>
                  {["conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score"].map(k=>(
                    <td key={k} className={`px-3 py-2 font-semibold ${r[k]<80?"text-red-600":"text-gray-700"}`}>{parseFloat(r[k]||0).toFixed(1)}%</td>
                  ))}
                  <td className="px-3 py-2 text-slate-500">{r.last_updated_by||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KPI BREAKDOWN
// ═══════════════════════════════════════════════════════════════════════════════
function KPIBreakdown({ data }) {
  const { performanceData, allTeams } = data;
  const [f, setF] = useState({ quarter:"All", month:"All", team:"All" });
  const filtData = useMemo(() => {
    let d = performanceData;
    if (f.quarter !== "All") d = d.filter(r => r.quarter === f.quarter);
    if (f.month !== "All") d = d.filter(r => r.month === f.month);
    if (f.team !== "All") d = d.filter(r => r.team === f.team);
    return d;
  }, [f, performanceData]);
  const quarters = [...new Set(performanceData.map(r=>r.quarter).filter(Boolean))];
  const months   = [...new Set(performanceData.map(r=>r.month).filter(Boolean))];
  const cats = [
    { name:"Conversion", key:"conversion_score", target:80 },
    { name:"RMO",        key:"rmo_score",         target:80 },
    { name:"RTS",        key:"rts_score",         target:80 },
    { name:"Delivery",   key:"delivery_success_score", target:80 },
    { name:"Upsell",     key:"upsell_score",      target:80 },
    { name:"ESC",        key:"esc_score",         target:80 },
  ];
  if (!performanceData.length) return <div className="p-7"><EmptyState /></div>;
  const chartData = cats.map(c => ({ name:c.name, avg:avg(filtData,c.key), target:c.target }));
  return (
    <div className="p-7 space-y-6">
      <SectionHeader title="KPI Breakdown" sub="Category-level performance analysis" />
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-gray-400" />
        <FilterSelect value={f.quarter} onChange={v=>setF(p=>({...p,quarter:v}))} label="Quarters" options={quarters} />
        <FilterSelect value={f.month}   onChange={v=>setF(p=>({...p,month:v}))}   label="Months"   options={months} />
        <FilterSelect value={f.team}    onChange={v=>setF(p=>({...p,team:v}))}    label="Teams"    options={allTeams} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-4">KPI Average vs Target</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize:11 }} /><YAxis domain={[0,100]} tick={{ fontSize:11 }} />
            <Tooltip formatter={v=>`${v?.toFixed(1)}%`} /><Legend />
            <Bar dataKey="avg" name="Team Avg" fill="#3b82f6" radius={[4,4,0,0]} />
            <Bar dataKey="target" name="Target" fill="#e5e7eb" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <table className="w-full text-sm">
          <thead><tr className="bg-[#0d1b36] text-white text-xs">{["KPI","Target","Team Avg","Below Target","Health","Progress"].map(h=><th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {cats.map((c,i) => {
              const a = avg(filtData, c.key);
              const below = [...new Set(filtData.filter(r=>(r[c.key]||0)<c.target).map(r=>r.csr_name))].length;
              const health = a>=c.target?"On Target":a>=c.target-10?"Near Target":"Below Target";
              return (
                <tr key={c.name} className={`border-b border-gray-50 ${i%2===0?"bg-white":"bg-gray-50/30"}`}>
                  <td className="px-5 py-3 font-semibold text-gray-800">{c.name}</td>
                  <td className="px-5 py-3 text-gray-600">{c.target}%</td>
                  <td className={`px-5 py-3 font-bold ${a>=c.target?"text-emerald-700":a>=c.target-10?"text-amber-700":"text-red-700"}`}>{a?.toFixed(1)}%</td>
                  <td className="px-5 py-3">{below>0?<span className="text-red-600 font-semibold">{below} CSR{below!==1?"s":""}</span>:<span className="text-emerald-600 font-semibold">None</span>}</td>
                  <td className="px-5 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${health==="On Target"?"bg-emerald-100 text-emerald-800":health==="Near Target"?"bg-amber-100 text-amber-800":"bg-red-100 text-red-800"}`}>{health}</span></td>
                  <td className="px-5 py-3 w-36"><div className="bg-gray-100 rounded-full h-2"><div className={`h-2 rounded-full ${a>=c.target?"bg-emerald-500":a>=c.target-10?"bg-amber-400":"bg-red-500"}`} style={{ width:`${Math.min(a,100)}%` }} /></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COACHING TRACKER  — saves to coaching_logs, PDF export
// coaching_logs table: id, csr_name, kpi_issue, coaching_owner, status, result_notes,
//                      updated_by, updated_at, created_at
// ═══════════════════════════════════════════════════════════════════════════════
const COACHING_STATUS_OPTIONS = ["Pending","Ongoing","Done","Improved","No Improvement","Escalated"];

function CoachingTracker({ data, user }) {
  const { performanceData, coachingLogs: initialLogs } = data;
  const agg = getAggregated(performanceData);
  const [logs, setLogs] = useState({});        // { csr_name: { coaching_owner, status, result_notes, saving } }
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});

  // Init logs from DB
  useEffect(() => {
    const init = {};
    (initialLogs || []).forEach(l => {
      init[l.csr_name] = { coaching_owner: l.coaching_owner||"", status: l.status||"Pending", result_notes: l.result_notes||"" };
    });
    setLogs(init);
  }, [initialLogs]);

  const coachingList = useMemo(() => agg.filter(c => getCoachingIssues(c).length > 0).map(csr => ({
    csr, issues: getCoachingIssues(csr),
    priority: csr.total_rate < 3.00 ? "Critical" : csr.total_rate < 3.50 ? "High" : "Medium"
  })).sort((a,b) => ({ Critical:0, High:1, Medium:2 }[a.priority]-{ Critical:0, High:1, Medium:2 }[b.priority])), [agg]);

  const updateLog = (csrName, field, value) => {
    setLogs(prev => ({ ...prev, [csrName]: { ...prev[csrName], [field]: value } }));
  };

  const saveLog = async (csr) => {
    const logData = logs[csr.csr_name] || {};
    setSaving(p => ({ ...p, [csr.csr_name]: true }));
    try {
      const payload = {
        csr_name: csr.csr_name,
        kpi_issues: getCoachingIssues(csr).map(i => i.kpi).join(", "),
        coaching_owner: logData.coaching_owner || "",
        status: logData.status || "Pending",
        result_notes: logData.result_notes || "",
        updated_by: user?.email || "unknown",
        updated_at: new Date().toISOString(),
      };
      // Upsert — insert or update by csr_name
      await supabase.from("coaching_logs").upsert(payload, { onConflict: "csr_name" });
      setSaved(p => ({ ...p, [csr.csr_name]: true }));
      setTimeout(() => setSaved(p => ({ ...p, [csr.csr_name]: false })), 2000);
    } catch (err) {
      console.error("Save coaching log error:", err);
    }
    setSaving(p => ({ ...p, [csr.csr_name]: false }));
  };

  if (!performanceData.length) return <div className="p-7"><EmptyState /></div>;
  const pColor = { Critical:"bg-red-100 text-red-800 border-red-300", High:"bg-orange-100 text-orange-800 border-orange-300", Medium:"bg-amber-100 text-amber-800 border-amber-300" };

  return (
    <div className="p-7 space-y-6">
      <SectionHeader title="Coaching Tracker" sub="Auto-generated from KPI data · changes saved to database">
        <button onClick={() => exportCoachingPDF(coachingList, initialLogs)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-red-300 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors">
          <FileText size={13} />Export PDF
        </button>
      </SectionHeader>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Need Coaching" value={coachingList.length}                                      icon={BookOpen}      color="orange" />
        <MetricCard label="Critical"      value={coachingList.filter(c=>c.priority==="Critical").length}   icon={AlertTriangle} color="red" />
        <MetricCard label="High Priority" value={coachingList.filter(c=>c.priority==="High").length}       icon={TrendingDown}  color="amber" />
        <MetricCard label="On Track"      value={agg.length-coachingList.length}                           icon={CheckCircle}   color="emerald" />
      </div>
      {coachingList.length === 0
        ? <EmptyState message="No CSRs need coaching!" sub="All CSRs are above the 3.50 threshold." />
        : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0d1b36] text-white">
                    {["Priority","CSR Name","Team","KPI Issue","Score","Recommendation","Coaching Owner","Status","Notes / Result","Last Updated By","Save"].map(h=>(
                      <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coachingList.map(({ csr, issues, priority }, idx) => {
                    const log = logs[csr.csr_name] || {};
                    const dbLog = initialLogs.find(l => l.csr_name === csr.csr_name);
                    return issues.map((issue, ii) => (
                      <tr key={`${csr.csr_name}-${ii}`} className={`border-b border-gray-50 ${idx%2===0?"bg-white":"bg-gray-50/20"}`}>
                        {ii===0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top"><span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${pColor[priority]}`}>{priority}</span></td>}
                        {ii===0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top font-semibold text-gray-800 whitespace-nowrap">{csr.csr_name}</td>}
                        {ii===0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top text-gray-600 whitespace-nowrap">{csr.team}</td>}
                        <td className="px-3 py-2.5 font-semibold text-gray-700">{issue.kpi}</td>
                        <td className="px-3 py-2.5 font-bold text-red-600">{issue.score}</td>
                        <td className="px-3 py-2.5 text-gray-600 max-w-36">{issue.rec}</td>
                        {/* Coaching Owner dropdown — TL Nic, TL Regie + others */}
                        {ii===0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top">
                          <select value={log.coaching_owner||""} onChange={e=>updateLog(csr.csr_name,"coaching_owner",e.target.value)}
                            className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white focus:outline-none focus:border-blue-400 min-w-[100px]">
                            <option value="">Select TL…</option>
                            {TL_OPTIONS.map(tl=><option key={tl} value={tl}>{tl}</option>)}
                          </select>
                        </td>}
                        {/* Status dropdown */}
                        {ii===0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top">
                          <select value={log.status||"Pending"} onChange={e=>updateLog(csr.csr_name,"status",e.target.value)}
                            className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white focus:outline-none focus:border-blue-400">
                            {COACHING_STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                          </select>
                        </td>}
                        {/* Notes */}
                        {ii===0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top">
                          <input placeholder="Add notes…" value={log.result_notes||""} onChange={e=>updateLog(csr.csr_name,"result_notes",e.target.value)}
                            className="text-xs border border-gray-200 rounded px-2 py-1 w-32 focus:outline-none focus:border-blue-400" />
                        </td>}
                        {/* Who last updated */}
                        {ii===0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top text-gray-400">
                          {dbLog ? (
                            <div>
                              <p className="font-semibold text-gray-600">{dbLog.updated_by||"—"}</p>
                              <p>{dbLog.updated_at ? new Date(dbLog.updated_at).toLocaleDateString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : ""}</p>
                            </div>
                          ) : <span>—</span>}
                        </td>}
                        {/* Save button */}
                        {ii===0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top">
                          <button onClick={() => saveLog(csr)} disabled={saving[csr.csr_name]}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${saved[csr.csr_name]?"bg-emerald-100 text-emerald-700":"bg-blue-600 text-white hover:bg-blue-700"} disabled:opacity-50`}>
                            {saving[csr.csr_name] ? <RefreshCw size={11} className="spin-slow" /> : saved[csr.csr_name] ? <CheckCircle size={11} /> : <Save size={11} />}
                            {saving[csr.csr_name]?"Saving…":saved[csr.csr_name]?"Saved!":"Save"}
                          </button>
                        </td>}
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

// ═══════════════════════════════════════════════════════════════════════════════
// QUARTER COMPARISON
// ═══════════════════════════════════════════════════════════════════════════════
function QuarterComparison({ data }) {
  const { performanceData } = data;
  const quarters = [...new Set(performanceData.map(r=>r.quarter).filter(Boolean))];
  const agg = getAggregated(performanceData);
  if (!performanceData.length) return <div className="p-7"><EmptyState /></div>;
  return (
    <div className="p-7 space-y-6">
      <SectionHeader title="Quarter Comparison" sub="All quarters with data" />
      <div className="grid grid-cols-4 gap-4">
        {quarters.length === 0
          ? <div className="col-span-4"><EmptyState message="No quarter data yet." /></div>
          : quarters.map(q => {
              const qData = getAggregated(performanceData.filter(r=>r.quarter===q));
              return (
                <div key={q} className="bg-blue-600 text-white rounded-xl p-5">
                  <p className="text-blue-200 text-xs font-semibold uppercase">{q} {qData[0]?.year||""}</p>
                  <p className="text-xl font-black mt-1">{QUARTERS[q]?.join(" · ")||q}</p>
                  <div className="mt-3 pt-3 border-t border-blue-500">
                    <p className="text-xs text-blue-200">Team Avg Rate</p>
                    <p className="text-2xl font-black">{avg(qData,"total_rate").toFixed(2)}</p>
                    <p className="text-xs text-blue-200 mt-1">{qData.length} CSRs</p>
                  </div>
                </div>
              );
            })}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#0d1b36] text-white text-xs">{["CSR Name","Team","Quarter","Month","Week","Total Rate","KRA","Behavioral","Status"].map(h=><th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {agg.map((c,i) => (
                <tr key={c.csr_name} className={`border-b border-gray-50 ${i%2===0?"bg-white":"bg-gray-50/30"}`}>
                  <td className="px-4 py-2.5 font-semibold text-gray-800">{c.csr_name}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{c.team}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.quarter||"—"}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.month||"—"}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.week||"—"}</td>
                  <td className="px-4 py-2.5 font-bold text-blue-700">{c.total_rate}</td>
                  <td className="px-4 py-2.5 text-gray-700">{c.kra_scale}</td>
                  <td className="px-4 py-2.5 text-gray-700">{c.behavioral_scale}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={getStatus(c.total_rate)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════════
function TeamPerformance({ data }) {
  const { performanceData, allTeams } = data;
  if (!performanceData.length) return <div className="p-7"><EmptyState /></div>;
  const agg = getAggregated(performanceData);
  const teamStats = allTeams.map(team => {
    const members = agg.filter(c=>c.team===team);
    return { team, members:members.length, avgRate:avg(members,"total_rate"), avgConv:avg(members,"conversion_score"), avgRMO:avg(members,"rmo_score"), avgDel:avg(members,"delivery_success_score"), coaching:members.filter(c=>getCoachingIssues(c).length>0).length, top:[...members].sort((a,b)=>b.total_rate-a.total_rate)[0]?.csr_name?.split(" ")[0]||"—" };
  }).filter(t=>t.members>0);
  const barData = teamStats.map(t=>({ name:t.team.replace("Team ",""), rate:t.avgRate }));
  return (
    <div className="p-7 space-y-6">
      <SectionHeader title="Team Performance" sub="Team-level comparison" />
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-4">Team Average Total Rate</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize:11 }} /><YAxis domain={[0,5]} tick={{ fontSize:11 }} /><Tooltip formatter={v=>v?.toFixed(2)} />
            <Bar dataKey="rate" name="Avg Rate" radius={[4,4,0,0]}>{barData.map((e,i)=><Cell key={i} fill={e.rate>=4.50?"#10b981":e.rate>=4.00?"#3b82f6":e.rate>=3.50?"#f59e0b":"#ef4444"} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#0d1b36] text-white text-xs">{["Team","CSRs","Avg Rate","Conv%","RMO%","Delivery%","Coaching","Top CSR","Status"].map(h=><th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {teamStats.map((t,i)=>(
                <tr key={t.team} className={`border-b border-gray-50 ${i%2===0?"bg-white":"bg-gray-50/30"}`}>
                  <td className="px-3 py-3 font-bold text-gray-800">{t.team}</td>
                  <td className="px-3 py-3 text-gray-600">{t.members}</td>
                  <td className={`px-3 py-3 font-bold ${t.avgRate>=4.50?"text-emerald-700":t.avgRate>=4.00?"text-blue-700":t.avgRate>=3.50?"text-amber-700":"text-red-700"}`}>{t.avgRate.toFixed(2)}</td>
                  <td className={`px-3 py-3 font-semibold ${t.avgConv<80?"text-red-600":"text-gray-700"}`}>{t.avgConv.toFixed(1)}%</td>
                  <td className={`px-3 py-3 font-semibold ${t.avgRMO<80?"text-red-600":"text-gray-700"}`}>{t.avgRMO.toFixed(1)}%</td>
                  <td className={`px-3 py-3 font-semibold ${t.avgDel<80?"text-red-600":"text-gray-700"}`}>{t.avgDel.toFixed(1)}%</td>
                  <td className="px-3 py-3">{t.coaching>0?<span className="text-orange-600 font-bold">{t.coaching}</span>:<span className="text-emerald-600 font-semibold">0</span>}</td>
                  <td className="px-3 py-3 text-emerald-700 font-semibold text-xs">{t.top}</td>
                  <td className="px-3 py-3"><StatusBadge status={getStatus(t.avgRate)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QA AUDIT LOG
// ═══════════════════════════════════════════════════════════════════════════════
function QAAuditLog({ data }) {
  const { qaData } = data;
  const [f, setF] = useState({ week:"All", month:"All", team:"All", csr:"All" });
  const filtered = useMemo(() => {
    let d = qaData;
    if (f.week !== "All") d = d.filter(r=>r.week===f.week);
    if (f.month !== "All") d = d.filter(r=>r.month===f.month);
    if (f.team !== "All") d = d.filter(r=>r.team===f.team);
    if (f.csr !== "All") d = d.filter(r=>r.csr_name===f.csr);
    return d;
  }, [f, qaData]);
  const months = [...new Set(qaData.map(r=>r.month).filter(Boolean))];
  const allNames = [...new Set(qaData.map(r=>r.csr_name).filter(Boolean))].sort();
  const qaTeams = [...new Set(qaData.map(r=>r.team).filter(t=>t&&t!=="Unknown"))].sort();
  if (!qaData.length) return <div className="p-7"><EmptyState message="No QA data yet." sub="Add QA entries using the Data Entry tab." /></div>;
  return (
    <div className="p-7 space-y-6">
      <SectionHeader title="QA Audit Log" sub="Minimum 2 QA audits per CSR per week" />
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total QA Audits"  value={filtered.length}                                    icon={ClipboardList} color="blue" />
        <MetricCard label="Average QA Score" value={avg(filtered,"qa_score").toFixed(1)}               icon={Target}        color="emerald" />
        <MetricCard label="Coaching Needed"  value={filtered.filter(q=>q.coaching_needed).length}      icon={BookOpen}      color="orange" />
        <MetricCard label="Passed"           value={filtered.filter(q=>(q.qa_score||0)>=90).length}    icon={CheckCircle}   color="emerald" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-gray-400" />
        <FilterSelect value={f.week}  onChange={v=>setF(p=>({...p,week:v}))}  label="Weeks"  options={["Week 1","Week 2","Week 3","Week 4"]} />
        <FilterSelect value={f.month} onChange={v=>setF(p=>({...p,month:v}))} label="Months" options={months} />
        <FilterSelect value={f.team}  onChange={v=>setF(p=>({...p,team:v}))}  label="Teams"  options={qaTeams} />
        <FilterSelect value={f.csr}   onChange={v=>setF(p=>({...p,csr:v}))}   label="CSRs"   options={allNames} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-[#0d1b36] text-white">{["CSR Name","Team","Week","Month","Chat Ref","QA Score","Script%","Order Acc%","Tone%","Escalation%","Issue","Audited By","Coaching?","Status"].map(h=><th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={14} className="text-center py-12 text-gray-400">No QA records match filters.</td></tr>
                : filtered.map((q,i)=>{
                    const st=qaStatus(q.qa_score||0);
                    return (
                      <tr key={q.id||i} className={`border-b border-gray-50 ${i%2===0?"bg-white":"bg-gray-50/20"}`}>
                        <td className="px-3 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{q.csr_name}</td>
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{q.team}</td>
                        <td className="px-3 py-2.5">{q.week}</td><td className="px-3 py-2.5">{q.month}</td>
                        <td className="px-3 py-2.5 font-mono text-gray-500">{q.chat_ref||"—"}</td>
                        <td className={`px-3 py-2.5 font-bold ${(q.qa_score||0)>=90?"text-emerald-600":(q.qa_score||0)>=80?"text-amber-600":"text-red-600"}`}>{q.qa_score}</td>
                        <td className="px-3 py-2.5">{q.script_compliance}%</td><td className="px-3 py-2.5">{q.order_accuracy}%</td>
                        <td className="px-3 py-2.5">{q.tone_score}%</td><td className="px-3 py-2.5">{q.escalation_handling}%</td>
                        <td className="px-3 py-2.5 text-gray-500 max-w-28">{q.issue_found||"—"}</td>
                        <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{q.audited_by||"—"}</td>
                        <td className="px-3 py-2.5">{q.coaching_needed?<span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-semibold">Yes</span>:<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">No</span>}</td>
                        <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full font-semibold ${qaStatusColor(st)}`}>{st}</span></td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">Showing {filtered.length} QA records</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROADMAP
// ═══════════════════════════════════════════════════════════════════════════════
function RoadmapCard() {
  const features = [
    { icon:FileSpreadsheet, label:"Excel Export",       desc:"CSR ranking + KPI summaries (done ✓)" },
    { icon:FileText,        label:"PDF Coaching Report", desc:"One-click coaching report export (done ✓)" },
    { icon:UserCheck,       label:"Login by TL",         desc:"Supabase Auth — email/password (done ✓)" },
    { icon:Lock,            label:"Record Locking",      desc:"Prevent duplicate data entry (done ✓)" },
    { icon:RefreshCw,       label:"Real-time Sync",      desc:"Live data updates without page refresh" },
    { icon:BarChart2,       label:"Advanced Analytics",  desc:"Trend forecasting and benchmarking" },
  ];
  return (
    <div className="p-7 space-y-7">
      <div><h2 className="text-xl font-bold text-gray-900">Roadmap</h2><p className="text-sm text-gray-500 mt-1">Version 2.1 — What's been done & what's next</p></div>
      <div className="grid grid-cols-2 gap-4">
        {features.map(({ icon:Icon, label, desc }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 fade-in">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><Icon size={17} className="text-blue-600" /></div>
            <div><p className="font-bold text-gray-800 text-sm">{label}</p><p className="text-xs text-gray-500 mt-0.5">{desc}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const PAGE_CONFIG = {
  overview:   { title:"Executive Overview",      subtitle:"Live data from Supabase" },
  ranking:    { title:"CSR Ranking",             subtitle:"Ranked by Total Rate · 1.00–5.00 scale" },
  kpi:        { title:"KPI Breakdown",           subtitle:"Category-level KPI analysis" },
  coaching:   { title:"Coaching Tracker",        subtitle:"Auto-generated · changes saved to database" },
  comparison: { title:"Quarter Comparison",      subtitle:"All quarters with data" },
  team:       { title:"Team Performance",        subtitle:"Team-level comparison and rankings" },
  qa:         { title:"QA Audit Log",            subtitle:"Minimum 2 QA audits per CSR per week" },
  weekly:     { title:"Weekly Scorecard",        subtitle:"Individual CSR weekly scorecard" },
  dataentry:  { title:"Performance Data Entry",  subtitle:"Weekly KPI data input · CSR performance evaluation" },
  roadmap:    { title:"Roadmap",                 subtitle:"Version 2.1 features" },
  profile:    { title:"CSR Profile",             subtitle:"Individual performance details" },
  monthly: { title:"Monthly Dashboard", subtitle:"Monthly scorecard per CSR" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("overview");
  const [selectedCSR, setSelectedCSR] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const { status, data, error, retry, loadedAt } = useSupabaseData();

  const handleSelectCSR = (csr) => { setSelectedCSR(csr); setPage("profile"); };
  const handleNav = (id) => { setPage(id); if (id !== "profile") setSelectedCSR(null); };
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true); retry();
    setTimeout(() => setIsRefreshing(false), 1500);
  }, [retry]);

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#080f1f] flex items-center justify-center">
        <div className="text-center"><div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-3"><Activity size={20} className="text-white" /></div>
          <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent spin-slow mx-auto" /></div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) return <LoginPage onLogin={signIn} />;

  const cfg = PAGE_CONFIG[page] || PAGE_CONFIG.overview;
  const sidebarActive = page === "profile" ? "ranking" : page;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar active={sidebarActive} onNav={handleNav} user={user} onSignOut={signOut} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={page==="profile"&&selectedCSR?selectedCSR.csr_name:cfg.title}
          subtitle={cfg.subtitle}
          loadedAt={status==="success"?loadedAt:null}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          user={user}
        />
        <div className="flex-1 overflow-y-auto">
          {page==="weekly"    && <WeeklyDashboard user={user} />}
          {page==="dataentry" && <DataEntryForm user={user} />}
          {page==="roadmap"   && <RoadmapCard />}
          {page==="weekly"    && <WeeklyDashboard user={user} />}
{page==="dataentry" && <DataEntryForm user={user} />}
{page==="monthly"   && <MonthlyDashboard />}   // ← add this
{page==="roadmap"   && <RoadmapCard />}
       {page!=="dataentry" && page!=="roadmap" && page!=="weekly" && page!=="monthly" && (
            <>
              {status==="loading" && <PageLoadingState pageName={cfg.title} />}
              {status==="error"   && <ErrorState error={error} onRetry={retry} />}
              {status==="success" && (
                <>
                  {page==="overview"   && <ExecutiveOverview   data={data} onSelectCSR={handleSelectCSR} />}
                  {page==="ranking"    && <CSRRanking          data={data} onSelectCSR={handleSelectCSR} />}
                  {page==="profile"    && selectedCSR && <CSRProfile csr={selectedCSR} data={data} onBack={()=>handleNav("ranking")} />}
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
