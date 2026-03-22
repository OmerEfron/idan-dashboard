/* DOM section renderers: KPIs, tables, heatmap, ESG, income */

function renderHeroKpis(model) {
  const t = getTable(model, "Key Statistics", ["BeginningNAV"]);
  const s = t?.rows[0] ? toObj(t.header, t.rows[0]) : {};
  const begin = num(s.BeginningNAV), end = num(s.EndingNAV), cum = num(s.CumulativeReturn);
  const best = num(s.BestReturn), worst = num(s.WorstReturn);
  const ch = num(s.ChangeInNAV), mtm = num(s.MTM);
  const fees = num(s["Fees & Commissions"]);

  const riskRows = tableRows(model, "Risk Measures Benchmark Comparison", ["Risk Measure"]);
  const riskVal = (needle) => {
    const r = riskRows.find((r) => r["Risk Measure"]?.startsWith(needle));
    return r ? num(r["Account Value"]) : null;
  };

  const maxDD = riskVal("Max Drawdown:");
  const sharpe = riskVal("Sharpe Ratio:");
  const sortino = riskVal("Sortino Ratio:");
  const stdDev = riskVal("Standard Deviation:");

  const cards = [
    { termKey: "kpi.endingNav", label: "Ending NAV", value: fmtUsd(end), cls: "", spark: "sparkNav" },
    {
      termKey: "kpi.cumulativeReturn",
      label: "Cumulative Return",
      value: fmtPct(cum),
      cls: signCls(cum),
      spark: "sparkCumul",
    },
    {
      termKey: "kpi.maxDrawdown",
      label: "Max Drawdown",
      value: maxDD != null ? fmtPct(-maxDD) : "—",
      cls: "neg",
      spark: "sparkDrawdown",
    },
    {
      termKey: "kpi.sharpeRatio",
      label: "Sharpe Ratio",
      value: sharpe != null ? sharpe.toFixed(2) : "—",
      cls: signCls(sharpe),
    },
    {
      termKey: "kpi.sortinoRatio",
      label: "Sortino Ratio",
      value: sortino != null ? sortino.toFixed(2) : "—",
      cls: signCls(sortino),
    },
    { termKey: "kpi.stdDeviation", label: "Std Deviation", value: stdDev != null ? fmtPct(stdDev) : "—", cls: "" },
    {
      termKey: "kpi.bestDay",
      label: "Best Day",
      value: fmtPct(best),
      cls: "pos",
      sub: s.BestReturnDate ? parseDate(s.BestReturnDate) : "",
    },
    {
      termKey: "kpi.worstDay",
      label: "Worst Day",
      value: fmtPct(worst),
      cls: "neg",
      sub: s.WorstReturnDate ? parseDate(s.WorstReturnDate) : "",
    },
    { termKey: "kpi.changeNav", label: "Change in NAV", value: fmtUsd(ch), cls: signCls(ch) },
    { termKey: "kpi.mtm", label: "MTM (Mark-to-Market)", value: fmtUsd(mtm), cls: signCls(mtm) },
    { termKey: "kpi.fees", label: "Fees & Commissions", value: fmtUsd(fees), cls: "neg" },
    { termKey: "kpi.beginningNav", label: "Beginning NAV", value: fmtUsd(begin), cls: "" },
  ];

  $("#heroKpis").innerHTML = cards
    .map(
      (c) => `
    <article class="kpi ${c.cls}">
      <span class="kpi-label">${termHtml(c.termKey, c.label)}</span>
      <span class="kpi-value ${c.cls}">${c.value}</span>
      ${c.sub ? `<span class="kpi-sub">${c.sub}</span>` : ""}
      ${
        c.spark
          ? `<div class="kpi-spark-wrap"><canvas id="${c.spark}" class="kpi-spark" aria-hidden="true"></canvas></div>`
          : ""
      }
    </article>
  `,
    )
    .join("");

  const posRows = tableRows(model, "Open Position Summary", ["Symbol", "Value"]);
  const topPos = posRows
    .filter((r) => r.Symbol && !r.Symbol.startsWith("Total") && r.Date !== "Total" && r.FinancialInstrument !== "Cash")
    .sort((a, b) => (num(b.Value) || 0) - (num(a.Value) || 0))
    .slice(0, 3);
  const benchRows = tableRows(model, "Historical Performance Benchmark Comparison", ["Account"]);
  const spxYtd = benchRows.find((r) => r.Account === "SPXTR");

  const cumSeries = getCumulativeBenchmarkSeries(model);
  const ddStats = cumSeries ? drawdownFromCumulativePct(cumSeries.cumulative) : null;
  const modeledDd =
    ddStats && ddStats.currentDrawdown != null ? fmtNum(ddStats.currentDrawdown, 2) : null;

  const insights = [
    `Portfolio declined <b class="neg">${fmtPct(cum)}</b> over the period, from ${fmtUsd(begin)} to ${fmtUsd(end)}.`,
    spxYtd ? `Underperformed S&P 500 (${fmtPct(num(spxYtd["YTD"]))}) by <b class="neg">${fmtPct((cum || 0) - (num(spxYtd["YTD"]) || 0))}</b>.` : "",
    maxDD != null ? `Max drawdown hit <b class="neg">${fmtPct(-maxDD)}</b> — peak-to-valley still ongoing.` : "",
    modeledDd != null
      ? `Drawdown vs peak on cumulative curve: <b class="neg">${modeledDd}%</b>.`
      : "",
    topPos.length ? `Largest open positions: ${topPos.map((p) => `<b>${p.Symbol}</b> (${fmtUsd(num(p.Value))})`).join(", ")}.` : "",
  ].filter(Boolean);

  $("#insights").innerHTML = `<ul>${insights.map((i) => `<li>${i}</li>`).join("")}</ul>`;
}

