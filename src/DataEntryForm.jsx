import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "./supabaseClient";

function calcRtsPct(d,f,r){const D=parseFloat(d)||0,F=parseFloat(f)||0,R=parseFloat(r)||0,t=D+F+R;return t===0?0:(F+R)/t;}
function calcDeliverySuccessRate(d,f,r){const D=parseFloat(d)||0,F=parseFloat(f)||0,R=parseFloat(r)||0,t=D+F+R;return t===0?0:D/t;}
function calcRtsKpiScore(p){if(p<=0.15)return 1.0;if(p<=0.16)return 1.0-(p-0.15)*10;if(p<=0.17)return 0.9-(p-0.16)*10;if(p<=0.18)return 0.8-(p-0.17)*10;return Math.max(0,0.7-(p-0.18)*2);}
function calcEscKpiScore(e){const p=parseFloat(e);if(isNaN(p)||e==="")return null;if(p===0)return 0;if(p===21)return 1;if(p>=18)return 0.857+((p-18)/3)*(1-0.857);if(p>=15)return 0.714+((p-15)/3)*(0.857-0.714);if(p>=12)return 0.571+((p-12)/3)*(0.714-0.571);if(p>=9)return 0.428+((p-9)/3)*(0.571-0.428);if(p>=1)return 0.001+((p-1)/8)*(0.428-0.001);return 0;}
function calcRmoKpiScore(r){const h=(parseFloat(r)||0)>1?(parseFloat(r)||0)/100:(parseFloat(r)||0);if(h>=0.85)return 1;if(h>=0.75)return 0.9+(h-0.75)/0.1*0.1;if(h>=0.65)return 0.8+(h-0.65)/0.1*0.1;if(h>=0.55)return 0.7+(h-0.55)/0.1*0.1;return 0.5;}
function calcConversionKpiScore(j){const v=parseFloat(j)||0;if(v>=6)return 1;if(v<=1)return 0.3;return 0.3+((v-1)/5)*0.7;}
function calcDeliverySuccessKpiScore(g){const v=parseFloat(g)||0;if(v>=0.85)return 1;if(v>=0.75)return 0.9+(v-0.75)/0.1*0.1;if(v>=0.65)return 0.8+(v-0.65)/0.1*0.1;if(v>=0.55)return 0.7+(v-0.55)/0.1*0.1;return 0.5;}
function calcUpsellKpiScore(u){const k=(parseFloat(u)||0)>1?(parseFloat(u)||0)/100:(parseFloat(u)||0);if(k>=0.4)return 1;if(k>=0.35)return 0.9+(k-0.35)/0.05*0.1;if(k>=0.3)return 0.8+(k-0.3)/0.05*0.1;if(k>=0.25)return 0.7+(k-0.25)/0.05*0.1;if(k>=0.2)return 0.6+(k-0.2)/0.05*0.1;if(k>=0.15)return 0.5+(k-0.15)/0.05*0.1;if(k>=0.1)return 0.4+(k-0.1)/0.05*0.1;return 0.2;}
function kpiScoreToGrade(s){const p=s*100;if(p>=100)return 5;if(p>=90)return 4;if(p>=80)return 3;if(p>=70)return 2;return 1;}

const KPI_SECTIONS = [
  { type:"BUSINESS PROCESS", kraKey:"kra_bp", groups:[
    { id:"1.1.0", label:"Sales Performance and Order Quality Monitoring", weight:1, subs:[
      {id:"1.1.1",dbKey:"g_1_1_1",label:"Compliance to approved schedule — 0 incidents of tardiness per month",weight:0.2,kpiBasisKey:"attendanceKpiScore"},
      {id:"1.1.2",dbKey:"g_1_1_2",label:"Compliance to attendance policy — 0 incidents of AWOL or unplanned absence",weight:0.2,kpiBasisKey:"attendanceKpiScore"},
      {id:"1.1.3",dbKey:"g_1_1_3",label:"Compliance to VL Planner — 100% adherence to approved leave schedule",weight:0.2,kpiBasisKey:"attendanceKpiScore"},
      {id:"1.1.4",dbKey:"g_1_1_4",label:"Compliance to breaktime policy — 0 incidents of overbreak",weight:0.2,kpiBasisKey:"attendanceKpiScore"},
      {id:"1.1.5",dbKey:"g_1_1_5",label:"Order Risk Control Compliance — 100% adherence to verification and documentation standards",weight:0.2,kpiBasisKey:"attendanceKpiScore"},
    ]},
    { id:"2.1.0", label:"Documentation & System Compliance", weight:1, subs:[
      {id:"2.1.1",dbKey:"g_2_1_1",label:"Customer order documentation accuracy — 100% complete records in system",weight:0.2,kpiBasisKey:"attendanceKpiScore"},
      {id:"2.1.2",dbKey:"g_2_1_2",label:"Customer verification documentation — 100% documented verification calls",weight:0.2,kpiBasisKey:"attendanceKpiScore"},
      {id:"2.1.3",dbKey:"g_2_1_3",label:"Policy and process compliance — 100% adherence to order processing guidelines",weight:0.2,kpiBasisKey:"attendanceKpiScore"},
      {id:"2.1.4",dbKey:"g_2_1_4",label:"Data confidentiality and accuracy — 0 incidents of data breach or incorrect customer information",weight:0.2,kpiBasisKey:"attendanceKpiScore"},
    ]},
    { id:"3.1.0", label:"Order Processing & Workflow Integrity", weight:1, subs:[
      {id:"3.1.1",dbKey:"g_3_1_1",label:"Order processing accuracy — ≥99% correct order handling",weight:0.2,kpiBasisKey:"rtsKpiScore"},
      {id:"3.1.2",dbKey:"g_3_1_2",label:"Processing timeliness — Orders processed within required timeline",weight:0.2,kpiBasisKey:"rtsKpiScore"},
      {id:"3.1.3",dbKey:"g_3_1_3",label:"RTS prevention compliance — All high-risk orders verified before processing",weight:0.2,kpiBasisKey:"rtsKpiScore"},
      {id:"3.1.4",dbKey:"g_3_1_4",label:"Escalation compliance — 100% escalation of high-risk or uncertain cases to Team Leader",weight:0.2,kpiBasisKey:"rtsKpiScore"},
    ]},
  ]},
  { type:"CUSTOMER", kraKey:"kra_customer", groups:[
    { id:"4.1.0", label:"Customer Engagement & Retention Performance", weight:1, subs:[
      {id:"4.1.1",dbKey:"g_4_1_1",label:"Conversion Rate — Meet daily conversion target",weight:0.25,kpiBasisKey:"conversionKpiScore"},
      {id:"4.1.2",dbKey:"g_4_1_2",label:"Consistent Follow-Ups — 100% daily follow-up completion",weight:0.25,kpiBasisKey:"rmoKpiScore"},
      {id:"4.1.3",dbKey:"g_4_1_3",label:"Customer Retention Tracking — All follow-ups and reorders logged in retention tracker",weight:0.25},
      {id:"4.1.4",dbKey:"g_4_1_4",label:"Verified Calls — 100% verified customer information",weight:0.25},
    ]},
  ]},
  { type:"PEOPLE DEVELOPMENT", kraKey:"kra_people", groups:[
    { id:"5.1.0", label:"Team & Skill Development", weight:1, subs:[
      {id:"5.1.1",dbKey:"g_5_1_1",label:"Participation in Team Huddles — 100% attendance",weight:0.3334},
      {id:"5.1.2",dbKey:"g_5_1_2",label:"Collaboration with Team Members — Consistent coordination and support",weight:0.3333},
      {id:"5.1.3",dbKey:"g_5_1_3",label:"Adaptability & Continuous Learning — Active adoption of feedback",weight:0.3333,kpiBasisKey:"escKpiScore"},
    ]},
  ]},
  { type:"FINANCIALS", kraKey:"kra_financial", groups:[
    { id:"6.1.0", label:"Sales & Profit Contribution", weight:1, subs:[
      {id:"6.1.1",dbKey:"g_6_1_1",label:"Sales Encoding Accuracy — 100% accurate encoding",weight:0.5},
      {id:"6.1.2",dbKey:"g_6_1_2",label:"Upselling Conversion Rate — Meet upselling target",weight:0.5,kpiBasisKey:"upsellKpiScore"},
      {id:"6.1.3",dbKey:"g_6_1_3",label:"ROAS Performance — Maintain required ROAS level",weight:0.5,kpiBasisKey:"conversionKpiScore"},
      {id:"6.1.4",dbKey:"g_6_1_4",label:"RTS Rate Compliance — Maintain RTS ≤ 15%",weight:0.5,kpiBasisKey:"rtsKpiScore"},
    ]},
  ]},
];

