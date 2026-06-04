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
  Layers, Map, Flag, Briefcase, Bell,
  ChevronDown, Info, Package, Rocket, WifiOff, ServerCrash, RotateCcw
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const CSR_LIST = [
  { csr_id:"C001", csr_name:"Alliah Shannel Vizcarra", team:"Team Keljash" },
  { csr_id:"C002", csr_name:"Alphe Balakid",           team:"Team Keljash" },
  { csr_id:"C003", csr_name:"Cedric Josh Deniega",     team:"Team Pao"     },
  { csr_id:"C004", csr_name:"Chynna Torno",            team:"Team Pao"     },
  { csr_id:"C005", csr_name:"Ervin Escarda",           team:"Team Krizia"  },
  { csr_id:"C006", csr_name:"Franzgian Castor",        team:"Team Krizia"  },
  { csr_id:"C007", csr_name:"Jerald Byron Cepe",       team:"Team Pikutin" },
  { csr_id:"C008", csr_name:"Kate Valeizze Hope Pedarse", team:"Team Pikutin" },
  { csr_id:"C009", csr_name:"Lance Borlado",           team:"Team Artemis" },
  { csr_id:"C010", csr_name:"Princess Aleyah Borlado", team:"Team Artemis" },
  { csr_id:"C011", csr_name:"Rachel Hate",             team:"Team Artemis" },
  { csr_id:"C012", csr_name:"Raine Chavez",            team:"Team Keljash" },
  { csr_id:"C013", csr_name:"Razel Hila",              team:"Team Pao"     },
  { csr_id:"C014", csr_name:"Rhea Mae Tugado",         team:"Team Krizia"  },
  { csr_id:"C015", csr_name:"Venice Cuaton",           team:"Team Pikutin" },
  { csr_id:"C016", csr_name:"McGilbert Hitosis",       team:"Team Artemis" },
];

const PERFORMANCE_DATA_RAW = [
  { csr_id:"C001", year:2026, quarter:"Q2", month:"April", total_rate:4.62, kra_scale:4.70, behavioral_scale:4.55, conversion_score:91, rmo_score:88, rts_score:90, delivery_success_score:93, upsell_score:85, attendance_score:95, esc_score:87 },
  { csr_id:"C001", year:2026, quarter:"Q2", month:"May",   total_rate:4.70, kra_scale:4.75, behavioral_scale:4.65, conversion_score:93, rmo_score:90, rts_score:92, delivery_success_score:95, upsell_score:88, attendance_score:97, esc_score:89 },
  { csr_id:"C001", year:2026, quarter:"Q2", month:"June",  total_rate:4.75, kra_scale:4.80, behavioral_scale:4.70, conversion_score:94, rmo_score:92, rts_score:93, delivery_success_score:96, upsell_score:90, attendance_score:98, esc_score:91 },
  { csr_id:"C002", year:2026, quarter:"Q2", month:"April", total_rate:3.20, kra_scale:3.10, behavioral_scale:3.30, conversion_score:72, rmo_score:68, rts_score:70, delivery_success_score:74, upsell_score:65, attendance_score:80, esc_score:71 },
  { csr_id:"C002", year:2026, quarter:"Q2", month:"May",   total_rate:3.35, kra_scale:3.25, behavioral_scale:3.40, conversion_score:74, rmo_score:70, rts_score:72, delivery_success_score:76, upsell_score:68, attendance_score:82, esc_score:73 },
  { csr_id:"C002", year:2026, quarter:"Q2", month:"June",  total_rate:3.45, kra_scale:3.40, behavioral_scale:3.50, conversion_score:76, rmo_score:72, rts_score:74, delivery_success_score:78, upsell_score:70, attendance_score:84, esc_score:75 },
  { csr_id:"C003", year:2026, quarter:"Q2", month:"April", total_rate:4.45, kra_scale:4.50, behavioral_scale:4.40, conversion_score:88, rmo_score:85, rts_score:87, delivery_success_score:90, upsell_score:83, attendance_score:93, esc_score:85 },
  { csr_id:"C003", year:2026, quarter:"Q2", month:"May",   total_rate:4.52, kra_scale:4.58, behavioral_scale:4.46, conversion_score:89, rmo_score:87, rts_score:88, delivery_success_score:91, upsell_score:84, attendance_score:94, esc_score:86 },
  { csr_id:"C003", year:2026, quarter:"Q2", month:"June",  total_rate:4.55, kra_scale:4.60, behavioral_scale:4.50, conversion_score:90, rmo_score:88, rts_score:89, delivery_success_score:92, upsell_score:85, attendance_score:95, esc_score:87 },
  { csr_id:"C004", year:2026, quarter:"Q2", month:"April", total_rate:2.80, kra_scale:2.75, behavioral_scale:2.85, conversion_score:65, rmo_score:60, rts_score:62, delivery_success_score:67, upsell_score:58, attendance_score:72, esc_score:63 },
  { csr_id:"C004", year:2026, quarter:"Q2", month:"May",   total_rate:2.90, kra_scale:2.85, behavioral_scale:2.95, conversion_score:67, rmo_score:62, rts_score:64, delivery_success_score:69, upsell_score:60, attendance_score:74, esc_score:65 },
  { csr_id:"C004", year:2026, quarter:"Q2", month:"June",  total_rate:2.85, kra_scale:2.80, behavioral_scale:2.90, conversion_score:66, rmo_score:61, rts_score:63, delivery_success_score:68, upsell_score:59, attendance_score:73, esc_score:64 },
  { csr_id:"C005", year:2026, quarter:"Q2", month:"April", total_rate:4.10, kra_scale:4.15, behavioral_scale:4.05, conversion_score:82, rmo_score:80, rts_score:81, delivery_success_score:84, upsell_score:78, attendance_score:88, esc_score:80 },
  { csr_id:"C005", year:2026, quarter:"Q2", month:"May",   total_rate:4.18, kra_scale:4.22, behavioral_scale:4.14, conversion_score:83, rmo_score:81, rts_score:82, delivery_success_score:85, upsell_score:79, attendance_score:89, esc_score:81 },
  { csr_id:"C005", year:2026, quarter:"Q2", month:"June",  total_rate:4.20, kra_scale:4.25, behavioral_scale:4.15, conversion_score:84, rmo_score:82, rts_score:83, delivery_success_score:86, upsell_score:80, attendance_score:90, esc_score:82 },
  { csr_id:"C006", year:2026, quarter:"Q2", month:"April", total_rate:3.75, kra_scale:3.80, behavioral_scale:3.70, conversion_score:78, rmo_score:75, rts_score:76, delivery_success_score:80, upsell_score:73, attendance_score:85, esc_score:76 },
  { csr_id:"C006", year:2026, quarter:"Q2", month:"May",   total_rate:3.68, kra_scale:3.72, behavioral_scale:3.64, conversion_score:76, rmo_score:73, rts_score:74, delivery_success_score:78, upsell_score:71, attendance_score:83, esc_score:74 },
  { csr_id:"C006", year:2026, quarter:"Q2", month:"June",  total_rate:3.72, kra_scale:3.76, behavioral_scale:3.68, conversion_score:77, rmo_score:74, rts_score:75, delivery_success_score:79, upsell_score:72, attendance_score:84, esc_score:75 },
  { csr_id:"C007", year:2026, quarter:"Q2", month:"April", total_rate:4.35, kra_scale:4.40, behavioral_scale:4.30, conversion_score:86, rmo_score:83, rts_score:85, delivery_success_score:88, upsell_score:81, attendance_score:91, esc_score:83 },
  { csr_id:"C007", year:2026, quarter:"Q2", month:"May",   total_rate:4.28, kra_scale:4.32, behavioral_scale:4.24, conversion_score:85, rmo_score:82, rts_score:84, delivery_success_score:87, upsell_score:80, attendance_score:90, esc_score:82 },
  { csr_id:"C007", year:2026, quarter:"Q2", month:"June",  total_rate:4.40, kra_scale:4.45, behavioral_scale:4.35, conversion_score:87, rmo_score:84, rts_score:86, delivery_success_score:89, upsell_score:82, attendance_score:92, esc_score:84 },
  { csr_id:"C008", year:2026, quarter:"Q2", month:"April", total_rate:4.58, kra_scale:4.65, behavioral_scale:4.51, conversion_score:90, rmo_score:87, rts_score:89, delivery_success_score:92, upsell_score:86, attendance_score:96, esc_score:88 },
  { csr_id:"C008", year:2026, quarter:"Q2", month:"May",   total_rate:4.62, kra_scale:4.68, behavioral_scale:4.56, conversion_score:91, rmo_score:88, rts_score:90, delivery_success_score:93, upsell_score:87, attendance_score:97, esc_score:89 },
  { csr_id:"C008", year:2026, quarter:"Q2", month:"June",  total_rate:4.65, kra_scale:4.70, behavioral_scale:4.60, conversion_score:92, rmo_score:89, rts_score:91, delivery_success_score:94, upsell_score:88, attendance_score:98, esc_score:90 },
  { csr_id:"C009", year:2026, quarter:"Q2", month:"April", total_rate:3.50, kra_scale:3.55, behavioral_scale:3.45, conversion_score:76, rmo_score:73, rts_score:74, delivery_success_score:78, upsell_score:71, attendance_score:83, esc_score:74 },
  { csr_id:"C009", year:2026, quarter:"Q2", month:"May",   total_rate:3.58, kra_scale:3.62, behavioral_scale:3.54, conversion_score:77, rmo_score:74, rts_score:75, delivery_success_score:79, upsell_score:72, attendance_score:84, esc_score:75 },
  { csr_id:"C009", year:2026, quarter:"Q2", month:"June",  total_rate:3.55, kra_scale:3.60, behavioral_scale:3.50, conversion_score:76, rmo_score:73, rts_score:74, delivery_success_score:78, upsell_score:71, attendance_score:83, esc_score:74 },
  { csr_id:"C010", year:2026, quarter:"Q2", month:"April", total_rate:4.05, kra_scale:4.10, behavioral_scale:4.00, conversion_score:81, rmo_score:79, rts_score:80, delivery_success_score:83, upsell_score:77, attendance_score:87, esc_score:79 },
  { csr_id:"C010", year:2026, quarter:"Q2", month:"May",   total_rate:4.12, kra_scale:4.18, behavioral_scale:4.06, conversion_score:82, rmo_score:80, rts_score:81, delivery_success_score:84, upsell_score:78, attendance_score:88, esc_score:80 },
  { csr_id:"C010", year:2026, quarter:"Q2", month:"June",  total_rate:4.08, kra_scale:4.14, behavioral_scale:4.02, conversion_score:81, rmo_score:79, rts_score:80, delivery_success_score:83, upsell_score:77, attendance_score:87, esc_score:79 },
  { csr_id:"C011", year:2026, quarter:"Q2", month:"April", total_rate:3.15, kra_scale:3.20, behavioral_scale:3.10, conversion_score:70, rmo_score:67, rts_score:68, delivery_success_score:72, upsell_score:64, attendance_score:78, esc_score:69 },
  { csr_id:"C011", year:2026, quarter:"Q2", month:"May",   total_rate:3.08, kra_scale:3.12, behavioral_scale:3.04, conversion_score:69, rmo_score:65, rts_score:66, delivery_success_score:70, upsell_score:62, attendance_score:76, esc_score:67 },
  { csr_id:"C011", year:2026, quarter:"Q2", month:"June",  total_rate:3.12, kra_scale:3.16, behavioral_scale:3.08, conversion_score:70, rmo_score:66, rts_score:67, delivery_success_score:71, upsell_score:63, attendance_score:77, esc_score:68 },
  { csr_id:"C012", year:2026, quarter:"Q2", month:"April", total_rate:4.25, kra_scale:4.30, behavioral_scale:4.20, conversion_score:84, rmo_score:82, rts_score:83, delivery_success_score:86, upsell_score:80, attendance_score:90, esc_score:82 },
  { csr_id:"C012", year:2026, quarter:"Q2", month:"May",   total_rate:4.30, kra_scale:4.35, behavioral_scale:4.25, conversion_score:85, rmo_score:83, rts_score:84, delivery_success_score:87, upsell_score:81, attendance_score:91, esc_score:83 },
  { csr_id:"C012", year:2026, quarter:"Q2", month:"June",  total_rate:4.33, kra_scale:4.38, behavioral_scale:4.28, conversion_score:86, rmo_score:84, rts_score:85, delivery_success_score:88, upsell_score:82, attendance_score:92, esc_score:84 },
  { csr_id:"C013", year:2026, quarter:"Q2", month:"April", total_rate:3.88, kra_scale:3.92, behavioral_scale:3.84, conversion_score:79, rmo_score:77, rts_score:78, delivery_success_score:81, upsell_score:75, attendance_score:86, esc_score:77 },
  { csr_id:"C013", year:2026, quarter:"Q2", month:"May",   total_rate:3.95, kra_scale:4.00, behavioral_scale:3.90, conversion_score:80, rmo_score:78, rts_score:79, delivery_success_score:82, upsell_score:76, attendance_score:87, esc_score:78 },
  { csr_id:"C013", year:2026, quarter:"Q2", month:"June",  total_rate:3.92, kra_scale:3.96, behavioral_scale:3.88, conversion_score:80, rmo_score:78, rts_score:79, delivery_success_score:82, upsell_score:76, attendance_score:87, esc_score:78 },
  { csr_id:"C014", year:2026, quarter:"Q2", month:"April", total_rate:4.48, kra_scale:4.53, behavioral_scale:4.43, conversion_score:89, rmo_score:86, rts_score:88, delivery_success_score:91, upsell_score:84, attendance_score:94, esc_score:86 },
  { csr_id:"C014", year:2026, quarter:"Q2", month:"May",   total_rate:4.52, kra_scale:4.57, behavioral_scale:4.47, conversion_score:90, rmo_score:87, rts_score:89, delivery_success_score:92, upsell_score:85, attendance_score:95, esc_score:87 },
  { csr_id:"C014", year:2026, quarter:"Q2", month:"June",  total_rate:4.56, kra_scale:4.62, behavioral_scale:4.50, conversion_score:91, rmo_score:88, rts_score:90, delivery_success_score:93, upsell_score:86, attendance_score:96, esc_score:88 },
  { csr_id:"C015", year:2026, quarter:"Q2", month:"April", total_rate:3.62, kra_scale:3.66, behavioral_scale:3.58, conversion_score:77, rmo_score:74, rts_score:75, delivery_success_score:79, upsell_score:72, attendance_score:84, esc_score:75 },
  { csr_id:"C015", year:2026, quarter:"Q2", month:"May",   total_rate:3.70, kra_scale:3.74, behavioral_scale:3.66, conversion_score:78, rmo_score:75, rts_score:76, delivery_success_score:80, upsell_score:73, attendance_score:85, esc_score:76 },
  { csr_id:"C015", year:2026, quarter:"Q2", month:"June",  total_rate:3.65, kra_scale:3.70, behavioral_scale:3.60, conversion_score:77, rmo_score:74, rts_score:75, delivery_success_score:79, upsell_score:72, attendance_score:84, esc_score:75 },
  { csr_id:"C016", year:2026, quarter:"Q2", month:"April", total_rate:4.78, kra_scale:4.82, behavioral_scale:4.74, conversion_score:94, rmo_score:92, rts_score:93, delivery_success_score:96, upsell_score:90, attendance_score:99, esc_score:92 },
  { csr_id:"C016", year:2026, quarter:"Q2", month:"May",   total_rate:4.82, kra_scale:4.86, behavioral_scale:4.78, conversion_score:95, rmo_score:93, rts_score:94, delivery_success_score:97, upsell_score:91, attendance_score:100,esc_score:93 },
  { csr_id:"C016", year:2026, quarter:"Q2", month:"June",  total_rate:4.85, kra_scale:4.90, behavioral_scale:4.80, conversion_score:96, rmo_score:94, rts_score:95, delivery_success_score:98, upsell_score:92, attendance_score:100,esc_score:94 },
];

