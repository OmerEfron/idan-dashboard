/* Chart.js wrapper functions for all visualizations */

const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

function createChart(canvasId, config) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  const isDoughnut = config.type === "doughnut" || config.type === "pie";
  if (isDoughnut) {
    const base = { responsive: true, maintainAspectRatio: false, plugins: CHART_DEFAULTS.plugins };
    config.options = deepMerge(base, config.options || {});
  } else {
    config.options = deepMerge(CHART_DEFAULTS, config.options || {});
  }
  chartInstances[canvasId] = new Chart(ctx, config);
  return chartInstances[canvasId];
}

function renderCumulativeChart(model) {
  const t = getTable(model, "Cumulative Benchmark Comparison", ["Date"]);
  if (!t) return;

  const rows = t.rows.map((r) => toObj(t.header, r));
  const labels = rows.map((r) => parseDateLabel(r.Date));

  const accountKey = t.header.find((h) => /Return$/i.test(h) && !/^BM\d/i.test(h)) || t.header.at(-1);
  const bmKeys = t.header.filter((h) => /^BM\dReturn$/i.test(h));
  const bmNames = t.header.filter((h) => /^BM\d$/i.test(h));

  const bmLabels = bmNames.map((k) => rows[0]?.[k] || k);

  const datasets = [
    {
      label: "Account",
      data: rows.map((r) => num(r[accountKey])),
      borderColor: COLORS.accent,
      backgroundColor: "rgba(85,214,255,0.08)",
      borderWidth: 2.5,
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      pointHitRadius: 8,
    },
    ...bmKeys.map((k, i) => ({
      label: bmLabels[i] || k.replace("Return", ""),
      data: rows.map((r) => num(r[k])),
      borderColor: [COLORS.purple, COLORS.orange, COLORS.teal][i] || COLORS.slate,
      borderWidth: 1.8,
      borderDash: [4, 3],
      fill: false,
      tension: 0.3,
      pointRadius: 0,
      pointHitRadius: 8,
    })),
  ];

  createChart("cumulChart", {
    type: "line",
    data: { labels, datasets },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${fmtPct(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        y: {
          ticks: { callback: (v) => fmtPct(v, 1) },
        },
      },
    },
  });
}