const BEHAVIOURAL_INDICATORS = [
  {id:"bi1",label:"Attendance & Reliability — Maintains consistent attendance and punctuality",weight:0.2,kpiBasisKey:"attendanceKpiScore"},
  {id:"bi2",label:"Accountability & Compliance — Follows HR, sales, and company policies diligently",weight:0.2},
  {id:"bi3",label:"Initiative & Adaptability — Shows willingness to learn and adjust to operational changes",weight:0.2},
  {id:"bi4",label:"Professionalism & Collaboration — Communicates respectfully and maintains teamwork",weight:0.2},
  {id:"bi5",label:"Extreme Self-Care & Mindfulness — Practices emotional balance and maintains focus",weight:0.2,kpiBasisKey:"escKpiScore"},
];

const KRA_WEIGHTS = {"BUSINESS PROCESS":0.25,CUSTOMER:0.25,"PEOPLE DEVELOPMENT":0.25,FINANCIALS:0.25};
const SCALE_LABELS = {0:"0%",1:"60% Below",2:"70%",3:"80%",4:"90%",5:"100%"};
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const QUARTERS = {Q1:["January","February","March"],Q2:["April","May","June"],Q3:["July","August","September"],Q4:["October","November","December"]};
const TEAMS = ["Team Keljash","Team Tristan","Team Knathan","Team Lowii","Team Krizia","Team Bryan","Team Wendell","Team Pikutin","Team Mark"];
const CSR_NAMES = ["ALPHE BALAKID","CEDRIC JOSH DENIEGA","CHYNNA TORNO","ERVIN ESCARDA","FRANZGIAN CASTOR","JERALD BYRON CEPE","KATE VALEIZZE HOPE PEDARSE","KENNETH ELBANBUENA","LANCE BORLADO","PRINCESS ALEYAH BORLADO","RACHEL HATE","RAINE CHAVEZ","RAZEL HILA","RHEA MAE TUGADO","ROXANNE SOLIS","VENICE CUATON","YANO HITOSIS","ANGELO PROVIDO"];
const sectionColors = {"BUSINESS PROCESS":"#6366f1",CUSTOMER:"#0ea5e9","PEOPLE DEVELOPMENT":"#10b981",FINANCIALS:"#f59e0b"};

// LIGHT THEME TOKENS
const T = {
  bg:"#fdf8f0", surface:"#ffffff", surface2:"#fdf8f0", border:"#e8dfc8",
  accent:"#c9a84c", accent2:"#8a6f28", text:"#1a1510", muted:"#7a6a50", faint:"#a89070",
};
const iBase = {background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:8,color:T.text,padding:"8px 12px",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"inherit"};
const iDis  = {...iBase,background:T.surface2,color:T.faint,cursor:"not-allowed",opacity:0.7};
const lBase = {fontSize:11,color:T.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5,display:"block"};

function calcSubRating(v){if(v===""||v===null||v===undefined)return null;const n=parseFloat(v);return(isNaN(n)||n<0||n>5)?null:n;}
function calcGroupScore(g,grades){let t=0,w=0;for(const s of g.subs){const r=calcSubRating(grades[s.id]);if(r===null)return null;t+=r*s.weight;w+=s.weight;}return w>0?t/w:null;}
function calcKraScore(sec,grades){const s=sec.groups.map(g=>calcGroupScore(g,grades)).filter(x=>x!==null);return s.length?s.reduce((a,b)=>a+b,0)/s.length:null;}
function calcBehaviouralScore(grades){let t=0,w=0;for(const b of BEHAVIOURAL_INDICATORS){const r=calcSubRating(grades[b.id]);if(r===null)return null;t+=r*b.weight;w+=b.weight;}return w>0?t/w:null;}
function ratingLabel(s){if(s===null)return"—";if(s>=4.5)return"Outstanding";if(s>=3.5)return"Exceeds Expectations";if(s>=2.5)return"Meets Expectations";if(s>=1.5)return"Needs Improvement";return"Unsatisfactory";}
function ratingColor(s){if(s===null)return T.faint;if(s>=4.5)return"#16a34a";if(s>=3.5)return"#65a30d";if(s>=2.5)return"#d97706";if(s>=1.5)return"#ea580c";if(s>=0.5)return"#dc2626";return T.muted;}
function buildInitialGrades(){const g={};KPI_SECTIONS.forEach(s=>s.groups.forEach(gr=>gr.subs.forEach(sub=>{g[sub.id]="";})));BEHAVIOURAL_INDICATORS.forEach(b=>{g[b.id]="";});return g;}
function getQuarterFromMonth(m){for(const[q,ms]of Object.entries(QUARTERS)){if(ms.includes(m))return q;}return"";}
function pct(v){return v!==null?(v*100).toFixed(1)+"%":"—";}