const QA_DATA_RAW = [
  { qa_id:"QA001", csr_id:"C001", week:"Week 1", month:"June", chat_ref:"CHT-001-A", qa_score:94, script_compliance:95, order_accuracy:93, tone_score:96, escalation_handling:92, issue_found:"None", audited_by:"QA Lead Ana", audit_date:"2026-06-02", coaching_needed:false },
  { qa_id:"QA002", csr_id:"C001", week:"Week 1", month:"June", chat_ref:"CHT-001-B", qa_score:92, script_compliance:93, order_accuracy:92, tone_score:94, escalation_handling:90, issue_found:"Minor tone issue", audited_by:"QA Lead Ana", audit_date:"2026-06-04", coaching_needed:false },
  { qa_id:"QA003", csr_id:"C002", week:"Week 1", month:"June", chat_ref:"CHT-002-A", qa_score:74, script_compliance:72, order_accuracy:75, tone_score:76, escalation_handling:70, issue_found:"Script deviation detected", audited_by:"QA Lead Ana", audit_date:"2026-06-02", coaching_needed:true },
  { qa_id:"QA004", csr_id:"C002", week:"Week 1", month:"June", chat_ref:"CHT-002-B", qa_score:71, script_compliance:70, order_accuracy:73, tone_score:72, escalation_handling:68, issue_found:"Order accuracy low", audited_by:"QA Lead Bea", audit_date:"2026-06-05", coaching_needed:true },
  { qa_id:"QA005", csr_id:"C003", week:"Week 1", month:"June", chat_ref:"CHT-003-A", qa_score:89, script_compliance:90, order_accuracy:88, tone_score:91, escalation_handling:87, issue_found:"None", audited_by:"QA Lead Bea", audit_date:"2026-06-03", coaching_needed:false },
  { qa_id:"QA006", csr_id:"C003", week:"Week 1", month:"June", chat_ref:"CHT-003-B", qa_score:91, script_compliance:92, order_accuracy:90, tone_score:92, escalation_handling:89, issue_found:"None", audited_by:"QA Lead Ana", audit_date:"2026-06-05", coaching_needed:false },
  { qa_id:"QA007", csr_id:"C004", week:"Week 1", month:"June", chat_ref:"CHT-004-A", qa_score:65, script_compliance:63, order_accuracy:66, tone_score:67, escalation_handling:62, issue_found:"Multiple script violations", audited_by:"QA Lead Bea", audit_date:"2026-06-02", coaching_needed:true },
  { qa_id:"QA008", csr_id:"C005", week:"Week 1", month:"June", chat_ref:"CHT-005-A", qa_score:85, script_compliance:86, order_accuracy:84, tone_score:87, escalation_handling:83, issue_found:"None", audited_by:"QA Lead Ana", audit_date:"2026-06-03", coaching_needed:false },
  { qa_id:"QA009", csr_id:"C005", week:"Week 1", month:"June", chat_ref:"CHT-005-B", qa_score:83, script_compliance:84, order_accuracy:82, tone_score:85, escalation_handling:81, issue_found:"Minor delay in response", audited_by:"QA Lead Bea", audit_date:"2026-06-06", coaching_needed:false },
  { qa_id:"QA010", csr_id:"C006", week:"Week 1", month:"June", chat_ref:"CHT-006-A", qa_score:78, script_compliance:77, order_accuracy:79, tone_score:80, escalation_handling:76, issue_found:"Tone inconsistency", audited_by:"QA Lead Ana", audit_date:"2026-06-04", coaching_needed:true },
  { qa_id:"QA011", csr_id:"C006", week:"Week 1", month:"June", chat_ref:"CHT-006-B", qa_score:80, script_compliance:79, order_accuracy:81, tone_score:82, escalation_handling:78, issue_found:"None", audited_by:"QA Lead Bea", audit_date:"2026-06-06", coaching_needed:false },
  { qa_id:"QA012", csr_id:"C007", week:"Week 1", month:"June", chat_ref:"CHT-007-A", qa_score:88, script_compliance:89, order_accuracy:87, tone_score:90, escalation_handling:86, issue_found:"None", audited_by:"QA Lead Ana", audit_date:"2026-06-02", coaching_needed:false },
  { qa_id:"QA013", csr_id:"C007", week:"Week 1", month:"June", chat_ref:"CHT-007-B", qa_score:86, script_compliance:87, order_accuracy:85, tone_score:88, escalation_handling:84, issue_found:"None", audited_by:"QA Lead Bea", audit_date:"2026-06-05", coaching_needed:false },
  { qa_id:"QA014", csr_id:"C008", week:"Week 1", month:"June", chat_ref:"CHT-008-A", qa_score:93, script_compliance:94, order_accuracy:92, tone_score:95, escalation_handling:91, issue_found:"None", audited_by:"QA Lead Ana", audit_date:"2026-06-03", coaching_needed:false },
  { qa_id:"QA015", csr_id:"C008", week:"Week 1", month:"June", chat_ref:"CHT-008-B", qa_score:91, script_compliance:92, order_accuracy:90, tone_score:93, escalation_handling:89, issue_found:"None", audited_by:"QA Lead Bea", audit_date:"2026-06-06", coaching_needed:false },
  { qa_id:"QA016", csr_id:"C009", week:"Week 1", month:"June", chat_ref:"CHT-009-A", qa_score:77, script_compliance:76, order_accuracy:78, tone_score:79, escalation_handling:75, issue_found:"Script adherence issue", audited_by:"QA Lead Ana", audit_date:"2026-06-04", coaching_needed:true },
  { qa_id:"QA017", csr_id:"C010", week:"Week 1", month:"June", chat_ref:"CHT-010-A", qa_score:84, script_compliance:85, order_accuracy:83, tone_score:86, escalation_handling:82, issue_found:"None", audited_by:"QA Lead Bea", audit_date:"2026-06-03", coaching_needed:false },
  { qa_id:"QA018", csr_id:"C010", week:"Week 1", month:"June", chat_ref:"CHT-010-B", qa_score:82, script_compliance:83, order_accuracy:81, tone_score:84, escalation_handling:80, issue_found:"None", audited_by:"QA Lead Ana", audit_date:"2026-06-05", coaching_needed:false },
  { qa_id:"QA019", csr_id:"C011", week:"Week 1", month:"June", chat_ref:"CHT-011-A", qa_score:68, script_compliance:66, order_accuracy:69, tone_score:70, escalation_handling:65, issue_found:"Multiple compliance issues", audited_by:"QA Lead Bea", audit_date:"2026-06-02", coaching_needed:true },
  { qa_id:"QA020", csr_id:"C011", week:"Week 1", month:"June", chat_ref:"CHT-011-B", qa_score:65, script_compliance:63, order_accuracy:67, tone_score:67, escalation_handling:62, issue_found:"Escalation mishandled", audited_by:"QA Lead Ana", audit_date:"2026-06-06", coaching_needed:true },
  { qa_id:"QA021", csr_id:"C012", week:"Week 1", month:"June", chat_ref:"CHT-012-A", qa_score:87, script_compliance:88, order_accuracy:86, tone_score:89, escalation_handling:85, issue_found:"None", audited_by:"QA Lead Bea", audit_date:"2026-06-03", coaching_needed:false },
  { qa_id:"QA022", csr_id:"C012", week:"Week 1", month:"June", chat_ref:"CHT-012-B", qa_score:89, script_compliance:90, order_accuracy:88, tone_score:91, escalation_handling:87, issue_found:"None", audited_by:"QA Lead Ana", audit_date:"2026-06-05", coaching_needed:false },
  { qa_id:"QA023", csr_id:"C013", week:"Week 1", month:"June", chat_ref:"CHT-013-A", qa_score:81, script_compliance:82, order_accuracy:80, tone_score:83, escalation_handling:79, issue_found:"None", audited_by:"QA Lead Bea", audit_date:"2026-06-04", coaching_needed:false },
  { qa_id:"QA024", csr_id:"C013", week:"Week 1", month:"June", chat_ref:"CHT-013-B", qa_score:79, script_compliance:78, order_accuracy:80, tone_score:81, escalation_handling:77, issue_found:"Minor tone issue", audited_by:"QA Lead Ana", audit_date:"2026-06-06", coaching_needed:true },
  { qa_id:"QA025", csr_id:"C014", week:"Week 1", month:"June", chat_ref:"CHT-014-A", qa_score:91, script_compliance:92, order_accuracy:90, tone_score:93, escalation_handling:89, issue_found:"None", audited_by:"QA Lead Bea", audit_date:"2026-06-02", coaching_needed:false },
  { qa_id:"QA026", csr_id:"C014", week:"Week 1", month:"June", chat_ref:"CHT-014-B", qa_score:93, script_compliance:94, order_accuracy:92, tone_score:95, escalation_handling:91, issue_found:"None", audited_by:"QA Lead Ana", audit_date:"2026-06-05", coaching_needed:false },
  { qa_id:"QA027", csr_id:"C015", week:"Week 1", month:"June", chat_ref:"CHT-015-A", qa_score:76, script_compliance:75, order_accuracy:77, tone_score:78, escalation_handling:74, issue_found:"Script deviation", audited_by:"QA Lead Bea", audit_date:"2026-06-03", coaching_needed:true },
  { qa_id:"QA028", csr_id:"C015", week:"Week 1", month:"June", chat_ref:"CHT-015-B", qa_score:78, script_compliance:77, order_accuracy:79, tone_score:80, escalation_handling:76, issue_found:"None", audited_by:"QA Lead Ana", audit_date:"2026-06-06", coaching_needed:false },
  { qa_id:"QA029", csr_id:"C016", week:"Week 1", month:"June", chat_ref:"CHT-016-A", qa_score:96, script_compliance:97, order_accuracy:95, tone_score:98, escalation_handling:94, issue_found:"None", audited_by:"QA Lead Bea", audit_date:"2026-06-02", coaching_needed:false },
  { qa_id:"QA030", csr_id:"C016", week:"Week 1", month:"June", chat_ref:"CHT-016-B", qa_score:95, script_compliance:96, order_accuracy:94, tone_score:97, escalation_handling:93, issue_found:"None", audited_by:"QA Lead Ana", audit_date:"2026-06-05", coaching_needed:false },
  { qa_id:"QA031", csr_id:"C004", week:"Week 2", month:"June", chat_ref:"CHT-004-C", qa_score:62, script_compliance:60, order_accuracy:63, tone_score:64, escalation_handling:60, issue_found:"Repeated script violation", audited_by:"QA Lead Bea", audit_date:"2026-06-10", coaching_needed:true },
  { qa_id:"QA032", csr_id:"C004", week:"Week 2", month:"June", chat_ref:"CHT-004-D", qa_score:64, script_compliance:62, order_accuracy:65, tone_score:66, escalation_handling:62, issue_found:"Customer complaint risk", audited_by:"QA Lead Ana", audit_date:"2026-06-12", coaching_needed:true },
  { qa_id:"QA033", csr_id:"C001", week:"Week 2", month:"June", chat_ref:"CHT-001-C", qa_score:95, script_compliance:96, order_accuracy:94, tone_score:97, escalation_handling:93, issue_found:"None", audited_by:"QA Lead Bea", audit_date:"2026-06-11", coaching_needed:false },
  { qa_id:"QA034", csr_id:"C001", week:"Week 2", month:"June", chat_ref:"CHT-001-D", qa_score:93, script_compliance:94, order_accuracy:92, tone_score:95, escalation_handling:91, issue_found:"None", audited_by:"QA Lead Ana", audit_date:"2026-06-13", coaching_needed:false },
  { qa_id:"QA035", csr_id:"C016", week:"Week 2", month:"June", chat_ref:"CHT-016-C", qa_score:97, script_compliance:98, order_accuracy:96, tone_score:99, escalation_handling:95, issue_found:"None", audited_by:"QA Lead Bea", audit_date:"2026-06-10", coaching_needed:false },
  { qa_id:"QA036", csr_id:"C016", week:"Week 2", month:"June", chat_ref:"CHT-016-D", qa_score:96, script_compliance:97, order_accuracy:95, tone_score:98, escalation_handling:94, issue_found:"None", audited_by:"QA Lead Ana", audit_date:"2026-06-12", coaching_needed:false },
];

const DAILY_DATA_RAW = [
  { date:"2026-06-02", csr_id:"C001", conversations:42, orders_closed:32, conversion_rate:76.2, followups_completed:15, missed_followups:0, frt:"1m 20s", art:"4m 10s", backlog:2, qa_flags:0, tl_notes:"Excellent day" },
  { date:"2026-06-02", csr_id:"C002", conversations:38, orders_closed:22, conversion_rate:57.9, followups_completed:10, missed_followups:3, frt:"2m 45s", art:"6m 30s", backlog:8, qa_flags:2, tl_notes:"Script coaching needed" },
  { date:"2026-06-02", csr_id:"C003", conversations:40, orders_closed:30, conversion_rate:75.0, followups_completed:14, missed_followups:1, frt:"1m 35s", art:"4m 45s", backlog:3, qa_flags:0, tl_notes:"Good performance" },
  { date:"2026-06-02", csr_id:"C004", conversations:35, orders_closed:18, conversion_rate:51.4, followups_completed:8,  missed_followups:5, frt:"3m 10s", art:"7m 20s", backlog:12, qa_flags:3, tl_notes:"Critical - escalate to coaching" },
  { date:"2026-06-02", csr_id:"C005", conversations:41, orders_closed:29, conversion_rate:70.7, followups_completed:13, missed_followups:0, frt:"1m 50s", art:"4m 55s", backlog:4, qa_flags:0, tl_notes:"Solid performance" },
  { date:"2026-06-02", csr_id:"C016", conversations:45, orders_closed:40, conversion_rate:88.9, followups_completed:18, missed_followups:0, frt:"1m 05s", art:"3m 30s", backlog:0, qa_flags:0, tl_notes:"Top performer today" },
  { date:"2026-06-02", csr_id:"C011", conversations:36, orders_closed:19, conversion_rate:52.8, followups_completed:9,  missed_followups:4, frt:"2m 55s", art:"7m 00s", backlog:9, qa_flags:2, tl_notes:"Needs follow-up coaching" },
  { date:"2026-06-02", csr_id:"C014", conversations:43, orders_closed:35, conversion_rate:81.4, followups_completed:16, missed_followups:0, frt:"1m 25s", art:"4m 20s", backlog:1, qa_flags:0, tl_notes:"Excellent" },
  { date:"2026-06-03", csr_id:"C001", conversations:44, orders_closed:34, conversion_rate:77.3, followups_completed:16, missed_followups:0, frt:"1m 15s", art:"4m 05s", backlog:1, qa_flags:0, tl_notes:"Consistent" },
  { date:"2026-06-03", csr_id:"C016", conversations:47, orders_closed:42, conversion_rate:89.4, followups_completed:19, missed_followups:0, frt:"1m 02s", art:"3m 25s", backlog:0, qa_flags:0, tl_notes:"Best in team today" },
  { date:"2026-06-03", csr_id:"C002", conversations:37, orders_closed:21, conversion_rate:56.8, followups_completed:11, missed_followups:2, frt:"2m 50s", art:"6m 40s", backlog:7, qa_flags:1, tl_notes:"Improving slightly" },
  { date:"2026-06-03", csr_id:"C004", conversations:33, orders_closed:16, conversion_rate:48.5, followups_completed:7,  missed_followups:6, frt:"3m 20s", art:"7m 45s", backlog:14, qa_flags:3, tl_notes:"Urgent coaching needed" },
];

const FOLLOWUP_DATA_RAW = [
  { csr_id:"C001", month:"June", total_due:82, completed:81, missed:1,  contact_rate:94.2, orders_recovered:12, revenue_recovered:24800 },
  { csr_id:"C002", month:"June", total_due:71, completed:57, missed:14, contact_rate:72.5, orders_recovered:4,  revenue_recovered:7200  },
  { csr_id:"C003", month:"June", total_due:78, completed:76, missed:2,  contact_rate:93.8, orders_recovered:10, revenue_recovered:21400 },
  { csr_id:"C004", month:"June", total_due:66, completed:44, missed:22, contact_rate:58.3, orders_recovered:2,  revenue_recovered:3600  },
  { csr_id:"C005", month:"June", total_due:75, completed:71, missed:4,  contact_rate:89.6, orders_recovered:8,  revenue_recovered:16800 },
  { csr_id:"C006", month:"June", total_due:69, completed:63, missed:6,  contact_rate:85.4, orders_recovered:6,  revenue_recovered:12200 },
  { csr_id:"C007", month:"June", total_due:74, completed:70, missed:4,  contact_rate:88.2, orders_recovered:7,  revenue_recovered:14600 },
  { csr_id:"C008", month:"June", total_due:80, completed:79, missed:1,  contact_rate:95.1, orders_recovered:11, revenue_recovered:23200 },
  { csr_id:"C009", month:"June", total_due:67, completed:61, missed:6,  contact_rate:83.7, orders_recovered:5,  revenue_recovered:10400 },
  { csr_id:"C010", month:"June", total_due:73, completed:69, missed:4,  contact_rate:88.9, orders_recovered:8,  revenue_recovered:17200 },
  { csr_id:"C011", month:"June", total_due:62, completed:46, missed:16, contact_rate:65.2, orders_recovered:3,  revenue_recovered:5800  },
  { csr_id:"C012", month:"June", total_due:77, completed:74, missed:3,  contact_rate:91.3, orders_recovered:9,  revenue_recovered:19600 },
  { csr_id:"C013", month:"June", total_due:72, completed:68, missed:4,  contact_rate:87.5, orders_recovered:7,  revenue_recovered:14200 },
  { csr_id:"C014", month:"June", total_due:79, completed:78, missed:1,  contact_rate:94.6, orders_recovered:11, revenue_recovered:22800 },
  { csr_id:"C015", month:"June", total_due:70, completed:64, missed:6,  contact_rate:84.3, orders_recovered:5,  revenue_recovered:10200 },
  { csr_id:"C016", month:"June", total_due:85, completed:85, missed:0,  contact_rate:97.2, orders_recovered:14, revenue_recovered:29800 },
];

const QUARTERS = { Q2:["April","May","June"], Q3:["July","August","September"], Q4:["October","November","December"] };
const TEAMS = ["Team Keljash","Team Pao","Team Krizia","Team Pikutin","Team Artemis"];
const TL_MAP = { "Team Keljash":"TL Keljash","Team Pao":"TL Pao","Team Krizia":"TL Krizia","Team Pikutin":"TL Pikutin","Team Artemis":"TL Artemis" };

