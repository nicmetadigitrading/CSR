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
      if (r.source === "monthly" || r.week === "Monthly") {
        byCSRQuarter[key].monthly.push(r);
      } else {
        byCSRQuarter[key].weekly.push(r);
      }
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
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#7a6a50" }}>
          <span style={{ width:10, height:10, borderRadius:"50%", background:"#0ea5e9", display:"inline-block" }} />
          Monthly entry (pre-averaged)
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#7a6a50" }}>
          <span style={{ width:10, height:10, borderRadius:"50%", background:"#c9a84c", display:"inline-block" }} />
          Weekly average (Wk 1–4)
        </div>
      </div>

      {selectedQ === "All" && (
        <div className="grid grid-cols-4 gap-4">
          {quarters.map(q => {
            const qSummary = buildQuarterlySummary(q);
            const qAvg = qSummary.length ? +(qSummary.reduce((s, r) => s + r.total_rate, 0) / qSummary.length).toFixed(2) : 0;
            return (
              <div key={q} onClick={() => setSelectedQ(q)} style={{ background:"#ffffff", border:"1px solid #e8c96b", borderRadius:14, padding:20, boxShadow:"0 2px 12px #c9a84c11", cursor:"pointer", transition:"all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 20px #c9a84c33"}
                onMouseLeave={e => e.currentTarget.style.boxShadow="0 2px 12px #c9a84c11"}>
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
            <thead>
              <tr>{["#","CSR Name","Team","Quarter","Source","Weeks","Total Rate","KRA","Behavioral","Conv %","RMO %","RTS %","Delivery %","Upsell %","Status"].map(h => (
                <th key={h} style={TH_STYLE}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {summary.length === 0
                ? <tr><td colSpan={15} style={{ textAlign:"center", padding:40, color:"#a89070" }}>No data for this quarter.</td></tr>
                : summary.map((c, i) => (
                  <tr key={c.csr_name + c.quarter + i} style={{ ...tdBase(i), transition:"background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background="#fdf3d8"}
                    onMouseLeave={e => e.currentTarget.style.background=tdBase(i).background}>
                    <td style={{ padding:"10px 12px", color:"#a89070", fontWeight:700, fontSize:10 }}>{i+1}</td>
                    <td style={{ padding:"10px 12px", fontWeight:700, color:"#1a1510", whiteSpace:"nowrap" }}>{c.csr_name}</td>
                    <td style={{ padding:"10px 12px", color:"#7a6a50", fontSize:11, whiteSpace:"nowrap" }}>{c.team}</td>
                    <td style={{ padding:"10px 12px", color:"#7a6a50" }}>{c.quarter||"—"}</td>
                    <td style={{ padding:"10px 12px" }}>
                      {c.source === "monthly"
                        ? <span style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background:"#eff6ff", color:"#1d4ed8", border:"1px solid #bfdbfe", fontWeight:700 }}>Monthly</span>
                        : <span style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background:"#fdf3d8", color:"#8a6f28", border:"1px solid #e8c96b", fontWeight:700 }}>Wk avg</span>}
                    </td>
                    <td style={{ padding:"10px 12px", color:"#a89070", fontSize:11 }}>
                      {c.source === "monthly" ? "Monthly" : `${c.weeklyCount} wk${c.weeklyCount !== 1 ? "s" : ""}`}
                    </td>
                    <td style={{ padding:"10px 12px", fontWeight:900, color:"#c9a84c", fontSize:14 }}>{c.total_rate}</td>
                    <td style={{ padding:"10px 12px", color:"#1a1510" }}>{c.kra_scale}</td>
                    <td style={{ padding:"10px 12px", color:"#1a1510" }}>{c.behavioral_scale}</td>
                    {["conversion_score","rmo_score","rts_score","delivery_success_score","upsell_score"].map(k => (
                      <td key={k} style={{ padding:"10px 12px", fontWeight:700, color:c[k]<80?"#c0392b":"#1a1510" }}>{parseFloat(c[k]).toFixed(1)}%</td>
                    ))}
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