function renderMonthlyReturns(model) {
  const t = getTable(model, "Historical Performance Benchmark Comparison", ["Month"]);
  if (!t) return;

  const rows = t.rows.map((r) => toObj(t.header, r));
  const valid = rows
    .filter((r) => r.Month && num(r.AccountReturn) != null)
    .sort((a, b) => a.Month.localeCompare(b.Month));

  const el = $("#monthlyReturns");
  if (!valid.length) { el.innerHTML = "<p class='muted'>No monthly data.</p>"; return; }

  el.innerHTML = `<div class="month-row month-header">
    <span>${termHtml("table.month", "Month")}</span>
    <span>${termHtml("table.account", "Account")}</span>
    <span>${benchmarkHtml("SPXTR")}</span>
    <span>${benchmarkHtml("EFA")}</span>
    <span>${benchmarkHtml("VT")}</span>
  </div>` + valid.map((r) => {
    const acct = num(r.AccountReturn);
    const bm1 = num(r.BM1Return);
    const bm2 = num(r.BM2Return);
    const bm3 = num(r.BM3Return);
    return `<div class="month-row">
      <span class="month-label">${monthName(r.Month)}&nbsp;${r.Month.slice(0, 4)}</span>
      <span class="month-cell ${signCls(acct)}" style="${heatBg(acct)}">${fmtPct(acct)}</span>
      <span class="month-cell ${signCls(bm1)}" style="${heatBg(bm1)}">${fmtPct(bm1)}</span>
      <span class="month-cell ${signCls(bm2)}" style="${heatBg(bm2)}">${fmtPct(bm2)}</span>
      <span class="month-cell ${signCls(bm3)}" style="${heatBg(bm3)}">${fmtPct(bm3)}</span>
    </div>`;
  }).join("");
}

function heatBg(v) {
  if (v == null) return "";
  const intensity = Math.min(Math.abs(v) / 12, 1);
  return v >= 0
    ? `background:rgba(93,211,158,${intensity * 0.35})`
    : `background:rgba(255,124,143,${intensity * 0.35})`;
}

function renderRiskTable(model) {
  const rows = tableRows(model, "Risk Measures Benchmark Comparison", ["Risk Measure"]);
  const relRows = tableRows(model, "Risk Measures Benchmark Comparison", ["Risk Measure Relative to Benchmark"]);

  const mainMetrics = rows.filter((r) => r["Risk Measure"] && !r["Risk Measure"].includes("Relative"));
  const relMetrics = relRows.filter((r) => r["Risk Measure Relative to Benchmark"]);

  const html = `<table class="table-zebra"><thead><tr>
    <th>${termHtml("table.metric", "Metric")}</th>
    <th class="r">${termHtml("table.account", "Account")}</th>
    <th class="r">${benchmarkHtml("SPXTR")}</th>
    <th class="r">${benchmarkHtml("EFA")}</th>
    <th class="r">${benchmarkHtml("VT")}</th>
  </tr></thead><tbody>
  ${mainMetrics.map((r) => {
    const metric = r["Risk Measure"];
    return `<tr>
      <td>${riskMetricHtml(metric)}</td>
      <td class="mono r">${fmtRiskVal(r["Account Value"])}</td>
      <td class="mono r">${fmtRiskVal(r["BM1 Value"])}</td>
      <td class="mono r">${fmtRiskVal(r["BM2 Value"])}</td>
      <td class="mono r">${fmtRiskVal(r["BM3 Value"])}</td>
    </tr>`;
  }).join("")}
  </tbody></table>`;

  const relHtml = relMetrics.length ? `<table class="mt table-zebra"><thead><tr>
    <th>${termHtml("table.relativeMetric", "Relative Metric")}</th>
    <th class="r">${termHtml("table.vs", "vs")} ${benchmarkHtml("SPXTR")}</th>
    <th class="r">${termHtml("table.vs", "vs")} ${benchmarkHtml("EFA")}</th>
    <th class="r">${termHtml("table.vs", "vs")} ${benchmarkHtml("VT")}</th>
  </tr></thead><tbody>
  ${relMetrics.map((r) => `<tr>
    <td>${riskMetricHtml(r["Risk Measure Relative to Benchmark"])}</td>
    <td class="mono r">${fmtRiskVal(r["BM1 Value"])}</td>
    <td class="mono r">${fmtRiskVal(r["BM2 Value"])}</td>
    <td class="mono r">${fmtRiskVal(r["BM3 Value"])}</td>
  </tr>`).join("")}
  </tbody></table>` : "";

  $("#riskTable").innerHTML = html + relHtml;
}

