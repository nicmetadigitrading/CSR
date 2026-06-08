import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  Layers, Flag, Briefcase, Bell, Info, Package, Rocket,
  WifiOff, ServerCrash, RotateCcw, PlusCircle
} from "lucide-react";

import {
  loadEvaluations,
  computeScores,
  getStatus,
  ratingColor,
  CSR_ROSTER,
  KPI_SECTIONS,
  BEHAVIOURAL_INDICATORS,
  KRA_WEIGHTS,
} from "./PerformanceEvaluation";

import PerformanceEvaluation from "./PerformanceEvaluation";
import './animations.css';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TEAMS = ["Team Keljash","Team Pao","Team Krizia","Team Pikutin","Team Artemis"];
const TL_MAP = {
  "Team Keljash":"TL Keljash","Team Pao":"TL Pao","Team Krizia":"TL Krizia",
  "Team Pikutin":"TL Pikutin","Team Artemis":"TL Artemis"
};
const QUARTERS = {
  Q1:["January","February","March"],
  Q2:["April","May","June"],
  Q3:["July","August","September"],
  Q4:["October","November","December"],
};

// ─── DATA HELPERS ─────────────────────────────────────────────────────────────

// Transform a saved evaluation record into the shape the dashboard expects
function evalToRecord(e) {
  const s = e.scores || {};
  const kpi = s.kpiScores || {};
  return {
    csr_id: e.employeeName,
    csr_name: e.employeeName,
    team: e.team,
    month: e.month,
    quarter: e.quarter,
    year: e.year,
    total_rate: s.finalScore,
    kra_scale: s.kraTotal,
    behavioral_scale: s.biScore,
    // Section scores (1–5 scale)
    business_process_score: s.sectionScores?.["BUSINESS PROCESS"],
    customer_score: s.sectionScores?.["CUSTOMER"],
    people_development_score: s.sectionScores?.["PEOPLE DEVELOPMENT"],
    financial_score: s.sectionScores?.["FINANCIALS"],
    // KPI scores (converted to %, 20–100)
    conversion_score: kpi.conversionKPI,
    rmo_score: kpi.rmoKPI,
    rts_score: kpi.rtsKPI,
    delivery_success_score: kpi.deliveryKPI,
    upsell_score: kpi.upsellKPI,
    attendance_score: kpi.attendanceKPI,
    esc_score: kpi.escKPI,
    submittedAt: e.submittedAt,
    id: e.id,
  };
}