// ═══════════════════════════════════════════════════════════════════════════════
// WEEKLY SCORECARD MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════
const WEEKLY_DATA = [
  // ── C001 Alliah – strong performer
  { csr_id:"C001", year:2026, quarter:"Q2", month:"April", week_number:1,
    final_score:4.62, kra_score_percent:88, kra_scale:4.70, behavioral_score_percent:86, behavioral_scale:4.55,
    followups_rmo:88, verified_calls:91, roas_performance:91, rts_compliance:90, sales_encoding_accuracy:93, upsell_rate:85,
    attendance_kpi:95, delivery_success_rate:93, order_accuracy:92, tagging_accuracy:90,
    esc_points:87, training_compliance:95, initiative_score:88,
    rts_percentage:90, delivered_orders:142, returned_orders:8, for_return:3, conversion_roas:91,
    business_process_score:91, customer_score:89, people_development_score:90, financial_score:88,
    attendance_reliability:90, accountability_compliance:88, initiative_adaptability:84, extreme_self_care:82,
    weekly_insight:"Strong weekly performance. Maintain RMO consistency and upsell discipline.",
    coaching_recommendation:"Focus on upsell scripting to push rate above 90%.", tl_note:"", coaching_status:"On Track" },
  { csr_id:"C001", year:2026, quarter:"Q2", month:"May", week_number:5,
    final_score:4.70, kra_score_percent:90, kra_scale:4.75, behavioral_score_percent:88, behavioral_scale:4.65,
    followups_rmo:90, verified_calls:93, roas_performance:93, rts_compliance:92, sales_encoding_accuracy:95, upsell_rate:88,
    attendance_kpi:97, delivery_success_rate:95, order_accuracy:94, tagging_accuracy:92,
    esc_points:89, training_compliance:97, initiative_score:90,
    rts_percentage:92, delivered_orders:151, returned_orders:6, for_return:2, conversion_roas:93,
    business_process_score:94, customer_score:91, people_development_score:92, financial_score:90,
    attendance_reliability:93, accountability_compliance:91, initiative_adaptability:87, extreme_self_care:85,
    weekly_insight:"Excellent week. All KPIs above target. Top performance in RTS and delivery.",
    coaching_recommendation:"Maintain current momentum. No immediate coaching needed.", tl_note:"", coaching_status:"On Track" },
  // ── C002 Alphe – needs coaching
  { csr_id:"C002", year:2026, quarter:"Q2", month:"April", week_number:1,
    final_score:3.20, kra_score_percent:62, kra_scale:3.10, behavioral_score_percent:66, behavioral_scale:3.30,
    followups_rmo:68, verified_calls:70, roas_performance:72, rts_compliance:70, sales_encoding_accuracy:74, upsell_rate:65,
    attendance_kpi:80, delivery_success_rate:74, order_accuracy:72, tagging_accuracy:70,
    esc_points:71, training_compliance:80, initiative_score:68,
    rts_percentage:70, delivered_orders:98, returned_orders:22, for_return:10, conversion_roas:72,
    business_process_score:72, customer_score:69, people_development_score:71, financial_score:68,
    attendance_reliability:72, accountability_compliance:68, initiative_adaptability:64, extreme_self_care:60,
    weekly_insight:"Needs coaching on RTS Compliance and Delivery Success. Script adherence is below target.",
    coaching_recommendation:"Schedule script refresher coaching. Focus on order verification and delivery follow-up.", tl_note:"", coaching_status:"Pending" },
  { csr_id:"C002", year:2026, quarter:"Q2", month:"May", week_number:5,
    final_score:3.35, kra_score_percent:65, kra_scale:3.25, behavioral_score_percent:68, behavioral_scale:3.40,
    followups_rmo:70, verified_calls:72, roas_performance:74, rts_compliance:72, sales_encoding_accuracy:76, upsell_rate:68,
    attendance_kpi:82, delivery_success_rate:76, order_accuracy:74, tagging_accuracy:72,
    esc_points:73, training_compliance:82, initiative_score:70,
    rts_percentage:72, delivered_orders:104, returned_orders:20, for_return:9, conversion_roas:74,
    business_process_score:74, customer_score:71, people_development_score:73, financial_score:70,
    attendance_reliability:74, accountability_compliance:70, initiative_adaptability:66, extreme_self_care:64,
    weekly_insight:"Slight improvement from last week. RMO and upsell still below target.",
    coaching_recommendation:"Continue coaching on follow-up discipline. Review conversion script.", tl_note:"", coaching_status:"Ongoing" },
  // ── C003 Cedric – good
  { csr_id:"C003", year:2026, quarter:"Q2", month:"April", week_number:1,
    final_score:4.45, kra_score_percent:85, kra_scale:4.50, behavioral_score_percent:84, behavioral_scale:4.40,
    followups_rmo:85, verified_calls:88, roas_performance:88, rts_compliance:87, sales_encoding_accuracy:90, upsell_rate:83,
    attendance_kpi:93, delivery_success_rate:90, order_accuracy:88, tagging_accuracy:87,
    esc_points:85, training_compliance:93, initiative_score:86,
    rts_percentage:87, delivered_orders:136, returned_orders:11, for_return:4, conversion_roas:88,
    business_process_score:88, customer_score:86, people_development_score:87, financial_score:85,
    attendance_reliability:88, accountability_compliance:85, initiative_adaptability:83, extreme_self_care:80,
    weekly_insight:"Good performance across all categories. Conversion and delivery are strong.",
    coaching_recommendation:"Push upsell rate above 85% for Excellent tier.", tl_note:"", coaching_status:"On Track" },
  { csr_id:"C003", year:2026, quarter:"Q2", month:"May", week_number:5,
    final_score:4.52, kra_score_percent:87, kra_scale:4.58, behavioral_score_percent:85, behavioral_scale:4.46,
    followups_rmo:87, verified_calls:90, roas_performance:89, rts_compliance:88, sales_encoding_accuracy:91, upsell_rate:84,
    attendance_kpi:94, delivery_success_rate:91, order_accuracy:89, tagging_accuracy:88,
    esc_points:86, training_compliance:94, initiative_score:87,
    rts_percentage:88, delivered_orders:141, returned_orders:10, for_return:3, conversion_roas:89,
    business_process_score:89, customer_score:87, people_development_score:88, financial_score:86,
    attendance_reliability:89, accountability_compliance:86, initiative_adaptability:84, extreme_self_care:82,
    weekly_insight:"Consistent improvement. All KPIs trending upward. Solid team performer.",
    coaching_recommendation:"Maintain consistency. Focus on tagging accuracy.", tl_note:"", coaching_status:"On Track" },
  // ── C004 Chynna – critical
  { csr_id:"C004", year:2026, quarter:"Q2", month:"April", week_number:1,
    final_score:2.80, kra_score_percent:55, kra_scale:2.75, behavioral_score_percent:57, behavioral_scale:2.85,
    followups_rmo:60, verified_calls:62, roas_performance:65, rts_compliance:62, sales_encoding_accuracy:67, upsell_rate:58,
    attendance_kpi:72, delivery_success_rate:67, order_accuracy:65, tagging_accuracy:62,
    esc_points:63, training_compliance:72, initiative_score:60,
    rts_percentage:62, delivered_orders:82, returned_orders:32, for_return:15, conversion_roas:65,
    business_process_score:64, customer_score:61, people_development_score:62, financial_score:60,
    attendance_reliability:64, accountability_compliance:60, initiative_adaptability:57, extreme_self_care:54,
    weekly_insight:"Critical performance. Multiple KPIs below target. Immediate intervention required.",
    coaching_recommendation:"Immediate structured coaching required. Focus on script adherence, RTS compliance, and attendance.", tl_note:"", coaching_status:"Escalated" },
  { csr_id:"C004", year:2026, quarter:"Q2", month:"May", week_number:5,
    final_score:2.90, kra_score_percent:57, kra_scale:2.85, behavioral_score_percent:59, behavioral_scale:2.95,
    followups_rmo:62, verified_calls:64, roas_performance:67, rts_compliance:64, sales_encoding_accuracy:69, upsell_rate:60,
    attendance_kpi:74, delivery_success_rate:69, order_accuracy:67, tagging_accuracy:64,
    esc_points:65, training_compliance:74, initiative_score:62,
    rts_percentage:64, delivered_orders:87, returned_orders:30, for_return:13, conversion_roas:67,
    business_process_score:66, customer_score:63, people_development_score:64, financial_score:62,
    attendance_reliability:66, accountability_compliance:62, initiative_adaptability:59, extreme_self_care:56,
    weekly_insight:"Marginal improvement. Still in critical zone. Needs continued intensive coaching.",
    coaching_recommendation:"Continue intensive coaching plan. Set weekly KPI review cadence.", tl_note:"", coaching_status:"Ongoing" },
  // ── C005 Ervin
  { csr_id:"C005", year:2026, quarter:"Q2", month:"April", week_number:1,
    final_score:4.10, kra_score_percent:79, kra_scale:4.15, behavioral_score_percent:77, behavioral_scale:4.05,
    followups_rmo:80, verified_calls:82, roas_performance:82, rts_compliance:81, sales_encoding_accuracy:84, upsell_rate:78,
    attendance_kpi:88, delivery_success_rate:84, order_accuracy:82, tagging_accuracy:80,
    esc_points:80, training_compliance:88, initiative_score:79,
    rts_percentage:81, delivered_orders:122, returned_orders:15, for_return:6, conversion_roas:82,
    business_process_score:82, customer_score:80, people_development_score:81, financial_score:79,
    attendance_reliability:82, accountability_compliance:79, initiative_adaptability:77, extreme_self_care:74,
    weekly_insight:"Good performance. Conversion is good, but order verification needs improvement.",
    coaching_recommendation:"Focus on order accuracy and tagging to push KRA above 80%.", tl_note:"", coaching_status:"On Track" },
  { csr_id:"C005", year:2026, quarter:"Q2", month:"May", week_number:5,
    final_score:4.18, kra_score_percent:80, kra_scale:4.22, behavioral_score_percent:78, behavioral_scale:4.14,
    followups_rmo:81, verified_calls:83, roas_performance:83, rts_compliance:82, sales_encoding_accuracy:85, upsell_rate:79,
    attendance_kpi:89, delivery_success_rate:85, order_accuracy:83, tagging_accuracy:81,
    esc_points:81, training_compliance:89, initiative_score:80,
    rts_percentage:82, delivered_orders:126, returned_orders:14, for_return:5, conversion_roas:83,
    business_process_score:83, customer_score:81, people_development_score:82, financial_score:80,
    attendance_reliability:83, accountability_compliance:80, initiative_adaptability:78, extreme_self_care:76,
    weekly_insight:"Steady improvement. At the cusp of Excellent tier. Push upsell for next level.",
    coaching_recommendation:"Upsell coaching to break into 80% consistently.", tl_note:"", coaching_status:"On Track" },
  // ── C006 Franzgian
  { csr_id:"C006", year:2026, quarter:"Q2", month:"April", week_number:1,
    final_score:3.75, kra_score_percent:73, kra_scale:3.80, behavioral_score_percent:71, behavioral_scale:3.70,
    followups_rmo:75, verified_calls:77, roas_performance:78, rts_compliance:76, sales_encoding_accuracy:80, upsell_rate:73,
    attendance_kpi:85, delivery_success_rate:80, order_accuracy:78, tagging_accuracy:75,
    esc_points:76, training_compliance:85, initiative_score:74,
    rts_percentage:76, delivered_orders:110, returned_orders:18, for_return:8, conversion_roas:78,
    business_process_score:77, customer_score:75, people_development_score:76, financial_score:74,
    attendance_reliability:77, accountability_compliance:74, initiative_adaptability:71, extreme_self_care:68,
    weekly_insight:"Needs monitoring. Tone inconsistency noted. RMO and upsell need improvement.",
    coaching_recommendation:"Tone coaching and script consistency review.", tl_note:"", coaching_status:"Pending" },
  { csr_id:"C006", year:2026, quarter:"Q2", month:"May", week_number:5,
    final_score:3.68, kra_score_percent:71, kra_scale:3.72, behavioral_score_percent:69, behavioral_scale:3.64,
    followups_rmo:73, verified_calls:75, roas_performance:76, rts_compliance:74, sales_encoding_accuracy:78, upsell_rate:71,
    attendance_kpi:83, delivery_success_rate:78, order_accuracy:76, tagging_accuracy:73,
    esc_points:74, training_compliance:83, initiative_score:72,
    rts_percentage:74, delivered_orders:107, returned_orders:19, for_return:9, conversion_roas:76,
    business_process_score:75, customer_score:73, people_development_score:74, financial_score:72,
    attendance_reliability:75, accountability_compliance:72, initiative_adaptability:69, extreme_self_care:66,
    weekly_insight:"Slight dip from last week. Behavioral score dropped below monitoring threshold.",
    coaching_recommendation:"Accountability and compliance review needed.", tl_note:"", coaching_status:"Ongoing" },
  // ── C007 Jerald
  { csr_id:"C007", year:2026, quarter:"Q2", month:"April", week_number:1,
    final_score:4.35, kra_score_percent:83, kra_scale:4.40, behavioral_score_percent:82, behavioral_scale:4.30,
    followups_rmo:83, verified_calls:86, roas_performance:86, rts_compliance:85, sales_encoding_accuracy:88, upsell_rate:81,
    attendance_kpi:91, delivery_success_rate:88, order_accuracy:86, tagging_accuracy:84,
    esc_points:83, training_compliance:91, initiative_score:84,
    rts_percentage:85, delivered_orders:130, returned_orders:13, for_return:5, conversion_roas:86,
    business_process_score:86, customer_score:84, people_development_score:85, financial_score:83,
    attendance_reliability:86, accountability_compliance:83, initiative_adaptability:81, extreme_self_care:79,
    weekly_insight:"Good and consistent. Upsell and RMO above target. Solid week.",
    coaching_recommendation:"Refine tagging accuracy to move toward Excellent.", tl_note:"", coaching_status:"On Track" },
  { csr_id:"C007", year:2026, quarter:"Q2", month:"May", week_number:5,
    final_score:4.28, kra_score_percent:82, kra_scale:4.32, behavioral_score_percent:81, behavioral_scale:4.24,
    followups_rmo:82, verified_calls:85, roas_performance:85, rts_compliance:84, sales_encoding_accuracy:87, upsell_rate:80,
    attendance_kpi:90, delivery_success_rate:87, order_accuracy:85, tagging_accuracy:83,
    esc_points:82, training_compliance:90, initiative_score:83,
    rts_percentage:84, delivered_orders:128, returned_orders:14, for_return:6, conversion_roas:85,
    business_process_score:85, customer_score:83, people_development_score:84, financial_score:82,
    attendance_reliability:85, accountability_compliance:82, initiative_adaptability:80, extreme_self_care:78,
    weekly_insight:"Consistent good performance. Minor dip in upsell. All metrics above floor.",
    coaching_recommendation:"Maintain current coaching plan. Upsell focus for next week.", tl_note:"", coaching_status:"On Track" },
  // ── C008 Kate
  { csr_id:"C008", year:2026, quarter:"Q2", month:"April", week_number:1,
    final_score:4.58, kra_score_percent:88, kra_scale:4.65, behavioral_score_percent:86, behavioral_scale:4.51,
    followups_rmo:87, verified_calls:90, roas_performance:90, rts_compliance:89, sales_encoding_accuracy:92, upsell_rate:86,
    attendance_kpi:96, delivery_success_rate:92, order_accuracy:91, tagging_accuracy:89,
    esc_points:88, training_compliance:96, initiative_score:89,
    rts_percentage:89, delivered_orders:145, returned_orders:9, for_return:3, conversion_roas:90,
    business_process_score:91, customer_score:88, people_development_score:90, financial_score:87,
    attendance_reliability:91, accountability_compliance:88, initiative_adaptability:86, extreme_self_care:84,
    weekly_insight:"Excellent week. Near-perfect attendance and delivery success. Top 3 performer.",
    coaching_recommendation:"No immediate coaching. Focus on maintaining Excellent status.", tl_note:"", coaching_status:"On Track" },
  { csr_id:"C008", year:2026, quarter:"Q2", month:"May", week_number:5,
    final_score:4.62, kra_score_percent:89, kra_scale:4.68, behavioral_score_percent:87, behavioral_scale:4.56,
    followups_rmo:88, verified_calls:91, roas_performance:91, rts_compliance:90, sales_encoding_accuracy:93, upsell_rate:87,
    attendance_kpi:97, delivery_success_rate:93, order_accuracy:92, tagging_accuracy:90,
    esc_points:89, training_compliance:97, initiative_score:90,
    rts_percentage:90, delivered_orders:149, returned_orders:8, for_return:2, conversion_roas:91,
    business_process_score:92, customer_score:89, people_development_score:91, financial_score:88,
    attendance_reliability:92, accountability_compliance:89, initiative_adaptability:87, extreme_self_care:85,
    weekly_insight:"Strong Excellent performance. Trending upward. Best week this quarter.",
    coaching_recommendation:"Mentor other CSRs. Share best practices.", tl_note:"", coaching_status:"On Track" },
  // ── C009 Lance
  { csr_id:"C009", year:2026, quarter:"Q2", month:"April", week_number:1,
    final_score:3.50, kra_score_percent:68, kra_scale:3.55, behavioral_score_percent:66, behavioral_scale:3.45,
    followups_rmo:73, verified_calls:74, roas_performance:76, rts_compliance:74, sales_encoding_accuracy:78, upsell_rate:71,
    attendance_kpi:83, delivery_success_rate:78, order_accuracy:76, tagging_accuracy:73,
    esc_points:74, training_compliance:83, initiative_score:72,
    rts_percentage:74, delivered_orders:104, returned_orders:20, for_return:9, conversion_roas:76,
    business_process_score:75, customer_score:73, people_development_score:74, financial_score:72,
    attendance_reliability:75, accountability_compliance:72, initiative_adaptability:69, extreme_self_care:66,
    weekly_insight:"On the monitoring threshold. Script adherence issue noted in QA audit.",
    coaching_recommendation:"Script adherence coaching. Improve follow-up rate.", tl_note:"", coaching_status:"Pending" },
  { csr_id:"C009", year:2026, quarter:"Q2", month:"May", week_number:5,
    final_score:3.58, kra_score_percent:69, kra_scale:3.62, behavioral_score_percent:68, behavioral_scale:3.54,
    followups_rmo:74, verified_calls:75, roas_performance:77, rts_compliance:75, sales_encoding_accuracy:79, upsell_rate:72,
    attendance_kpi:84, delivery_success_rate:79, order_accuracy:77, tagging_accuracy:74,
    esc_points:75, training_compliance:84, initiative_score:73,
    rts_percentage:75, delivered_orders:107, returned_orders:19, for_return:8, conversion_roas:77,
    business_process_score:76, customer_score:74, people_development_score:75, financial_score:73,
    attendance_reliability:76, accountability_compliance:73, initiative_adaptability:70, extreme_self_care:68,
    weekly_insight:"Gradual improvement. Staying in Needs Monitoring tier. More consistency needed.",
    coaching_recommendation:"Continue script coaching. Monitor RMO improvement.", tl_note:"", coaching_status:"Ongoing" },
  // ── C010 Princess
  { csr_id:"C010", year:2026, quarter:"Q2", month:"April", week_number:1,
    final_score:4.05, kra_score_percent:78, kra_scale:4.10, behavioral_score_percent:76, behavioral_scale:4.00,
    followups_rmo:79, verified_calls:81, roas_performance:81, rts_compliance:80, sales_encoding_accuracy:83, upsell_rate:77,
    attendance_kpi:87, delivery_success_rate:83, order_accuracy:81, tagging_accuracy:79,
    esc_points:79, training_compliance:87, initiative_score:78,
    rts_percentage:80, delivered_orders:120, returned_orders:16, for_return:7, conversion_roas:81,
    business_process_score:81, customer_score:79, people_development_score:80, financial_score:78,
    attendance_reliability:81, accountability_compliance:78, initiative_adaptability:76, extreme_self_care:73,
    weekly_insight:"Good performance. Slightly below Excellent. Upsell and RMO have room for improvement.",
    coaching_recommendation:"Upsell refinement. Focus on daily RMO targets.", tl_note:"", coaching_status:"On Track" },
  { csr_id:"C010", year:2026, quarter:"Q2", month:"May", week_number:5,
    final_score:4.12, kra_score_percent:79, kra_scale:4.18, behavioral_score_percent:77, behavioral_scale:4.06,
    followups_rmo:80, verified_calls:82, roas_performance:82, rts_compliance:81, sales_encoding_accuracy:84, upsell_rate:78,
    attendance_kpi:88, delivery_success_rate:84, order_accuracy:82, tagging_accuracy:80,
    esc_points:80, training_compliance:88, initiative_score:79,
    rts_percentage:81, delivered_orders:124, returned_orders:15, for_return:6, conversion_roas:82,
    business_process_score:82, customer_score:80, people_development_score:81, financial_score:79,
    attendance_reliability:82, accountability_compliance:79, initiative_adaptability:77, extreme_self_care:75,
    weekly_insight:"Consistent improvement. On track for Good tier. Push toward 4.50.",
    coaching_recommendation:"Keep up consistency. Focus on order accuracy for full marks.", tl_note:"", coaching_status:"On Track" },
  // ── C011 Rachel
  { csr_id:"C011", year:2026, quarter:"Q2", month:"April", week_number:1,
    final_score:3.15, kra_score_percent:61, kra_scale:3.20, behavioral_score_percent:59, behavioral_scale:3.10,
    followups_rmo:67, verified_calls:68, roas_performance:70, rts_compliance:68, sales_encoding_accuracy:72,
    upsell_rate:64, attendance_kpi:78, delivery_success_rate:72, order_accuracy:70, tagging_accuracy:67,
    esc_points:69, training_compliance:78, initiative_score:66,
    rts_percentage:68, delivered_orders:90, returned_orders:27, for_return:12, conversion_roas:70,
    business_process_score:69, customer_score:67, people_development_score:68, financial_score:66,
    attendance_reliability:69, accountability_compliance:65, initiative_adaptability:63, extreme_self_care:60,
    weekly_insight:"Behavioral score is below target. Focus on attendance, reliability, and compliance.",
    coaching_recommendation:"Compliance and escalation handling coaching. Review call recordings.", tl_note:"", coaching_status:"Pending" },
  { csr_id:"C011", year:2026, quarter:"Q2", month:"May", week_number:5,
    final_score:3.08, kra_score_percent:59, kra_scale:3.12, behavioral_score_percent:57, behavioral_scale:3.04,
    followups_rmo:65, verified_calls:66, roas_performance:69, rts_compliance:66, sales_encoding_accuracy:70, upsell_rate:62,
    attendance_kpi:76, delivery_success_rate:70, order_accuracy:68, tagging_accuracy:65,
    esc_points:67, training_compliance:76, initiative_score:64,
    rts_percentage:66, delivered_orders:88, returned_orders:29, for_return:13, conversion_roas:69,
    business_process_score:67, customer_score:65, people_development_score:66, financial_score:64,
    attendance_reliability:67, accountability_compliance:63, initiative_adaptability:61, extreme_self_care:58,
    weekly_insight:"Performance declined. Approaching critical zone. Immediate coaching intervention needed.",
    coaching_recommendation:"Escalate to TL-level coaching. Daily check-ins recommended.", tl_note:"", coaching_status:"Escalated" },
  // ── C012 Raine
  { csr_id:"C012", year:2026, quarter:"Q2", month:"April", week_number:1,
    final_score:4.25, kra_score_percent:82, kra_scale:4.30, behavioral_score_percent:80, behavioral_scale:4.20,
    followups_rmo:82, verified_calls:84, roas_performance:84, rts_compliance:83, sales_encoding_accuracy:86, upsell_rate:80,
    attendance_kpi:90, delivery_success_rate:86, order_accuracy:84, tagging_accuracy:82,
    esc_points:82, training_compliance:90, initiative_score:81,
    rts_percentage:83, delivered_orders:128, returned_orders:14, for_return:5, conversion_roas:84,
    business_process_score:84, customer_score:82, people_development_score:83, financial_score:81,
    attendance_reliability:84, accountability_compliance:81, initiative_adaptability:79, extreme_self_care:77,
    weekly_insight:"Good performance. All KPIs above target. RMO and delivery are strong.",
    coaching_recommendation:"Maintain current pace. Push upsell rate toward 85%.", tl_note:"", coaching_status:"On Track" },
  { csr_id:"C012", year:2026, quarter:"Q2", month:"May", week_number:5,
    final_score:4.30, kra_score_percent:83, kra_scale:4.35, behavioral_score_percent:81, behavioral_scale:4.25,
    followups_rmo:83, verified_calls:85, roas_performance:85, rts_compliance:84, sales_encoding_accuracy:87, upsell_rate:81,
    attendance_kpi:91, delivery_success_rate:87, order_accuracy:85, tagging_accuracy:83,
    esc_points:83, training_compliance:91, initiative_score:82,
    rts_percentage:84, delivered_orders:131, returned_orders:13, for_return:5, conversion_roas:85,
    business_process_score:85, customer_score:83, people_development_score:84, financial_score:82,
    attendance_reliability:85, accountability_compliance:82, initiative_adaptability:80, extreme_self_care:78,
    weekly_insight:"Improving trend. On path to Excellent. Continue strong RMO discipline.",
    coaching_recommendation:"No urgent coaching needed. Encourage initiative and self-development.", tl_note:"", coaching_status:"On Track" },
  // ── C013 Razel
  { csr_id:"C013", year:2026, quarter:"Q2", month:"April", week_number:1,
    final_score:3.88, kra_score_percent:75, kra_scale:3.92, behavioral_score_percent:73, behavioral_scale:3.84,
    followups_rmo:77, verified_calls:79, roas_performance:79, rts_compliance:78, sales_encoding_accuracy:81, upsell_rate:75,
    attendance_kpi:86, delivery_success_rate:81, order_accuracy:79, tagging_accuracy:77,
    esc_points:77, training_compliance:86, initiative_score:76,
    rts_percentage:78, delivered_orders:114, returned_orders:17, for_return:7, conversion_roas:79,
    business_process_score:79, customer_score:77, people_development_score:78, financial_score:76,
    attendance_reliability:79, accountability_compliance:76, initiative_adaptability:74, extreme_self_care:71,
    weekly_insight:"Needs monitoring. Minor tone issue noted. RMO consistency could improve.",
    coaching_recommendation:"Tone coaching and RMO target review.", tl_note:"", coaching_status:"Pending" },
  { csr_id:"C013", year:2026, quarter:"Q2", month:"May", week_number:5,
    final_score:3.95, kra_score_percent:76, kra_scale:4.00, behavioral_score_percent:74, behavioral_scale:3.90,
    followups_rmo:78, verified_calls:80, roas_performance:80, rts_compliance:79, sales_encoding_accuracy:82, upsell_rate:76,
    attendance_kpi:87, delivery_success_rate:82, order_accuracy:80, tagging_accuracy:78,
    esc_points:78, training_compliance:87, initiative_score:77,
    rts_percentage:79, delivered_orders:118, returned_orders:16, for_return:7, conversion_roas:80,
    business_process_score:80, customer_score:78, people_development_score:79, financial_score:77,
    attendance_reliability:80, accountability_compliance:77, initiative_adaptability:75, extreme_self_care:73,
    weekly_insight:"Improving. Close to Good tier. Keep up the consistency on conversions.",
    coaching_recommendation:"Focus on getting 3 more KPIs above 80% threshold.", tl_note:"", coaching_status:"On Track" },
  // ── C014 Rhea Mae
  { csr_id:"C014", year:2026, quarter:"Q2", month:"April", week_number:1,
    final_score:4.48, kra_score_percent:86, kra_scale:4.53, behavioral_score_percent:84, behavioral_scale:4.43,
    followups_rmo:86, verified_calls:89, roas_performance:89, rts_compliance:88, sales_encoding_accuracy:91, upsell_rate:84,
    attendance_kpi:94, delivery_success_rate:91, order_accuracy:89, tagging_accuracy:87,
    esc_points:86, training_compliance:94, initiative_score:87,
    rts_percentage:88, delivered_orders:139, returned_orders:10, for_return:4, conversion_roas:89,
    business_process_score:89, customer_score:87, people_development_score:88, financial_score:86,
    attendance_reliability:89, accountability_compliance:86, initiative_adaptability:84, extreme_self_care:82,
    weekly_insight:"Excellent performance. Strong delivery and attendance. Near top-tier.",
    coaching_recommendation:"Minor upsell focus to push past 4.50 final score.", tl_note:"", coaching_status:"On Track" },
  { csr_id:"C014", year:2026, quarter:"Q2", month:"May", week_number:5,
    final_score:4.52, kra_score_percent:87, kra_scale:4.57, behavioral_score_percent:85, behavioral_scale:4.47,
    followups_rmo:87, verified_calls:90, roas_performance:90, rts_compliance:89, sales_encoding_accuracy:92, upsell_rate:85,
    attendance_kpi:95, delivery_success_rate:92, order_accuracy:90, tagging_accuracy:88,
    esc_points:87, training_compliance:95, initiative_score:88,
    rts_percentage:89, delivered_orders:143, returned_orders:9, for_return:3, conversion_roas:90,
    business_process_score:90, customer_score:88, people_development_score:89, financial_score:87,
    attendance_reliability:90, accountability_compliance:87, initiative_adaptability:85, extreme_self_care:83,
    weekly_insight:"Crossed into Excellent tier! Keep it up. All category scores trending green.",
    coaching_recommendation:"Sustain current level. Potential peer mentor candidate.", tl_note:"", coaching_status:"On Track" },
  // ── C015 Venice
  { csr_id:"C015", year:2026, quarter:"Q2", month:"April", week_number:1,
    final_score:3.62, kra_score_percent:70, kra_scale:3.66, behavioral_score_percent:68, behavioral_scale:3.58,
    followups_rmo:74, verified_calls:75, roas_performance:77, rts_compliance:75, sales_encoding_accuracy:79, upsell_rate:72,
    attendance_kpi:84, delivery_success_rate:79, order_accuracy:77, tagging_accuracy:74,
    esc_points:75, training_compliance:84, initiative_score:73,
    rts_percentage:75, delivered_orders:108, returned_orders:19, for_return:8, conversion_roas:77,
    business_process_score:76, customer_score:74, people_development_score:75, financial_score:73,
    attendance_reliability:76, accountability_compliance:73, initiative_adaptability:70, extreme_self_care:68,
    weekly_insight:"Needs monitoring. Script deviation noted. RMO follow-through inconsistent.",
    coaching_recommendation:"Script adherence and RMO follow-through coaching.", tl_note:"", coaching_status:"Pending" },
  { csr_id:"C015", year:2026, quarter:"Q2", month:"May", week_number:5,
    final_score:3.70, kra_score_percent:71, kra_scale:3.74, behavioral_score_percent:69, behavioral_scale:3.66,
    followups_rmo:75, verified_calls:76, roas_performance:78, rts_compliance:76, sales_encoding_accuracy:80, upsell_rate:73,
    attendance_kpi:85, delivery_success_rate:80, order_accuracy:78, tagging_accuracy:75,
    esc_points:76, training_compliance:85, initiative_score:74,
    rts_percentage:76, delivered_orders:112, returned_orders:18, for_return:7, conversion_roas:78,
    business_process_score:77, customer_score:75, people_development_score:76, financial_score:74,
    attendance_reliability:77, accountability_compliance:74, initiative_adaptability:71, extreme_self_care:69,
    weekly_insight:"Slight improvement. Still in monitoring range. Build consistency in RMO.",
    coaching_recommendation:"Ongoing RMO coaching. Improve tagging accuracy.", tl_note:"", coaching_status:"Ongoing" },
  // ── C016 McGilbert – top performer
  { csr_id:"C016", year:2026, quarter:"Q2", month:"April", week_number:1,
    final_score:4.78, kra_score_percent:92, kra_scale:4.82, behavioral_score_percent:90, behavioral_scale:4.74,
    followups_rmo:92, verified_calls:94, roas_performance:94, rts_compliance:93, sales_encoding_accuracy:96, upsell_rate:90,
    attendance_kpi:99, delivery_success_rate:96, order_accuracy:95, tagging_accuracy:93,
    esc_points:92, training_compliance:99, initiative_score:93,
    rts_percentage:93, delivered_orders:161, returned_orders:5, for_return:1, conversion_roas:94,
    business_process_score:95, customer_score:93, people_development_score:94, financial_score:92,
    attendance_reliability:95, accountability_compliance:92, initiative_adaptability:90, extreme_self_care:88,
    weekly_insight:"Exceptional performance. Best in team. All KPIs in Excellent range.",
    coaching_recommendation:"Assign as peer mentor. Share best practices with lower-performing CSRs.", tl_note:"", coaching_status:"On Track" },
  { csr_id:"C016", year:2026, quarter:"Q2", month:"May", week_number:5,
    final_score:4.82, kra_score_percent:93, kra_scale:4.86, behavioral_score_percent:91, behavioral_scale:4.78,
    followups_rmo:93, verified_calls:95, roas_performance:95, rts_compliance:94, sales_encoding_accuracy:97, upsell_rate:91,
    attendance_kpi:100, delivery_success_rate:97, order_accuracy:96, tagging_accuracy:94,
    esc_points:93, training_compliance:100, initiative_score:94,
    rts_percentage:94, delivered_orders:167, returned_orders:4, for_return:1, conversion_roas:95,
    business_process_score:96, customer_score:94, people_development_score:95, financial_score:93,
    attendance_reliability:96, accountability_compliance:93, initiative_adaptability:91, extreme_self_care:90,
    weekly_insight:"Perfect attendance. Highest final score this quarter. Model CSR.",
    coaching_recommendation:"Continue excellence. Expand coaching role to support team peers.", tl_note:"", coaching_status:"On Track" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ASYNC DATA LAYER — simulates real API fetching with variable delays + errors
// ═══════════════════════════════════════════════════════════════════════════════

// Each section has its own simulated fetch so loading states are independent
const PAGE_FETCH_DELAYS = {
  overview: 1200,
  ranking: 900,
  kpi: 800,
  coaching: 1000,
  comparison: 700,
  team: 850,
  qa: 950,
  daily: 750,
  followup: 800,
  roadmap: 300,
  profile: 600,
};

// Simulate fetch — returns promise that resolves with data after delay
// Pass forceError=true to trigger error state for demo purposes
function simulateFetch(pageKey, forceError = false) {
  const delay = PAGE_FETCH_DELAYS[pageKey] || 800;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (forceError) {
        reject(new Error("Failed to load data. Please check your connection and try again."));
      } else {
        resolve({
          performanceData: PERFORMANCE_DATA_RAW,
          qaData: QA_DATA_RAW,
          dailyData: DAILY_DATA_RAW,
          followupData: FOLLOWUP_DATA_RAW,
          csrList: CSR_LIST,
          loadedAt: new Date().toLocaleTimeString(),
        });
      }
    }, delay);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOK: usePageData
// ═══════════════════════════════════════════════════════════════════════════════

function usePageData(pageKey) {
  const [state, setState] = useState({ status: "idle", data: null, error: null, loadedAt: null });
  const retryCountRef = useRef(0);

  const load = useCallback((forceError = false) => {
    setState({ status: "loading", data: null, error: null, loadedAt: null });
    simulateFetch(pageKey, forceError)
      .then(data => {
        retryCountRef.current = 0;
        setState({ status: "success", data, error: null, loadedAt: data.loadedAt });
      })
      .catch(err => {
        setState({ status: "error", data: null, error: err.message, loadedAt: null });
      });
  }, [pageKey]);

  const retry = useCallback(() => {
    retryCountRef.current += 1;
    load(false);
  }, [load]);

  useEffect(() => {
    load(false);
  }, [load]);

  return { ...state, retry, retryCount: retryCountRef.current };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

import './animations.css';

function SkeletonBox({ w = "100%", h = 16, r = 6, mb = 0 }) {
  return (
    <div
      className="shimmer"
      style={{ width: w, height: h, borderRadius: r, marginBottom: mb, flexShrink: 0 }}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
      <div className="flex items-start justify-between">
        <SkeletonBox w="55%" h={10} />
        <SkeletonBox w={32} h={32} r={8} />
      </div>
      <SkeletonBox w="40%" h={28} />
      <SkeletonBox w="60%" h={10} />
    </div>
  );
}

function SkeletonRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <SkeletonBox w={i === 0 ? "80%" : i === cols - 1 ? "50%" : "65%"} h={12} />
        </td>
      ))}
    </tr>
  );
}