function renderEsg(model) {
  const summary = tableRows(model, "ESG", ["Category", "Score"]);
  const ratings = summary.filter((r) => r.SubSection === "RatingsSummary");

  const el = $("#esgSection");
  if (!ratings.length) { el.innerHTML = "<p class='muted'>No ESG data.</p>"; return; }

  const primary = ["ESG", "Environmental", "Social", "Governance", "Controversies", "Combined"];
  const items = ratings.filter((r) => primary.includes(r.Category));
  const rest = ratings.filter((r) => !primary.includes(r.Category) && r.Category !== "Coverage Ratio");

  el.innerHTML = `
    <div class="esg-grid">
      ${items.map((r) => {
        const score = num(r.Score);
        const pct = score != null ? score * 10 : 0;
        const color = score >= 7 ? COLORS.green : score >= 4 ? COLORS.orange : COLORS.red;
        return `<div class="esg-card">
          <div class="esg-meta"><span class="esg-label">${r.Category}</span><span class="esg-score" style="color:${color}">${score ?? "—"}<small>/10</small></span></div>
          <div class="esg-bar-track"><div class="esg-bar-fill" style="width:${pct}%;background:${color}"></div></div>
        </div>`;
      }).join("")}
    </div>
    <div class="esg-details">
      ${rest.map((r) => `<span class="esg-tag">${r.Category}: <b>${r.Score}/10</b></span>`).join("")}
    </div>
  `;
}

function renderIncome(model) {
  const rows = tableRows(model, "Projected Income", ["Symbol", "Description"]);
  const items = rows.filter((r) => r.Symbol && r.Symbol !== "Total");

  const el = $("#incomeTable");
  if (!items.length) { el.innerHTML = "<p class='muted'>No income data.</p>"; return; }

  const totalRow = rows.find((r) => r.Symbol === "Total");
  el.innerHTML = `<table class="table-zebra"><thead><tr>
    <th>${termHtml("table.symbol", "Symbol")}</th>
    <th>${termHtml("table.frequency", "Frequency")}</th>
    <th class="r">${termHtml("table.qty", "Qty")}</th>
    <th class="r">${termHtml("table.yieldPct", "Yield %")}</th>
    <th class="r">${termHtml("table.estimatedAnnualIncome", "Est. Annual")}</th>
    <th class="r">${termHtml("table.estimatedRemainingIncome", "Est. Remaining")}</th>
  </tr></thead><tbody>
  ${items.map((r) => `<tr>
    <td><strong>${r.Symbol}</strong></td>
    <td>${r.Frequency || "—"}</td>
    <td class="mono r">${r.Quantity || "—"}</td>
    <td class="mono r">${r["Current Yield %"] !== "N/A" ? fmtPct(num(r["Current Yield %"])) : "N/A"}</td>
    <td class="mono r pos">${fmtUsd(num(r["Estimated Annual Income"]))}</td>
    <td class="mono r pos">${fmtUsd(num(r["Estimated 2026 Remaining Income"]))}</td>
  </tr>`).join("")}
  ${totalRow ? `<tr class="total-row">
    <td colspan="4"><strong>Total</strong></td>
    <td class="mono r pos"><strong>${fmtUsd(num(totalRow["Estimated Annual Income"]))}</strong></td>
    <td class="mono r pos"><strong>${fmtUsd(num(totalRow["Estimated 2026 Remaining Income"]))}</strong></td>
  </tr>` : ""}
  </tbody></table>`;
}