function useEvaluations() {
  const [evals, setEvals] = useState(() => loadEvaluations().map(evalToRecord));
  useEffect(() => {
    const onStorage = () => setEvals(loadEvaluations().map(evalToRecord));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return [evals, () => setEvals(loadEvaluations().map(evalToRecord))];
}

const avg = (arr, key) => {
  const valid = arr.map(r => r[key]).filter(v => v !== null && v !== undefined && !isNaN(v));
  return valid.length ? +(valid.reduce((s, v) => s + v, 0) / valid.length).toFixed(2) : null;
};

function getAggregated(data) {
  const byCSR = {};
  data.forEach(r => {
    if (!byCSR[r.csr_id]) {
      byCSR[r.csr_id] = { ...r, count: 1 };
    } else {
      const keys = ["total_rate","kra_scale","behavioral_scale","conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score","attendance_score","esc_score","business_process_score","customer_score","people_development_score","financial_score"];
      keys.forEach(k => {
        if (r[k] !== null && r[k] !== undefined) {
          byCSR[r.csr_id][k] = (byCSR[r.csr_id][k] || 0) + r[k];
        }
      });
      byCSR[r.csr_id].count++;
    }
  });
  return Object.values(byCSR).map(c => {
    const n = c.count;
    const keys = ["total_rate","kra_scale","behavioral_scale","conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score","attendance_score","esc_score","business_process_score","customer_score","people_development_score","financial_score"];
    const out = { ...c };
    keys.forEach(k => { if (out[k] !== null && out[k] !== undefined) out[k] = +(out[k] / n).toFixed(2); });
    return out;
  }).sort((a, b) => (b.total_rate || 0) - (a.total_rate || 0));
}

function getCoachingIssues(r) {
  const issues = [];
  if (r.total_rate < 3.50) issues.push({ kpi: "Total Rate", score: r.total_rate, rec: "Structured coaching plan required" });
  if (r.kra_scale < 3.50) issues.push({ kpi: "KRA Scale", score: r.kra_scale, rec: "KRA improvement coaching" });
  if (r.behavioral_scale < 3.50) issues.push({ kpi: "Behavioral Scale", score: r.behavioral_scale, rec: "Attitude/compliance coaching" });
  if (r.conversion_score !== null && r.conversion_score < 80) issues.push({ kpi: "Conversion", score: r.conversion_score, rec: "Conversion script coaching" });
  if (r.rmo_score !== null && r.rmo_score < 80) issues.push({ kpi: "RMO", score: r.rmo_score, rec: "Follow-up discipline coaching" });
  if (r.rts_score !== null && r.rts_score < 80) issues.push({ kpi: "RTS", score: r.rts_score, rec: "Order verification coaching" });
  if (r.delivery_success_score !== null && r.delivery_success_score < 80) issues.push({ kpi: "Delivery Success", score: r.delivery_success_score, rec: "Address validation coaching" });
  if (r.upsell_score !== null && r.upsell_score < 80) issues.push({ kpi: "Upsell", score: r.upsell_score, rec: "Upsell technique coaching" });
  return issues;
}

// ─── SKELETON / LOADING ───────────────────────────────────────────────────────
function SkeletonBox({ w = "100%", h = 16, r = 6, mb = 0 }) {
  return <div className="shimmer" style={{ width: w, height: h, borderRadius: r, marginBottom: mb, flexShrink: 0 }} />;
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function NoDataState({ onNav }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-8">
      <div className="w-20 h-20 rounded-3xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center mb-6">
        <ClipboardList size={32} className="text-blue-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">No evaluations submitted yet</h3>
      <p className="text-gray-500 text-sm max-w-md mb-6">
        This dashboard is powered entirely by data from the Performance Evaluation form.
        Submit at least one evaluation to populate the charts, rankings, and KPI reports.
      </p>
      <button
        onClick={() => onNav("eval")}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
      >
        <PlusCircle size={16} />
        Go to Performance Evaluation
      </button>
    </div>
  );
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Excellent: "bg-emerald-100 text-emerald-800",
    Good: "bg-blue-100 text-blue-800",
    "Needs Monitoring": "bg-amber-100 text-amber-800",
    "For Coaching": "bg-orange-100 text-orange-800",
    Critical: "bg-red-100 text-red-800",
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${map[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

function MetricCard({ label, value, sub, icon: Icon, color = "blue", onClick, alert: isAlert }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600", emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600", red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600", orange: "bg-orange-50 text-orange-600",
    slate: "bg-slate-50 text-slate-600", teal: "bg-teal-50 text-teal-600",
  };
  return (
    <div onClick={onClick} className={`bg-white rounded-xl border ${isAlert ? "border-red-300" : "border-gray-100"} p-5 ${onClick ? "cursor-pointer hover:border-blue-300 hover:shadow-md transition-all" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
        {Icon && <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}><Icon size={15} /></div>}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, sub, exports = [] }) {
  return (
    <div className="flex items-start justify-between">
      <div><h2 className="text-lg font-bold text-gray-900">{title}</h2>{sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}</div>
      {exports.length > 0 && (
        <div className="flex gap-2">
          {exports.map((e, i) => (
            <button key={i} onClick={() => alert("Export coming in Version 2.")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              {e.icon && <e.icon size={13} />}{e.label}
            </button>
          ))}
        </div>
      )}
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

function RefreshBar({ count, onRefresh }) {
  return (
    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2">
      <div className="flex items-center gap-2 text-xs text-emerald-700">
        <CheckCircle size={13} className="text-emerald-500" />
        <span>{count} evaluation{count !== 1 ? "s" : ""} loaded from localStorage</span>
      </div>
      <button onClick={onRefresh} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">
        <RefreshCw size={11} />Refresh
      </button>
    </div>
  );
}

// ─── SIDEBAR & HEADER ─────────────────────────────────────────────────────────
const NAV = [
  { id: "overview",  label: "Executive Overview",    icon: Home },
  { id: "ranking",   label: "CSR Ranking",           icon: BarChart2 },
  { id: "kpi",       label: "KPI Breakdown",         icon: Target },
  { id: "coaching",  label: "Coaching Tracker",      icon: BookOpen },
  { id: "comparison",label: "Quarter Comparison",    icon: GitCompare },
  { id: "team",      label: "Team Performance",      icon: Layers },
  { id: "weekly",    label: "Weekly Dashboard",      icon: Star },
  { id: "eval",      label: "Performance Evaluation",icon: ClipboardList },
  { id: "roadmap",   label: "Next Build Roadmap",    icon: Rocket },
];

function Sidebar({ active, onNav, evalCount }) {
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
            <Icon size={15} className="flex-shrink-0" />
            <span className="truncate">{label}</span>
            {id === "eval" && evalCount > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{evalCount}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-blue-400 text-xs">Version 1.0 · Live Data Mode</p>
        <p className="text-blue-500 text-xs mt-0.5">Powered by localStorage</p>
      </div>
    </div>
  );
}

function Header({ title, subtitle }) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-3.5 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs text-gray-400">Data Source</p>
          <p className="text-sm font-semibold text-gray-700">localStorage · Live</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold">TL</div>
      </div>
    </div>
  );
}

// ─── EXECUTIVE OVERVIEW ───────────────────────────────────────────────────────
function ExecutiveOverview({ evals, onRefresh, onSelectCSR, onNav }) {
  if (evals.length === 0) return <NoDataState onNav={onNav} />;

  const agg = getAggregated(evals);
  const coaching = agg.filter(r => (r.total_rate || 0) < 3.50);
  const teamAvgRate = avg(agg, "total_rate");
  const kraAvg = avg(agg, "kra_scale");
  const behAvg = avg(agg, "behavioral_scale");

  const months = [...new Set(evals.map(r => r.month))];
  const monthlyTrend = months.map(m => {
    const rows = evals.filter(r => r.month === m);
    return { month: m.slice(0, 3), avg: avg(rows, "total_rate"), kra: avg(rows, "kra_scale") };
  });

  const kpiHealth = [
    { name: "Conversion", val: avg(evals, "conversion_score"), target: 80 },
    { name: "RMO", val: avg(evals, "rmo_score"), target: 80 },
    { name: "RTS", val: avg(evals, "rts_score"), target: 80 },
    { name: "Delivery", val: avg(evals, "delivery_success_score"), target: 80 },
    { name: "Upsell", val: avg(evals, "upsell_score"), target: 80 },
    { name: "ESC", val: avg(evals, "esc_score"), target: 80 },
  ].filter(k => k.val !== null);

  const top5 = agg.slice(0, 5);
  const bot5 = agg.slice(-5).reverse();

  return (
    <div className="p-7 space-y-7">
      <RefreshBar count={evals.length} onRefresh={onRefresh} />
      <SectionHeader title="Executive Overview" sub="All submitted evaluations · Live data"
        exports={[{ label: "Export PDF", icon: FileText }]} />

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total CSRs Evaluated" value={agg.length} sub="Unique CSRs with data" icon={Users} color="blue" />
        <MetricCard label="Team Avg Final Score" value={teamAvgRate?.toFixed(2) ?? "—"} sub="Scale 1.00–5.00" icon={TrendingUp} color="emerald" />
        <MetricCard label="Avg KRA Scale" value={kraAvg?.toFixed(2) ?? "—"} sub={`Behavioral: ${behAvg?.toFixed(2) ?? "—"}`} icon={Target} color="purple" />
        <MetricCard label="CSRs Needing Coaching" value={coaching.length} sub="Below 3.50 threshold" icon={AlertTriangle} color="orange" alert={coaching.length > 3} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4"><Award size={15} className="text-emerald-500" /><h3 className="font-bold text-gray-800 text-sm">Top 5 Performers</h3></div>
          {top5.map((c, i) => (
            <div key={c.csr_id} onClick={() => onSelectCSR(c)} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer mb-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-orange-300 text-white" : "bg-gray-100 text-gray-600"}`}>{i + 1}</span>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{c.csr_name}</p><p className="text-xs text-gray-500">{c.team}</p></div>
              <div className="text-right flex-shrink-0"><p className="text-sm font-bold">{c.total_rate?.toFixed(2)}</p><StatusBadge status={getStatus(c.total_rate)} /></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4"><TrendingDown size={15} className="text-red-500" /><h3 className="font-bold text-gray-800 text-sm">Needs Attention</h3></div>
          {bot5.map((c, i) => (
            <div key={c.csr_id} onClick={() => onSelectCSR(c)} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer mb-1.5">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{agg.length - i}</span>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{c.csr_name}</p><p className="text-xs text-gray-500">{c.team}</p></div>
              <div className="text-right flex-shrink-0"><p className="text-sm font-bold">{c.total_rate?.toFixed(2)}</p><StatusBadge status={getStatus(c.total_rate)} /></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4"><BookOpen size={15} className="text-orange-500" /><h3 className="font-bold text-gray-800 text-sm">Coaching Priority</h3></div>
          {coaching.length === 0
            ? <p className="text-sm text-gray-400">No CSRs below 3.50 threshold.</p>
            : coaching.map(c => (
              <div key={c.csr_id} onClick={() => onSelectCSR(c)} className="p-2.5 rounded-lg border border-orange-100 bg-orange-50 hover:bg-orange-100 cursor-pointer mb-2">
                <div className="flex items-center justify-between mb-1"><p className="text-sm font-semibold text-gray-800 truncate pr-2">{c.csr_name}</p><StatusBadge status={getStatus(c.total_rate)} /></div>
                <p className="text-xs text-gray-600">{c.team} · {c.total_rate?.toFixed(2)}</p>
              </div>
            ))
          }
        </div>
      </div>

      {monthlyTrend.length > 1 && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-4">Performance Trend by Month</h3>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={v => v?.toFixed(2)} />
                <Legend />
                <Line type="monotone" dataKey="avg" name="Total Rate" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="kra" name="KRA Scale" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-4">KPI Health Summary</h3>
            {kpiHealth.map(k => (
              <div key={k.name} className="flex items-center gap-3 mb-3">
                <span className="text-xs text-gray-600 w-20 font-medium">{k.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${k.val >= 80 ? "bg-emerald-500" : k.val >= 70 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${Math.min(k.val, 100)}%` }} />
                </div>
                <span className={`text-xs font-bold w-14 text-right ${k.val >= 80 ? "text-emerald-600" : k.val >= 70 ? "text-amber-600" : "text-red-600"}`}>{k.val?.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CSR RANKING ──────────────────────────────────────────────────────────────
function CSRRanking({ evals, onRefresh, onSelectCSR, onNav }) {
  const [f, setF] = useState({ quarter: "All", month: "All", team: "All", status: "All", search: "" });

  const filtered = useMemo(() => {
    let d = evals;
    if (f.quarter !== "All") d = d.filter(r => r.quarter === f.quarter);
    if (f.month !== "All") d = d.filter(r => r.month === f.month);
    if (f.team !== "All") d = d.filter(r => r.team === f.team);
    let agg = getAggregated(d);
    if (f.status !== "All") agg = agg.filter(r => getStatus(r.total_rate) === f.status);
    if (f.search) agg = agg.filter(r => r.csr_name?.toLowerCase().includes(f.search.toLowerCase()));
    return agg;
  }, [f, evals]);

  const quarters = [...new Set(evals.map(r => r.quarter))];
  const months = [...new Set(evals.map(r => r.month))];

  if (evals.length === 0) return <NoDataState onNav={onNav} />;

  return (
    <div className="p-7 space-y-6">
      <RefreshBar count={evals.length} onRefresh={onRefresh} />
      <SectionHeader title="CSR Ranking" sub="Ranked by Final Score · 1.00–5.00 scale"
        exports={[{ label: "Export Excel", icon: FileSpreadsheet }]} />

      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-gray-400" />
        <FilterSelect value={f.quarter} onChange={v => setF(p => ({ ...p, quarter: v }))} label="Quarters" options={quarters} />
        <FilterSelect value={f.month} onChange={v => setF(p => ({ ...p, month: v }))} label="Months" options={months} />
        <FilterSelect value={f.team} onChange={v => setF(p => ({ ...p, team: v }))} label="Teams" options={TEAMS} />
        <FilterSelect value={f.status} onChange={v => setF(p => ({ ...p, status: v }))} label="Statuses" options={["Excellent","Good","Needs Monitoring","For Coaching","Critical"]} />
        <div className="relative flex-1 min-w-44">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={f.search} onChange={e => setF(p => ({ ...p, search: e.target.value }))} placeholder="Search CSR name..."
            className="w-full text-sm border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-400" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0d1b36] text-white text-xs">
                {["#","CSR Name","Team","Final Score","KRA Scale","Behavioral","Conv%","RMO%","RTS%","Delivery%","Upsell%","Status",""].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={13} className="text-center py-12 text-gray-400">No CSRs match filters.</td></tr>
                : filtered.map((c, i) => (
                  <tr key={c.csr_id} className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                    <td className="px-3 py-2.5 font-bold text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-3 py-2.5"><button onClick={() => onSelectCSR(c)} className="text-blue-700 font-semibold hover:underline text-left whitespace-nowrap">{c.csr_name}</button></td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap text-xs">{c.team}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-900">{c.total_rate?.toFixed(2) ?? "—"}</td>
                    <td className="px-3 py-2.5 text-gray-700">{c.kra_scale?.toFixed(2) ?? "—"}</td>
                    <td className="px-3 py-2.5 text-gray-700">{c.behavioral_scale?.toFixed(2) ?? "—"}</td>
                    {["conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score"].map(k => (
                      <td key={k} className={`px-3 py-2.5 font-semibold ${c[k] !== null && c[k] < 80 ? "text-red-600" : "text-gray-700"}`}>{c[k] !== null && c[k] !== undefined ? `${c[k]}%` : "—"}</td>
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

// ─── CSR PROFILE ──────────────────────────────────────────────────────────────
function CSRProfile({ csr, evals, onBack }) {
  const csrEvals = evals.filter(r => r.csr_id === csr.csr_id);
  const allAgg = getAggregated(evals);
  const rank = allAgg.findIndex(r => r.csr_id === csr.csr_id) + 1;

  const months = [...new Set(csrEvals.map(r => r.month))];
  const trendData = months.map(m => {
    const rows = csrEvals.filter(r => r.month === m);
    return {
      month: m.slice(0, 3),
      rate: avg(rows, "total_rate"),
      kra: avg(rows, "kra_scale"),
      beh: avg(rows, "behavioral_scale"),
    };
  });

  const issues = getCoachingIssues(csr);
  const status = getStatus(csr.total_rate);

  const kpiData = [
    { subject: "Conv", value: csr.conversion_score, fullMark: 100 },
    { subject: "RMO", value: csr.rmo_score, fullMark: 100 },
    { subject: "RTS", value: csr.rts_score, fullMark: 100 },
    { subject: "Deliv", value: csr.delivery_success_score, fullMark: 100 },
    { subject: "Upsell", value: csr.upsell_score, fullMark: 100 },
    { subject: "ESC", value: csr.esc_score, fullMark: 100 },
    { subject: "Attend", value: csr.attendance_score, fullMark: 100 },
  ].filter(k => k.value !== null && k.value !== undefined);

  return (
    <div className="p-7 space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-semibold"><ChevronRight size={15} className="rotate-180" />Back to Ranking</button>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {(csr.csr_name || "").split(" ").map(n => n[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap"><h2 className="text-xl font-bold text-gray-900">{csr.csr_name}</h2><StatusBadge status={status} /></div>
            <p className="text-gray-500 text-sm mt-1">{csr.team} · Rank #{rank} of {allAgg.length} · {csrEvals.length} evaluation{csrEvals.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-black text-gray-900">{csr.total_rate?.toFixed(2) ?? "—"}</p>
            <p className="text-xs text-gray-500">Final Score (avg)</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">KRA Scale</p><p className="text-2xl font-bold text-gray-900">{csr.kra_scale?.toFixed(2) ?? "—"}</p></div>
          <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Behavioral Scale</p><p className="text-2xl font-bold text-gray-900">{csr.behavioral_scale?.toFixed(2) ?? "—"}</p></div>
          <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Status</p><div className="mt-1"><StatusBadge status={status} /></div></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {trendData.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-4">Score Trend</h3>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => v?.toFixed(2)} />
                <Legend />
                <Line type="monotone" dataKey="rate" name="Final Score" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="kra" name="KRA" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="beh" name="Behavioral" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {kpiData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-4">KPI Radar</h3>
            <ResponsiveContainer width="100%" height={190}>
              <RadarChart data={kpiData}>
                <PolarGrid /><PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
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
    </div>
  );
}

// ─── KPI BREAKDOWN ────────────────────────────────────────────────────────────
function KPIBreakdown({ evals, onRefresh, onNav }) {
  const [f, setF] = useState({ quarter: "All", month: "All", team: "All" });

  const filtered = useMemo(() => {
    let d = evals;
    if (f.quarter !== "All") d = d.filter(r => r.quarter === f.quarter);
    if (f.month !== "All") d = d.filter(r => r.month === f.month);
    if (f.team !== "All") d = d.filter(r => r.team === f.team);
    return d;
  }, [f, evals]);

  if (evals.length === 0) return <NoDataState onNav={onNav} />;

  const quarters = [...new Set(evals.map(r => r.quarter))];
  const months = [...new Set(evals.map(r => r.month))];

  const cats = [
    { name: "Conversion", key: "conversion_score", target: 80 },
    { name: "RMO", key: "rmo_score", target: 80 },
    { name: "RTS", key: "rts_score", target: 80 },
    { name: "Delivery", key: "delivery_success_score", target: 80 },
    { name: "Upsell", key: "upsell_score", target: 80 },
    { name: "ESC", key: "esc_score", target: 80 },
    { name: "Attendance", key: "attendance_score", target: 90 },
  ].filter(c => avg(filtered, c.key) !== null);

  const chartData = cats.map(c => ({ name: c.name, avg: avg(filtered, c.key), target: c.target }));

  return (
    <div className="p-7 space-y-6">
      <RefreshBar count={evals.length} onRefresh={onRefresh} />
      <SectionHeader title="KPI Breakdown" sub="Category-level performance · scores are 20–100%" />

      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-gray-400" />
        <FilterSelect value={f.quarter} onChange={v => setF(p => ({ ...p, quarter: v }))} label="Quarters" options={quarters} />
        <FilterSelect value={f.month} onChange={v => setF(p => ({ ...p, month: v }))} label="Months" options={months} />
        <FilterSelect value={f.team} onChange={v => setF(p => ({ ...p, team: v }))} label="Teams" options={TEAMS} />
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">KPI Average vs Target</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => `${v}%`} />
              <Legend />
              <Bar dataKey="avg" name="Team Avg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Target" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-[#0d1b36] text-white text-xs">
            {["KPI","Target","Team Avg","Below Target","Health","Progress"].map(h => <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>)}
          </tr></thead>
          <tbody>
            {cats.map((c, i) => {
              const a = avg(filtered, c.key);
              if (a === null) return null;
              const below = [...new Set(filtered.filter(r => r[c.key] !== null && r[c.key] < c.target).map(r => r.csr_id))].length;
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

// ─── COACHING TRACKER ─────────────────────────────────────────────────────────
const COACHING_STATUS_OPTIONS = ["Pending","Ongoing","Done","Improved","No Improvement","Escalated"];

function CoachingTracker({ evals, onRefresh, onNav }) {
  const agg = getAggregated(evals);
  const [statuses, setStatuses] = useState({});
  const [notes, setNotes] = useState({});
  const [f, setF] = useState({ priority: "All", team: "All" });

  if (evals.length === 0) return <NoDataState onNav={onNav} />;

  const coachingList = useMemo(() => {
    return agg
      .map(csr => { const issues = getCoachingIssues(csr); return { csr, issues }; })
      .filter(({ issues }) => issues.length > 0)
      .map(({ csr, issues }) => {
        const priority = csr.total_rate < 3.00 ? "Critical" : csr.total_rate < 3.50 ? "High" : "Medium";
        return { csr, issues, priority };
      })
      .sort((a, b) => ({ Critical: 0, High: 1, Medium: 2 }[a.priority] - { Critical: 0, High: 1, Medium: 2 }[b.priority]));
  }, [agg]);

  const filtered = coachingList.filter(({ csr, priority }) => {
    if (f.priority !== "All" && priority !== f.priority) return false;
    if (f.team !== "All" && csr.team !== f.team) return false;
    return true;
  });

  const pColor = { Critical: "bg-red-100 text-red-800 border-red-300", High: "bg-orange-100 text-orange-800 border-orange-300", Medium: "bg-amber-100 text-amber-800 border-amber-300" };
  const today = new Date(); today.setDate(today.getDate() + 14);
  const fuDate = today.toISOString().split("T")[0];

  return (
    <div className="p-7 space-y-6">
      <RefreshBar count={evals.length} onRefresh={onRefresh} />
      <SectionHeader title="Coaching Tracker" sub="Auto-generated from submitted evaluation data" />

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Needing Coaching" value={coachingList.length} icon={BookOpen} color="orange" />
        <MetricCard label="Critical" value={coachingList.filter(c => c.priority === "Critical").length} icon={AlertTriangle} color="red" />
        <MetricCard label="High Priority" value={coachingList.filter(c => c.priority === "High").length} icon={TrendingDown} color="orange" />
        <MetricCard label="Medium Priority" value={coachingList.filter(c => c.priority === "Medium").length} icon={Minus} color="amber" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-gray-400" />
        <FilterSelect value={f.priority} onChange={v => setF(p => ({ ...p, priority: v }))} label="Priority" options={["Critical","High","Medium"]} />
        <FilterSelect value={f.team} onChange={v => setF(p => ({ ...p, team: v }))} label="Teams" options={TEAMS} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-[#0d1b36] text-white">
              {["Priority","CSR Name","Team","KPI Issue","Score","Recommendation","Coach Owner","Follow-up","Notes","Status"].map(h => (
                <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={10} className="text-center py-12 text-gray-400">No coaching records for current filters.</td></tr>
                : filtered.map(({ csr, issues, priority }, idx) =>
                  issues.map((issue, ii) => (
                    <tr key={`${csr.csr_id}-${ii}`} className={`border-b border-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}>
                      {ii === 0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top"><span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${pColor[priority]}`}>{priority}</span></td>}
                      {ii === 0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top font-semibold text-gray-800 whitespace-nowrap">{csr.csr_name}</td>}
                      {ii === 0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top text-gray-600 whitespace-nowrap">{csr.team}</td>}
                      <td className="px-3 py-2.5 font-semibold text-gray-700">{issue.kpi}</td>
                      <td className={`px-3 py-2.5 font-bold ${priority === "Critical" ? "text-red-600" : "text-orange-600"}`}>{issue.score}</td>
                      <td className="px-3 py-2.5 text-gray-600 max-w-36">{issue.rec}</td>
                      {ii === 0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top whitespace-nowrap text-gray-600">{TL_MAP[csr.team]}</td>}
                      {ii === 0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top text-gray-400 whitespace-nowrap">{fuDate}</td>}
                      {ii === 0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top">
                        <input placeholder="Add note..." value={notes[csr.csr_id] || ""} onChange={e => setNotes(p => ({ ...p, [csr.csr_id]: e.target.value }))}
                          className="text-xs border border-gray-200 rounded px-2 py-1 w-28 focus:outline-none focus:border-blue-400" />
                      </td>}
                      {ii === 0 && <td rowSpan={issues.length} className="px-3 py-2.5 align-top">
                        <select value={statuses[csr.csr_id] || "Pending"} onChange={e => setStatuses(p => ({ ...p, [csr.csr_id]: e.target.value }))}
                          className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white focus:outline-none">
                          {COACHING_STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>}
                    </tr>
                  ))
                )
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── QUARTER COMPARISON ───────────────────────────────────────────────────────
function QuarterComparison({ evals, onRefresh, onNav }) {
  if (evals.length === 0) return <NoDataState onNav={onNav} />;

  const quarters = [...new Set(evals.map(r => r.quarter))];
  const qData = quarters.map(q => {
    const rows = evals.filter(r => r.quarter === q);
    const agg = getAggregated(rows);
    return { quarter: q, count: agg.length, avgRate: avg(agg, "total_rate"), avgKRA: avg(agg, "kra_scale") };
  });

  const allAgg = getAggregated(evals);

  return (
    <div className="p-7 space-y-6">
      <RefreshBar count={evals.length} onRefresh={onRefresh} />
      <SectionHeader title="Quarter Comparison" sub="Comparison across submitted evaluation periods" />

      <div className="grid grid-cols-4 gap-4">
        {qData.map(q => (
          <div key={q.quarter} className="bg-white rounded-xl border border-blue-200 p-5 border-t-4 border-t-blue-500">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">{q.quarter}</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{q.avgRate?.toFixed(2) ?? "—"}</p>
            <p className="text-xs text-gray-500 mt-1">{q.count} CSRs · Avg KRA {q.avgKRA?.toFixed(2) ?? "—"}</p>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 4 - qData.length) }).map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-5 border-t-4 border-t-gray-200">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">No data yet</p>
            <p className="text-xs text-gray-400 mt-2">Submit evaluations to populate</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-[#0d1b36] text-white text-xs">
            {["CSR Name","Team","Final Score","KRA Scale","Behavioral","Quarter","Month","Status"].map(h => (
              <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {allAgg.map((c, i) => (
              <tr key={c.csr_id} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                <td className="px-4 py-2.5 font-semibold text-gray-800">{c.csr_name}</td>
                <td className="px-4 py-2.5 text-gray-600 text-xs">{c.team}</td>
                <td className="px-4 py-2.5 font-bold text-blue-700">{c.total_rate?.toFixed(2) ?? "—"}</td>
                <td className="px-4 py-2.5 text-gray-700">{c.kra_scale?.toFixed(2) ?? "—"}</td>
                <td className="px-4 py-2.5 text-gray-700">{c.behavioral_scale?.toFixed(2) ?? "—"}</td>
                <td className="px-4 py-2.5 text-gray-600">{c.quarter}</td>
                <td className="px-4 py-2.5 text-gray-600">{c.month}</td>
                <td className="px-4 py-2.5"><StatusBadge status={getStatus(c.total_rate)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TEAM PERFORMANCE ─────────────────────────────────────────────────────────
function TeamPerformance({ evals, onRefresh, onNav }) {
  if (evals.length === 0) return <NoDataState onNav={onNav} />;

  const agg = getAggregated(evals);
  const teamStats = TEAMS.map(team => {
    const members = agg.filter(c => c.team === team);
    const sorted = [...members].sort((a, b) => (b.total_rate || 0) - (a.total_rate || 0));
    return {
      team, members: members.length,
      avgRate: avg(members, "total_rate"),
      avgKRA: avg(members, "kra_scale"),
      avgBeh: avg(members, "behavioral_scale"),
      avgConv: avg(members, "conversion_score"),
      coaching: members.filter(c => getCoachingIssues(c).length > 0).length,
      top: sorted[0]?.csr_name?.split(" ")[0] || "—",
      lowest: sorted[sorted.length - 1]?.csr_name?.split(" ")[0] || "—",
    };
  }).filter(t => t.members > 0);

  const barData = teamStats.map(t => ({ name: t.team.replace("Team ", ""), rate: t.avgRate }));

  return (
    <div className="p-7 space-y-6">
      <RefreshBar count={evals.length} onRefresh={onRefresh} />
      <SectionHeader title="Team Performance" sub="Team-level comparison from submitted evaluations" />

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-4">Team Average Final Score</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => v?.toFixed(2)} />
            <Bar dataKey="rate" name="Avg Score" radius={[4, 4, 0, 0]}>
              {barData.map((e, i) => <Cell key={i} fill={e.rate >= 4.50 ? "#10b981" : e.rate >= 4.00 ? "#3b82f6" : e.rate >= 3.50 ? "#f59e0b" : "#ef4444"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-[#0d1b36] text-white text-xs">
            {["Team","CSRs","Avg Score","KRA","Behavioral","Conv%","Coaching","Top","Lowest","Status"].map(h => (
              <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {teamStats.map((t, i) => (
              <tr key={t.team} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                <td className="px-3 py-3 font-bold text-gray-800">{t.team}</td>
                <td className="px-3 py-3 text-gray-600">{t.members}</td>
                <td className={`px-3 py-3 font-bold ${t.avgRate >= 4.50 ? "text-emerald-700" : t.avgRate >= 4.00 ? "text-blue-700" : t.avgRate >= 3.50 ? "text-amber-700" : "text-red-700"}`}>{t.avgRate?.toFixed(2) ?? "—"}</td>
                <td className="px-3 py-3 text-gray-700">{t.avgKRA?.toFixed(2) ?? "—"}</td>
                <td className="px-3 py-3 text-gray-700">{t.avgBeh?.toFixed(2) ?? "—"}</td>
                <td className={`px-3 py-3 font-semibold ${t.avgConv !== null && t.avgConv < 80 ? "text-red-600" : "text-gray-700"}`}>{t.avgConv !== null ? `${t.avgConv?.toFixed(1)}%` : "—"}</td>
                <td className="px-3 py-3">{t.coaching > 0 ? <span className="text-orange-600 font-bold">{t.coaching}</span> : <span className="text-emerald-600 font-semibold">0</span>}</td>
                <td className="px-3 py-3 text-emerald-700 font-semibold text-xs">{t.top}</td>
                <td className="px-3 py-3 text-red-600 font-semibold text-xs">{t.lowest}</td>
                <td className="px-3 py-3"><StatusBadge status={getStatus(t.avgRate)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── WEEKLY DASHBOARD ─────────────────────────────────────────────────────────
function WeeklyDashboard({ evals, onRefresh, onNav }) {
  const [selectedName, setSelectedName] = useState("");

  if (evals.length === 0) return <NoDataState onNav={onNav} />;

  const csrNames = [...new Set(evals.map(r => r.csr_name))].sort();
  const name = selectedName || csrNames[0];
  const csrEvals = evals.filter(r => r.csr_name === name).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  const latest = csrEvals[0];

  if (!latest) return <NoDataState onNav={onNav} />;

  const agg = getAggregated(evals);
  const rank = agg.findIndex(r => r.csr_name === name) + 1;
  const issues = getCoachingIssues(latest);

  const kpiItems = [
    { label: "Conversion / ROAS", val: latest.conversion_score },
    { label: "RMO Rate", val: latest.rmo_score },
    { label: "RTS Compliance", val: latest.rts_score },
    { label: "Delivery Success", val: latest.delivery_success_score },
    { label: "Upsell Rate", val: latest.upsell_score },
    { label: "Attendance KPI", val: latest.attendance_score },
    { label: "ESC Points", val: latest.esc_score },
  ].filter(k => k.val !== null && k.val !== undefined);

  const sectionItems = [
    { label: "Business Process", val: latest.business_process_score },
    { label: "Customer", val: latest.customer_score },
    { label: "People Development", val: latest.people_development_score },
    { label: "Financial", val: latest.financial_score },
  ].filter(k => k.val !== null && k.val !== undefined);

  const status = getStatus(latest.total_rate);
  const statusAccent = { Excellent: "from-emerald-600 to-emerald-900", Good: "from-blue-600 to-blue-900", "Needs Monitoring": "from-amber-500 to-amber-800", "For Coaching": "from-orange-500 to-orange-800", Critical: "from-red-600 to-red-900" }[status] || "from-blue-600 to-blue-900";

  return (
    <div className="p-7 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Weekly CSR Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Individual scorecard from latest submitted evaluation</p>
        </div>
        <RefreshBar count={evals.length} onRefresh={onRefresh} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
        <Filter size={13} className="text-gray-400" />
        <select value={name} onChange={e => setSelectedName(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-400 min-w-60">
          {csrNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="text-xs text-gray-400">{csrEvals.length} evaluation{csrEvals.length !== 1 ? "s" : ""} found · showing latest</span>
      </div>

      {/* Header card */}
      <div className={`bg-gradient-to-r ${statusAccent} rounded-2xl p-7 text-white shadow-lg`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
              {name.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">{latest.team} · {TL_MAP[latest.team]}</p>
              <h1 className="text-2xl font-black text-white mt-0.5">{name.toUpperCase()}</h1>
              <p className="text-white/80 text-sm mt-1">{latest.month} {latest.year} · {latest.quarter} · Rank #{rank}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-white">{latest.total_rate?.toFixed(2) ?? "—"}</p>
            <p className="text-white/60 text-sm">Final Score</p>
            <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm font-bold">{status}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/20">
          {[["KRA Scale", latest.kra_scale?.toFixed(2)], ["Behavioral", latest.behavioral_scale?.toFixed(2)], ["Submitted", new Date(latest.submittedAt).toLocaleDateString()]].map(([label, val]) => (
            <div key={label} className="text-center">
              <p className="text-white/60 text-xs font-semibold uppercase">{label}</p>
              <p className="text-xl font-black text-white mt-0.5">{val ?? "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KRA Section scores */}
      {sectionItems.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {sectionItems.map(s => (
            <div key={s.label} style={{ borderTop: `3px solid ${ratingColor(s.val)}` }}
              className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500 font-semibold">{s.label}</p>
              <p className="text-2xl font-black mt-1" style={{ color: ratingColor(s.val) }}>{s.val?.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">{getStatus(s.val)}</p>
            </div>
          ))}
        </div>
      )}

      {/* KPI scores */}
      {kpiItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">KPI Scores</h3>
          <div className="space-y-3">
            {kpiItems.map(k => {
              const st = k.val >= 80 ? "Excellent" : k.val >= 70 ? "Good" : k.val >= 60 ? "Needs Monitoring" : "For Coaching";
              return (
                <div key={k.label} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-700 w-40">{k.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${k.val >= 80 ? "bg-emerald-500" : k.val >= 70 ? "bg-blue-500" : k.val >= 60 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${Math.min(k.val, 100)}%` }} />
                  </div>
                  <span className={`text-sm font-bold w-12 text-right ${k.val >= 80 ? "text-emerald-600" : k.val >= 70 ? "text-blue-600" : k.val >= 60 ? "text-amber-600" : "text-red-600"}`}>{k.val}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Coaching */}
      {issues.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 p-5">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle size={14} className="text-orange-500" /><h3 className="font-bold text-gray-800 text-sm">Coaching Flags</h3></div>
          {issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg mb-2">
              <span className="w-5 h-5 rounded-full bg-orange-400 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
              <div><p className="text-sm font-semibold text-gray-800">{issue.kpi}</p><p className="text-xs text-orange-700">{issue.rec}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* Eval history */}
      {csrEvals.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Evaluation History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-50 text-gray-500">
                {["Date","Month","Quarter","Final Score","KRA","Behavioral","Status"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {csrEvals.map(e => (
                  <tr key={e.id} className="border-b border-gray-50">
                    <td className="px-3 py-2 text-gray-500">{new Date(e.submittedAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{e.month}</td>
                    <td className="px-3 py-2">{e.quarter}</td>
                    <td className="px-3 py-2 font-bold" style={{ color: ratingColor(e.total_rate) }}>{e.total_rate?.toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-600">{e.kra_scale?.toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-600">{e.behavioral_scale?.toFixed(2)}</td>
                    <td className="px-3 py-2"><StatusBadge status={getStatus(e.total_rate)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROADMAP ──────────────────────────────────────────────────────────────────
function Roadmap() {
  const features = [
    { icon: FileSpreadsheet, label: "Excel Upload", desc: "Upload KPI BASIS sheet and auto-parse data" },
    { icon: BarChart2, label: "Real-time Sync", desc: "Connect to Supabase/PostgreSQL for live multi-user data" },
    { icon: FileText, label: "Export PDF Reports", desc: "One-click PDF export for coaching reports" },
    { icon: UserCheck, label: "Login by TL", desc: "Secure TL-specific login and access control" },
    { icon: RefreshCw, label: "Multi-device Sync", desc: "Replace localStorage with cloud database" },
    { icon: ClipboardList, label: "QA Module", desc: "Full QA audit upload, entry, and trend tracking" },
    { icon: Package, label: "Daily Scorecard", desc: "Daily activity and conversation volume tracking" },
    { icon: Flag, label: "Follow-up Tracker", desc: "Missed follow-ups and revenue recovery tracking" },
  ];

  return (
    <div className="p-7 space-y-7">
      <SectionHeader title="Next Build Roadmap" sub="Version 2 planned features" />
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-7 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Rocket size={20} /></div>
          <div><p className="font-black text-xl">Version 2</p><p className="text-blue-200 text-sm">Full Production Dashboard</p></div>
        </div>
        <p className="text-blue-100 text-sm leading-relaxed">Version 2 will add cloud storage, multi-user support, Excel upload, and export features. Currently all data flows through the Performance Evaluation form → localStorage → dashboard.</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900 text-sm">Current Version 1 Architecture</p>
            <p className="text-amber-800 text-xs mt-1">All dashboard data comes from <strong>PerformanceEvaluation.jsx</strong>. Fill out the form → Submit → data is saved to localStorage → all dashboard pages update automatically. No mock data. No backend required.</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {features.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><Icon size={17} className="text-blue-600" /></div>
            <div><p className="font-bold text-gray-800 text-sm">{label}</p><p className="text-xs text-gray-500 mt-0.5">{desc}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
const PAGE_CONFIG = {
  overview:   { title: "Executive Overview",     subtitle: "Live data from submitted evaluations" },
  ranking:    { title: "CSR Ranking",            subtitle: "Ranked by Final Score · 1.00–5.00 scale" },
  kpi:        { title: "KPI Breakdown",          subtitle: "Category-level KPI analysis" },
  coaching:   { title: "Coaching Tracker",       subtitle: "Auto-generated from evaluation data" },
  comparison: { title: "Quarter Comparison",     subtitle: "Cross-period performance view" },
  team:       { title: "Team Performance",       subtitle: "Team-level comparison" },
  weekly:     { title: "Weekly Dashboard",       subtitle: "Individual CSR scorecard · latest evaluation" },
  eval:       { title: "Performance Evaluation", subtitle: "Submit a new CSR evaluation · saves to dashboard" },
  profile:    { title: "CSR Profile",            subtitle: "Individual performance details" },
  roadmap:    { title: "Next Build Roadmap",     subtitle: "Version 2 planned features" },
};

export default function App() {
  const [page, setPage] = useState("overview");
  const [selectedCSR, setSelectedCSR] = useState(null);
  const [evals, setEvals] = useState(() => loadEvaluations().map(e => {
    const evalToRecord = (e) => {
      const s = e.scores || {};
      const kpi = s.kpiScores || {};
      return {
        csr_id: e.employeeName, csr_name: e.employeeName, team: e.team,
        month: e.month, quarter: e.quarter, year: e.year,
        total_rate: s.finalScore, kra_scale: s.kraTotal, behavioral_scale: s.biScore,
        business_process_score: s.sectionScores?.["BUSINESS PROCESS"],
        customer_score: s.sectionScores?.["CUSTOMER"],
        people_development_score: s.sectionScores?.["PEOPLE DEVELOPMENT"],
        financial_score: s.sectionScores?.["FINANCIALS"],
        conversion_score: kpi.conversionKPI, rmo_score: kpi.rmoKPI, rts_score: kpi.rtsKPI,
        delivery_success_score: kpi.deliveryKPI, upsell_score: kpi.upsellKPI,
        attendance_score: kpi.attendanceKPI, esc_score: kpi.escKPI,
        submittedAt: e.submittedAt, id: e.id,
      };
    };
    return evalToRecord(e);
  }));

  const refresh = useCallback(() => {
    const evalToRecord = (e) => {
      const s = e.scores || {};
      const kpi = s.kpiScores || {};
      return {
        csr_id: e.employeeName, csr_name: e.employeeName, team: e.team,
        month: e.month, quarter: e.quarter, year: e.year,
        total_rate: s.finalScore, kra_scale: s.kraTotal, behavioral_scale: s.biScore,
        business_process_score: s.sectionScores?.["BUSINESS PROCESS"],
        customer_score: s.sectionScores?.["CUSTOMER"],
        people_development_score: s.sectionScores?.["PEOPLE DEVELOPMENT"],
        financial_score: s.sectionScores?.["FINANCIALS"],
        conversion_score: kpi.conversionKPI, rmo_score: kpi.rmoKPI, rts_score: kpi.rtsKPI,
        delivery_success_score: kpi.deliveryKPI, upsell_score: kpi.upsellKPI,
        attendance_score: kpi.attendanceKPI, esc_score: kpi.escKPI,
        submittedAt: e.submittedAt, id: e.id,
      };
    };
    setEvals(loadEvaluations().map(evalToRecord));
  }, []);

  // Auto-refresh when eval page is left
  const handleNav = (id) => {
    if (page === "eval") refresh();
    setPage(id);
    if (id !== "profile") setSelectedCSR(null);
  };

  const handleSelectCSR = (csr) => { setSelectedCSR(csr); setPage("profile"); };

  const cfg = PAGE_CONFIG[page] || PAGE_CONFIG.overview;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar active={page === "profile" ? "ranking" : page} onNav={handleNav} evalCount={evals.length} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={page === "profile" && selectedCSR ? selectedCSR.csr_name : cfg.title} subtitle={cfg.subtitle} />
        <div className="flex-1 overflow-y-auto">
          {page === "overview"   && <ExecutiveOverview evals={evals} onRefresh={refresh} onSelectCSR={handleSelectCSR} onNav={handleNav} />}
          {page === "ranking"    && <CSRRanking evals={evals} onRefresh={refresh} onSelectCSR={handleSelectCSR} onNav={handleNav} />}
          {page === "profile"    && selectedCSR && <CSRProfile csr={selectedCSR} evals={evals} onBack={() => handleNav("ranking")} />}
          {page === "kpi"        && <KPIBreakdown evals={evals} onRefresh={refresh} onNav={handleNav} />}
          {page === "coaching"   && <CoachingTracker evals={evals} onRefresh={refresh} onNav={handleNav} />}
          {page === "comparison" && <QuarterComparison evals={evals} onRefresh={refresh} onNav={handleNav} />}
          {page === "team"       && <TeamPerformance evals={evals} onRefresh={refresh} onNav={handleNav} />}
          {page === "weekly"     && <WeeklyDashboard evals={evals} onRefresh={refresh} onNav={handleNav} />}
          {page === "eval"       && <PerformanceEvaluation />}
          {page === "roadmap"    && <Roadmap />}
        </div>
      </div>
    </div>
  );
}