function renderNavChart(model) {
  const t = getTable(model, "Allocation by Asset Class", ["Date", "Equities", "Cash", "NAV"]);
  if (!t) return;

  const rows = t.rows.map((r) => toObj(t.header, r));
  const labels = rows.map((r) => parseDateLabel(r.Date));

  createChart("navChart", {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "NAV",
          data: rows.map((r) => num(r.NAV)),
          borderColor: COLORS.accent,
          backgroundColor: "rgba(85,214,255,0.06)",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        },
        {
          label: "Equities",
          data: rows.map((r) => num(r.Equities)),
          borderColor: COLORS.purple,
          backgroundColor: "rgba(192,132,252,0.1)",
          borderWidth: 1.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        },
        {
          label: "Cash",
          data: rows.map((r) => num(r.Cash)),
          borderColor: COLORS.green,
          backgroundColor: "rgba(93,211,158,0.1)",
          borderWidth: 1.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        },
      ],
    },
    options: {
      scales: { y: { ticks: { callback: (v) => `$${fmtNum(v, 0)}` } } },
      plugins: {
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmtUsd(ctx.parsed.y)}` } },
      },
    },
  });
}

function renderAllocDonut(model) {
  const t = getTable(model, "Allocation by Financial Instrument", ["Date"]);
  if (!t) return;

  const lastRow = t.rows.length ? toObj(t.header, t.rows[t.rows.length - 1]) : null;
  if (!lastRow) return;

  const parts = t.header
    .filter((h) => !["Date", "NAV"].includes(h))
    .map((h) => ({ label: h, value: num(lastRow[h]) || 0 }))
    .filter((p) => p.value > 0);

  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const colors = [COLORS.purple, COLORS.accent, COLORS.green, COLORS.orange, COLORS.yellow];

  createChart("allocDonut", {
    type: "doughnut",
    data: {
      labels: parts.map((p) => p.label),
      datasets: [{
        data: parts.map((p) => p.value),
        backgroundColor: colors.slice(0, parts.length),
        borderColor: "#111933",
        borderWidth: 2,
      }],
    },
    options: {
      cutout: "65%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed;
              return `${ctx.label}: ${fmtUsd(v)} (${((v / total) * 100).toFixed(1)}%)`;
            },
          },
        },
      },
    },
  });

  const legendEl = $("#allocLegend");
  if (legendEl) {
    legendEl.innerHTML = parts.map((p, i) => `
      <div class="alloc-item">
        <span class="alloc-dot" style="background:${colors[i]}"></span>
        <span class="alloc-label">${p.label}</span>
        <span class="alloc-val">${fmtUsd(p.value)}</span>
        <span class="alloc-pct">${((p.value / total) * 100).toFixed(1)}%</span>
      </div>
    `).join("");
  }
}

function renderSymbolChart(model) {
  const rows = tableRows(model, "Performance by Symbol", ["Symbol", "Contribution"]);
  const allSymbols = rows
    .filter((r) => r.Symbol && !r.Symbol.startsWith("Total") && r.Symbol !== "USD")
    .map((r) => ({ sym: r.Symbol, contrib: num(r.Contribution), ret: num(r.Return) }))
    .filter((r) => r.contrib != null);
  const symbols = allSymbols
    .sort((a, b) => Math.abs(b.contrib) - Math.abs(a.contrib))
    .slice(0, 14)
    .sort((a, b) => a.contrib - b.contrib);

  const symbolChartInst = createChart("symbolChart", {
    type: "bar",
    data: {
      labels: symbols.map((s) => s.sym),
      datasets: [{
        label: "Contribution to Return (%)",
        data: symbols.map((s) => s.contrib),
        backgroundColor: symbols.map((s) => s.contrib >= 0 ? "rgba(93,211,158,0.75)" : "rgba(255,124,143,0.7)"),
        borderColor: symbols.map((s) => s.contrib >= 0 ? COLORS.green : COLORS.red),
        borderWidth: 1,
        borderRadius: 3,
        barThickness: 20,
      }],
    },
    options: {
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const s = symbols[ctx.dataIndex];
              return `Contribution: ${fmtPct(s.contrib)} | Return: ${fmtPct(s.ret)}`;
            },
          },
        },
      },
      scales: {
        x: { ticks: { callback: (v) => fmtPct(v, 1) }, grid: { color: "#1e2e5a" } },
        y: { ticks: { font: { size: 11, weight: "600" }, color: "#b0c4f5" }, grid: { display: false } },
      },
    },
  });
}

function renderSectorChart(model) {
  const rows = tableRows(model, "Performance Attribution vs. S&P 500", ["Sector", "AccountContributionToReturn"]);
  const contribs = rows
    .filter((r) => r.Sector && r.Sector !== "Total" && r.SubSection === "Contribution To Return")
    .map((r) => ({
      sector: r.Sector,
      account: num(r.AccountContributionToReturn),
      bench: num(r.BM_ContributionToReturn),
    }))
    .filter((r) => (r.account != null && Math.abs(r.account) > 0.001) || (r.bench != null && Math.abs(r.bench) > 0.001));

  createChart("sectorChart", {
    type: "bar",
    data: {
      labels: contribs.map((c) => c.sector),
      datasets: [
        {
          label: "Account",
          data: contribs.map((c) => c.account),
          backgroundColor: COLORS.accent,
          borderRadius: 3,
        },
        {
          label: "S&P 500",
          data: contribs.map((c) => c.bench),
          backgroundColor: COLORS.purple,
          borderRadius: 3,
        },
      ],
    },
    options: {
      plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmtPct(ctx.parsed.y)}` } } },
      scales: {
        x: { ticks: { maxRotation: 55, font: { size: 9 } } },
        y: { ticks: { callback: (v) => fmtPct(v, 1) } },
      },
    },
  });
}