function SkeletonTable({ rows = 6, cols = 8 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex gap-2">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} w={i === 0 ? 80 : i === 1 ? 120 : 60} h={10} />
        ))}
      </div>
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkeletonChart({ height = 220 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <SkeletonBox w="40%" h={14} mb={16} />
      <div className="flex items-end gap-2" style={{ height }}>
        {[65, 80, 55, 90, 70, 85, 60, 75, 88, 72].map((h, i) => (
          <div key={i} className="shimmer flex-1 rounded-t-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

function SkeletonMetricGrid({ count = 4 }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

// Full-page loading state with progress bar + spinner
function PageLoadingState({ pageName }) {
  return (
    <div className="p-7 space-y-6 fade-in">
      {/* Progress bar at top */}
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full progress-bar" />
      </div>

      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <SkeletonBox w={220} h={22} />
          <SkeletonBox w={300} h={13} />
        </div>
        <div className="flex gap-2">
          <SkeletonBox w={100} h={32} r={8} />
          <SkeletonBox w={100} h={32} r={8} />
        </div>
      </div>

      {/* Metric cards */}
      <SkeletonMetricGrid count={4} />

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-6">
        <SkeletonChart height={200} />
        <SkeletonChart height={200} />
      </div>

      {/* Table */}
      <SkeletonTable rows={5} cols={7} />

      {/* Centered loading indicator */}
      <div className="fixed bottom-8 right-8 bg-white rounded-2xl shadow-xl border border-gray-100 px-5 py-3 flex items-center gap-3 z-50">
        <div className="relative w-5 h-5">
          <div className="absolute inset-0 rounded-full bg-blue-200 pulse-ring" />
          <div className="relative w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent spin-slow" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700">Loading {pageName}</p>
          <div className="flex gap-1 mt-0.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 bounce-dot" style={{ animationDelay: `${i * 0.16}s` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline loading for smaller sections (charts, tables)
function InlineLoader({ label = "Fetching data…", height = 120 }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 bg-white rounded-xl border border-gray-100 fade-in"
      style={{ height }}
    >
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full bg-blue-100 pulse-ring" />
        <div className="relative w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent spin-slow" />
      </div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR STATES
// ═══════════════════════════════════════════════════════════════════════════════

function ErrorState({ error, onRetry, pageName, retryCount = 0 }) {
  const [shaking, setShaking] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShaking(false), 600);
    return () => clearTimeout(t);
  }, []);

  const isNetworkError = error?.toLowerCase().includes("network") || error?.toLowerCase().includes("connection");
  const ErrorIcon = isNetworkError ? WifiOff : ServerCrash;

  return (
    <div className="p-7 flex items-center justify-center min-h-96">
      <div className={`max-w-md w-full text-center ${shaking ? "error-shake" : "fade-in"}`}>
        <div className="w-20 h-20 rounded-3xl bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-5">
          <ErrorIcon size={32} className="text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {isNetworkError ? "Connection Lost" : "Failed to Load Data"}
        </h3>
        <p className="text-sm text-gray-500 mb-1">
          Could not load <span className="font-semibold text-gray-700">{pageName}</span>
        </p>
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-4 py-2 inline-block mb-6 font-mono">
          {error}
        </p>

        {retryCount > 0 && (
          <p className="text-xs text-amber-600 mb-3">
            Retry attempt {retryCount} failed. Check your connection.
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all"
          >
            <RotateCcw size={14} />
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 active:scale-95 transition-all"
          >
            Reload Page
          </button>
        </div>

        <div className="mt-6 p-3 bg-gray-50 rounded-xl text-left">
          <p className="text-xs font-semibold text-gray-600 mb-2">Troubleshooting:</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li className="flex items-start gap-1.5"><span className="text-gray-400 mt-0.5">•</span>Check your network connection</li>
            <li className="flex items-start gap-1.5"><span className="text-gray-400 mt-0.5">•</span>Verify the data source is accessible</li>
            <li className="flex items-start gap-1.5"><span className="text-gray-400 mt-0.5">•</span>Contact your system administrator if this persists</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Inline error for partial content failures
function InlineError({ message, onRetry, compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-xs">
        <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
        <span className="text-red-700 flex-1">{message}</span>
        {onRetry && (
          <button onClick={onRetry} className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-1">
            <RotateCcw size={11} />Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertCircle size={15} className="text-red-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-red-800">Data load failed</p>
          <p className="text-xs text-red-600">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-900 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
        >
          <RotateCcw size={11} />Retry
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA FRESHNESS INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

function DataFreshnessBar({ loadedAt, onRefresh, isRefreshing }) {
  return (
    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2">
      <div className="flex items-center gap-2 text-xs text-emerald-700">
        <CheckCircle size={13} className="text-emerald-500" />
        <span>Data loaded at <span className="font-semibold">{loadedAt}</span></span>
      </div>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw size={11} className={isRefreshing ? "spin-slow" : ""} />
        {isRefreshing ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE WRAPPER — handles loading/error/success lifecycle
// ═══════════════════════════════════════════════════════════════════════════════

function PageWrapper({ pageKey, pageName, children }) {
  const { status, data, error, retry, loadedAt, retryCount } = usePageData(pageKey);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      retry();
      setIsRefreshing(false);
    }, 800);
  }, [retry]);

  if (status === "loading") return <PageLoadingState pageName={pageName} />;
  if (status === "error") return (
    <ErrorState error={error} onRetry={retry} pageName={pageName} retryCount={retryCount} />
  );
  if (status === "success") {
    return (
      <div className="success-pop">
        <div className="px-7 pt-4">
          <DataFreshnessBar loadedAt={loadedAt} onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        </div>
        {children(data)}
      </div>
    );
  }
  return null;
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
function qaStatus(score, auditCount) {
  if (auditCount < 2) return "Missing Audit";
  if (score >= 90) return "Passed";
  if (score >= 80) return "Needs Monitoring";
  return "Needs Coaching";
}
function qaStatusColor(s) {
  return { Passed:"bg-emerald-100 text-emerald-800", "Needs Monitoring":"bg-amber-100 text-amber-800", "Needs Coaching":"bg-orange-100 text-orange-800", "Missing Audit":"bg-red-100 text-red-800" }[s] || "bg-gray-100 text-gray-700";
}
function dailyStatus(r) {
  const low = r.conversion_rate < 60;
  const missed = r.missed_followups > 0;
  const backlog = r.backlog > 8;
  if (low && missed && backlog) return "Critical";
  if (low || r.qa_flags > 1) return "Needs Coaching";
  if (missed) return "Needs Follow-up";
  return "On Track";
}
function dailyStatusColor(s) {
  return { "On Track":"bg-emerald-100 text-emerald-800", "Needs Follow-up":"bg-amber-100 text-amber-800", "Needs Coaching":"bg-orange-100 text-orange-800", Critical:"bg-red-100 text-red-800" }[s] || "bg-gray-100 text-gray-700";
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
function getCSRName(id) { return CSR_LIST.find(c=>c.csr_id===id)?.csr_name || id; }
function getCSRTeam(id) { return CSR_LIST.find(c=>c.csr_id===id)?.team || ""; }

// Weekly KPI helpers
function kpiStatus(score) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 70) return "Needs Monitoring";
  return "For Coaching";
}
function kpiStatusColor(s) {
  return { Excellent:"text-emerald-700 bg-emerald-50 border-emerald-200", Good:"text-blue-700 bg-blue-50 border-blue-200", "Needs Monitoring":"text-amber-700 bg-amber-50 border-amber-200", "For Coaching":"text-red-700 bg-red-50 border-red-200" }[s] || "text-gray-600 bg-gray-50 border-gray-200";
}
function kpiBarColor(s) {
  return { Excellent:"bg-emerald-500", Good:"bg-blue-500", "Needs Monitoring":"bg-amber-400", "For Coaching":"bg-red-500" }[s] || "bg-gray-300";
}
function kpiDot(s) {
  return { Excellent:"bg-emerald-500", Good:"bg-blue-500", "Needs Monitoring":"bg-amber-400", "For Coaching":"bg-red-500" }[s] || "bg-gray-400";
}
function ordinalWeek(n) {
  const sfx = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (sfx[(v-20)%10] || sfx[v] || sfx[0]);
}

function getAggregated(data) {
  const byCSR = {};
  data.forEach(r => {
    const info = CSR_LIST.find(c=>c.csr_id===r.csr_id);
    if (!byCSR[r.csr_id]) byCSR[r.csr_id] = { ...r, csr_name:info?.csr_name||r.csr_id, team:info?.team||"", count:1 };
    else {
      ["total_rate","kra_scale","behavioral_scale","conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score","attendance_score","esc_score"].forEach(k=>{ byCSR[r.csr_id][k]+=r[k]; });
      byCSR[r.csr_id].count++;
    }
  });
  return Object.values(byCSR).map(c=>{
    const n=c.count;
    return {...c, total_rate:+(c.total_rate/n).toFixed(2), kra_scale:+(c.kra_scale/n).toFixed(2), behavioral_scale:+(c.behavioral_scale/n).toFixed(2), conversion_score:+(c.conversion_score/n).toFixed(1), rmo_score:+(c.rmo_score/n).toFixed(1), rts_score:+(c.rts_score/n).toFixed(1), delivery_success_score:+(c.delivery_success_score/n).toFixed(1), upsell_score:+(c.upsell_score/n).toFixed(1), attendance_score:+(c.attendance_score/n).toFixed(1), esc_score:+(c.esc_score/n).toFixed(1) };
  }).sort((a,b)=>b.total_rate-a.total_rate||b.kra_scale-a.kra_scale||b.behavioral_scale-a.behavioral_scale||b.conversion_score-a.conversion_score);
}

function getCoachingIssues(r) {
  const issues=[];
  if(r.total_rate<3.50) issues.push({kpi:"Total Rate",score:r.total_rate,rec:"Structured coaching plan required"});
  if(r.kra_scale<3.50) issues.push({kpi:"KRA Scale",score:r.kra_scale,rec:"KRA improvement coaching"});
  if(r.behavioral_scale<3.50) issues.push({kpi:"Behavioral Scale",score:r.behavioral_scale,rec:"Attitude/compliance coaching"});
  if(r.conversion_score<80) issues.push({kpi:"Conversion",score:r.conversion_score,rec:"Conversion script coaching"});
  if(r.rmo_score<80) issues.push({kpi:"RMO",score:r.rmo_score,rec:"Follow-up discipline coaching"});
  if(r.rts_score<80) issues.push({kpi:"RTS",score:r.rts_score,rec:"Order verification coaching"});
  if(r.delivery_success_score<80) issues.push({kpi:"Delivery Success",score:r.delivery_success_score,rec:"Address validation coaching"});
  if(r.upsell_score<80) issues.push({kpi:"Upsell",score:r.upsell_score,rec:"Upsell technique coaching"});
  return issues;
}

const avg = (arr,key) => arr.length ? +(arr.reduce((s,r)=>s+(r[key]||0),0)/arr.length).toFixed(2) : 0;

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatusBadge({status}) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${statusColor(status)}`}>{status}</span>;
}

function MetricCard({label,value,sub,icon:Icon,color="blue",onClick,alert}) {
  const colors={blue:"bg-blue-50 text-blue-600",emerald:"bg-emerald-50 text-emerald-600",amber:"bg-amber-50 text-amber-600",red:"bg-red-50 text-red-600",purple:"bg-purple-50 text-purple-600",orange:"bg-orange-50 text-orange-600",slate:"bg-slate-50 text-slate-600",teal:"bg-teal-50 text-teal-600"};
  return(
    <div onClick={onClick} className={`bg-white rounded-xl border ${alert?"border-red-300":"border-gray-100"} p-5 ${onClick?"cursor-pointer hover:border-blue-300 hover:shadow-md transition-all":""} fade-in`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
        {Icon && <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}><Icon size={15}/></div>}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function EmptyState({quarter}) {
  return(
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><Clock size={28} className="text-gray-300"/></div>
      <p className="text-gray-600 font-semibold text-lg">No data uploaded yet for this period.</p>
      <p className="text-gray-400 text-sm mt-2">{quarter} data will appear here once uploaded.</p>
      <p className="text-gray-400 text-xs mt-1">Excel upload will be available in Version 2.</p>
    </div>
  );
}

function ExportButton({label,icon:Icon=Download}) {
  return(
    <button onClick={()=>alert("Coming in Version 2 — Export functionality will be available with the Excel/PDF export module.")}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">
      <Icon size={13}/>{label}
    </button>
  );
}

function SectionHeader({title,sub,exports=[]}) {
  return(
    <div className="flex items-start justify-between">
      <div><h2 className="text-lg font-bold text-gray-900">{title}</h2>{sub&&<p className="text-sm text-gray-500 mt-0.5">{sub}</p>}</div>
      {exports.length>0 && <div className="flex gap-2 flex-wrap">{exports.map((e,i)=><ExportButton key={i} label={e.label} icon={e.icon}/>)}</div>}
    </div>
  );
}

function FilterSelect({label,value,onChange,options}) {
  return(
    <select value={value} onChange={e=>onChange(e.target.value)}
      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-400">
      {label && <option value="All">All {label}</option>}
      {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR & HEADER
// ═══════════════════════════════════════════════════════════════════════════════

const NAV = [
  {id:"overview",   label:"Executive Overview",  icon:Home},
  {id:"ranking",    label:"CSR Ranking",          icon:BarChart2},
  {id:"kpi",        label:"KPI Breakdown",        icon:Target},
  {id:"coaching",   label:"Coaching Tracker",     icon:BookOpen},
  {id:"comparison", label:"Quarter Comparison",   icon:GitCompare},
  {id:"team",       label:"Team Performance",     icon:Layers},
  {id:"qa",         label:"QA Audit Log",         icon:ClipboardList},
  {id:"daily",      label:"Daily Scorecard",      icon:Calendar},
  {id:"followup",   label:"Follow-up Tracker",    icon:Flag},
  {id:"weekly",     label:"Weekly CSR Dashboard", icon:Star},
  {id:"roadmap",    label:"Next Build Roadmap",   icon:Rocket},
];

function Sidebar({active,onNav}) {
  return(
    <div className="w-60 min-h-screen bg-[#0d1b36] flex flex-col flex-shrink-0">
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center"><Activity size={16} className="text-white"/></div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">CSR Performance</p>
            <p className="text-blue-300 text-xs">TL Control Panel</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {NAV.map(({id,label,icon:Icon})=>(
          <button key={id} onClick={()=>onNav(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${active===id?"bg-blue-600 text-white font-semibold":"text-blue-200 hover:bg-white/10 hover:text-white"}`}>
            <Icon size={15} className="flex-shrink-0"/><span className="truncate">{label}</span>
          </button>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-blue-400 text-xs">Version 1.0 — Q2 2026</p>
        <p className="text-blue-500 text-xs mt-0.5">Mock Data Mode</p>
      </div>
    </div>
  );
}

function Header({title,subtitle}) {
  return(
    <div className="bg-white border-b border-gray-200 px-8 py-3.5 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 text-xs text-gray-400 border-r border-gray-200 pr-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>Mock Data Mode</span>
          <span>Last Updated: June 2026</span>
          <span>V1 Prototype</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Current Period</p>
          <p className="text-sm font-semibold text-gray-700">Q2 2026</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold">TL</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUTIVE OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

function ExecutiveOverviewContent({ data, onSelectCSR }) {
  const { performanceData: PERFORMANCE_DATA } = data;
  const q2 = PERFORMANCE_DATA.filter(r=>r.quarter==="Q2");
  const agg = getAggregated(q2);
  const coaching = agg.filter(r=>r.total_rate<3.50);
  const teamAvgRate = avg(agg,"total_rate");
  const kraAvg = avg(agg,"kra_scale");
  const behAvg = avg(agg,"behavioral_scale");

  const monthlyTrend = ["April","May","June"].map(m=>{
    const rows = q2.filter(r=>r.month===m);
    return {month:m.slice(0,3), avg:avg(rows,"total_rate"), kra:avg(rows,"kra_scale")};
  });

  const kpiHealth = [
    {name:"Conversion",  val:avg(q2,"conversion_score"),  target:80},
    {name:"RMO",         val:avg(q2,"rmo_score"),          target:80},
    {name:"RTS",         val:avg(q2,"rts_score"),          target:80},
    {name:"Delivery",    val:avg(q2,"delivery_success_score"), target:80},
    {name:"Upsell",      val:avg(q2,"upsell_score"),       target:80},
    {name:"ESC",         val:avg(q2,"esc_score"),          target:80},
  ];

  const top5=agg.slice(0,5);
  const bot5=agg.slice(-5).reverse();

  return(
    <div className="p-7 space-y-7">
      <SectionHeader title="Executive Overview" sub="Q2 2026 — April · May · June"
        exports={[{label:"Export PDF",icon:FileText},{label:"Monthly Summary",icon:Download}]}/>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Active CSRs"      value={agg.length}   sub="Q2 2026"               icon={Users}          color="blue"/>
        <MetricCard label="Team Avg Total Rate"    value={teamAvgRate.toFixed(2)} sub="Scale 1.00–5.00" icon={TrendingUp} color="emerald"/>
        <MetricCard label="Avg KRA Scale"          value={kraAvg.toFixed(2)} sub={`Behavioral: ${behAvg.toFixed(2)}`} icon={Target} color="purple"/>
        <MetricCard label="CSRs Needing Coaching"  value={coaching.length} sub="Below 3.50 threshold" icon={AlertTriangle}  color="orange" alert={coaching.length>3}/>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Top Performer"     value={agg[0]?.csr_name?.split(" ")[0]}  sub={`Rate: ${agg[0]?.total_rate} · ${agg[0]?.team}`} icon={Star}          color="emerald" onClick={()=>onSelectCSR(agg[0])}/>
        <MetricCard label="Lowest Performer"  value={agg[agg.length-1]?.csr_name?.split(" ")[0]} sub={`Rate: ${agg[agg.length-1]?.total_rate} · ${agg[agg.length-1]?.team}`} icon={TrendingDown} color="red" onClick={()=>onSelectCSR(agg[agg.length-1])}/>
        <MetricCard label="Avg Behavioral Scale" value={behAvg.toFixed(2)} sub="Scale 1.00–5.00" icon={UserCheck} color="blue"/>
        <MetricCard label="Current Quarter"   value="Q2 2026"              sub="April · May · June" icon={Calendar}       color="slate"/>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4"><Award size={15} className="text-emerald-500"/><h3 className="font-bold text-gray-800 text-sm">Top 5 Performers</h3></div>
          {top5.map((c,i)=>(
            <div key={c.csr_id} onClick={()=>onSelectCSR(c)} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer mb-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i===0?"bg-amber-400 text-white":i===1?"bg-gray-300 text-gray-700":i===2?"bg-orange-300 text-white":"bg-gray-100 text-gray-600"}`}>{i+1}</span>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{c.csr_name}</p><p className="text-xs text-gray-500">{c.team}</p></div>
              <div className="text-right flex-shrink-0"><p className="text-sm font-bold text-gray-900">{c.total_rate}</p><StatusBadge status={getStatus(c.total_rate)}/></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4"><TrendingDown size={15} className="text-red-500"/><h3 className="font-bold text-gray-800 text-sm">Bottom 5 Performers</h3></div>
          {bot5.map((c,i)=>(
            <div key={c.csr_id} onClick={()=>onSelectCSR(c)} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer mb-1.5">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{agg.length-i}</span>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{c.csr_name}</p><p className="text-xs text-gray-500">{c.team}</p></div>
              <div className="text-right flex-shrink-0"><p className="text-sm font-bold">{c.total_rate}</p><StatusBadge status={getStatus(c.total_rate)}/></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4"><BookOpen size={15} className="text-orange-500"/><h3 className="font-bold text-gray-800 text-sm">Coaching Priority List</h3></div>
          {coaching.length===0
            ? <p className="text-sm text-gray-400">No CSRs currently below 3.50.</p>
            : coaching.map(c=>{
                const issues=getCoachingIssues(c);
                return(
                  <div key={c.csr_id} onClick={()=>onSelectCSR(c)} className="p-2.5 rounded-lg border border-orange-100 bg-orange-50 hover:bg-orange-100 cursor-pointer mb-2">
                    <div className="flex items-center justify-between mb-1"><p className="text-sm font-semibold text-gray-800 truncate pr-2">{c.csr_name}</p><StatusBadge status={getStatus(c.total_rate)}/></div>
                    <p className="text-xs text-gray-600">{c.team} · Rate: {c.total_rate}</p>
                    <p className="text-xs text-orange-700 mt-1 font-medium">{issues[0]?.rec}</p>
                  </div>
                );
              })
          }
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">Monthly Performance Trend — Q2 2026</h3>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="month" tick={{fontSize:12}}/>
              <YAxis domain={[3,5]} tick={{fontSize:12}}/>
              <Tooltip formatter={v=>v.toFixed(2)}/>
              <Legend/>
              <Line type="monotone" dataKey="avg" name="Total Rate" stroke="#3b82f6" strokeWidth={2.5} dot={{r:4}}/>
              <Line type="monotone" dataKey="kra" name="KRA Scale"  stroke="#10b981" strokeWidth={2}   dot={{r:4}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">KPI Health Summary</h3>
          {kpiHealth.map(k=>(
            <div key={k.name} className="flex items-center gap-3 mb-3">
              <span className="text-xs text-gray-600 w-20 font-medium">{k.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${k.val>=80?"bg-emerald-500":k.val>=70?"bg-amber-400":"bg-red-500"}`} style={{width:`${Math.min(k.val,100)}%`}}/>
              </div>
              <span className={`text-xs font-bold w-12 text-right ${k.val>=80?"text-emerald-600":k.val>=70?"text-amber-600":"text-red-600"}`}>{k.val.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-4">Quarter Comparison Preview</h3>
        <div className="grid grid-cols-3 gap-4">
          {["Q2","Q3","Q4"].map(q=>(
            <div key={q} className={`rounded-xl p-4 border ${q==="Q2"?"border-blue-200 bg-blue-50":"border-gray-200 bg-gray-50"}`}>
              <p className={`text-xl font-black ${q==="Q2"?"text-blue-700":"text-gray-400"}`}>{q} 2026</p>
              <p className="text-xs text-gray-500 mt-0.5">{QUARTERS[q].join(" · ")}</p>
              {q==="Q2"
                ? <div className="mt-3 space-y-1"><p className="text-sm text-gray-700">Avg Rate: <span className="font-bold text-blue-700">{teamAvgRate.toFixed(2)}</span></p><p className="text-sm text-gray-700">CSRs: <span className="font-bold">{agg.length}</span></p><span className="inline-block mt-1 px-2 py-0.5 bg-blue-200 text-blue-800 text-xs rounded-full font-semibold">Data Available</span></div>
                : <div className="mt-3"><span className="inline-block px-2 py-0.5 bg-gray-200 text-gray-500 text-xs rounded-full">No Data Yet</span></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExecutiveOverview({onSelectCSR}) {
  return (
    <PageWrapper pageKey="overview" pageName="Executive Overview">
      {(data) => <ExecutiveOverviewContent data={data} onSelectCSR={onSelectCSR} />}
    </PageWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSR RANKING
// ═══════════════════════════════════════════════════════════════════════════════

function CSRRankingContent({ data, onSelectCSR }) {
  const { performanceData: PERFORMANCE_DATA } = data;
  const [f,setF] = useState({quarter:"Q2",month:"All",team:"All",status:"All",search:""});
  const hasData = f.quarter==="Q2";

  const filtered = useMemo(()=>{
    if(!hasData) return [];
    let d = PERFORMANCE_DATA.filter(r=>r.quarter===f.quarter);
    if(f.month!=="All") d=d.filter(r=>r.month===f.month);
    if(f.team!=="All") d=d.filter(r=>getCSRTeam(r.csr_id)===f.team);
    let agg=getAggregated(d);
    if(f.status!=="All") agg=agg.filter(r=>getStatus(r.total_rate)===f.status);
    if(f.search) agg=agg.filter(r=>r.csr_name?.toLowerCase().includes(f.search.toLowerCase()));
    return agg;
  },[f,hasData,PERFORMANCE_DATA]);

  const setFld=(k,v)=>setF(p=>({...p,[k]:v,...(k==="quarter"?{month:"All"}:{})}));

  return(
    <div className="p-7 space-y-6">
      <SectionHeader title="CSR Ranking" sub="Ranked by Total Rate (1.00–5.00 scale) · KPI Scores are 0–100%"
        exports={[{label:"Export Excel",icon:FileSpreadsheet},{label:"Export PDF",icon:FileText}]}/>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5 text-gray-400"><Filter size={13}/><span className="text-xs font-semibold uppercase tracking-wide">Filters</span></div>
          <FilterSelect value={f.quarter} onChange={v=>setFld("quarter",v)} options={["Q2","Q3","Q4"]}/>
          <FilterSelect value={f.month}   onChange={v=>setFld("month",v)} label="Months" options={QUARTERS[f.quarter]||[]}/>
          <FilterSelect value={f.team}    onChange={v=>setFld("team",v)}  label="Teams"  options={TEAMS}/>
          <FilterSelect value={f.status}  onChange={v=>setFld("status",v)} label="Statuses" options={["Excellent","Good","Needs Monitoring","For Coaching","Critical"]}/>
          <div className="relative flex-1 min-w-44">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={f.search} onChange={e=>setFld("search",e.target.value)} placeholder="Search CSR name..." className="w-full text-sm border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-400"/>
          </div>
        </div>
      </div>

      {!hasData ? <EmptyState quarter={f.quarter}/> : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
            <p className="text-xs text-blue-700"><strong>Scale note:</strong> Total Rate, KRA Scale, Behavioral Scale = 1.00–5.00 · All KPI Scores = 0–100%</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0d1b36] text-white text-xs">
                  {["#","CSR Name","Team","Total Rate","KRA Scale","Behavioral","Conversion %","RMO %","RTS %","Delivery %","Upsell %","Status",""].map(h=>(
                    <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length===0
                  ? <tr><td colSpan={13} className="text-center py-12 text-gray-400">No CSRs match current filters.</td></tr>
                  : filtered.map((c,i)=>(
                    <tr key={c.csr_id} className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${i%2===0?"bg-white":"bg-gray-50/30"}`}>
                      <td className="px-3 py-2.5 font-bold text-gray-400 text-xs">{i+1}</td>
                      <td className="px-3 py-2.5"><button onClick={()=>onSelectCSR(c)} className="text-blue-700 font-semibold hover:underline text-left whitespace-nowrap">{c.csr_name}</button></td>
                      <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap text-xs">{c.team}</td>
                      <td className="px-3 py-2.5 font-bold text-gray-900">{c.total_rate}</td>
                      <td className="px-3 py-2.5 text-gray-700">{c.kra_scale}</td>
                      <td className="px-3 py-2.5 text-gray-700">{c.behavioral_scale}</td>
                      {["conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score"].map(k=>(
                        <td key={k} className={`px-3 py-2.5 font-semibold ${c[k]<80?"text-red-600":"text-gray-700"}`}>{c[k]}%</td>
                      ))}
                      <td className="px-3 py-2.5"><StatusBadge status={getStatus(c.total_rate)}/></td>
                      <td className="px-3 py-2.5"><button onClick={()=>onSelectCSR(c)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold"><Eye size={12}/>View</button></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">Showing {filtered.length} CSRs · {f.quarter} 2026</div>
        </div>
      )}
    </div>
  );
}

function CSRRanking({onSelectCSR}) {
  return (
    <PageWrapper pageKey="ranking" pageName="CSR Ranking">
      {(data) => <CSRRankingContent data={data} onSelectCSR={onSelectCSR} />}
    </PageWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSR PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

function CSRProfileContent({ csr, data, onBack }) {
  const { performanceData: PERFORMANCE_DATA, qaData: QA_DATA, followupData: FOLLOWUP_DATA } = data;

  const csrData = PERFORMANCE_DATA.filter(r=>r.csr_id===csr.csr_id&&r.quarter==="Q2");
  const allQ2 = getAggregated(PERFORMANCE_DATA.filter(r=>r.quarter==="Q2"));
  const rank = allQ2.findIndex(r=>r.csr_id===csr.csr_id)+1;
  const monthly = ["April","May","June"].map(m=>csrData.find(r=>r.month===m)||null);
  const trendData = monthly.filter(Boolean).map(r=>({month:r.month.slice(0,3),rate:r.total_rate,kra:r.kra_scale,beh:r.behavioral_scale}));

  const apr=monthly[0], may=monthly[1], jun=monthly[2];
  const mov=(a,b)=>{if(!a||!b)return"N/A"; const d=b.total_rate-a.total_rate; return d>0.05?"Improving":d<-0.05?"Declining":"Stable";};
  const movColor=m=>m==="Improving"?"text-emerald-600":m==="Declining"?"text-red-600":"text-blue-600";
  const MovIcon=({m})=>m==="Improving"?<ArrowUp size={13}/>:m==="Declining"?<ArrowDown size={13}/>:<Minus size={13}/>;

  const kpiData=[
    {subject:"Conv",  value:csr.conversion_score,       fullMark:100},
    {subject:"RMO",   value:csr.rmo_score,               fullMark:100},
    {subject:"RTS",   value:csr.rts_score,               fullMark:100},
    {subject:"Deliv", value:csr.delivery_success_score,  fullMark:100},
    {subject:"Upsell",value:csr.upsell_score,            fullMark:100},
    {subject:"ESC",   value:csr.esc_score,               fullMark:100},
    {subject:"Attend",value:csr.attendance_score,        fullMark:100},
  ];

  const kpiScores={Conversion:csr.conversion_score,RMO:csr.rmo_score,RTS:csr.rts_score,Delivery:csr.delivery_success_score,Upsell:csr.upsell_score};
  const sorted=Object.entries(kpiScores).sort((a,b)=>b[1]-a[1]);
  const strongest=sorted[0], weakest=sorted[sorted.length-1];
  const issues=getCoachingIssues(csr);
  const status=getStatus(csr.total_rate);

  const csrQA = QA_DATA.filter(q=>q.csr_id===csr.csr_id);
  const qaAvg = csrQA.length ? +(csrQA.reduce((s,q)=>s+q.qa_score,0)/csrQA.length).toFixed(1) : "—";
  const fu = FOLLOWUP_DATA.find(f=>f.csr_id===csr.csr_id);
  const fuRate = fu ? +((fu.completed/fu.total_due)*100).toFixed(1) : null;

  return(
    <div className="p-7 space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-semibold"><ChevronRight size={15} className="rotate-180"/>Back to Ranking</button>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {(csr.csr_name||"").split(" ").map(n=>n[0]).slice(0,2).join("")}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap"><h2 className="text-xl font-bold text-gray-900">{csr.csr_name}</h2><StatusBadge status={status}/></div>
            <p className="text-gray-500 text-sm mt-1">{csr.team} · Rank #{rank} of {allQ2.length} · Q2 2026</p>
          </div>
          <div className="text-right flex-shrink-0"><p className="text-3xl font-black text-gray-900">{csr.total_rate}</p><p className="text-xs text-gray-500">Total Rate (Q2 Avg)</p></div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">KRA Scale</p><p className="text-2xl font-bold text-gray-900">{csr.kra_scale}</p></div>
          <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Behavioral Scale</p><p className="text-2xl font-bold text-gray-900">{csr.behavioral_scale}</p></div>
          <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Current Status</p><div className="mt-1"><StatusBadge status={status}/></div></div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <MetricCard label="Total QA Audits"   value={csrQA.length}           sub="June — Week 1&2"       icon={ClipboardList} color="blue"/>
        <MetricCard label="Avg QA Score"       value={qaAvg}                  sub="Target: ≥ 90"          icon={Target}        color={qaAvg>=90?"emerald":qaAvg>=80?"amber":"orange"}/>
        <MetricCard label="Follow-up Rate"     value={fuRate?`${fuRate}%`:"—"} sub="June completion rate" icon={Flag}          color={fuRate>=95?"emerald":fuRate>=80?"amber":"red"} alert={fuRate&&fuRate<80}/>
        <MetricCard label="Missed Follow-ups"  value={fu?.missed||0}           sub="June total"            icon={AlertCircle}   color="red" alert={(fu?.missed||0)>5}/>
        <MetricCard label="Coaching Status"    value={issues.length>0?"Flagged":"Clear"} sub={issues.length>0?`${issues.length} KPI issue(s)`:"No triggers"} icon={BookOpen} color={issues.length>0?"orange":"emerald"}/>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-4">Monthly Score Breakdown & Movement</h3>
        <div className="grid grid-cols-5 gap-3 mb-5">
          {["April","May","June"].map((m)=>{
            const row=monthly.find(r=>r?.month===m);
            return(
              <div key={m} className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 font-semibold">{m}</p>
                <p className="text-2xl font-black text-blue-900 mt-1">{row?.total_rate||"—"}</p>
                <p className="text-xs text-blue-500">Q2 2026</p>
              </div>
            );
          })}
          {["Q3 (Jul–Sep)","Q4 (Oct–Dec)"].map(q=>(
            <div key={q} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-400 font-semibold">{q}</p>
              <p className="text-xs text-gray-400 mt-2">No data yet</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[["Apr → May",mov(apr,may)],["May → Jun",mov(may,jun)],["Q2 Direction",mov(apr,jun)]].map(([label,m])=>(
            <div key={label} className={`flex items-center gap-2 p-3 rounded-lg ${m==="Improving"?"bg-emerald-50 border border-emerald-100":m==="Declining"?"bg-red-50 border border-red-100":"bg-blue-50 border border-blue-100"}`}>
              <span className={movColor(m)}><MovIcon m={m}/></span>
              <div><p className="text-xs text-gray-500">{label}</p><p className={`text-sm font-bold ${movColor(m)}`}>{m}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="month" tick={{fontSize:11}}/>
              <YAxis domain={[2.5,5]} tick={{fontSize:11}}/>
              <Tooltip formatter={v=>v.toFixed(2)}/>
              <Legend/>
              <Line type="monotone" dataKey="rate" name="Total Rate"  stroke="#3b82f6" strokeWidth={2.5} dot={{r:4}}/>
              <Line type="monotone" dataKey="kra"  name="KRA"         stroke="#10b981" strokeWidth={2}   dot={{r:3}} strokeDasharray="5 5"/>
              <Line type="monotone" dataKey="beh"  name="Behavioral"  stroke="#8b5cf6" strokeWidth={2}   dot={{r:3}} strokeDasharray="3 3"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">KPI Breakdown Radar</h3>
          <ResponsiveContainer width="100%" height={190}>
            <RadarChart data={kpiData}>
              <PolarGrid/>
              <PolarAngleAxis dataKey="subject" tick={{fontSize:10}}/>
              <PolarRadiusAxis domain={[0,100]} tick={{fontSize:9}}/>
              <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Zap size={14} className="text-emerald-600"/><p className="text-xs font-bold text-emerald-700 uppercase">Strongest KPI</p></div>
          <p className="text-xl font-black text-emerald-900">{strongest[0]}</p><p className="text-sm text-emerald-700 font-semibold">{strongest[1]}%</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><AlertCircle size={14} className="text-red-600"/><p className="text-xs font-bold text-red-700 uppercase">Weakest KPI</p></div>
          <p className="text-xl font-black text-red-900">{weakest[0]}</p><p className="text-sm text-red-700 font-semibold">{weakest[1]}%</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><BookOpen size={14} className="text-blue-600"/><p className="text-xs font-bold text-blue-700 uppercase">Primary Focus</p></div>
          <p className="text-sm font-bold text-blue-900">{issues[0]?.rec||"Maintain current performance"}</p>
        </div>
      </div>

      {csrQA.length>0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-3">QA Audit Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-50 text-gray-500">{["Chat Ref","Week","Score","Script","Tone","Issue","Status"].map(h=><th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {csrQA.slice(0,4).map(q=>{
                  const s=qaStatus(q.qa_score,2);
                  return(
                    <tr key={q.qa_id} className="border-b border-gray-50">
                      <td className="px-3 py-2 font-mono">{q.chat_ref}</td>
                      <td className="px-3 py-2">{q.week}</td>
                      <td className={`px-3 py-2 font-bold ${q.qa_score>=90?"text-emerald-600":q.qa_score>=80?"text-amber-600":"text-red-600"}`}>{q.qa_score}</td>
                      <td className="px-3 py-2">{q.script_compliance}%</td>
                      <td className="px-3 py-2">{q.tone_score}%</td>
                      <td className="px-3 py-2 text-gray-500">{q.issue_found}</td>
                      <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${qaStatusColor(s)}`}>{s}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {issues.length>0 && (
        <div className="bg-white rounded-xl border border-orange-200 p-5">
          <div className="flex items-center gap-2 mb-4"><AlertTriangle size={14} className="text-orange-500"/><h3 className="font-bold text-gray-800 text-sm">Coaching Recommendations</h3></div>
          {issues.map((issue,i)=>(
            <div key={i} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg mb-2">
              <span className="w-5 h-5 rounded-full bg-orange-400 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i+1}</span>
              <div><p className="text-sm font-semibold text-gray-800">{issue.kpi} — {issue.score}</p><p className="text-xs text-orange-700">{issue.rec}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CSRProfile({csr, onBack}) {
  return (
    <PageWrapper pageKey="profile" pageName={`${csr.csr_name}'s Profile`}>
      {(data) => <CSRProfileContent csr={csr} data={data} onBack={onBack} />}
    </PageWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KPI BREAKDOWN
// ═══════════════════════════════════════════════════════════════════════════════

function KPIBreakdownContent({ data }) {
  const { performanceData: PERFORMANCE_DATA } = data;
  const [f,setF]=useState({quarter:"Q2",month:"All",team:"All",csr:"All"});
  const filtData=useMemo(()=>{
    if(f.quarter!=="Q2") return [];
    let d=PERFORMANCE_DATA.filter(r=>r.quarter===f.quarter);
    if(f.month!=="All") d=d.filter(r=>r.month===f.month);
    if(f.team!=="All") d=d.filter(r=>getCSRTeam(r.csr_id)===f.team);
    if(f.csr!=="All") d=d.filter(r=>getCSRName(r.csr_id)===f.csr);
    return d;
  },[f,PERFORMANCE_DATA]);

  const allCSRNames=[...new Set(CSR_LIST.map(c=>c.csr_name))].sort();
  const cats=[
    {name:"Conversion",    key:"conversion_score",       target:80},
    {name:"RMO",           key:"rmo_score",               target:80},
    {name:"RTS",           key:"rts_score",               target:80},
    {name:"Delivery",      key:"delivery_success_score",  target:80},
    {name:"Upsell",        key:"upsell_score",            target:80},
    {name:"ESC",           key:"esc_score",               target:80},
    {name:"Attendance",    key:"attendance_score",        target:90},
  ];
  const chartData=cats.map(c=>({name:c.name,avg:avg(filtData,c.key),target:c.target}));
  const best=[...cats].sort((a,b)=>avg(filtData,b.key)-avg(filtData,a.key))[0];
  const worst=[...cats].sort((a,b)=>avg(filtData,a.key)-avg(filtData,b.key))[0];

  return(
    <div className="p-7 space-y-6">
      <SectionHeader title="KPI Breakdown" sub="Category-level performance analysis · All scores 0–100%"/>
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-gray-400"/>
        <FilterSelect value={f.quarter} onChange={v=>setF(p=>({...p,quarter:v,month:"All"}))} options={["Q2","Q3","Q4"]}/>
        <FilterSelect value={f.month}   onChange={v=>setF(p=>({...p,month:v}))} label="Months" options={QUARTERS[f.quarter]||[]}/>
        <FilterSelect value={f.team}    onChange={v=>setF(p=>({...p,team:v}))}  label="Teams"  options={TEAMS}/>
        <FilterSelect value={f.csr}     onChange={v=>setF(p=>({...p,csr:v}))}   label="CSRs"   options={allCSRNames}/>
      </div>
      {f.quarter!=="Q2" ? <EmptyState quarter={f.quarter}/> : (
        <>
          <div className="grid grid-cols-3 gap-5">
            <MetricCard label="Best Category"   value={best?.name}  sub={`${avg(filtData,best?.key).toFixed(1)}% avg`}  icon={Star}          color="emerald"/>
            <MetricCard label="Weakest Category" value={worst?.name} sub={`${avg(filtData,worst?.key).toFixed(1)}% avg`} icon={AlertTriangle}  color="red"/>
            <MetricCard label="Records Analyzed" value={filtData.length} sub={`${f.quarter} · ${f.month} · ${f.team}`} icon={BarChart2}       color="blue"/>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-4">KPI Average vs Target</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="name" tick={{fontSize:11}}/>
                <YAxis domain={[0,100]} tick={{fontSize:11}}/>
                <Tooltip formatter={v=>`${v}%`}/>
                <Legend/>
                <Bar dataKey="avg" name="Team Avg" fill="#3b82f6" radius={[4,4,0,0]}/>
                <Bar dataKey="target" name="Target" fill="#e5e7eb" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
            <table className="w-full text-sm">
              <thead><tr className="bg-[#0d1b36] text-white text-xs">{["KPI Category","Target","Team Avg","CSRs Below Target","Health","Progress"].map(h=><th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {cats.map((c,i)=>{
                  const a=avg(filtData,c.key);
                  const below=[...new Set(filtData.filter(r=>r[c.key]<c.target).map(r=>r.csr_id))].length;
                  const health=a>=c.target?"On Target":a>=c.target-10?"Near Target":"Below Target";
                  return(
                    <tr key={c.name} className={`border-b border-gray-50 ${i%2===0?"bg-white":"bg-gray-50/30"}`}>
                      <td className="px-5 py-3 font-semibold text-gray-800">{c.name}</td>
                      <td className="px-5 py-3 text-gray-600">{c.target}%</td>
                      <td className={`px-5 py-3 font-bold ${a>=c.target?"text-emerald-700":a>=c.target-10?"text-amber-700":"text-red-700"}`}>{a.toFixed(1)}%</td>
                      <td className="px-5 py-3">{below>0?<span className="text-red-600 font-semibold">{below} CSR{below!==1?"s":""}</span>:<span className="text-emerald-600 font-semibold">None</span>}</td>
                      <td className="px-5 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${health==="On Target"?"bg-emerald-100 text-emerald-800":health==="Near Target"?"bg-amber-100 text-amber-800":"bg-red-100 text-red-800"}`}>{health}</span></td>
                      <td className="px-5 py-3 w-36"><div className="bg-gray-100 rounded-full h-2"><div className={`h-2 rounded-full ${a>=c.target?"bg-emerald-500":a>=c.target-10?"bg-amber-400":"bg-red-500"}`} style={{width:`${Math.min(a,100)}%`}}/></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function KPIBreakdown() {
  return (
    <PageWrapper pageKey="kpi" pageName="KPI Breakdown">
      {(data) => <KPIBreakdownContent data={data} />}
    </PageWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COACHING TRACKER
// ═══════════════════════════════════════════════════════════════════════════════

const COACHING_STATUS_OPTIONS=["Pending","Ongoing","Done","Improved","No Improvement","Escalated"];
const COACHING_STATUS_COLORS={Pending:"bg-gray-100 text-gray-700",Ongoing:"bg-blue-100 text-blue-800",Done:"bg-emerald-100 text-emerald-800",Improved:"bg-teal-100 text-teal-800","No Improvement":"bg-red-100 text-red-800",Escalated:"bg-purple-100 text-purple-800"};

function CoachingTrackerContent({ data }) {
  const { performanceData: PERFORMANCE_DATA } = data;
  const agg=getAggregated(PERFORMANCE_DATA.filter(r=>r.quarter==="Q2"));
  const [statuses,setStatuses]=useState({});
  const [results,setResults]=useState({});
  const [f,setF]=useState({priority:"All",team:"All",status:"All",kpi:"All"});

  const coachingList=useMemo(()=>{
    const list=[];
    agg.forEach(csr=>{
      const issues=getCoachingIssues(csr);
      if(issues.length>0){
        const priority=csr.total_rate<3.00?"Critical":csr.total_rate<3.50?"High":"Medium";
        list.push({csr,issues,priority});
      }
    });
    return list.sort((a,b)=>({Critical:0,High:1,Medium:2}[a.priority]-{Critical:0,High:1,Medium:2}[b.priority]));
  },[agg]);

  const filtered=coachingList.filter(({csr,issues,priority})=>{
    if(f.priority!=="All"&&priority!==f.priority) return false;
    if(f.team!=="All"&&csr.team!==f.team) return false;
    if(f.status!=="All"&&(statuses[`${csr.csr_id}-status`]||"Pending")!==f.status) return false;
    if(f.kpi!=="All"&&!issues.some(i=>i.kpi===f.kpi)) return false;
    return true;
  });

  const counts=st=>filtered.filter(({csr})=>(statuses[`${csr.csr_id}-status`]||"Pending")===st).length;
  const today=new Date(); today.setDate(today.getDate()+14);
  const fu=today.toISOString().split("T")[0];
  const pColor={Critical:"bg-red-100 text-red-800 border-red-300",High:"bg-orange-100 text-orange-800 border-orange-300",Medium:"bg-amber-100 text-amber-800 border-amber-300"};

  return(
    <div className="p-7 space-y-6">
      <SectionHeader title="Coaching Tracker" sub="Auto-generated from KPI trigger rules · Q2 2026"
        exports={[{label:"Download Coaching List",icon:Download}]}/>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Pending Coaching"    value={counts("Pending")}    icon={Clock}        color="amber"/>
        <MetricCard label="Ongoing Coaching"    value={counts("Ongoing")}    icon={RefreshCw}    color="blue"/>
        <MetricCard label="Improved After"      value={counts("Improved")}   icon={TrendingUp}   color="emerald"/>
        <MetricCard label="Escalated Cases"     value={counts("Escalated")}  icon={AlertTriangle} color="red" alert={counts("Escalated")>0}/>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-gray-400"/>
        <FilterSelect value={f.priority} onChange={v=>setF(p=>({...p,priority:v}))} label="Priority" options={["Critical","High","Medium"]}/>
        <FilterSelect value={f.team}     onChange={v=>setF(p=>({...p,team:v}))}     label="Teams"    options={TEAMS}/>
        <FilterSelect value={f.status}   onChange={v=>setF(p=>({...p,status:v}))}   label="Statuses" options={COACHING_STATUS_OPTIONS}/>
        <FilterSelect value={f.kpi}      onChange={v=>setF(p=>({...p,kpi:v}))}      label="KPI Issues" options={["Total Rate","KRA Scale","Behavioral Scale","Conversion","RMO","RTS","Delivery Success","Upsell"]}/>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#0d1b36] text-white">
                {["Priority","CSR Name","Team","KPI Issue","Score","Root Cause","Recommendation","Coaching Owner","Coach Date","Follow-up","Before","After","Result","Status"].map(h=>(
                  <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={14} className="text-center py-12 text-gray-400">No records match current filters.</td></tr>
                : filtered.map(({csr,issues,priority},idx)=>(
                    issues.map((issue,ii)=>(
                      <tr key={`${csr.csr_id}-${ii}`} className={`border-b border-gray-50 ${idx%2===0?"bg-white":"bg-gray-50/20"}`}>
                        {ii===0&&<td rowSpan={issues.length} className="px-3 py-2.5 align-top"><span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${pColor[priority]}`}>{priority}</span></td>}
                        {ii===0&&<td rowSpan={issues.length} className="px-3 py-2.5 align-top font-semibold text-gray-800 whitespace-nowrap">{csr.csr_name}</td>}
                        {ii===0&&<td rowSpan={issues.length} className="px-3 py-2.5 align-top text-gray-600 whitespace-nowrap">{csr.team}</td>}
                        <td className="px-3 py-2.5 font-semibold text-gray-700">{issue.kpi}</td>
                        <td className={`px-3 py-2.5 font-bold ${priority==="Critical"?"text-red-600":priority==="High"?"text-orange-600":"text-amber-600"}`}>{issue.score}</td>
                        <td className="px-3 py-2.5 text-gray-500 max-w-28">{issue.kpi==="Conversion"?"Script gap":issue.kpi==="RMO"?"Low follow-through":issue.kpi==="Behavioral Scale"?"Compliance concern":"Performance gap"}</td>
                        <td className="px-3 py-2.5 text-gray-600 max-w-36">{issue.rec}</td>
                        {ii===0&&<td rowSpan={issues.length} className="px-3 py-2.5 align-top whitespace-nowrap text-gray-600">{TL_MAP[csr.team]}</td>}
                        {ii===0&&<td rowSpan={issues.length} className="px-3 py-2.5 align-top text-gray-400 whitespace-nowrap">—</td>}
                        {ii===0&&<td rowSpan={issues.length} className="px-3 py-2.5 align-top text-gray-400 whitespace-nowrap">{fu}</td>}
                        {ii===0&&<td rowSpan={issues.length} className="px-3 py-2.5 align-top font-bold text-gray-900">{csr.total_rate}</td>}
                        {ii===0&&<td rowSpan={issues.length} className="px-3 py-2.5 align-top text-gray-400">—</td>}
                        {ii===0&&<td rowSpan={issues.length} className="px-3 py-2.5 align-top"><input placeholder="Note..." className="text-xs border border-gray-200 rounded px-2 py-1 w-24 focus:outline-none focus:border-blue-400" value={results[csr.csr_id]||""} onChange={e=>setResults(p=>({...p,[csr.csr_id]:e.target.value}))}/></td>}
                        {ii===0&&<td rowSpan={issues.length} className="px-3 py-2.5 align-top">
                          <select value={statuses[`${csr.csr_id}-status`]||"Pending"} onChange={e=>setStatuses(p=>({...p,[`${csr.csr_id}-status`]:e.target.value}))} className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white focus:outline-none">
                            {COACHING_STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                          </select>
                        </td>}
                      </tr>
                    ))
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CoachingTracker() {
  return (
    <PageWrapper pageKey="coaching" pageName="Coaching Tracker">
      {(data) => <CoachingTrackerContent data={data} />}
    </PageWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUARTER COMPARISON
// ═══════════════════════════════════════════════════════════════════════════════

function QuarterComparisonContent({ data }) {
  const { performanceData: PERFORMANCE_DATA } = data;
  const q2Agg=getAggregated(PERFORMANCE_DATA.filter(r=>r.quarter==="Q2"));
  const teamQ2=TEAMS.map(t=>{const r=q2Agg.filter(c=>c.team===t);return{team:t.replace("Team ",""),avg:r.length?avg(r,"total_rate"):0};});
  const mov=(q2,q3)=>{if(!q3)return"No Data";const d=q3-q2;return d>0.05?"Improving":d<-0.05?"Declining":"Consistent";};
  const movIcon=m=>m==="Improving"?<ArrowUp size={11}/>:m==="Declining"?<ArrowDown size={11}/>:m==="Consistent"?<Minus size={11}/>:null;
  const movColor=m=>m==="Improving"?"text-emerald-700 bg-emerald-50":m==="Declining"?"text-red-700 bg-red-50":m==="Consistent"?"text-blue-700 bg-blue-50":"text-gray-400 bg-gray-50";

  return(
    <div className="p-7 space-y-6">
      <SectionHeader title="Quarter Comparison" sub="Q2 · Q3 · Q4 — 2026"
        exports={[{label:"Export Excel",icon:FileSpreadsheet}]}/>
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-blue-600 text-white rounded-xl p-5">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Q2 2026</p>
          <p className="text-xl font-black mt-1">April · May · June</p>
          <p className="text-blue-200 text-sm mt-2">{q2Agg.length} CSRs · Data Available</p>
          <div className="mt-3 pt-3 border-t border-blue-500">
            <p className="text-xs text-blue-200">Team Avg Rate</p>
            <p className="text-2xl font-black">{avg(q2Agg,"total_rate").toFixed(2)}</p>
          </div>
        </div>
        {["Q3","Q4"].map(q=>(
          <div key={q} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-gray-400 text-xs font-semibold uppercase">{q} 2026</p>
            <p className="text-xl font-bold text-gray-400 mt-1">{QUARTERS[q].join(" · ")}</p>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
              <Clock size={18} className="text-gray-300 mx-auto mb-2"/>
              <p className="text-sm text-gray-400 font-medium">No data uploaded yet.</p>
              <p className="text-xs text-gray-400 mt-1">Upload available in Version 2.</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 text-sm">CSR Quarter Comparison Table</h3>
          <p className="text-xs text-gray-500 mt-0.5">Q3 and Q4 columns will populate once data is uploaded</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0d1b36] text-white text-xs">
                {["CSR Name","Team","Q2 Rate","Q3 Rate","Q4 Rate","Trend","Status","Coaching Priority"].map(h=>(
                  <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q2Agg.map((c,i)=>{
                const trend=mov(c.total_rate,null);
                const needsCoaching=getCoachingIssues(c).length>0;
                return(
                  <tr key={c.csr_id} className={`border-b border-gray-50 ${i%2===0?"bg-white":"bg-gray-50/30"}`}>
                    <td className="px-4 py-2.5 font-semibold text-gray-800">{c.csr_name}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{c.team}</td>
                    <td className="px-4 py-2.5 font-bold text-blue-700">{c.total_rate}</td>
                    <td className="px-4 py-2.5 text-gray-400 italic text-xs">—</td>
                    <td className="px-4 py-2.5 text-gray-400 italic text-xs">—</td>
                    <td className="px-4 py-2.5">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${movColor(trend)}`}>{movIcon(trend)}{trend}</span>
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge status={getStatus(c.total_rate)}/></td>
                    <td className="px-4 py-2.5">
                      {needsCoaching
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">Needs Coaching</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">On Track</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-4">Team Average by Quarter — Q2 Available</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={teamQ2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
            <XAxis dataKey="team" tick={{fontSize:11}}/>
            <YAxis domain={[0,5]} tick={{fontSize:11}}/>
            <Tooltip formatter={v=>v.toFixed(2)}/>
            <Bar dataKey="avg" name="Q2 Avg Rate" fill="#3b82f6" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function QuarterComparison() {
  return (
    <PageWrapper pageKey="comparison" pageName="Quarter Comparison">
      {(data) => <QuarterComparisonContent data={data} />}
    </PageWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════════

function TeamPerformanceContent({ data }) {
  const { performanceData: PERFORMANCE_DATA, qaData: QA_DATA } = data;
  const q2Agg=getAggregated(PERFORMANCE_DATA.filter(r=>r.quarter==="Q2"));
  const teamStats=TEAMS.map(team=>{
    const members=q2Agg.filter(c=>c.team===team);
    const sorted=[...members].sort((a,b)=>b.total_rate-a.total_rate);
    const qaForTeam=QA_DATA.filter(q=>getCSRTeam(q.csr_id)===team);
    const qaAvgScore=qaForTeam.length?avg(qaForTeam,"qa_score"):0;
    return{
      team,members:members.length,
      avgRate:avg(members,"total_rate"),avgKRA:avg(members,"kra_scale"),avgBeh:avg(members,"behavioral_scale"),
      avgConv:avg(members,"conversion_score"),avgQA:+qaAvgScore.toFixed(1),avgRMO:avg(members,"rmo_score"),avgDel:avg(members,"delivery_success_score"),
      coaching:members.filter(c=>getCoachingIssues(c).length>0).length,
      top:sorted[0]?.csr_name?.split(" ")[0]||"—",lowest:sorted[sorted.length-1]?.csr_name?.split(" ")[0]||"—",
    };
  });
  const bestTeam=[...teamStats].sort((a,b)=>b.avgRate-a.avgRate)[0];
  const worstTeam=[...teamStats].sort((a,b)=>a.avgRate-b.avgRate)[0];
  const barData=teamStats.map(t=>({name:t.team.replace("Team ",""),rate:t.avgRate,conv:t.avgConv,qa:t.avgQA}));
  const coachingData=teamStats.map(t=>({name:t.team.replace("Team ",""),count:t.coaching}));

  return(
    <div className="p-7 space-y-6">
      <SectionHeader title="Team Performance" sub="Team-level comparison · Q2 2026"/>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Best Performing Team"   value={bestTeam?.team.replace("Team ","")}  sub={`Avg Rate: ${bestTeam?.avgRate?.toFixed(2)}`} icon={Award}        color="emerald"/>
        <MetricCard label="Lowest Performing Team" value={worstTeam?.team.replace("Team ","")} sub={`Avg Rate: ${worstTeam?.avgRate?.toFixed(2)}`} icon={AlertTriangle} color="red"/>
        <MetricCard label="Overall Team Avg Rate"  value={avg(q2Agg,"total_rate").toFixed(2)}  sub="All teams combined"                          icon={TrendingUp}    color="blue"/>
        <MetricCard label="CSRs Needing Coaching"  value={q2Agg.filter(c=>getCoachingIssues(c).length>0).length} sub="Across all teams"         icon={BookOpen}      color="orange"/>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">Team Average Total Rate</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="name" tick={{fontSize:11}}/>
              <YAxis domain={[0,5]} tick={{fontSize:11}}/>
              <Tooltip formatter={v=>v.toFixed(2)}/>
              <Bar dataKey="rate" name="Avg Rate" radius={[4,4,0,0]}>
                {barData.map((e,i)=><Cell key={i} fill={e.rate>=4.50?"#10b981":e.rate>=4.00?"#3b82f6":e.rate>=3.50?"#f59e0b":"#ef4444"}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">CSRs Needing Coaching per Team</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={coachingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="name" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}} allowDecimals={false}/>
              <Tooltip/>
              <Bar dataKey="count" name="Coaching Count" fill="#f97316" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0d1b36] text-white text-xs">
                {["Team","CSRs","Avg Rate","KRA","Behavioral","Conversion %","QA Score","RMO %","Delivery %","Coaching","Top CSR","Lowest CSR","Status"].map(h=>(
                  <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teamStats.map((t,i)=>(
                <tr key={t.team} className={`border-b border-gray-50 ${i%2===0?"bg-white":"bg-gray-50/30"}`}>
                  <td className="px-3 py-3 font-bold text-gray-800">{t.team}</td>
                  <td className="px-3 py-3 text-gray-600">{t.members}</td>
                  <td className={`px-3 py-3 font-bold ${t.avgRate>=4.50?"text-emerald-700":t.avgRate>=4.00?"text-blue-700":t.avgRate>=3.50?"text-amber-700":"text-red-700"}`}>{t.avgRate.toFixed(2)}</td>
                  <td className="px-3 py-3 text-gray-700">{t.avgKRA.toFixed(2)}</td>
                  <td className="px-3 py-3 text-gray-700">{t.avgBeh.toFixed(2)}</td>
                  <td className={`px-3 py-3 font-semibold ${t.avgConv<80?"text-red-600":"text-gray-700"}`}>{t.avgConv.toFixed(1)}%</td>
                  <td className={`px-3 py-3 font-semibold ${t.avgQA<80?"text-red-600":"text-gray-700"}`}>{t.avgQA}%</td>
                  <td className={`px-3 py-3 font-semibold ${t.avgRMO<80?"text-red-600":"text-gray-700"}`}>{t.avgRMO.toFixed(1)}%</td>
                  <td className={`px-3 py-3 font-semibold ${t.avgDel<80?"text-red-600":"text-gray-700"}`}>{t.avgDel.toFixed(1)}%</td>
                  <td className="px-3 py-3">{t.coaching>0?<span className="text-orange-600 font-bold">{t.coaching}</span>:<span className="text-emerald-600 font-semibold">0</span>}</td>
                  <td className="px-3 py-3 text-emerald-700 font-semibold text-xs">{t.top}</td>
                  <td className="px-3 py-3 text-red-600 font-semibold text-xs">{t.lowest}</td>
                  <td className="px-3 py-3"><StatusBadge status={getStatus(t.avgRate)}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TeamPerformance() {
  return (
    <PageWrapper pageKey="team" pageName="Team Performance">
      {(data) => <TeamPerformanceContent data={data} />}
    </PageWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QA AUDIT LOG
// ═══════════════════════════════════════════════════════════════════════════════

function QAAuditLogContent({ data }) {
  const { qaData: QA_DATA } = data;
  const [f,setF]=useState({week:"All",month:"All",team:"All",csr:"All",status:"All"});

  const enriched=QA_DATA.map(q=>{
    const team=getCSRTeam(q.csr_id);
    const name=getCSRName(q.csr_id);
    const weekAudits=QA_DATA.filter(x=>x.csr_id===q.csr_id&&x.week===q.week).length;
    return{...q,team,csr_name:name,qa_status:qaStatus(q.qa_score,weekAudits)};
  });

  const filtered=enriched.filter(q=>{
    if(f.week!=="All"&&q.week!==f.week) return false;
    if(f.month!=="All"&&q.month!==f.month) return false;
    if(f.team!=="All"&&q.team!==f.team) return false;
    if(f.csr!=="All"&&q.csr_name!==f.csr) return false;
    if(f.status!=="All"&&q.qa_status!==f.status) return false;
    return true;
  });

  const totalAudits=filtered.length;
  const avgQAScore=totalAudits?+(filtered.reduce((s,q)=>s+q.qa_score,0)/totalAudits).toFixed(1):0;
  const missingAudit=[...new Set(CSR_LIST.map(c=>c.csr_id))].filter(id=>{
    const wk=f.week==="All"?"Week 1":f.week;
    const cnt=QA_DATA.filter(q=>q.csr_id===id&&q.week===wk).length;
    return cnt<2;
  }).length;
  const coachingNeeded=filtered.filter(q=>q.coaching_needed).length;
  const allNames=[...new Set(enriched.map(q=>q.csr_name))].sort();

  return(
    <div className="p-7 space-y-6">
      <SectionHeader title="QA Audit Log" sub="Minimum 2 QA audits per CSR per week required"/>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total QA Audits"        value={totalAudits}    sub="Matching current filters" icon={ClipboardList} color="blue"/>
        <MetricCard label="Average QA Score"       value={avgQAScore}     sub="Target: ≥ 90"             icon={Target}        color={avgQAScore>=90?"emerald":avgQAScore>=80?"amber":"orange"}/>
        <MetricCard label="CSRs Missing QA"        value={missingAudit}   sub="Below 2 audits this week" icon={AlertCircle}   color="red" alert={missingAudit>0}/>
        <MetricCard label="Coaching Needed (QA)"   value={coachingNeeded} sub="Score below 80"           icon={BookOpen}      color="orange"/>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-gray-400"/>
        <FilterSelect value={f.week}   onChange={v=>setF(p=>({...p,week:v}))}   label="Weeks"    options={["Week 1","Week 2","Week 3","Week 4"]}/>
        <FilterSelect value={f.month}  onChange={v=>setF(p=>({...p,month:v}))}  label="Months"   options={["April","May","June"]}/>
        <FilterSelect value={f.team}   onChange={v=>setF(p=>({...p,team:v}))}   label="Teams"    options={TEAMS}/>
        <FilterSelect value={f.csr}    onChange={v=>setF(p=>({...p,csr:v}))}    label="CSRs"     options={allNames}/>
        <FilterSelect value={f.status} onChange={v=>setF(p=>({...p,status:v}))} label="Statuses" options={["Passed","Needs Monitoring","Needs Coaching","Missing Audit"]}/>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#0d1b36] text-white">
                {["CSR Name","Team","Week","Month","Chat Ref","QA Score","Script %","Order Acc %","Tone %","Escalation %","Issue Found","Audited By","Audit Date","Coaching?","QA Status"].map(h=>(
                  <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={15} className="text-center py-12 text-gray-400">No QA records match current filters.</td></tr>
                : filtered.map((q,i)=>(
                  <tr key={q.qa_id} className={`border-b border-gray-50 ${i%2===0?"bg-white":"bg-gray-50/20"}`}>
                    <td className="px-3 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{q.csr_name}</td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{q.team}</td>
                    <td className="px-3 py-2.5 text-gray-600">{q.week}</td>
                    <td className="px-3 py-2.5 text-gray-600">{q.month}</td>
                    <td className="px-3 py-2.5 font-mono text-gray-500">{q.chat_ref}</td>
                    <td className={`px-3 py-2.5 font-bold ${q.qa_score>=90?"text-emerald-600":q.qa_score>=80?"text-amber-600":"text-red-600"}`}>{q.qa_score}</td>
                    <td className="px-3 py-2.5 text-gray-600">{q.script_compliance}%</td>
                    <td className="px-3 py-2.5 text-gray-600">{q.order_accuracy}%</td>
                    <td className="px-3 py-2.5 text-gray-600">{q.tone_score}%</td>
                    <td className="px-3 py-2.5 text-gray-600">{q.escalation_handling}%</td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-28">{q.issue_found}</td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{q.audited_by}</td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{q.audit_date}</td>
                    <td className="px-3 py-2.5">{q.coaching_needed?<span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-semibold">Yes</span>:<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">No</span>}</td>
                    <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full font-semibold ${qaStatusColor(q.qa_status)}`}>{q.qa_status}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">Showing {filtered.length} QA records</div>
      </div>
    </div>
  );
}

function QAAuditLog() {
  return (
    <PageWrapper pageKey="qa" pageName="QA Audit Log">
      {(data) => <QAAuditLogContent data={data} />}
    </PageWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DAILY SCORECARD
// ═══════════════════════════════════════════════════════════════════════════════

function DailyScorecardContent({ data }) {
  const { dailyData: DAILY_DATA } = data;
  const [f,setF]=useState({date:"All",team:"All",csr:"All",status:"All"});

  const enriched=DAILY_DATA.map(r=>{
    const info=CSR_LIST.find(c=>c.csr_id===r.csr_id);
    return{...r,csr_name:info?.csr_name||r.csr_id,team:info?.team||"",daily_status:dailyStatus(r)};
  });

  const filtered=enriched.filter(r=>{
    if(f.date!=="All"&&r.date!==f.date) return false;
    if(f.team!=="All"&&r.team!==f.team) return false;
    if(f.csr!=="All"&&r.csr_name!==f.csr) return false;
    if(f.status!=="All"&&r.daily_status!==f.status) return false;
    return true;
  });

  const totalOrders=filtered.reduce((s,r)=>s+r.orders_closed,0);
  const avgConv=filtered.length?+(filtered.reduce((s,r)=>s+r.conversion_rate,0)/filtered.length).toFixed(1):0;
  const totalMissed=filtered.reduce((s,r)=>s+r.missed_followups,0);
  const needsAttention=filtered.filter(r=>r.daily_status!=="On Track").length;
  const dates=[...new Set(DAILY_DATA.map(r=>r.date))].sort();
  const allNames=[...new Set(enriched.map(r=>r.csr_name))].sort();

  return(
    <div className="p-7 space-y-6">
      <SectionHeader title="Daily CSR Scorecard" sub="Monitor daily activity · conversation volume · follow-up discipline"/>
      <div className="grid grid-cols-5 gap-4">
        <MetricCard label="CSRs Present"         value={filtered.length} sub="In current view"      icon={Users}        color="blue"/>
        <MetricCard label="Total Orders Closed"  value={totalOrders}     sub="Across filtered data" icon={Package}      color="emerald"/>
        <MetricCard label="Avg Daily Conversion" value={`${avgConv}%`}   sub="Target: ≥ 70%"        icon={TrendingUp}   color={avgConv>=70?"emerald":"orange"}/>
        <MetricCard label="Missed Follow-ups"    value={totalMissed}     sub="Total across CSRs"    icon={AlertCircle}  color="red" alert={totalMissed>5}/>
        <MetricCard label="Needs Attention"      value={needsAttention}  sub="Not 'On Track'"       icon={Bell}         color="orange"/>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-gray-400"/>
        <FilterSelect value={f.date}   onChange={v=>setF(p=>({...p,date:v}))}   label="All Dates" options={dates.map(d=>({value:d,label:d}))}/>
        <FilterSelect value={f.team}   onChange={v=>setF(p=>({...p,team:v}))}   label="Teams"     options={TEAMS}/>
        <FilterSelect value={f.csr}    onChange={v=>setF(p=>({...p,csr:v}))}    label="CSRs"      options={allNames}/>
        <FilterSelect value={f.status} onChange={v=>setF(p=>({...p,status:v}))} label="Statuses"  options={["On Track","Needs Follow-up","Needs Coaching","Critical"]}/>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#0d1b36] text-white">
                {["Date","CSR Name","Team","Chats","Orders","Conv %","Follow-ups Done","Missed","FRT","ART","Backlog","QA Flags","Daily Status","TL Notes"].map(h=>(
                  <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={14} className="text-center py-12 text-gray-400">No daily records match current filters.</td></tr>
                : filtered.map((r,i)=>(
                  <tr key={`${r.date}-${r.csr_id}`} className={`border-b border-gray-50 ${i%2===0?"bg-white":"bg-gray-50/20"}`}>
                    <td className="px-3 py-2.5 font-mono text-gray-500 whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{r.csr_name}</td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{r.team}</td>
                    <td className="px-3 py-2.5 text-gray-700">{r.conversations}</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-800">{r.orders_closed}</td>
                    <td className={`px-3 py-2.5 font-bold ${r.conversion_rate<60?"text-red-600":r.conversion_rate<70?"text-amber-600":"text-emerald-600"}`}>{r.conversion_rate}%</td>
                    <td className="px-3 py-2.5 text-gray-700">{r.followups_completed}</td>
                    <td className={`px-3 py-2.5 font-bold ${r.missed_followups>0?"text-red-600":"text-emerald-600"}`}>{r.missed_followups}</td>
                    <td className="px-3 py-2.5 text-gray-500">{r.frt}</td>
                    <td className="px-3 py-2.5 text-gray-500">{r.art}</td>
                    <td className={`px-3 py-2.5 font-semibold ${r.backlog>8?"text-red-600":r.backlog>4?"text-amber-600":"text-gray-600"}`}>{r.backlog}</td>
                    <td className={`px-3 py-2.5 font-bold ${r.qa_flags>0?"text-red-600":"text-gray-500"}`}>{r.qa_flags}</td>
                    <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full font-semibold ${dailyStatusColor(r.daily_status)}`}>{r.daily_status}</span></td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-32">{r.tl_notes}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">Showing {filtered.length} daily records</div>
      </div>
    </div>
  );
}

function DailyScorecard() {
  return (
    <PageWrapper pageKey="daily" pageName="Daily Scorecard">
      {(data) => <DailyScorecardContent data={data} />}
    </PageWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOLLOW-UP TRACKER
// ═══════════════════════════════════════════════════════════════════════════════

function FollowUpTrackerContent({ data }) {
  const { followupData: FOLLOWUP_DATA } = data;
  const [f,setF]=useState({team:"All",csr:"All",status:"All"});

  const enriched=FOLLOWUP_DATA.map(r=>{
    const info=CSR_LIST.find(c=>c.csr_id===r.csr_id);
    const rate=+((r.completed/r.total_due)*100).toFixed(1);
    return{...r,csr_name:info?.csr_name||r.csr_id,team:info?.team||"",completion_rate:rate,status:followUpStatus(rate),flagged:r.missed>0};
  });

  const filtered=enriched.filter(r=>{
    if(f.team!=="All"&&r.team!==f.team) return false;
    if(f.csr!=="All"&&r.csr_name!==f.csr) return false;
    if(f.status!=="All"&&r.status!==f.status) return false;
    return true;
  });

  const totalDue=filtered.reduce((s,r)=>s+r.total_due,0);
  const totalCompleted=filtered.reduce((s,r)=>s+r.completed,0);
  const totalMissed=filtered.reduce((s,r)=>s+r.missed,0);
  const overallRate=totalDue?+((totalCompleted/totalDue)*100).toFixed(1):0;
  const ordersRecovered=filtered.reduce((s,r)=>s+r.orders_recovered,0);
  const revenueRecovered=filtered.reduce((s,r)=>s+r.revenue_recovered,0);
  const allNames=[...new Set(enriched.map(r=>r.csr_name))].sort();

  return(
    <div className="p-7 space-y-6">
      <SectionHeader title="Follow-up Tracker" sub="Missed follow-ups = lost revenue · June 2026"/>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Total Follow-ups Due"  value={totalDue}                    sub="June total"           icon={Flag}       color="blue"/>
        <MetricCard label="Completed Follow-ups"  value={totalCompleted}              sub="Successfully done"    icon={CheckCircle} color="emerald"/>
        <MetricCard label="Missed Follow-ups"     value={totalMissed}                 sub="Revenue risk"         icon={XCircle}    color="red" alert={totalMissed>20}/>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Completion Rate"       value={`${overallRate}%`}           sub="Target: ≥ 95%"        icon={TrendingUp} color={overallRate>=95?"emerald":overallRate>=80?"amber":"red"}/>
        <MetricCard label="Orders Recovered"      value={ordersRecovered}             sub="Via follow-ups"       icon={Package}    color="teal"/>
        <MetricCard label="Revenue Recovered"     value={`₱${revenueRecovered.toLocaleString()}`} sub="June est." icon={Briefcase} color="purple"/>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <Filter size={13} className="text-gray-400"/>
        <FilterSelect value={f.team}   onChange={v=>setF(p=>({...p,team:v}))}   label="Teams"    options={TEAMS}/>
        <FilterSelect value={f.csr}    onChange={v=>setF(p=>({...p,csr:v}))}    label="CSRs"     options={allNames}/>
        <FilterSelect value={f.status} onChange={v=>setF(p=>({...p,status:v}))} label="Statuses" options={["Excellent","On Track","Needs Monitoring","For Coaching"]}/>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0d1b36] text-white text-xs">
                {["CSR Name","Team","Total Due","Completed","Missed","Completion %","Contact Rate %","Orders Recovered","Revenue Recovered","Status","TL Action"].map(h=>(
                  <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={11} className="text-center py-12 text-gray-400">No follow-up records match current filters.</td></tr>
                : filtered.map((r,i)=>(
                  <tr key={r.csr_id} className={`border-b border-gray-50 ${i%2===0?"bg-white":"bg-gray-50/30"}`}>
                    <td className="px-3 py-3 font-semibold text-gray-800 whitespace-nowrap">{r.csr_name}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs whitespace-nowrap">{r.team}</td>
                    <td className="px-3 py-3 text-gray-700">{r.total_due}</td>
                    <td className="px-3 py-3 text-emerald-700 font-semibold">{r.completed}</td>
                    <td className={`px-3 py-3 font-bold ${r.missed>5?"text-red-600":r.missed>0?"text-amber-600":"text-emerald-600"}`}>{r.missed}</td>
                    <td className={`px-3 py-3 font-bold ${r.completion_rate>=95?"text-emerald-600":r.completion_rate>=80?"text-amber-600":"text-red-600"}`}>{r.completion_rate}%</td>
                    <td className="px-3 py-3 text-gray-600">{r.contact_rate}%</td>
                    <td className="px-3 py-3 text-gray-700">{r.orders_recovered}</td>
                    <td className="px-3 py-3 text-gray-700 font-semibold">₱{r.revenue_recovered.toLocaleString()}</td>
                    <td className="px-3 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${followUpStatusColor(r.status)}`}>{r.status}</span></td>
                    <td className="px-3 py-3">
                      {r.missed>5
                        ? <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full font-semibold">Escalate</span>
                        : r.missed>0
                          ? <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-semibold">Monitor</span>
                          : <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs rounded-full font-semibold">Keep Up</span>}
                    </td>
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

function FollowUpTracker() {
  return (
    <PageWrapper pageKey="followup" pageName="Follow-up Tracker">
      {(data) => <FollowUpTrackerContent data={data} />}
    </PageWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROADMAP
// ═══════════════════════════════════════════════════════════════════════════════

function RoadmapCard() {
  const features=[
    {icon:FileSpreadsheet, label:"Excel Upload",           desc:"Upload KPI BASIS sheet and auto-parse data"},
    {icon:BarChart2,       label:"Auto-Detect Data Blocks",desc:"Detect April, May, June blocks per CSR sheet"},
    {icon:Activity,        label:"Q3 & Q4 Imports",        desc:"Support future quarter data uploads seamlessly"},
    {icon:FileText,        label:"Export PDF Reports",     desc:"One-click PDF export for coaching reports"},
    {icon:FileSpreadsheet, label:"Export Excel Reports",   desc:"Download CSR ranking and KPI summaries"},
    {icon:UserCheck,       label:"Login by TL",            desc:"Secure TL-specific login and access control"},
    {icon:Layers,          label:"Database Connection",    desc:"Connect to PostgreSQL/Supabase for live data"},
    {icon:ClipboardList,   label:"QA Module Expansion",    desc:"Full QA audit upload and trend tracking"},
    {icon:RefreshCw,       label:"Real-time Sync",         desc:"Live data updates without page refresh"},
    {icon:Package,         label:"Normalized Data Store",  desc:"Properly structured data per CSR per period"},
  ];

  return(
    <PageWrapper pageKey="roadmap" pageName="Roadmap">
      {() => (
        <div className="p-7 space-y-7">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Next Build Roadmap</h2>
            <p className="text-sm text-gray-500 mt-1">Version 2 Planned Features · Currently in Version 1 Prototype</p>
          </div>

          <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-7 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Rocket size={20}/></div>
              <div><p className="font-black text-xl">Version 2</p><p className="text-blue-200 text-sm">Full Production Dashboard</p></div>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed">Version 2 will transform this prototype into a fully operational TL system with real data ingestion, live reports, user authentication, and complete Q3/Q4 support.</p>
            <div className="mt-4 flex gap-3 flex-wrap">
              {["Excel Upload","PDF Export","TL Login","Live Database","Q3/Q4 Import"].map(t=>(
                <span key={t} className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">{t}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map(({icon:Icon,label,desc})=>(
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 fade-in">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><Icon size={17} className="text-blue-600"/></div>
                <div><p className="font-bold text-gray-800 text-sm">{label}</p><p className="text-xs text-gray-500 mt-0.5">{desc}</p></div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5"/>
              <div>
                <p className="font-bold text-amber-900 text-sm">Current Version 1 Scope</p>
                <p className="text-amber-800 text-xs mt-1">This prototype uses <strong>mock data only</strong>. All pages, filters, charts, and tables are built and functional, but no real data is connected. Now includes async data loading simulation, skeleton screens, error boundaries, retry logic, and data freshness indicators — all ready to wire to a real API in Version 2.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-4">Version 1 → Version 2 Upgrade Path</h3>
            <div className="space-y-3">
              {[
                {step:"1",label:"Add Excel Parser",desc:"Use SheetJS to parse uploaded KPI files into normalized JSON"},
                {step:"2",label:"Connect Supabase",desc:"Replace simulateFetch() with Supabase queries per quarter"},
                {step:"3",label:"Add TL Auth",desc:"Supabase Auth + RLS so each TL sees their own team data"},
                {step:"4",label:"Real Export",desc:"jsPDF + xlsx library to export coaching lists and summaries"},
                {step:"5",label:"Q3/Q4 Module",desc:"Add upload triggers for Q3 and Q4 data with auto-detection"},
              ].map(({step,label,desc})=>(
                <div key={step} className="flex items-start gap-4">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{step}</span>
                  <div><p className="font-semibold text-gray-800 text-sm">{label}</p><p className="text-xs text-gray-500">{desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEEKLY CSR DASHBOARD — COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── FinalScoreCard ─────────────────────────────────────────────────────────
function FinalScoreCard({ d }) {
  const status = getStatus(d.final_score);
  const pct = ((d.final_score / 5) * 100).toFixed(0);
  const r = 52, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const statusRing = { Excellent:"#10b981", Good:"#3b82f6", "Needs Monitoring":"#f59e0b", "For Coaching":"#f97316", Critical:"#ef4444" }[status] || "#3b82f6";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center justify-center text-center shadow-sm">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Final Score</p>
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10"/>
          <circle cx="60" cy="60" r={r} fill="none" stroke={statusRing} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{transition:"stroke-dasharray 1s ease"}}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-gray-900">{d.final_score.toFixed(2)}</span>
          <span className="text-xs text-gray-400 font-medium">/5.00</span>
        </div>
      </div>
      <div className="mt-3">
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusColor(status)}`}>{status}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 w-full">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-xs text-blue-500 font-semibold">KRA Scale</p>
          <p className="text-xl font-black text-blue-900">{d.kra_scale.toFixed(2)}</p>
          <p className="text-xs text-blue-400">{d.kra_score_percent}%</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 text-center">
          <p className="text-xs text-purple-500 font-semibold">Behavioral</p>
          <p className="text-xl font-black text-purple-900">{d.behavioral_scale.toFixed(2)}</p>
          <p className="text-xs text-purple-400">{d.behavioral_score_percent}%</p>
        </div>
      </div>
    </div>
  );
}

// ── WeeklyScorecardHeader ──────────────────────────────────────────────────
function WeeklyScorecardHeader({ d }) {
  const status = getStatus(d.final_score);
  const initials = (d.csr_name||"").split(" ").map(n=>n[0]).slice(0,2).join("");
  const statusAccent = { Excellent:"from-emerald-600 to-emerald-900", Good:"from-blue-600 to-blue-900", "Needs Monitoring":"from-amber-500 to-amber-800", "For Coaching":"from-orange-500 to-orange-800", Critical:"from-red-600 to-red-900" }[status] || "from-blue-600 to-blue-900";

  return (
    <div className={`bg-gradient-to-r ${statusAccent} rounded-2xl p-7 text-white shadow-lg`}>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">{d.team} · {TL_MAP[d.team]}</p>
            <h1 className="text-2xl font-black text-white leading-tight mt-0.5">{(d.csr_name||"").toUpperCase()}</h1>
            <p className="text-white/80 text-sm mt-1 font-medium">
              {ordinalWeek(d.week_number)} WEEK OF {d.quarter} · {d.month} {d.year}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="px-4 py-1.5 bg-white/20 backdrop-blur rounded-full text-sm font-bold text-white border border-white/30">
            {status}
          </span>
          <p className="text-white/60 text-xs">Period: {d.quarter} {d.year}</p>
          <p className="text-white/60 text-xs">Week #{d.week_number} of Quarter</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/20">
        {[
          {label:"Final Score", val:d.final_score.toFixed(2), sub:"/ 5.00"},
          {label:"KRA Score",   val:`${d.kra_score_percent}%`, sub:`Scale ${d.kra_scale.toFixed(2)}`},
          {label:"Behavioral",  val:`${d.behavioral_score_percent}%`, sub:`Scale ${d.behavioral_scale.toFixed(2)}`},
          {label:"Week",        val:`W${d.week_number}`, sub:`${d.month} ${d.year}`},
        ].map(({label,val,sub})=>(
          <div key={label} className="text-center">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-black text-white mt-0.5">{val}</p>
            <p className="text-white/50 text-xs mt-0.5">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPIScoreGrid ────────────────────────────────────────────────────────────
function KPIScoreGrid({ d }) {
  const groups = [
    { label:"Customer", color:"blue", kpis:[
      { name:"Follow-Ups / RMO", val:d.followups_rmo },
      { name:"Verified Calls",   val:d.verified_calls },
    ]},
    { label:"Financial", color:"emerald", kpis:[
      { name:"ROAS Performance",       val:d.roas_performance },
      { name:"RTS Compliance",         val:d.rts_compliance },
      { name:"Sales Encoding Accuracy",val:d.sales_encoding_accuracy },
      { name:"Upsell Rate",            val:d.upsell_rate },
    ]},
    { label:"Business Process", color:"purple", kpis:[
      { name:"Attendance KPI",      val:d.attendance_kpi },
      { name:"Delivery Success",    val:d.delivery_success_rate },
      { name:"Order Accuracy",      val:d.order_accuracy },
      { name:"Tagging Accuracy",    val:d.tagging_accuracy },
    ]},
    { label:"People Development", color:"orange", kpis:[
      { name:"ESC Points",           val:d.esc_points },
      { name:"Training Compliance",  val:d.training_compliance },
      { name:"Initiative Score",     val:d.initiative_score },
    ]},
  ];

  const headerColors = { blue:"bg-blue-600", emerald:"bg-emerald-600", purple:"bg-purple-600", orange:"bg-orange-500" };

  return (
    <div className="grid grid-cols-2 gap-4">
      {groups.map(g=>(
        <div key={g.label} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className={`${headerColors[g.color]} px-4 py-2.5`}>
            <p className="text-white text-xs font-bold uppercase tracking-widest">{g.label}</p>
          </div>
          <div className="p-3 space-y-2">
            {g.kpis.map(k=>{
              const st = kpiStatus(k.val);
              return (
                <div key={k.name} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${kpiStatusColor(st)}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${kpiDot(st)}`}/>
                    <span className="text-xs font-semibold truncate">{k.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-sm font-black">{k.val}%</span>
                    {k.val < 70 && <span className="text-xs text-red-500 font-medium">↓ Below target</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── PerformanceBasisGrid ────────────────────────────────────────────────────
function PerformanceBasisGrid({ d }) {
  const items = [
    { label:"RTS %",                val:`${d.rts_percentage}%`,         icon:"📋" },
    { label:"Delivery Success",      val:`${d.delivery_success_rate}%`,  icon:"📦" },
    { label:"Weekly RMO Rate",       val:`${d.followups_rmo}%`,          icon:"📞" },
    { label:"ESC Points",            val:`${d.esc_points}pts`,           icon:"⭐" },
    { label:"Conversion / ROAS",     val:`${d.conversion_roas}%`,        icon:"💰" },
    { label:"Delivered Orders",      val:d.delivered_orders,             icon:"✅" },
    { label:"Returned Orders",       val:d.returned_orders,              icon:"↩️" },
    { label:"For Return",            val:d.for_return,                   icon:"🔄" },
    { label:"Upsell Rate",           val:`${d.upsell_rate}%`,            icon:"📈" },
    { label:"Attendance Score",      val:`${d.attendance_kpi}%`,         icon:"🗓️" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <p className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">📊</span>
        Performance Basis
      </p>
      <div className="grid grid-cols-5 gap-3">
        {items.map(item=>(
          <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
            <p className="text-lg mb-1">{item.icon}</p>
            <p className="text-lg font-black text-gray-900">{item.val}</p>
            <p className="text-xs text-gray-500 font-medium leading-tight mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KRABreakdownBars ────────────────────────────────────────────────────────
function KRABreakdownBars({ d }) {
  const cats = [
    { label:"Business Process",   val:d.business_process_score,    color:"purple" },
    { label:"Customer",           val:d.customer_score,             color:"blue" },
    { label:"People Development", val:d.people_development_score,  color:"orange" },
    { label:"Financial",          val:d.financial_score,            color:"emerald" },
  ];
  const barColors = { purple:"bg-purple-500", blue:"bg-blue-500", orange:"bg-orange-500", emerald:"bg-emerald-500" };
  const textColors = { purple:"text-purple-700", blue:"text-blue-700", orange:"text-orange-700", emerald:"text-emerald-700" };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-gray-800">KRA Breakdown</p>
        <span className="text-xs text-gray-400 font-medium">KRA Scale: {d.kra_scale.toFixed(2)}</span>
      </div>
      <div className="space-y-4">
        {cats.map(c=>{
          const st = kpiStatus(c.val);
          return (
            <div key={c.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-gray-700">{c.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-black ${textColors[c.color]}`}>{c.val}%</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${kpiStatusColor(st)}`}>{st}</span>
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-3 rounded-full transition-all ${barColors[c.color]}`}
                  style={{width:`${c.val}%`}}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── BehavioralBreakdownBars ─────────────────────────────────────────────────
function BehavioralBreakdownBars({ d }) {
  const behaviors = [
    { label:"Attendance & Reliability",    val:d.attendance_reliability,    icon:"🕐",
      interp: d.attendance_reliability >= 90 ? "Excellent punctuality and presence" : d.attendance_reliability >= 80 ? "Generally reliable, minor lapses" : d.attendance_reliability >= 70 ? "Some attendance concerns noted" : "Attendance needs immediate attention" },
    { label:"Accountability & Compliance", val:d.accountability_compliance,  icon:"📋",
      interp: d.accountability_compliance >= 90 ? "Highly compliant, takes ownership" : d.accountability_compliance >= 80 ? "Meets compliance standards" : d.accountability_compliance >= 70 ? "Some compliance gaps observed" : "Non-compliance issues flagged" },
    { label:"Initiative & Adaptability",   val:d.initiative_adaptability,    icon:"🚀",
      interp: d.initiative_adaptability >= 90 ? "Proactive and highly adaptable" : d.initiative_adaptability >= 80 ? "Shows initiative consistently" : d.initiative_adaptability >= 70 ? "Moderate initiative shown" : "Needs encouragement to take initiative" },
    { label:"Extreme Self-Care",           val:d.extreme_self_care,          icon:"💚",
      interp: d.extreme_self_care >= 90 ? "Strong wellbeing and self-management" : d.extreme_self_care >= 80 ? "Good work-life balance observed" : d.extreme_self_care >= 70 ? "Moderate self-care practice" : "Support needed in self-care area" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-gray-800">Behavioral Breakdown</p>
        <span className="text-xs text-gray-400 font-medium">Behavioral Scale: {d.behavioral_scale.toFixed(2)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {behaviors.map(b=>{
          const st = kpiStatus(b.val);
          const bg = { Excellent:"bg-emerald-50 border-emerald-200", Good:"bg-blue-50 border-blue-200", "Needs Monitoring":"bg-amber-50 border-amber-200", "For Coaching":"bg-red-50 border-red-200" }[st];
          const score_color = { Excellent:"text-emerald-700", Good:"text-blue-700", "Needs Monitoring":"text-amber-700", "For Coaching":"text-red-700" }[st];
          return (
            <div key={b.label} className={`rounded-xl border p-4 ${bg}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{b.icon}</span>
                  <p className="text-xs font-bold text-gray-700 leading-tight">{b.label}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className={`text-xl font-black ${score_color}`}>{b.val}%</p>
                  <p className={`text-xs font-semibold ${score_color}`}>{st}</p>
                </div>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div className={`h-1.5 rounded-full ${kpiBarColor(st)}`} style={{width:`${b.val}%`}}/>
              </div>
              <p className="text-xs text-gray-500 italic">{b.interp}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── WeeklyInsightCard ───────────────────────────────────────────────────────
function WeeklyInsightCard({ d }) {
  const status = getStatus(d.final_score);
  const accent = { Excellent:"border-emerald-300 bg-emerald-50", Good:"border-blue-300 bg-blue-50", "Needs Monitoring":"border-amber-300 bg-amber-50", "For Coaching":"border-orange-300 bg-orange-50", Critical:"border-red-300 bg-red-50" }[status] || "border-gray-200 bg-gray-50";
  const iconColor = { Excellent:"text-emerald-600", Good:"text-blue-600", "Needs Monitoring":"text-amber-600", "For Coaching":"text-orange-600", Critical:"text-red-600" }[status] || "text-gray-600";

  return (
    <div className={`rounded-2xl border-2 p-5 ${accent} shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm ${iconColor}`}>
          <Zap size={16}/>
        </div>
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${iconColor}`}>Weekly TL Insight</p>
          <p className="text-gray-800 text-sm font-semibold leading-relaxed">{d.weekly_insight}</p>
        </div>
      </div>
    </div>
  );
}

// ── CoachingRecommendationCard ──────────────────────────────────────────────
function CoachingRecommendationCard({ d, onNoteChange }) {
  const COACHING_STATUSES = ["On Track","Pending","Ongoing","Done","Improved","No Improvement","Escalated"];
  const [status, setStatus] = useState(d.coaching_status || "Pending");
  const [note, setNote] = useState(d.tl_note || "");
  const today = new Date(); today.setDate(today.getDate()+14);
  const followUpDate = today.toISOString().split("T")[0];

  const stColor = { "On Track":"bg-emerald-100 text-emerald-800", Pending:"bg-gray-100 text-gray-700", Ongoing:"bg-blue-100 text-blue-800", Done:"bg-teal-100 text-teal-800", Improved:"bg-emerald-100 text-emerald-800", "No Improvement":"bg-red-100 text-red-800", Escalated:"bg-purple-100 text-purple-800" }[status] || "bg-gray-100 text-gray-700";

  // Identify top issue KPI
  const kpis = [
    {name:"Follow-Ups / RMO", val:d.followups_rmo},
    {name:"Verified Calls", val:d.verified_calls},
    {name:"RTS Compliance", val:d.rts_compliance},
    {name:"Delivery Success", val:d.delivery_success_rate},
    {name:"Upsell Rate", val:d.upsell_rate},
    {name:"Attendance KPI", val:d.attendance_kpi},
    {name:"ESC Points", val:d.esc_points},
  ];
  const topIssue = [...kpis].sort((a,b)=>a.val-b.val)[0];

  return (
    <div className="bg-white rounded-2xl border border-orange-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center"><BookOpen size={14} className="text-orange-600"/></div>
          <p className="text-sm font-bold text-gray-800">Coaching Recommendation</p>
        </div>
        <select value={status} onChange={e=>setStatus(e.target.value)}
          className={`text-xs font-semibold px-3 py-1 rounded-full border-0 focus:outline-none cursor-pointer ${stColor}`}>
          {COACHING_STATUSES.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">Main KPI Issue</p>
          <p className="text-sm font-bold text-gray-800">{topIssue?.name}</p>
          <p className="text-xs text-red-500 font-semibold">{topIssue?.val}% — below target</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">Follow-up Date</p>
          <p className="text-sm font-bold text-gray-800">{followUpDate}</p>
          <p className="text-xs text-gray-400">2 weeks from today</p>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Recommended Action</p>
        <p className="text-sm text-gray-700">{d.coaching_recommendation}</p>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">TL Note</p>
        <textarea
          value={note} onChange={e=>{setNote(e.target.value); onNoteChange && onNoteChange(e.target.value);}}
          placeholder="Add coaching notes, observations, or follow-up actions here…"
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 focus:outline-none focus:border-blue-400 resize-none bg-gray-50"
          rows={3}/>
      </div>
    </div>
  );
}

// ── ExportPlaceholderButtons ────────────────────────────────────────────────
function ExportPlaceholderButtons() {
  const buttons = [
    { label:"Export as PNG",    icon:Download,      color:"bg-blue-600 hover:bg-blue-700 text-white" },
    { label:"Export as PDF",    icon:FileText,      color:"bg-gray-800 hover:bg-gray-900 text-white" },
    { label:"Print Scorecard",  icon:FileSpreadsheet, color:"bg-white hover:bg-gray-50 text-gray-800 border border-gray-200" },
    { label:"Copy Summary",     icon:ClipboardList, color:"bg-white hover:bg-gray-50 text-gray-800 border border-gray-200" },
  ];
  return (
    <div className="flex flex-wrap gap-3">
      {buttons.map(({label,icon:Icon,color})=>(
        <button key={label}
          onClick={()=>alert("Coming in Version 2 — Export functionality will be available with the PDF/PNG export module.")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-sm ${color}`}>
          <Icon size={14}/>{label}
        </button>
      ))}
    </div>
  );
}

// ── WeeklyCSRDashboard (main page) ──────────────────────────────────────────
function WeeklyCSRDashboard() {
  const allCSRs = CSR_LIST.map(c=>c.csr_name).sort();
  const [filters, setFilters] = useState({
    year:"2026", quarter:"Q2", month:"April", week:"1", team:"All", csr:allCSRs[0]
  });

  const setF = (k,v) => setFilters(p=>({...p,[k]:v}));

  const weeks = ["1","2","3","4","5","6"];

  const record = useMemo(()=>{
    const csrInfo = CSR_LIST.find(c=>c.csr_name===filters.csr);
    if (!csrInfo) return null;
    return WEEKLY_DATA.find(w=>
      w.csr_id === csrInfo.csr_id &&
      w.year === +filters.year &&
      w.quarter === filters.quarter &&
      w.month === filters.month &&
      w.week_number === +filters.week
    ) || null;
  }, [filters]);

  return (
    <div className="p-7 space-y-5">
      {/* Page header + export */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Weekly CSR Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Individual weekly scorecard — shareable, printable, premium</p>
        </div>
        <ExportPlaceholderButtons/>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5 text-gray-400"><Filter size={13}/><span className="text-xs font-semibold uppercase tracking-wide">Filters</span></div>
        <FilterSelect value={filters.year}    onChange={v=>setF("year",v)}    options={["2026","2027"]}/>
        <FilterSelect value={filters.quarter} onChange={v=>setF("quarter",v)} options={["Q2","Q3","Q4"]}/>
        <FilterSelect value={filters.month}   onChange={v=>setF("month",v)}   options={QUARTERS[filters.quarter]||[]}/>
        <FilterSelect value={filters.week}    onChange={v=>setF("week",v)}    options={weeks.map(w=>({value:w,label:`Week ${w}`}))}/>
        <FilterSelect value={filters.team}    onChange={v=>{setF("team",v);}} label="Teams" options={TEAMS}/>
        <select value={filters.csr} onChange={e=>setF("csr",e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-400 min-w-52">
          {CSR_LIST.filter(c=>filters.team==="All"||c.team===filters.team).map(c=>(
            <option key={c.csr_id} value={c.csr_name}>{c.csr_name}</option>
          ))}
        </select>
      </div>

      {/* No record found */}
      {!record ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><Calendar size={28} className="text-gray-300"/></div>
          <p className="text-gray-600 font-semibold text-lg">No scorecard found for this selection.</p>
          <p className="text-gray-400 text-sm mt-1">Try selecting a different CSR, week, month, or quarter.</p>
          <p className="text-gray-400 text-xs mt-1">Mock data is available for Week 1 (April) and Week 5 (May) for all CSRs.</p>
        </div>
      ) : (
        <div className="space-y-5 fade-in">
          {/* SECTION 1 — Header + Score */}
          <WeeklyScorecardHeader d={record}/>

          <div className="grid grid-cols-3 gap-5">
            <FinalScoreCard d={record}/>
            <div className="col-span-2 space-y-4">
              <WeeklyInsightCard d={record}/>
              <KRABreakdownBars d={record}/>
            </div>
          </div>

          {/* SECTION 2 — KPI Scores */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Target size={14} className="text-blue-500"/>KPI Scores by Category
            </p>
            <KPIScoreGrid d={record}/>
          </div>

          {/* SECTION 3 — Performance Basis */}
          <PerformanceBasisGrid d={record}/>

          {/* SECTION 4 — Behavioral */}
          <BehavioralBreakdownBars d={record}/>

          {/* SECTION 5 — Coaching */}
          <CoachingRecommendationCard d={record}/>

          {/* Footer watermark */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">Generated by CSR Performance Dashboard · V1 Prototype · {new Date().toLocaleDateString()}</p>
            <p className="text-xs text-gray-400">{record.team} · {TL_MAP[record.team]} · {record.quarter} {record.year}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════

const PAGE_CONFIG={
  overview:   {title:"Executive Overview",        subtitle:"Q2 2026 — April · May · June"},
  ranking:    {title:"CSR Ranking",               subtitle:"Ranked highest to lowest by Total Rate · 1.00–5.00 scale"},
  kpi:        {title:"KPI Breakdown",             subtitle:"Category-level KPI analysis"},
  coaching:   {title:"Coaching Tracker",          subtitle:"Auto-generated from KPI trigger rules"},
  comparison: {title:"Quarter Comparison",        subtitle:"Q2 · Q3 · Q4 — 2026"},
  team:       {title:"Team Performance",          subtitle:"Team-level comparison and rankings"},
  qa:         {title:"QA Audit Log",              subtitle:"Minimum 2 QA audits per CSR per week"},
  daily:      {title:"Daily CSR Scorecard",       subtitle:"Daily activity monitoring for Team Leaders"},
  followup:   {title:"Follow-up Tracker",         subtitle:"Missed follow-ups = lost revenue"},
  weekly:     {title:"Weekly CSR Dashboard",      subtitle:"Individual weekly scorecard · shareable · printable"},
  roadmap:    {title:"Next Build Roadmap",        subtitle:"Version 2 planned features and upgrade path"},
  profile:    {title:"CSR Profile",               subtitle:"Individual performance details"},
};

export default function App() {
  const [page,setPage]=useState("overview");
  const [selectedCSR,setSelectedCSR]=useState(null);

  const handleSelectCSR=(csr)=>{setSelectedCSR(csr);setPage("profile");};
  const handleNav=(id)=>{setPage(id);if(id!=="profile")setSelectedCSR(null);};

  const cfg=PAGE_CONFIG[page]||PAGE_CONFIG.overview;
  const sidebarActive=page==="profile"?"ranking":page;

  return(
    <div className="flex min-h-screen bg-gray-50 font-sans">
        <Sidebar active={sidebarActive} onNav={handleNav}/>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header title={page==="profile"&&selectedCSR?selectedCSR.csr_name:cfg.title} subtitle={cfg.subtitle}/>
          <div className="flex-1 overflow-y-auto">
            {page==="overview"   && <ExecutiveOverview onSelectCSR={handleSelectCSR}/>}
            {page==="ranking"    && <CSRRanking onSelectCSR={handleSelectCSR}/>}
            {page==="profile"    && selectedCSR && <CSRProfile csr={selectedCSR} onBack={()=>handleNav("ranking")}/>}
            {page==="kpi"        && <KPIBreakdown/>}
            {page==="coaching"   && <CoachingTracker/>}
            {page==="comparison" && <QuarterComparison/>}
            {page==="team"       && <TeamPerformance/>}
            {page==="qa"         && <QAAuditLog/>}
            {page==="daily"      && <DailyScorecard/>}
            {page==="followup"   && <FollowUpTracker/>}
            {page==="weekly"     && <WeeklyCSRDashboard/>}
            {page==="roadmap"    && <RoadmapCard/>}
          </div>
        </div>
      </div>
  );
}