function GradeSelect({value,onChange,id,suggested,disabled}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      {suggested&&!disabled&&(
        <span style={{fontSize:10,padding:"2px 7px",borderRadius:4,background:"#eff6ff",color:"#1d4ed8",fontWeight:700,whiteSpace:"nowrap",border:"1px solid #bfdbfe"}}>💡 {suggested}</span>
      )}
      <select value={value} onChange={e=>onChange(id,e.target.value)} disabled={disabled} style={{width:82,padding:"5px 6px",border:value?`1.5px solid ${T.accent}`:`1.5px solid ${T.border}`,borderRadius:6,background:disabled?T.surface2:T.surface,color:disabled?T.faint:value?T.accent2:T.muted,fontSize:12,cursor:disabled?"not-allowed":"pointer",outline:"none",fontWeight:value?700:400}}>
        <option value="">—</option>
        {[0,1,2,3,4,5].map(g=><option key={g} value={g}>{g} — {SCALE_LABELS[g]}</option>)}
      </select>
    </div>
  );
}

function ScorePill({score,size="sm"}){
  if(score===null)return<span style={{color:T.faint,fontSize:12}}>—</span>;
  const c=ratingColor(score);
  return<span style={{display:"inline-block",padding:size==="lg"?"4px 16px":"2px 10px",borderRadius:20,background:c+"18",color:c,fontWeight:800,fontSize:size==="lg"?15:12,border:`1.5px solid ${c}44`}}>{score.toFixed(2)}</span>;
}

function EntryStatusBadge({status,checking}){
  if(checking)return<div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:20,background:T.surface2,border:`1.5px solid ${T.border}`,fontSize:12,color:T.muted,fontWeight:600}}><span style={{width:10,height:10,borderRadius:"50%",border:`2px solid ${T.accent}`,borderTopColor:"transparent",animation:"spin 0.7s linear infinite",display:"inline-block"}}/>Checking…</div>;
  if(!status)return null;
  const cfg={draft:{bg:"#fffbeb",border:"#fbbf24",color:"#92400e",icon:"✏️",label:"Draft — In Progress"},submitted:{bg:"#f0fdf4",border:"#86efac",color:"#166534",icon:"✅",label:"Submitted — Read Only"},new:{bg:"#eff6ff",border:"#bfdbfe",color:"#1d4ed8",icon:"🆕",label:"New Entry"}}[status]||{};
  return<div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:20,background:cfg.bg,border:`1.5px solid ${cfg.border}`,fontSize:12,color:cfg.color,fontWeight:700}}>{cfg.icon} {cfg.label}</div>;
}

