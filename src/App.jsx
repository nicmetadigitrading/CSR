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
  Filter, Calendar, Clock, RefreshCw, ArrowUp, ArrowDown, Minus,
  Activity, Target, Zap, UserCheck, AlertCircle, Eye, Download,
  FileText, FileSpreadsheet, CheckCircle, XCircle, ClipboardList,
  Layers, Map, Flag, Briefcase, Bell,
  ChevronDown, Info, Package, Rocket, WifiOff, ServerCrash, RotateCcw
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
const QUARTERS = { Q1:["January","February","March"], Q2:["April","May","June"], Q3:["July","August","September"], Q4:["October","November","December"] };
const TEAMS = ["Team Keljash","Team Tristan","Team Knathan","Team Lowii","Team Krizia","Team Bryan","Team Wendell","Team Pikutin","Team Mark"];
const TL_MAP = { "Team Keljash":"TL Keljash","Team Pao":"TL Pao","Team Krizia":"TL Krizia","Team Pikutin":"TL Pikutin","Team Artemis":"TL Artemis" };

const CSR_TEAM_MAP = {
  "ALPHE BALAKID":"Team Keljash","CEDRIC JOSH DENIEGA":"Team Pao","CHYNNA TORNO":"Team Pao",
  "ERVIN ESCARDA":"Team Krizia","FRANZGIAN CASTOR":"Team Krizia","JERALD BYRON CEPE":"Team Pikutin",
  "KATE VALEIZZE HOPE PEDARSE":"Team Pikutin","KENNETH ELBANBUENA":"Team Keljash",
  "LANCE BORLADO":"Team Artemis","PRINCESS ALEYAH BORLADO":"Team Artemis","RACHEL HATE":"Team Artemis",
  "RAINE CHAVEZ":"Team Keljash","RAZEL HILA":"Team Pao","RHEA MAE TUGADO":"Team Krizia",
  "ROXANNE SOLIS":"Team Pikutin","VENICE CUATON":"Team Pikutin","YANO HITOSIS":"Team Artemis",
  "ANGELO PROVIDO":"Team Artemis",
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE FETCH HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

function useSupabaseData() {
  const [state, setState] = useState({ status: "loading", data: null, error: null, loadedAt: null });

  const load = useCallback(async () => {
    setState(s => ({ ...s, status: "loading", error: null }));
    try {
      const [perfRes, qaRes, dailyRes, followupRes] = await Promise.all([
        supabase.from("performance_entries").select("*").order("created_at", { ascending: false }),
        supabase.from("qa_entries").select("*").order("created_at", { ascending: false }),
        supabase.from("daily_entries").select("*").order("date", { ascending: false }),
        supabase.from("followup_entries").select("*").order("created_at", { ascending: false }),
      ]);

      if (perfRes.error) throw perfRes.error;

      // Enrich performance data with team info
      const performanceData = (perfRes.data || []).map(r => ({
        ...r,
        team: CSR_TEAM_MAP[r.csr_name] || "Unknown",
        csr_id: r.csr_name,
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
      }));

      const qaData = (qaRes.data || []).map(r => ({
        ...r,
        csr_id: r.csr_name,
        team: CSR_TEAM_MAP[r.csr_name] || r.team || "Unknown",
      }));

      const dailyData = (dailyRes.data || []).map(r => ({
        ...r,
        csr_id: r.csr_name,
        team: CSR_TEAM_MAP[r.csr_name] || r.team || "Unknown",
      }));

      const followupData = (followupRes.data || []).map(r => ({
        ...r,
        csr_id: r.csr_name,
        team: CSR_TEAM_MAP[r.csr_name] || r.team || "Unknown",
      }));

      setState({
        status: "success",
        data: { performanceData, qaData, dailyData, followupData },
        error: null,
        loadedAt: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      setState({ status: "error", data: null, error: err.message, loadedAt: null });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { ...state, retry: load };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATIONS CSS
// ═══════════════════════════════════════════════════════════════════════════════
import './animations.css';

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON / LOADING COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function SkeletonBox({ w = "100%", h = 16, r = 6, mb = 0 }) {
  return <div className="shimmer" style={{ width: w, height: h, borderRadius: r, marginBottom: mb, flexShrink: 0 }} />;
}

function PageLoadingState({ pageName }) {
  return (
    <div className="p-7 space-y-6 fade-in">
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full progress-bar" />
      </div>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <SkeletonBox w={220} h={22} />
          <SkeletonBox w={300} h={13} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <SkeletonBox w="55%" h={10} />
            <SkeletonBox w="40%" h={28} />
          </div>
        ))}
      </div>
      <div className="fixed bottom-8 right-8 bg-white rounded-2xl shadow-xl border border-gray-100 px-5 py-3 flex items-center gap-3 z-50">
        <div className="relative w-5 h-5">
          <div className="absolute inset-0 rounded-full bg-blue-200 pulse-ring" />
          <div className="relative w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent spin-slow" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700">Loading {pageName}</p>
          <div className="flex gap-1 mt-0.5">
            {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 bounce-dot" style={{ animationDelay: `${i * 0.16}s` }} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="p-7 flex items-center justify-center min-h-96">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-5">
          <ServerCrash size={32} className="text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to Load Data</h3>
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-4 py-2 inline-block mb-6 font-mono">{error}</p>
        <button onClick={onRetry} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 mx-auto">
          <RotateCcw size={14} />Try Again
        </button>
      </div>
    </div>
  );
}

function EmptyState({ message = "No data yet.", sub = "Enter data using the Data Entry tab." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Clock size={28} className="text-gray-300" />
      </div>
      <p className="text-gray-600 font-semibold text-lg">{message}</p>
      <p className="text-gray-400 text-sm mt-2">{sub}</p>
    </div>
  );
}

function DataFreshnessBar({ loadedAt, onRefresh, isRefreshing }) {
  return (
    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2">
      <div className="flex items-center gap-2 text-xs text-emerald-700">
        <CheckCircle size={13} className="text-emerald-500" />
        <span>Live data · Loaded at <span className="font-semibold">{loadedAt}</span></span>
      </div>
      <button onClick={onRefresh} disabled={isRefreshing}
        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50 transition-colors">
        <RefreshCw size={11} className={isRefreshing ? "spin-slow" : ""} />
        {isRefreshing ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
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
function followUpStatus(rate) {
  if (rate >= 95) return "Excellent";
  if (rate >= 90) return "On Track";
  if (rate >= 80) return "Needs Monitoring";
  return "For Coaching";
}
function followUpStatusColor(s) {
  return { Excellent:"bg-emerald-100 text-emerald-800", "On Track":"bg-blue-100 text-blue-800", "Needs Monitoring":"bg-amber-100 text-amber-800", "For Coaching":"bg-red-100 text-red-800" }[s] || "bg-gray-100 text-gray-700";
}
function dailyStatus(r) {
  const low = (r.conversion_rate || 0) < 60;
  const missed = (r.missed_followups || 0) > 0;
  const backlog = (r.backlog || 0) > 8;
  if (low && missed && backlog) return "Critical";
  if (low || (r.qa_flags || 0) > 1) return "Needs Coaching";
  if (missed) return "Needs Follow-up";
  return "On Track";
}
function dailyStatusColor(s) {
  return { "On Track":"bg-emerald-100 text-emerald-800", "Needs Follow-up":"bg-amber-100 text-amber-800", "Needs Coaching":"bg-orange-100 text-orange-800", Critical:"bg-red-100 text-red-800" }[s] || "bg-gray-100 text-gray-700";
}
const avg = (arr, key) => arr.length ? +(arr.reduce((s, r) => s + (parseFloat(r[key]) || 0), 0) / arr.length).toFixed(2) : 0;

function getAggregated(data) {
  const byCSR = {};
  data.forEach(r => {
    const key = r.csr_name;
    if (!byCSR[key]) {
      byCSR[key] = { ...r, count: 1 };
    } else {
      ["total_rate","kra_scale","behavioral_scale","conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score","attendance_score","esc_score"].forEach(k => {
        byCSR[key][k] = (parseFloat(byCSR[key][k]) || 0) + (parseFloat(r[k]) || 0);
      });
      byCSR[key].count++;
    }
  });
  return Object.values(byCSR).map(c => {
    const n = c.count;
    return {
      ...c,
      total_rate: +(c.total_rate / n).toFixed(2),
      kra_scale: +(c.kra_scale / n).toFixed(2),
      behavioral_scale: +(c.behavioral_scale / n).toFixed(2),
      conversion_score: +(c.conversion_score / n).toFixed(1),
      rmo_score: +(c.rmo_score / n).toFixed(1),
      rts_score: +(c.rts_score / n).toFixed(1),
      delivery_success_score: +(c.delivery_success_score / n).toFixed(1),
      upsell_score: +(c.upsell_score / n).toFixed(1),
      attendance_score: +(c.attendance_score / n).toFixed(1),
      esc_score: +(c.esc_score / n).toFixed(1),
    };
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
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatusBadge({ status }) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${statusColor(status)}`}>{status}</span>;
}

function MetricCard({ label, value, sub, icon: Icon, color = "blue", onClick, alert }) {
  const colors = { blue:"bg-blue-50 text-blue-600", emerald:"bg-emerald-50 text-emerald-600", amber:"bg-amber-50 text-amber-600", red:"bg-red-50 text-red-600", purple:"bg-purple-50 text-purple-600", orange:"bg-orange-50 text-orange-600", slate:"bg-slate-50 text-slate-600", teal:"bg-teal-50 text-teal-600" };
  return (
    <div onClick={onClick} className={`bg-white rounded-xl border ${alert ? "border-red-300" : "border-gray-100"} p-5 ${onClick ? "cursor-pointer hover:border-blue-300 hover:shadow-md transition-all" : ""} fade-in`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
        {Icon && <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}><Icon size={15} /></div>}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function ExportButton({ label, icon: Icon = Download }) {
  return (
    <button onClick={() => alert("Export coming soon.")}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
      <Icon size={13} />{label}
    </button>
  );
}

function SectionHeader({ title, sub, exports = [] }) {
  return (
    <div className="flex items-start justify-between">
      <div><h2 className="text-lg font-bold text-gray-900">{title}</h2>{sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}</div>
      {exports.length > 0 && <div className="flex gap-2 flex-wrap">{exports.map((e, i) => <ExportButton key={i} label={e.label} icon={e.icon} />)}</div>}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-400">
      {label && <option value="All">All {label}</option>}
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR & HEADER
// ═══════════════════════════════════════════════════════════════════════════════

const NAV = [
  { id:"overview",   label:"Executive Overview",  icon:Home },
  { id:"ranking",    label:"CSR Ranking",          icon:BarChart2 },
  { id:"kpi",        label:"KPI Breakdown",        icon:Target },
  { id:"coaching",   label:"Coaching Tracker",     icon:BookOpen },
  { id:"comparison", label:"Quarter Comparison",   icon:GitCompare },
  { id:"team",       label:"Team Performance",     icon:Layers },
  { id:"qa",         label:"QA Audit Log",         icon:ClipboardList },
  { id:"daily",      label:"Daily Scorecard",      icon:Calendar },
  { id:"followup",   label:"Follow-up Tracker",    icon:Flag },
  { id:"weekly",    label:"Weekly Scorecard",     icon:Star },
  { id:"dataentry",  label:"Data Entry",           icon:ClipboardList },
  { id:"roadmap",    label:"Next Build Roadmap",   icon:Rocket },
];

function Sidebar({ active, onNav }) {
  return (
    <div className="w-60 min-h-screen bg-[#0d1b36] flex flex-col flex-shrink-0">
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center"><Activity size={16} className="text-white" /></div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">CSR Performance</p>
            <p className="text-blue-300 text-xs">TL Control Panel</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onNav(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${active === id ? "bg-blue-600 text-white font-semibold" : "text-blue-200 hover:bg-white/10 hover:text-white"}`}>
            <Icon size={15} className="flex-shrink-0" /><span className="truncate">{label}</span>
          </button>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-blue-400 text-xs">Version 2.0 · Live Data</p>
        <p className="text-blue-500 text-xs mt-0.5">Supabase Connected</p>
      </div>
    </div>
  );
}

function Header({ title, subtitle, loadedAt, onRefresh, isRefreshing }) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-3.5 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {loadedAt && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-lg">
            <CheckCircle size={12} />
            <span>Live · {loadedAt}</span>
            <button onClick={onRefresh} disabled={isRefreshing} className="ml-1 text-emerald-700 hover:text-emerald-900 disabled:opacity-50">
              <RefreshCw size={11} className={isRefreshing ? "spin-slow" : ""} />
            </button>
          </div>
        )}
        <div className="text-right">
          <p className="text-xs text-gray-400">Current Period</p>
          <p className="text-sm font-semibold text-gray-700">2026</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold">TL</div>
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
  const coaching = agg.filter(r => (r.total_rate || 0) < 3.50);
  const teamAvgRate = avg(agg, "total_rate");

  const months = [...new Set(performanceData.map(r => r.month).filter(Boolean))];
  const monthlyTrend = months.slice(0, 6).map(m => {
    const rows = performanceData.filter(r => r.month === m);
    return { month: m?.slice(0, 3), avg: avg(rows, "total_rate"), kra: avg(rows, "kra_scale") };
  });

  const kpiHealth = [
    { name:"Conversion", val:avg(performanceData,"conversion_score"), target:80 },
    { name:"RMO",        val:avg(performanceData,"rmo_score"),         target:80 },
    { name:"RTS",        val:avg(performanceData,"rts_score"),         target:80 },
    { name:"Delivery",   val:avg(performanceData,"delivery_success_score"), target:80 },
    { name:"Upsell",     val:avg(performanceData,"upsell_score"),      target:80 },
    { name:"ESC",        val:avg(performanceData,"esc_score"),         target:80 },
  ];

  return (
    <div className="p-7 space-y-7">
      <SectionHeader title="Executive Overview" sub="Live data from Supabase" exports={[{ label:"Export PDF", icon:FileText }]} />
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total CSRs"             value={agg.length}              sub="With performance data"    icon={Users}          color="blue" />
        <MetricCard label="Team Avg Total Rate"    value={teamAvgRate.toFixed(2)}  sub="Scale 1.00–5.00"         icon={TrendingUp}     color="emerald" />
        <MetricCard label="Total Entries"          value={performanceData.length}  sub="All records"             icon={Target}         color="purple" />
        <MetricCard label="Needs Coaching"         value={coaching.length}         sub="Below 3.50 threshold"    icon={AlertTriangle}  color="orange" alert={coaching.length > 3} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4"><Award size={15} className="text-emerald-500" /><h3 className="font-bold text-gray-800 text-sm">Top 5 Performers</h3></div>
          {agg.slice(0, 5).map((c, i) => (
            <div key={c.csr_name} onClick={() => onSelectCSR(c)} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer mb-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-orange-300 text-white" : "bg-gray-100 text-gray-600"}`}>{i + 1}</span>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{c.csr_name}</p><p className="text-xs text-gray-500">{c.team}</p></div>
              <div className="text-right flex-shrink-0"><p className="text-sm font-bold text-gray-900">{c.total_rate}</p><StatusBadge status={getStatus(c.total_rate)} /></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4"><TrendingDown size={15} className="text-red-500" /><h3 className="font-bold text-gray-800 text-sm">Bottom 5 Performers</h3></div>
          {agg.slice(-5).reverse().map((c, i) => (
            <div key={c.csr_name} onClick={() => onSelectCSR(c)} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer mb-1.5">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{agg.length - i}</span>
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
            ))
          }
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">Performance Trend by Month</h3>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={v => v?.toFixed(2)} />
                <Legend />
                <Line type="monotone" dataKey="avg" name="Total Rate" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="kra" name="KRA Scale" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No monthly data yet." sub="" />}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">KPI Health Summary</h3>
          {kpiHealth.map(k => (
            <div key={k.name} className="flex items-center gap-3 mb-3">
              <span className="text-xs text-gray-600 w-20 font-medium">{k.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${k.val >= 80 ? "bg-emerald-500" : k.val >= 70 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${Math.min(k.val, 100)}%` }} />
              </div>
              <span className={`text-xs font-bold w-12 text-right ${k.val >= 80 ? "text-emerald-600" : k.val >= 70 ? "text-amber-600" : "text-red-600"}`}>{k.val?.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSR RANKING
// ═══════════════════════════════════════════════════════════════════════════════

function CSRRanking({ data, onSelectCSR }) {
  const { performanceData } = data;
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
  const months = [...new Set(performanceData.map(r => r.month).filter(Boolean))];

  if (!performanceData.length) return <div className="p-7"><EmptyState /></div>;

  return (
    <div className="p-7 space-y-6">
      <SectionHeader title="CSR Ranking" sub="Ranked by Total Rate (1.00–5.00 scale)" exports={[{ label:"Export Excel", icon:FileSpreadsheet }]} />
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter size={13} className="text-gray-400" />
          <FilterSelect value={f.quarter} onChange={v => setF(p => ({ ...p, quarter:v }))} label="Quarters" options={quarters} />
          <FilterSelect value={f.month}   onChange={v => setF(p => ({ ...p, month:v }))}   label="Months"   options={months} />
          <FilterSelect value={f.team}    onChange={v => setF(p => ({ ...p, team:v }))}    label="Teams"    options={TEAMS} />
          <FilterSelect value={f.status}  onChange={v => setF(p => ({ ...p, status:v }))}  label="Statuses" options={["Excellent","Good","Needs Monitoring","For Coaching","Critical"]} />
          <div className="relative flex-1 min-w-44">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={f.search} onChange={e => setF(p => ({ ...p, search:e.target.value }))} placeholder="Search CSR name..." className="w-full text-sm border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-400" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0d1b36] text-white text-xs">
                {["#","CSR Name","Team","Month","Week","Total Rate","KRA Scale","Behavioral","Conv %","RMO %","RTS %","Delivery %","Upsell %","Status",""].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={15} className="text-center py-12 text-gray-400">No CSRs match current filters.</td></tr>
                : filtered.map((c, i) => (
                  <tr key={c.csr_name + i} className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                    <td className="px-3 py-2.5 font-bold text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-3 py-2.5"><button onClick={() => onSelectCSR(c)} className="text-blue-700 font-semibold hover:underline text-left whitespace-nowrap">{c.csr_name}</button></td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap text-xs">{c.team}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{c.month || "—"}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{c.week || "—"}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-900">{c.total_rate}</td>
                    <td className="px-3 py-2.5 text-gray-700">{c.kra_scale}</td>
                    <td className="px-3 py-2.5 text-gray-700">{c.behavioral_scale}</td>
                    {["conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score"].map(k => (
                      <td key={k} className={`px-3 py-2.5 font-semibold ${c[k] < 80 ? "text-red-600" : "text-gray-700"}`}>{parseFloat(c[k]).toFixed(1)}%</td>
                    ))}
                    <td className="px-3 py-2.5"><StatusBadge status={getStatus(c.total_rate)} /></td>
                    <td className="px-3 py-2.5"><button onClick={() => onSelectCSR(c)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold"><Eye size={12} />View</button></td>
                  </tr>
                ))
              }
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
  const { performanceData } = data;
  const csrRecords = performanceData.filter(r => r.csr_name === csr.csr_name);
  const allAgg = getAggregated(performanceData);
  const rank = allAgg.findIndex(r => r.csr_name === csr.csr_name) + 1;
  const issues = getCoachingIssues(csr);

  const trendData = csrRecords.map(r => ({
    label: `${r.month?.slice(0,3) || ""} ${r.week || ""}`.trim(),
    rate: r.total_rate, kra: r.kra_scale, beh: r.behavioral_scale,
  }));

  const kpiData = [
    { subject:"Conv",   value: csr.conversion_score },
    { subject:"RMO",    value: csr.rmo_score },
    { subject:"RTS",    value: csr.rts_score },
    { subject:"Deliv",  value: csr.delivery_success_score },
    { subject:"Upsell", value: csr.upsell_score },
    { subject:"ESC",    value: csr.esc_score },
  ];

  return (
    <div className="p-7 space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-semibold"><ChevronRight size={15} className="rotate-180" />Back to Ranking</button>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {(csr.csr_name || "").split(" ").map(n => n[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap"><h2 className="text-xl font-bold text-gray-900">{csr.csr_name}</h2><StatusBadge status={getStatus(csr.total_rate)} /></div>
            <p className="text-gray-500 text-sm mt-1">{csr.team} · Rank #{rank} of {allAgg.length}</p>
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
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => v?.toFixed(2)} />
                <Legend />
                <Line type="monotone" dataKey="rate" name="Total Rate" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="kra" name="KRA" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState message="Only one record." sub="More entries needed for trend." />}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">KPI Radar</h3>
          <ResponsiveContainer width="100%" height={190}>
            <RadarChart data={kpiData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 p-5">
          <div className="flex items-center gap-2 mb-4"><AlertTriangle size={14} className="text-orange-500" /><h3 className="font-bold text-gray-800 text-sm">Coaching Recommendations</h3></div>
          {issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg mb-2">
              <span className="w-5 h-5 rounded-full bg-orange-400 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
              <div><p className="text-sm font-semibold text-gray-800">{issue.kpi} — {issue.score}</p><p className="text-xs text-orange-700">{issue.rec}</p></div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800 text-sm">All Records</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-[#0d1b36] text-white">{["Month","Week","Final Score","KRA","Behavioral","Conv%","RMO%","RTS%","Delivery%","Upsell%"].map(h => <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {csrRecords.map((r, i) => (
                <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                  <td className="px-3 py-2">{r.month || "—"}</td>
                  <td className="px-3 py-2">{r.week || "—"}</td>
                  <td className="px-3 py-2 font-bold text-blue-700">{parseFloat(r.final_score || 0).toFixed(2)}</td>
                  <td className="px-3 py-2">{parseFloat(r.kra_total || 0).toFixed(2)}</td>
                  <td className="px-3 py-2">{parseFloat(r.bi_score || 0).toFixed(2)}</td>
                  {["conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score"].map(k => (
                    <td key={k} className={`px-3 py-2 font-semibold ${r[k] < 80 ? "text-red-600" : "text-gray-700"}`}>{parseFloat(r[k] || 0).toFixed(1)}%</td>
                  ))}
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
  const { performanceData } = data;
  const [f, setF] = useState({ quarter:"All", month:"All", team:"All" });

  const filtData = useMemo(() => {
    let d = performanceData;
    if (f.quarter !== "All") d = d.filter(r => r.quarter === f.quarter);
    if (f.month !== "All") d = d.filter(r => r.month === f.month);
    if (f.team !== "All") d = d.filter(r => r.team === f.team);
    return d;
  }, [f, performanceData]);

  const quarters = [...new Set(performanceData.map(r => r.quarter).filter(Boolean))];
  const months = [...new Set(performanceData.map(r => r.month).filter(Boolean))];

  const cats = [
    { name:"Conversion", key:"conversion_score", target:80 },
    { name:"RMO",        key:"rmo_score",         target:80 },
    { name:"RTS",        key:"rts_score",         target:80 },
    { name:"Delivery",   key:"delivery_success_score", target:80 },
    { name:"Upsell",     key:"upsell_score",      target:80 },
    { name:"ESC",        key:"esc_score",         target:80 },
  ];

  if (!performanceData.length) return <div className="p-7"><EmptyState /></div>;

  const chartData = cats.map(c => ({ name:c.name, avg:avg(filtData, c.key), target:c.target }));

  return (
    <div className="p-7 space-y-6">
      <SectionHeader title="KPI Breakdown" sub="Category-level performance analysis" />
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-gray-400" />
        <FilterSelect value={f.quarter} onChange={v => setF(p => ({ ...p, quarter:v }))} label="Quarters" options={quarters} />
        <FilterSelect value={f.month}   onChange={v => setF(p => ({ ...p, month:v }))}   label="Months"   options={months} />
        <FilterSelect value={f.team}    onChange={v => setF(p => ({ ...p, team:v }))}    label="Teams"    options={TEAMS} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-4">KPI Average vs Target</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => `${v?.toFixed(1)}%`} />
            <Legend />
            <Bar dataKey="avg" name="Team Avg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="target" name="Target" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <table className="w-full text-sm">
          <thead><tr className="bg-[#0d1b36] text-white text-xs">{["KPI","Target","Team Avg","Below Target","Health","Progress"].map(h => <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {cats.map((c, i) => {
              const a = avg(filtData, c.key);
              const below = [...new Set(filtData.filter(r => (r[c.key] || 0) < c.target).map(r => r.csr_name))].length;
              const health = a >= c.target ? "On Target" : a >= c.target - 10 ? "Near Target" : "Below Target";
              return (
                <tr key={c.name} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                  <td className="px-5 py-3 font-semibold text-gray-800">{c.name}</td>
                  <td className="px-5 py-3 text-gray-600">{c.target}%</td>
                  <td className={`px-5 py-3 font-bold ${a >= c.target ? "text-emerald-700" : a >= c.target - 10 ? "text-amber-700" : "text-red-700"}`}>{a?.toFixed(1)}%</td>
                  <td className="px-5 py-3">{below > 0 ? <span className="text-red-600 font-semibold">{below} CSR{below !== 1 ? "s" : ""}</span> : <span className="text-emerald-600 font-semibold">None</span>}</td>
                  <td className="px-5 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${health === "On Target" ? "bg-emerald-100 text-emerald-800" : health === "Near Target" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>{health}</span></td>
                  <td className="px-5 py-3 w-36"><div className="bg-gray-100 rounded-full h-2"><div className={`h-2 rounded-full ${a >= c.target ? "bg-emerald-500" : a >= c.target - 10 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${Math.min(a, 100)}%` }} /></div></td>
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
// COACHING TRACKER
// ═══════════════════════════════════════════════════════════════════════════════

const COACHING_STATUS_OPTIONS = ["Pending","Ongoing","Done","Improved","No Improvement","Escalated"];

function CoachingTracker({ data }) {
  const { performanceData } = data;
  const agg = getAggregated(performanceData);
  const [statuses, setStatuses] = useState({});
  const [results, setResults] = useState({});

  const coachingList = useMemo(() => {
    return agg.filter(c => getCoachingIssues(c).length > 0).map(csr => {
      const issues = getCoachingIssues(csr);
      const priority = csr.total_rate < 3.00 ? "Critical" : csr.total_rate < 3.50 ? "High" : "Medium";
      return { csr, issues, priority };
    }).sort((a, b) => ({ Critical:0, High:1, Medium:2 }[a.priority] - { Critical:0, High:1, Medium:2 }[b.priority]));
  }, [agg]);

  if (!performanceData.length) return <div className="p-7"><EmptyState /></div>;

  const pColor = { Critical:"bg-red-100 text-red-800 border-red-300", High:"bg-orange-100 text-orange-800 border-orange-300", Medium:"bg-amber-100 text-amber-800 border-amber-300" };

  return (
    <div className="p-7 space-y-6">
      <SectionHeader title="Coaching Tracker" sub="Auto-generated from KPI data" />
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Need Coaching"  value={coachingList.length}                                                          icon={BookOpen}      color="orange" />
        <MetricCard label="Critical"       value={coachingList.filter(c => c.priority === "Critical").length}                   icon={AlertTriangle} color="red" />
        <MetricCard label="High Priority"  value={coachingList.filter(c => c.priority === "High").length}                       icon={TrendingDown}  color="amber" />
        <MetricCard label="On Track"       value={agg.length - coachingList.length}                                             icon={CheckCircle}   color="emerald" />
      </div>
      {coachingList.length === 0
        ? <EmptyState message="No CSRs need coaching!" sub="All CSRs are above the 3.50 threshold." />
        : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0d1b36] text-white">
                    {["Priority","CSR Name","Team","KPI Issue","Score","Recommendation","Coaching Owner","Status","Result"].map(h => (
                      <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coachingList.map(({ csr, issues, priority }, idx) =>
                    issues.map((issue, ii) => (
                      <tr key={`${csr.csr_name}-${ii}`} className={`border-b border-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}>
                        {ii === 0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top"><span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${pColor[priority]}`}>{priority}</span></td>}
                        {ii === 0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top font-semibold text-gray-800 whitespace-nowrap">{csr.csr_name}</td>}
                        {ii === 0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top text-gray-600 whitespace-nowrap">{csr.team}</td>}
                        <td className="px-3 py-2.5 font-semibold text-gray-700">{issue.kpi}</td>
                        <td className="px-3 py-2.5 font-bold text-red-600">{issue.score}</td>
                        <td className="px-3 py-2.5 text-gray-600 max-w-36">{issue.rec}</td>
                        {ii === 0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top text-gray-600">{TL_MAP[csr.team] || "—"}</td>}
                        {ii === 0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top">
                          <select value={statuses[csr.csr_name] || "Pending"} onChange={e => setStatuses(p => ({ ...p, [csr.csr_name]:e.target.value }))}
                            className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white focus:outline-none">
                            {COACHING_STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>}
                        {ii === 0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top">
                          <input placeholder="Note…" className="text-xs border border-gray-200 rounded px-2 py-1 w-24 focus:outline-none focus:border-blue-400"
                            value={results[csr.csr_name] || ""} onChange={e => setResults(p => ({ ...p, [csr.csr_name]:e.target.value }))} />
                        </td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      }
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUARTER COMPARISON
// ═══════════════════════════════════════════════════════════════════════════════

function QuarterComparison({ data }) {
  const { performanceData } = data;
  const quarters = [...new Set(performanceData.map(r => r.quarter).filter(Boolean))];
  const agg = getAggregated(performanceData);

  if (!performanceData.length) return <div className="p-7"><EmptyState /></div>;

  return (
    <div className="p-7 space-y-6">
      <SectionHeader title="Quarter Comparison" sub="All quarters with data" />
      <div className="grid grid-cols-4 gap-4">
        {quarters.length === 0
          ? <div className="col-span-4"><EmptyState message="No quarter data yet." /></div>
          : quarters.map(q => {
              const qData = getAggregated(performanceData.filter(r => r.quarter === q));
              return (
                <div key={q} className="bg-blue-600 text-white rounded-xl p-5">
                  <p className="text-blue-200 text-xs font-semibold uppercase">{q} {qData[0]?.year || ""}</p>
                  <p className="text-xl font-black mt-1">{QUARTERS[q]?.join(" · ") || q}</p>
                  <div className="mt-3 pt-3 border-t border-blue-500">
                    <p className="text-xs text-blue-200">Team Avg Rate</p>
                    <p className="text-2xl font-black">{avg(qData, "total_rate").toFixed(2)}</p>
                    <p className="text-xs text-blue-200 mt-1">{qData.length} CSRs</p>
                  </div>
                </div>
              );
            })
        }
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#0d1b36] text-white text-xs">{["CSR Name","Team","Quarter","Month","Week","Total Rate","KRA","Behavioral","Status"].map(h => <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {agg.map((c, i) => (
                <tr key={c.csr_name} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                  <td className="px-4 py-2.5 font-semibold text-gray-800">{c.csr_name}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{c.team}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.quarter || "—"}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.month || "—"}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.week || "—"}</td>
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
  const { performanceData } = data;
  if (!performanceData.length) return <div className="p-7"><EmptyState /></div>;

  const agg = getAggregated(performanceData);
  const teamStats = TEAMS.map(team => {
    const members = agg.filter(c => c.team === team);
    return {
      team, members: members.length,
      avgRate: avg(members, "total_rate"),
      avgConv: avg(members, "conversion_score"),
      avgRMO: avg(members, "rmo_score"),
      avgDel: avg(members, "delivery_success_score"),
      coaching: members.filter(c => getCoachingIssues(c).length > 0).length,
      top: [...members].sort((a, b) => b.total_rate - a.total_rate)[0]?.csr_name?.split(" ")[0] || "—",
    };
  }).filter(t => t.members > 0);

  const barData = teamStats.map(t => ({ name:t.team.replace("Team ",""), rate:t.avgRate }));

  return (
    <div className="p-7 space-y-6">
      <SectionHeader title="Team Performance" sub="Team-level comparison" />
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-4">Team Average Total Rate</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => v?.toFixed(2)} />
            <Bar dataKey="rate" name="Avg Rate" radius={[4, 4, 0, 0]}>
              {barData.map((e, i) => <Cell key={i} fill={e.rate >= 4.50 ? "#10b981" : e.rate >= 4.00 ? "#3b82f6" : e.rate >= 3.50 ? "#f59e0b" : "#ef4444"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#0d1b36] text-white text-xs">{["Team","CSRs","Avg Rate","Conv%","RMO%","Delivery%","Coaching","Top CSR","Status"].map(h => <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {teamStats.map((t, i) => (
                <tr key={t.team} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                  <td className="px-3 py-3 font-bold text-gray-800">{t.team}</td>
                  <td className="px-3 py-3 text-gray-600">{t.members}</td>
                  <td className={`px-3 py-3 font-bold ${t.avgRate >= 4.50 ? "text-emerald-700" : t.avgRate >= 4.00 ? "text-blue-700" : t.avgRate >= 3.50 ? "text-amber-700" : "text-red-700"}`}>{t.avgRate.toFixed(2)}</td>
                  <td className={`px-3 py-3 font-semibold ${t.avgConv < 80 ? "text-red-600" : "text-gray-700"}`}>{t.avgConv.toFixed(1)}%</td>
                  <td className={`px-3 py-3 font-semibold ${t.avgRMO < 80 ? "text-red-600" : "text-gray-700"}`}>{t.avgRMO.toFixed(1)}%</td>
                  <td className={`px-3 py-3 font-semibold ${t.avgDel < 80 ? "text-red-600" : "text-gray-700"}`}>{t.avgDel.toFixed(1)}%</td>
                  <td className="px-3 py-3">{t.coaching > 0 ? <span className="text-orange-600 font-bold">{t.coaching}</span> : <span className="text-emerald-600 font-semibold">0</span>}</td>
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
    if (f.week !== "All") d = d.filter(r => r.week === f.week);
    if (f.month !== "All") d = d.filter(r => r.month === f.month);
    if (f.team !== "All") d = d.filter(r => r.team === f.team);
    if (f.csr !== "All") d = d.filter(r => r.csr_name === f.csr);
    return d;
  }, [f, qaData]);

  const months = [...new Set(qaData.map(r => r.month).filter(Boolean))];
  const allNames = [...new Set(qaData.map(r => r.csr_name).filter(Boolean))].sort();

  if (!qaData.length) return <div className="p-7"><EmptyState message="No QA data yet." sub="Add QA entries using the Data Entry tab." /></div>;

  return (
    <div className="p-7 space-y-6">
      <SectionHeader title="QA Audit Log" sub="Minimum 2 QA audits per CSR per week" />
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total QA Audits"     value={filtered.length}                                            icon={ClipboardList} color="blue" />
        <MetricCard label="Average QA Score"    value={avg(filtered, "qa_score").toFixed(1)}                       icon={Target}        color="emerald" />
        <MetricCard label="Coaching Needed"     value={filtered.filter(q => q.coaching_needed).length}             icon={BookOpen}      color="orange" />
        <MetricCard label="Passed"              value={filtered.filter(q => (q.qa_score||0) >= 90).length}         icon={CheckCircle}   color="emerald" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-gray-400" />
        <FilterSelect value={f.week}  onChange={v => setF(p => ({ ...p, week:v }))}  label="Weeks"   options={["Week 1","Week 2","Week 3","Week 4"]} />
        <FilterSelect value={f.month} onChange={v => setF(p => ({ ...p, month:v }))} label="Months"  options={months} />
        <FilterSelect value={f.team}  onChange={v => setF(p => ({ ...p, team:v }))}  label="Teams"   options={TEAMS} />
        <FilterSelect value={f.csr}   onChange={v => setF(p => ({ ...p, csr:v }))}   label="CSRs"    options={allNames} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-[#0d1b36] text-white">{["CSR Name","Team","Week","Month","Chat Ref","QA Score","Script%","Order Acc%","Tone%","Escalation%","Issue","Audited By","Coaching?","Status"].map(h => <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={14} className="text-center py-12 text-gray-400">No QA records match filters.</td></tr>
                : filtered.map((q, i) => {
                    const st = qaStatus(q.qa_score || 0);
                    return (
                      <tr key={q.id || i} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}>
                        <td className="px-3 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{q.csr_name}</td>
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{q.team}</td>
                        <td className="px-3 py-2.5">{q.week}</td>
                        <td className="px-3 py-2.5">{q.month}</td>
                        <td className="px-3 py-2.5 font-mono text-gray-500">{q.chat_ref || "—"}</td>
                        <td className={`px-3 py-2.5 font-bold ${(q.qa_score||0) >= 90 ? "text-emerald-600" : (q.qa_score||0) >= 80 ? "text-amber-600" : "text-red-600"}`}>{q.qa_score}</td>
                        <td className="px-3 py-2.5">{q.script_compliance}%</td>
                        <td className="px-3 py-2.5">{q.order_accuracy}%</td>
                        <td className="px-3 py-2.5">{q.tone_score}%</td>
                        <td className="px-3 py-2.5">{q.escalation_handling}%</td>
                        <td className="px-3 py-2.5 text-gray-500 max-w-28">{q.issue_found || "—"}</td>
                        <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{q.audited_by || "—"}</td>
                        <td className="px-3 py-2.5">{q.coaching_needed ? <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-semibold">Yes</span> : <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">No</span>}</td>
                        <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full font-semibold ${qaStatusColor(st)}`}>{st}</span></td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">Showing {filtered.length} QA records</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DAILY SCORECARD
// ═══════════════════════════════════════════════════════════════════════════════

function DailyScorecard({ data }) {
  const { dailyData } = data;
  const [f, setF] = useState({ date:"All", team:"All", csr:"All" });

  const enriched = useMemo(() => dailyData.map(r => ({ ...r, daily_status: dailyStatus(r) })), [dailyData]);
  const filtered = useMemo(() => {
    let d = enriched;
    if (f.date !== "All") d = d.filter(r => r.date === f.date);
    if (f.team !== "All") d = d.filter(r => r.team === f.team);
    if (f.csr !== "All") d = d.filter(r => r.csr_name === f.csr);
    return d;
  }, [f, enriched]);

  const dates = [...new Set(dailyData.map(r => r.date).filter(Boolean))].sort().reverse();
  const allNames = [...new Set(dailyData.map(r => r.csr_name).filter(Boolean))].sort();

  if (!dailyData.length) return <div className="p-7"><EmptyState message="No daily data yet." sub="Add daily entries using the Data Entry tab." /></div>;

  return (
    <div className="p-7 space-y-6">
      <SectionHeader title="Daily CSR Scorecard" sub="Daily activity monitoring" />
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Records"           value={filtered.length}                                                             icon={Users}       color="blue" />
        <MetricCard label="Total Orders"      value={filtered.reduce((s,r) => s+(r.orders_closed||0),0)}                        icon={Package}     color="emerald" />
        <MetricCard label="Avg Conversion"    value={`${avg(filtered,"conversion_rate").toFixed(1)}%`}                          icon={TrendingUp}  color="blue" />
        <MetricCard label="Missed Follow-ups" value={filtered.reduce((s,r) => s+(r.missed_followups||0),0)}                     icon={AlertCircle} color="red" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-gray-400" />
        <FilterSelect value={f.date} onChange={v => setF(p => ({ ...p, date:v }))} label="All Dates" options={dates.map(d => ({ value:d, label:d }))} />
        <FilterSelect value={f.team} onChange={v => setF(p => ({ ...p, team:v }))} label="Teams"    options={TEAMS} />
        <FilterSelect value={f.csr}  onChange={v => setF(p => ({ ...p, csr:v }))}  label="CSRs"     options={allNames} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-[#0d1b36] text-white">{["Date","CSR","Team","Chats","Orders","Conv%","Follow-ups","Missed","Backlog","QA Flags","Status","TL Notes"].map(h => <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={12} className="text-center py-12 text-gray-400">No daily records match filters.</td></tr>
                : filtered.map((r, i) => (
                  <tr key={r.id || i} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}>
                    <td className="px-3 py-2.5 font-mono text-gray-500 whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{r.csr_name}</td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{r.team}</td>
                    <td className="px-3 py-2.5">{r.conversations}</td>
                    <td className="px-3 py-2.5 font-semibold">{r.orders_closed}</td>
                    <td className={`px-3 py-2.5 font-bold ${(r.conversion_rate||0)<60?"text-red-600":(r.conversion_rate||0)<70?"text-amber-600":"text-emerald-600"}`}>{r.conversion_rate}%</td>
                    <td className="px-3 py-2.5">{r.followups_completed}</td>
                    <td className={`px-3 py-2.5 font-bold ${(r.missed_followups||0)>0?"text-red-600":"text-emerald-600"}`}>{r.missed_followups}</td>
                    <td className={`px-3 py-2.5 font-semibold ${(r.backlog||0)>8?"text-red-600":"text-gray-600"}`}>{r.backlog}</td>
                    <td className={`px-3 py-2.5 font-bold ${(r.qa_flags||0)>0?"text-red-600":"text-gray-500"}`}>{r.qa_flags}</td>
                    <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full font-semibold ${dailyStatusColor(r.daily_status)}`}>{r.daily_status}</span></td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-32">{r.tl_notes}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOLLOW-UP TRACKER
// ═══════════════════════════════════════════════════════════════════════════════

function FollowUpTracker({ data }) {
  const { followupData } = data;
  const [f, setF] = useState({ team:"All", csr:"All" });

  const enriched = useMemo(() => followupData.map(r => {
    const rate = r.total_due ? +((r.completed / r.total_due) * 100).toFixed(1) : 0;
    return { ...r, completion_rate: rate, status: followUpStatus(rate) };
  }), [followupData]);

  const filtered = useMemo(() => {
    let d = enriched;
    if (f.team !== "All") d = d.filter(r => r.team === f.team);
    if (f.csr !== "All") d = d.filter(r => r.csr_name === f.csr);
    return d;
  }, [f, enriched]);

  const allNames = [...new Set(followupData.map(r => r.csr_name).filter(Boolean))].sort();

  if (!followupData.length) return <div className="p-7"><EmptyState message="No follow-up data yet." sub="Add follow-up entries using the Data Entry tab." /></div>;

  return (
    <div className="p-7 space-y-6">
      <SectionHeader title="Follow-up Tracker" sub="Missed follow-ups = lost revenue" />
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Due"       value={filtered.reduce((s,r)=>s+(r.total_due||0),0)}       icon={Flag}       color="blue" />
        <MetricCard label="Completed"       value={filtered.reduce((s,r)=>s+(r.completed||0),0)}       icon={CheckCircle} color="emerald" />
        <MetricCard label="Missed"          value={filtered.reduce((s,r)=>s+(r.missed||0),0)}          icon={XCircle}    color="red" />
        <MetricCard label="Revenue Recovered" value={`₱${filtered.reduce((s,r)=>s+(r.revenue_recovered||0),0).toLocaleString()}`} icon={Briefcase} color="purple" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3 items-center">
        <Filter size={13} className="text-gray-400" />
        <FilterSelect value={f.team} onChange={v => setF(p => ({ ...p, team:v }))} label="Teams" options={TEAMS} />
        <FilterSelect value={f.csr}  onChange={v => setF(p => ({ ...p, csr:v }))}  label="CSRs"  options={allNames} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#0d1b36] text-white text-xs">{["CSR Name","Team","Month","Total Due","Completed","Missed","Completion%","Contact Rate%","Orders Recovered","Revenue Recovered","Status"].map(h => <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={11} className="text-center py-12 text-gray-400">No follow-up records.</td></tr>
                : filtered.map((r, i) => (
                  <tr key={r.id || i} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                    <td className="px-3 py-3 font-semibold text-gray-800 whitespace-nowrap">{r.csr_name}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs whitespace-nowrap">{r.team}</td>
                    <td className="px-3 py-3 text-gray-600">{r.month || "—"}</td>
                    <td className="px-3 py-3">{r.total_due}</td>
                    <td className="px-3 py-3 text-emerald-700 font-semibold">{r.completed}</td>
                    <td className={`px-3 py-3 font-bold ${(r.missed||0)>5?"text-red-600":(r.missed||0)>0?"text-amber-600":"text-emerald-600"}`}>{r.missed}</td>
                    <td className={`px-3 py-3 font-bold ${r.completion_rate>=95?"text-emerald-600":r.completion_rate>=80?"text-amber-600":"text-red-600"}`}>{r.completion_rate}%</td>
                    <td className="px-3 py-3 text-gray-600">{r.contact_rate}%</td>
                    <td className="px-3 py-3">{r.orders_recovered}</td>
                    <td className="px-3 py-3 font-semibold">₱{(r.revenue_recovered||0).toLocaleString()}</td>
                    <td className="px-3 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${followUpStatusColor(r.status)}`}>{r.status}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROADMAP
// ═══════════════════════════════════════════════════════════════════════════════

function RoadmapCard() {
  const features = [
    { icon:FileSpreadsheet, label:"QA Entry Form",          desc:"Direct QA audit entry inside dashboard" },
    { icon:Calendar,        label:"Daily Entry Form",       desc:"Daily scorecard entry form" },
    { icon:Flag,            label:"Follow-up Entry Form",   desc:"Follow-up tracker entry form" },
    { icon:FileText,        label:"Export PDF Reports",     desc:"One-click PDF export for coaching reports" },
    { icon:FileSpreadsheet, label:"Export Excel Reports",   desc:"Download CSR ranking and KPI summaries" },
    { icon:UserCheck,       label:"Login by TL",            desc:"Secure TL-specific login and access control" },
    { icon:RefreshCw,       label:"Real-time Sync",         desc:"Live data updates without page refresh" },
    { icon:BarChart2,       label:"Weekly Dashboard",       desc:"Individual weekly scorecard per CSR" },
  ];
  return (
    <div className="p-7 space-y-7">
      <div><h2 className="text-xl font-bold text-gray-900">Next Build Roadmap</h2><p className="text-sm text-gray-500 mt-1">Version 3 Planned Features</p></div>
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-7 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Rocket size={20} /></div>
          <div><p className="font-black text-xl">Version 3</p><p className="text-blue-200 text-sm">Full Production Dashboard</p></div>
        </div>
        <p className="text-blue-100 text-sm leading-relaxed">Version 2 is live with real Supabase data. Version 3 will add QA/Daily/Follow-up entry forms, PDF export, TL login, and real-time sync.</p>
      </div>
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
  coaching:   { title:"Coaching Tracker",        subtitle:"Auto-generated from KPI data" },
  comparison: { title:"Quarter Comparison",      subtitle:"All quarters with data" },
  team:       { title:"Team Performance",        subtitle:"Team-level comparison and rankings" },
  qa:         { title:"QA Audit Log",            subtitle:"Minimum 2 QA audits per CSR per week" },
  daily:      { title:"Daily CSR Scorecard",     subtitle:"Daily activity monitoring" },
  followup:   { title:"Follow-up Tracker",       subtitle:"Missed follow-ups = lost revenue" },
  weekly:     { title:"Weekly Scorecard",        subtitle:"Individual CSR weekly scorecard · auto-generated" },
  dataentry:  { title:"Performance Data Entry",  subtitle:"Weekly KPI data input · CSR performance evaluation" },
  roadmap:    { title:"Next Build Roadmap",      subtitle:"Version 3 planned features" },
  profile:    { title:"CSR Profile",             subtitle:"Individual performance details" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [page, setPage] = useState("overview");
  const [selectedCSR, setSelectedCSR] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { status, data, error, retry, loadedAt } = useSupabaseData();

  const handleSelectCSR = (csr) => { setSelectedCSR(csr); setPage("profile"); };
  const handleNav = (id) => { setPage(id); if (id !== "profile") setSelectedCSR(null); };
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    retry();
    setTimeout(() => setIsRefreshing(false), 1500);
  }, [retry]);

  const cfg = PAGE_CONFIG[page] || PAGE_CONFIG.overview;
  const sidebarActive = page === "profile" ? "ranking" : page;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar active={sidebarActive} onNav={handleNav} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={page === "profile" && selectedCSR ? selectedCSR.csr_name : cfg.title}
          subtitle={cfg.subtitle}
          loadedAt={status === "success" ? loadedAt : null}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <div className="flex-1 overflow-y-auto">
          {/* Data Entry — always show, no data needed */}
          {page === "weekly"    && <WeeklyDashboard />}
          {page === "dataentry" && <DataEntryForm />}
          {page === "roadmap"   && <RoadmapCard />}

          {/* Pages that need data */}
          {page !== "dataentry" && page !== "roadmap" && page !== "weekly" && (
            <>
              {status === "loading" && <PageLoadingState pageName={cfg.title} />}
              {status === "error"   && <ErrorState error={error} onRetry={retry} />}
              {status === "success" && (
                <>
                  {page === "overview"   && <ExecutiveOverview   data={data} onSelectCSR={handleSelectCSR} />}
                  {page === "ranking"    && <CSRRanking          data={data} onSelectCSR={handleSelectCSR} />}
                  {page === "profile"    && selectedCSR && <CSRProfile csr={selectedCSR} data={data} onBack={() => handleNav("ranking")} />}
                  {page === "kpi"        && <KPIBreakdown        data={data} />}
                  {page === "coaching"   && <CoachingTracker     data={data} />}
                  {page === "comparison" && <QuarterComparison   data={data} />}
                  {page === "team"       && <TeamPerformance     data={data} />}
                  {page === "qa"         && <QAAuditLog          data={data} />}
                  {page === "daily"      && <DailyScorecard      data={data} />}
                  {page === "followup"   && <FollowUpTracker     data={data} />}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