function SectionBlock({section,grades,onChange,suggestedGrades,disabled}){
  const[collapsed,setCollapsed]=useState(false);
  const color=sectionColors[section.type]||T.accent;
  const kraScore=calcKraScore(section,grades);
  return(
    <div style={{marginBottom:16,border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden"}}>
      <div onClick={()=>setCollapsed(c=>!c)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",background:color+"12",borderLeft:`4px solid ${color}`,cursor:"pointer",userSelect:"none"}}>
        <span style={{fontWeight:800,color,fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",flex:1}}>{section.type}</span>
        <span style={{fontSize:11,color:T.muted,marginRight:6}}>KRA Score</span>
        <ScorePill score={kraScore}/>
        <span style={{color:T.faint,fontSize:12,marginLeft:8}}>{collapsed?"▸":"▾"}</span>
      </div>
      {!collapsed&&section.groups.map(group=>{
        const grpScore=calcGroupScore(group,grades);
        return(
          <div key={group.id} style={{borderTop:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",background:T.surface2}}>
              <span style={{fontSize:10,color,fontWeight:700,minWidth:36}}>{group.id}</span>
              <span style={{flex:1,fontSize:13,fontWeight:600,color:T.text}}>{group.label}</span>
              <span style={{fontSize:11,color:T.faint,marginRight:6}}>Score</span>
              <ScorePill score={grpScore}/>
            </div>
            {group.subs.map((sub,si)=>(
              <div key={sub.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px 8px 28px",borderTop:`1px solid ${T.border}`,background:si%2===0?T.surface:T.surface2}}>
                <span style={{fontSize:10,color:T.faint,minWidth:36,fontWeight:600}}>{sub.id}</span>
                <span style={{flex:1,fontSize:12,color:T.muted,lineHeight:1.5}}>{sub.label}</span>
                <span style={{fontSize:10,color:T.faint,minWidth:55,textAlign:"right"}}>W: {(sub.weight*100).toFixed(0)}%</span>
                <GradeSelect value={grades[sub.id]} onChange={onChange} id={sub.id} suggested={sub.kpiBasisKey&&suggestedGrades[sub.kpiBasisKey]?suggestedGrades[sub.kpiBasisKey]:null} disabled={disabled}/>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function KpiBasisPanel({basis,setBasis,computed,onApplySuggested,disabled}){
  const fields=[
    {key:"delivered",label:"Delivered",placeholder:"e.g. 120"},
    {key:"forReturn",label:"For Return",placeholder:"e.g. 10"},
    {key:"returned",label:"Returned",placeholder:"e.g. 5"},
    {key:"attendanceKpiScore",label:"Attendance KPI Score",placeholder:"e.g. 5 (1–5 scale)"},
    {key:"weeklyRmoRate",label:"Weekly RMO Rate",placeholder:"e.g. 0.80 (decimal)"},
    {key:"escPoints",label:"ESC Points",placeholder:"e.g. 18 (max 21)"},
    {key:"conversionRoas",label:"Conversion (ROAS)",placeholder:"e.g. 4.5"},
    {key:"upsellRate",label:"Upsell Rate",placeholder:"e.g. 0.35 (decimal)"},
  ];
  const row=(label,value,grade)=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${T.border}`}}>
      <span style={{fontSize:12,color:T.muted,fontWeight:500}}>{label}</span>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:12,color:T.text,fontWeight:600}}>{value}</span>
        {grade!=null&&<span style={{fontSize:11,fontWeight:800,padding:"1px 9px",borderRadius:4,background:ratingColor(grade)+"18",color:ratingColor(grade),border:`1px solid ${ratingColor(grade)}44`}}>Grade {grade}</span>}
      </div>
    </div>
  );
  return(
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px",marginBottom:24,boxShadow:"0 1px 4px #c9a84c08"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div>
          <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:3}}>📊 KPI Basis — Raw Numbers</div>
          <div style={{fontSize:12,color:T.muted}}>{disabled?"This entry is read-only (submitted).":"Enter raw data below. KPI scores and suggested grades will auto-compute."}</div>
        </div>
        {!disabled&&<button onClick={onApplySuggested} style={{padding:"9px 20px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${T.accent},${T.accent2})`,color:"#12101f",fontWeight:800,fontSize:12,cursor:"pointer",boxShadow:`0 2px 8px ${T.accent}44`,whiteSpace:"nowrap"}}>⚡ Apply All Suggested Grades</button>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {fields.map(f=>(
          <div key={f.key}>
            <label style={lBase}>{f.label}</label>
            <input type="number" step="any" placeholder={f.placeholder} value={basis[f.key]??""} onChange={e=>setBasis(p=>({...p,[f.key]:e.target.value}))} disabled={disabled}
              style={disabled?iDis:iBase}
              onFocus={e=>{e.target.style.borderColor=T.accent;e.target.style.boxShadow=`0 0 0 3px ${T.accent}18`;}}
              onBlur={e=>{e.target.style.borderColor=T.border;e.target.style.boxShadow="none";}}
            />
          </div>
        ))}
      </div>
      <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 20px"}}>
        <div style={{fontSize:11,color:T.accent2,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Auto-Computed KPI Scores → Suggested Grades</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 32px"}}>
          {row("RTS %",pct(computed.rtsPct),computed.rtsGrade)}
          {row("Delivery Success Rate",pct(computed.dsr),computed.dsrGrade)}
          {row("RTS KPI Score",pct(computed.rtsKpiScore),computed.rtsGrade)}
          {row("Delivery Success KPI",pct(computed.dsrKpiScore),computed.dsrGrade)}
          {row("RMO KPI Score",pct(computed.rmoKpiScore),computed.rmoGrade)}
          {row("Conversion KPI Score",pct(computed.conversionKpiScore),computed.conversionGrade)}
          {row("ESC KPI Score",pct(computed.escKpiScore),computed.escGrade)}
          {row("Upsell Rate KPI Score",pct(computed.upsellKpiScore),computed.upsellGrade)}
        </div>
        {!disabled&&<div style={{marginTop:12,padding:"8px 12px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,fontSize:11,color:"#92400e"}}>💡 Click <strong>⚡ Apply All Suggested Grades</strong> to automatically fill relevant KPI fields.</div>}
      </div>
    </div>
  );
}

export default function DataEntryForm({ user, editEntry = null, onSaved, onCancel }) {
  const[employeeName,setEmployeeName]=useState("");
  const[customName,setCustomName]=useState("");
  const[selectedTeams,setSelectedTeams]=useState([]);
  const[periodFrom,setPeriodFrom]=useState("");
  const[periodTo,setPeriodTo]=useState("");
  const[selectedMonth,setSelectedMonth]=useState("");
  const[week,setWeek]=useState("");
  const[supervisorRemarks,setSupervisorRemarks]=useState("");
  const[employeeComments,setEmployeeComments]=useState("");
  const[grades,setGrades]=useState(buildInitialGrades);
  const[toast,setToast]=useState(null);
  const[toastMsg,setToastMsg]=useState("");
  const[entryStatus,setEntryStatus]=useState(null);
  const[existingId,setExistingId]=useState(null);
  const[checkingEntry,setCheckingEntry]=useState(false);
  const[pendingDrafts,setPendingDrafts]=useState([]);
  const[draftsLoading,setDraftsLoading]=useState(false);
  const[draftsCollapsed,setDraftsCollapsed]=useState(false);
  const[basis,setBasis]=useState({delivered:"",forReturn:"",returned:"",attendanceKpiScore:"",weeklyRmoRate:"",escPoints:"",conversionRoas:"",upsellRate:""});
const unlockedForEdit = !!editEntry;

useEffect(() => {
  if (!editEntry) return;
  const inList = CSR_NAMES.includes(editEntry.csr_name);
  if (inList) { setEmployeeName(editEntry.csr_name); setCustomName(""); }
  else { setEmployeeName("__custom__"); setCustomName(editEntry.csr_name); }
  setSelectedMonth(editEntry.month);
  setWeek(editEntry.week);
}, [editEntry]);
  
  const resolvedName=employeeName==="__custom__"?customName:employeeName;
  const isReadOnly = {unlockedForEdit && entryStatus === "submitted" && (
  <div style={{ marginBottom:20, padding:"12px 18px", background:"#fff7ed", border:"1.5px solid #fdba74", borderRadius:10, display:"flex", alignItems:"center", gap:10 }}>
    <span style={{ fontSize:18 }}>✏️</span>
    <div>
      <div style={{ fontWeight:700, color:"#9a3412", fontSize:13 }}>Editing a submitted entry — TL override enabled.</div>
      <div style={{ fontSize:12, color:"#c2410c", marginTop:2 }}>Changes update the live record and recompute all dependent scores immediately.</div>
    </div>
  </div>
)}

  useEffect(()=>{
    (async()=>{setDraftsLoading(true);const{data}=await supabase.from("performance_entries").select("id,csr_name,month,week,final_score,last_updated_at,last_updated_by").eq("status","draft").order("last_updated_at",{ascending:false});setPendingDrafts(data||[]);setDraftsLoading(false);})();
  },[]);

  const refreshDrafts=async()=>{const{data}=await supabase.from("performance_entries").select("id,csr_name,month,week,final_score,last_updated_at,last_updated_by").eq("status","draft").order("last_updated_at",{ascending:false});setPendingDrafts(data||[]);};

  const handleContinueDraft=(draft)=>{
    const inList=CSR_NAMES.includes(draft.csr_name);
    if(inList){setEmployeeName(draft.csr_name);setCustomName("");}else{setEmployeeName("__custom__");setCustomName(draft.csr_name);}
    setSelectedMonth(draft.month);setWeek(draft.week);window.scrollTo({top:0,behavior:"smooth"});
  };

  const toggleTeam=(team)=>{
    if(isReadOnly)return;
    setSelectedTeams(prev=>{if(prev.includes(team))return prev.filter(t=>t!==team);if(prev.length>=2)return prev;return[...prev,team];});
  };

  const checkRef=useRef(null);
  useEffect(()=>{
    if(!resolvedName||!selectedMonth||!week){setEntryStatus(null);setExistingId(null);return;}
    if(checkRef.current)clearTimeout(checkRef.current);
    checkRef.current=setTimeout(async()=>{
      setCheckingEntry(true);
      try{const{data,error}=await supabase.from("performance_entries").select("*").eq("csr_name",resolvedName).eq("month",selectedMonth).eq("week",week).order("created_at",{ascending:false}).limit(1).maybeSingle();
        if(error)throw error;
        if(data){setExistingId(data.id);setEntryStatus(data.status||"draft");loadEntry(data);}else{setExistingId(null);setEntryStatus("new");}
      }catch{setEntryStatus("new");}finally{setCheckingEntry(false);}
    },350);
    return()=>{if(checkRef.current)clearTimeout(checkRef.current);};
  },[resolvedName,selectedMonth,week]);

  const loadEntry=(row)=>{
    if(Array.isArray(row.teams))setSelectedTeams(row.teams);
    else if(row.teams)setSelectedTeams([row.teams]);
    else if(row.team)setSelectedTeams([row.team]);
    else setSelectedTeams([]);
    setPeriodFrom(row.period_from||"");setPeriodTo(row.period_to||"");
    setSupervisorRemarks(row.supervisor_remarks||"");setEmployeeComments(row.employee_comments||"");
    setBasis({delivered:row.delivered??"",forReturn:row.for_return??"",returned:row.returned??"",attendanceKpiScore:row.attendance_kpi_score??"",weeklyRmoRate:row.weekly_rmo_rate??"",escPoints:row.esc_points??"",conversionRoas:row.conversion_roas??"",upsellRate:row.upsell_rate??""});
    const ng=buildInitialGrades();
    KPI_SECTIONS.forEach(s=>s.groups.forEach(g=>g.subs.forEach(sub=>{const v=row[sub.dbKey];ng[sub.id]=v!=null?String(v):"";})));
    BEHAVIOURAL_INDICATORS.forEach(b=>{const v=row[b.id];ng[b.id]=v!=null?String(v):"";});
    setGrades(ng);
  };

  const handleGrade=useCallback((id,val)=>{setGrades(prev=>({...prev,[id]:val}));},[]);

  const computed=useMemo(()=>{
    const rtsPct=calcRtsPct(basis.delivered,basis.forReturn,basis.returned);
    const dsr=calcDeliverySuccessRate(basis.delivered,basis.forReturn,basis.returned);
    const rtsKpiScore=calcRtsKpiScore(rtsPct);
    const dsrKpiScore=calcDeliverySuccessKpiScore(dsr);
    const rmoKpiScore=calcRmoKpiScore(parseFloat(basis.weeklyRmoRate)||0);
    const conversionKpiScore=calcConversionKpiScore(parseFloat(basis.conversionRoas)||0);
    const escKpiScore=calcEscKpiScore(parseFloat(basis.escPoints)||0);
    const upsellKpiScore=calcUpsellKpiScore(parseFloat(basis.upsellRate)||0);
    const attScore=parseFloat(basis.attendanceKpiScore)||null;
    return{rtsPct,dsr,rtsKpiScore,dsrKpiScore,rmoKpiScore,conversionKpiScore,escKpiScore,upsellKpiScore,rtsGrade:kpiScoreToGrade(rtsKpiScore),dsrGrade:kpiScoreToGrade(dsrKpiScore),rmoGrade:kpiScoreToGrade(rmoKpiScore),conversionGrade:kpiScoreToGrade(conversionKpiScore),escGrade:kpiScoreToGrade(escKpiScore),upsellGrade:kpiScoreToGrade(upsellKpiScore),attendanceGrade:attScore};
  },[basis]);

  const suggestedGrades=useMemo(()=>({rtsKpiScore:computed.rtsGrade,dsrKpiScore:computed.dsrGrade,rmoKpiScore:computed.rmoGrade,conversionKpiScore:computed.conversionGrade,escKpiScore:computed.escGrade,upsellKpiScore:computed.upsellGrade,attendanceKpiScore:computed.attendanceGrade}),[computed]);

  const handleApplySuggested=useCallback(()=>{
    if(isReadOnly)return;
    setGrades(prev=>{const next={...prev};KPI_SECTIONS.forEach(s=>s.groups.forEach(g=>g.subs.forEach(sub=>{if(sub.kpiBasisKey&&suggestedGrades[sub.kpiBasisKey])next[sub.id]=String(suggestedGrades[sub.kpiBasisKey]);})));BEHAVIOURAL_INDICATORS.forEach(bi=>{if(bi.kpiBasisKey&&suggestedGrades[bi.kpiBasisKey])next[bi.id]=String(suggestedGrades[bi.kpiBasisKey]);});return next;});
  },[suggestedGrades,isReadOnly]);

  const kraScores={};
  KPI_SECTIONS.forEach(s=>{kraScores[s.type]=calcKraScore(s,grades);});
  const kraTypes=Object.keys(KRA_WEIGHTS);
  let kraTotal=null;
  if(kraTypes.every(t=>kraScores[t]!==null))kraTotal=kraTypes.reduce((sum,t)=>sum+kraScores[t]*KRA_WEIGHTS[t],0);
  const biScore=calcBehaviouralScore(grades);
  let finalScore=null;
  if(kraTotal!==null&&biScore!==null)finalScore=kraTotal*0.7+biScore*0.3;

  const showToast=(type,msg)=>{setToast(type);setToastMsg(msg);if(type!=="saving")setTimeout(()=>setToast(null),4000);};

  const buildPayload=(status)=>{
    const gp={};KPI_SECTIONS.forEach(s=>s.groups.forEach(g=>g.subs.forEach(sub=>{gp[sub.dbKey]=grades[sub.id]!==""?parseFloat(grades[sub.id]):null;})));
    BEHAVIOURAL_INDICATORS.forEach(b=>{gp[b.id]=grades[b.id]!==""?parseFloat(grades[b.id]):null;});
    const kp={};KPI_SECTIONS.forEach(s=>{kp[s.kraKey]=kraScores[s.type]!==null?+kraScores[s.type].toFixed(4):null;});
    const quarter=getQuarterFromMonth(selectedMonth);
    const year=periodFrom?new Date(periodFrom).getFullYear():new Date().getFullYear();
    return{csr_name:resolvedName,teams:selectedTeams,period_from:periodFrom||null,period_to:periodTo||null,month:selectedMonth,week,year,quarter,...gp,...kp,kra_total:kraTotal!==null?+kraTotal.toFixed(4):null,bi_score:biScore!==null?+biScore.toFixed(4):null,final_score:finalScore!==null?+finalScore.toFixed(4):null,delivered:parseFloat(basis.delivered)||null,for_return:parseFloat(basis.forReturn)||null,returned:parseFloat(basis.returned)||null,attendance_kpi_score:parseFloat(basis.attendanceKpiScore)||null,weekly_rmo_rate:parseFloat(basis.weeklyRmoRate)||null,esc_points:parseFloat(basis.escPoints)||null,conversion_roas:parseFloat(basis.conversionRoas)||null,upsell_rate:parseFloat(basis.upsellRate)||null,rts_pct:+computed.rtsPct.toFixed(4),delivery_success_rate:+computed.dsr.toFixed(4),rts_kpi_score:+computed.rtsKpiScore.toFixed(4),esc_kpi_score:+(computed.escKpiScore||0).toFixed(4),rmo_kpi_score:+computed.rmoKpiScore.toFixed(4),conversion_kpi_score:+computed.conversionKpiScore.toFixed(4),delivery_success_kpi_score:+computed.dsrKpiScore.toFixed(4),upsell_kpi_score:+computed.upsellKpiScore.toFixed(4),supervisor_remarks:supervisorRemarks,employee_comments:employeeComments,last_updated_by:user?.email||"unknown",last_updated_at:new Date().toISOString(),status};
  };

  const handleSave=async(saveStatus)=>{
    if(!resolvedName){showToast("error","Please select an employee name.");return;}
    if(!selectedMonth){showToast("error","Please select a month.");return;}
    if(!week){showToast("error","Please select a week.");return;}
    if(saveStatus==="submitted"&&(kraTotal===null||biScore===null)){showToast("error","Please complete all grades before submitting.");return;}
    showToast("saving","Saving…");
    const payload=buildPayload(saveStatus);
    let error;
    if(existingId){const r=await supabase.from("performance_entries").update(payload).eq("id",existingId);error=r.error;}
    else{const r=await supabase.from("performance_entries").insert([payload]).select("id").single();error=r.error;if(!error&&r.data)setExistingId(r.data.id);}
    if(error){showToast("error",`Save failed: ${error.message}`);}
    else{setEntryStatus(saveStatus);await refreshDrafts();showToast("success",saveStatus==="draft"?`📝 Draft saved for ${resolvedName} — ${selectedMonth} ${week}`:`✅ Submitted for ${resolvedName} — ${selectedMonth} ${week}`);onSaved?.(payload);}
  };

  const handleReset=()=>{
    if(isReadOnly)return;
    if(!window.confirm("Reset all fields?"))return;
    setGrades(buildInitialGrades());setBasis({delivered:"",forReturn:"",returned:"",attendanceKpiScore:"",weeklyRmoRate:"",escPoints:"",conversionRoas:"",upsellRate:""});
    setEmployeeName("");setCustomName("");setSelectedTeams([]);setPeriodFrom("");setPeriodTo("");setSelectedMonth("");setWeek("");setSupervisorRemarks("");setEmployeeComments("");setEntryStatus(null);setExistingId(null);
  };

  const isBusy=toast==="saving"||checkingEntry;

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Inter','DM Sans',system-ui,sans-serif",color:T.text,padding:"0 0 80px"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>

      {/* Top bar — keep dark for contrast anchor */}
      <div style={{background:"#1b1832",borderBottom:"1px solid #2e2814",padding:"14px 32px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 12px #00000020"}}>
        <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${T.accent},${T.accent2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📋</div>
        <div>
          <div style={{fontWeight:800,fontSize:15,color:"#f5ecd4"}}>CSR Performance Data Entry</div>
          <div style={{fontSize:11,color:T.accent}}>KPI Basis → Auto-Compute → Grade</div>
        </div>
        <div style={{flex:1}}/>
        <EntryStatusBadge status={entryStatus} checking={checkingEntry}/>
        {finalScore!==null&&(
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:T.accent,marginBottom:2}}>Final Score Preview</div>
            <div style={{fontSize:22,fontWeight:900,color:ratingColor(finalScore)}}>{finalScore.toFixed(2)}<span style={{fontSize:12,fontWeight:500,color:"#f5ecd4",marginLeft:6}}>{ratingLabel(finalScore)}</span></div>
          </div>
        )}
      </div>

      {/* Pending Drafts */}
      {(pendingDrafts.length>0||draftsLoading)&&(
        <div style={{maxWidth:980,margin:"16px auto 0",padding:"0 24px"}}>
          <div style={{background:T.surface,border:"1.5px solid #fbbf24",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px #c9a84c08"}}>
            <div onClick={()=>setDraftsCollapsed(c=>!c)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 18px",cursor:"pointer",userSelect:"none",background:"#fffbeb",borderBottom:draftsCollapsed?"none":`1px solid ${T.border}`}}>
              <span style={{fontSize:16}}>📝</span>
              <span style={{fontWeight:700,color:"#92400e",fontSize:13,flex:1}}>Pending Drafts <span style={{marginLeft:8,fontSize:11,fontWeight:800,padding:"1px 8px",borderRadius:10,background:"#f59e0b",color:"#fff"}}>{draftsLoading?"…":pendingDrafts.length}</span></span>
              <span style={{fontSize:11,color:T.muted}}>{draftsCollapsed?"▸ Show":"▾ Hide"}</span>
            </div>
            {!draftsCollapsed&&(
              <div style={{padding:"4px 0 8px"}}>
                {draftsLoading?<div style={{padding:"12px 18px",fontSize:12,color:T.muted}}>Loading drafts…</div>
                  :pendingDrafts.map((draft,i)=>(
                    <div key={draft.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 18px",borderBottom:i<pendingDrafts.length-1?`1px solid ${T.border}`:"none"}}>
                      <div style={{flex:1}}>
                        <span style={{fontWeight:700,color:T.text,fontSize:13}}>{draft.csr_name}</span>
                        <span style={{fontSize:12,color:T.muted,marginLeft:10}}>{draft.month} · {draft.week}</span>
                        {draft.final_score&&<span style={{fontSize:11,color:T.faint,marginLeft:8}}>Score so far: {parseFloat(draft.final_score).toFixed(2)}</span>}
                      </div>
                      {draft.last_updated_at&&<span style={{fontSize:11,color:T.faint,whiteSpace:"nowrap"}}>{new Date(draft.last_updated_at).toLocaleDateString("en-PH",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}{draft.last_updated_by&&` · ${draft.last_updated_by.split("@")[0]}`}</span>}
                      <button onClick={()=>handleContinueDraft(draft)} style={{padding:"5px 14px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${T.accent},${T.accent2})`,color:"#12101f",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Continue →</button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{maxWidth:980,margin:"0 auto",padding:"28px 24px 0"}}>

        {/* Banners */}
        {isReadOnly&&<div style={{marginBottom:20,padding:"12px 18px",background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:10,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>🔒</span><div><div style={{fontWeight:700,color:"#166534",fontSize:13}}>This entry has been submitted and is now read-only.</div><div style={{fontSize:12,color:"#15803d",marginTop:2}}>To make changes, contact your administrator or create a new entry for a different period.</div></div></div>}
        {entryStatus==="draft"&&!isReadOnly&&<div style={{marginBottom:20,padding:"12px 18px",background:"#fffbeb",border:"1.5px solid #fbbf24",borderRadius:10,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>📝</span><div><div style={{fontWeight:700,color:"#92400e",fontSize:13}}>Draft loaded — continue where you left off.</div><div style={{fontSize:12,color:"#a16207",marginTop:2}}>All previously saved data has been restored.</div></div></div>}

        {/* Employee Info */}
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:24,boxShadow:"0 1px 4px #c9a84c08"}}>
          <div style={{fontSize:12,fontWeight:800,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16}}>Employee Information</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{gridColumn:"1 / 3"}}>
              <label style={lBase}>Employee Name *</label>
              <select value={employeeName} onChange={e=>{setEmployeeName(e.target.value);setCustomName("");}} disabled={isReadOnly} style={isReadOnly?iDis:iBase}>
                <option value="">Select CSR...</option>
                {CSR_NAMES.map(n=><option key={n} value={n}>{n}</option>)}
                <option value="__custom__">Other (type below)</option>
              </select>
              {employeeName==="__custom__"&&<input value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="Enter full name" disabled={isReadOnly} style={{...(isReadOnly?iDis:iBase),marginTop:6}}/>}
            </div>
            <div>
              <label style={lBase}>Month *</label>
              <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} disabled={isReadOnly} style={isReadOnly?iDis:iBase}>
                <option value="">Select month…</option>
                {MONTHS.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={lBase}>Week *</label>
              <select value={week} onChange={e=>setWeek(e.target.value)} disabled={isReadOnly} style={isReadOnly?iDis:iBase}>
                <option value="">Select week…</option>
                {["Week 1","Week 2","Week 3","Week 4"].map(w=><option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          {checkingEntry&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,color:T.muted,marginBottom:12}}><span style={{width:12,height:12,borderRadius:"50%",border:`2px solid ${T.accent}`,borderTopColor:"transparent",animation:"spin 0.7s linear infinite",display:"inline-block"}}/>Checking for existing entry…</div>}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:16}}>
            <div><label style={lBase}>Period From</label><input type="date" value={periodFrom} onChange={e=>setPeriodFrom(e.target.value)} disabled={isReadOnly} style={isReadOnly?iDis:iBase}/></div>
            <div><label style={lBase}>Period To</label><input type="date" value={periodTo} onChange={e=>setPeriodTo(e.target.value)} disabled={isReadOnly} style={isReadOnly?iDis:iBase}/></div>
            <div style={{gridColumn:"3 / 5"}}><label style={lBase}>Immediate Superior</label><input type="text" defaultValue="NICOLE A. SAN JUAN / REGINALD BAYALAN" disabled={isReadOnly} style={isReadOnly?iDis:iBase}/></div>
          </div>

          <div style={{marginBottom:16}}>
            <label style={lBase}>Team/s * <span style={{color:T.faint,fontWeight:400,textTransform:"none",letterSpacing:0}}>(select up to 2)</span></label>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {TEAMS.map(team=>{
                const isSel=selectedTeams.includes(team);
                const isDis=isReadOnly||(!isSel&&selectedTeams.length>=2);
                return<button key={team} type="button" onClick={()=>!isDis&&toggleTeam(team)} style={{padding:"5px 14px",borderRadius:999,fontSize:12,fontWeight:600,cursor:isDis?"not-allowed":"pointer",fontFamily:"inherit",border:isSel?`1.5px solid ${T.accent}`:`1.5px solid ${T.border}`,background:isSel?T.accent:T.surface2,color:isSel?"#12101f":isDis?T.faint:T.muted,opacity:isDis?0.5:1,transition:"all 0.15s"}}>{isSel?"✓ ":""}{team.replace("Team ","")}</button>;
              })}
            </div>
            {selectedTeams.length>0&&<p style={{fontSize:11,color:T.accent2,marginTop:6,fontWeight:600}}>Selected: {selectedTeams.join(" + ")}</p>}
          </div>

          <div>
            <label style={lBase}>Scale Reference</label>
            <div style={{display:"flex",gap:6,padding:"8px 10px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8}}>
              {[0,1,2,3,4,5].map(g=><span key={g} style={{flex:1,textAlign:"center",fontSize:11,padding:"5px 0",borderRadius:6,background:ratingColor(g)+"15",color:ratingColor(g),fontWeight:700,border:`1px solid ${ratingColor(g)}30`}}>{g} = {SCALE_LABELS[g]}</span>)}
            </div>
          </div>
        </div>

        <KpiBasisPanel basis={basis} setBasis={setBasis} computed={computed} onApplySuggested={handleApplySuggested} disabled={isReadOnly}/>

        {/* Score Cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:24}}>
          {KPI_SECTIONS.map(sec=>{
            const score=kraScores[sec.type];const color=sectionColors[sec.type]||T.accent;
            return<div key={sec.type} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px",borderTop:`3px solid ${color}`,boxShadow:"0 1px 4px #c9a84c08"}}><div style={{fontSize:9,color,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{sec.type}</div><div style={{fontSize:22,fontWeight:900,color:score?ratingColor(score):T.border}}>{score?score.toFixed(2):"—"}</div><div style={{fontSize:10,color:T.faint,marginTop:3}}>{score?ratingLabel(score):"Not scored"}</div></div>;
          })}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px",borderTop:"3px solid #8b5cf6",boxShadow:"0 1px 4px #c9a84c08"}}><div style={{fontSize:9,color:"#8b5cf6",fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>BEHAVIOURAL</div><div style={{fontSize:22,fontWeight:900,color:biScore?ratingColor(biScore):T.border}}>{biScore?biScore.toFixed(2):"—"}</div><div style={{fontSize:10,color:T.faint,marginTop:3}}>{biScore?ratingLabel(biScore):"Not scored"}</div></div>
        </div>

        {/* KRA Sections */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:13,fontWeight:800,color:T.text,marginBottom:4}}>KRA — Key Results Area</div>
          <div style={{fontSize:12,color:T.muted,marginBottom:16}}>{isReadOnly?"Read only — submitted entry.":"Grade each sub-KPI on a 1–5 scale."}</div>
          {KPI_SECTIONS.map(section=><SectionBlock key={section.type} section={section} grades={grades} onChange={handleGrade} suggestedGrades={suggestedGrades} disabled={isReadOnly}/>)}
        </div>

        {/* Behavioural */}
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",marginBottom:24,boxShadow:"0 1px 4px #c9a84c08"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",background:"#f5f3ff",borderLeft:"4px solid #8b5cf6",borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontWeight:800,color:"#6d28d9",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",flex:1}}>Behavioural Indicators</span>
            <span style={{fontSize:11,color:T.muted,marginRight:6}}>Score</span>
            <ScorePill score={biScore}/>
          </div>
          {BEHAVIOURAL_INDICATORS.map((bi,si)=>(
            <div key={bi.id} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderBottom:si<BEHAVIOURAL_INDICATORS.length-1?`1px solid ${T.border}`:"none",background:si%2===0?T.surface:T.surface2}}>
              <span style={{flex:1,fontSize:12,color:T.muted,lineHeight:1.5}}>{bi.label}</span>
              <span style={{fontSize:10,color:T.faint,minWidth:40,textAlign:"right"}}>W: {(bi.weight*100).toFixed(0)}%</span>
              <GradeSelect value={grades[bi.id]} onChange={handleGrade} id={bi.id} suggested={bi.kpiBasisKey&&suggestedGrades[bi.kpiBasisKey]?suggestedGrades[bi.kpiBasisKey]:null} disabled={isReadOnly}/>
            </div>
          ))}
        </div>

        {/* Rating Summary */}
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",marginBottom:24,boxShadow:"0 1px 4px #c9a84c08"}}>
          <div style={{padding:"12px 16px",background:T.surface2,borderBottom:`1px solid ${T.border}`}}><div style={{fontSize:12,fontWeight:800,color:T.text,letterSpacing:"0.05em",textTransform:"uppercase"}}>Performance Rating Summary</div></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 100px 120px 180px"}}>
            {["","Weight","Total Score","Assessment"].map(h=><div key={h} style={{fontSize:10,color:T.muted,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",padding:"8px 14px",borderBottom:`1px solid ${T.border}`,background:T.surface2}}>{h}</div>)}
            {[{label:"KRA (Key Results Area)",weight:"70%",score:kraTotal},{label:"Behavioural Indicator",weight:"30%",score:biScore}].map((row,ri)=>(
              <>
                <div key={row.label} style={{padding:"12px 14px",borderBottom:`1px solid ${T.border}`,color:T.text,fontWeight:600,fontSize:13,background:ri%2===0?T.surface:T.surface2}}>{row.label}</div>
                <div style={{padding:"12px 14px",borderBottom:`1px solid ${T.border}`,color:T.muted,fontSize:13,background:ri%2===0?T.surface:T.surface2}}>{row.weight}</div>
                <div style={{padding:"12px 14px",borderBottom:`1px solid ${T.border}`,background:ri%2===0?T.surface:T.surface2}}>{row.score!==null?<ScorePill score={row.score}/>:<span style={{color:T.border,fontSize:12}}>—</span>}</div>
                <div style={{padding:"12px 14px",borderBottom:`1px solid ${T.border}`,color:row.score?ratingColor(row.score):T.border,fontSize:12,fontWeight:600,background:ri%2===0?T.surface:T.surface2}}>{row.score?ratingLabel(row.score):"—"}</div>
              </>
            ))}
            <div style={{padding:"14px",color:T.text,fontWeight:800,fontSize:14,background:T.surface2}}>TOTAL RATE</div>
            <div style={{padding:"14px",background:T.surface2}}/>
            <div style={{padding:"14px",background:T.surface2}}>{finalScore!==null?<ScorePill score={finalScore} size="lg"/>:<span style={{color:T.border}}>—</span>}</div>
            <div style={{padding:"14px",color:finalScore?ratingColor(finalScore):T.border,fontWeight:800,fontSize:14,background:T.surface2}}>{finalScore?ratingLabel(finalScore):"—"}</div>
          </div>
        </div>

        {/* Remarks */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
          {[{label:"Supervisor's Remarks",val:supervisorRemarks,set:setSupervisorRemarks,ph:"Enter remarks…"},{label:"Employee Comments / Reactions",val:employeeComments,set:setEmployeeComments,ph:"Employee may comment in support of or disagreement with the appraisal…"}].map(({label,val,set,ph})=>(
            <div key={label} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,boxShadow:"0 1px 4px #c9a84c08"}}>
              <label style={{...lBase,marginBottom:10}}>{label}</label>
              <textarea value={val} onChange={e=>set(e.target.value)} rows={3} placeholder={ph} disabled={isReadOnly} style={{...(isReadOnly?iDis:iBase),resize:"vertical",minHeight:80,lineHeight:1.6}}/>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{display:"flex",gap:12,justifyContent:"flex-end",alignItems:"center"}}>
          {unlockedForEdit && (
  <button onClick={() => onCancel?.()} style={{ padding:"10px 24px", borderRadius:8, border:`1.5px solid ${T.border}`, background:"transparent", color:T.muted, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
    ← Cancel / Back
  </button>
)}
          {!isReadOnly&&<button onClick={handleReset} disabled={isBusy} style={{padding:"10px 24px",borderRadius:8,border:`1.5px solid ${T.border}`,background:"transparent",color:T.muted,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",opacity:isBusy?0.5:1}}>Reset Form</button>}
          {isReadOnly
            ?<div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",borderRadius:8,background:"#f0fdf4",border:"1.5px solid #86efac",color:"#166534",fontWeight:700,fontSize:13}}>✅ Entry Submitted — Read Only</div>
            :<>
              <button onClick={()=>handleSave("draft")} disabled={isBusy||!resolvedName||!selectedMonth||!week} style={{padding:"10px 24px",borderRadius:8,border:`1.5px solid ${T.accent}`,background:"#fffbeb",color:T.accent2,fontWeight:700,fontSize:13,cursor:(isBusy||!resolvedName||!selectedMonth||!week)?"not-allowed":"pointer",fontFamily:"inherit",opacity:(isBusy||!resolvedName||!selectedMonth||!week)?0.4:1}}>{toast==="saving"?"Saving…":"📝 Save Draft"}</button>
              <button onClick={()=>handleSave("submitted")} disabled={isBusy||!resolvedName||!selectedMonth||!week} style={{padding:"10px 28px",borderRadius:8,border:"none",background:(isBusy||!resolvedName||!selectedMonth||!week)?T.border:`linear-gradient(135deg,${T.accent},${T.accent2})`,color:"#12101f",fontWeight:800,fontSize:13,cursor:(isBusy||!resolvedName||!selectedMonth||!week)?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:`0 2px 8px ${T.accent}44`}}>{toast==="saving"?"Saving…":"💾 Submit Evaluation"}</button>
            </>
          }
        </div>
      </div>

      {toast&&toast!=="saving"&&<div style={{position:"fixed",bottom:"1.5rem",right:"1.5rem",padding:"12px 20px",borderRadius:10,fontWeight:600,fontSize:14,zIndex:9999,display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",...(toast==="success"?{background:"#f0fdf4",color:"#166534",border:"1px solid #86efac"}:{background:"#fef2f2",color:"#991b1b",border:"1px solid #fecaca"})}}>{toastMsg}</div>}
      {toast==="saving"&&<div style={{position:"fixed",bottom:"1.5rem",right:"1.5rem",padding:"12px 20px",borderRadius:10,fontWeight:600,fontSize:14,zIndex:9999,background:T.surface,color:T.muted,border:`1px solid ${T.border}`,boxShadow:"0 4px 20px rgba(0,0,0,0.08)"}}>⏳ Saving to database…</div>}
    </div>
  );
}
