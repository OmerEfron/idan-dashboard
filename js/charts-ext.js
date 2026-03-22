/* Additional charts: drawdown, rolling returns, concentration, KPI sparklines */

function renderDrawdownChart(model) {
  const series = getCumulativeBenchmarkSeries(model);
  const sumEl = $("#drawdownSummary");
  if (!series) {
    destroyChart("drawdownChart");
    if (sumEl) sumEl.textContent = "No cumulative benchmark data.";
    return;
  }
  const { drawdowns, maxDrawdown, currentDrawdown } = drawdownFromCumulativePct(series.cumulative);
  if (sumEl) {
    const cur = currentDrawdown != null ? fmtNum(currentDrawdown, 2) : "—";
    const mx = fmtNum(maxDrawdown, 2);
    sumEl.innerHTML = `Current drawdown: <strong class="neg">${cur}%</strong> · Max (period): <strong class="neg">${mx}%</strong>`;
  }
  createChart("drawdownChart", {
    type: "line",
    data: {
      labels: series.labels,
      datasets: [
        {
          label: "Drawdown %",
          data: drawdowns,
          borderColor: COLORS.red,
          backgroundColor: "rgba(255,124,143,0.12)",
          fill: true,
          tension: 0.25,
          pointRadius: 0,
        },
      ],
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmtNum(ctx.parsed.y, 2)}%` },
        },
      },
      scales: {
        y: { ticks: { callback: (v) => `${fmtNum(v, 0)}%` } },
      },
    },
  });
}

function renderRollingChart(model, windowDays = 20) {
  const series = getCumulativeBenchmarkSeries(model);
  if (!series) {
    destroyChart("rollingChart");
    return;
  }
  const rolling = rollingReturnFromCumulative(series.cumulative, windowDays);
  createChart("rollingChart", {
    type: "line",
    data: {
      labels: series.labels,
      datasets: [
        {
          label: `${windowDays}d rolling return`,
          data: rolling,
          borderColor: COLORS.yellow,
          backgroundColor: "rgba(249,231,132,0.08)",
          fill: true,
          tension: 0.25,
          pointRadius: 0,
        },
      ],
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: { label: (ctx) => `${fmtPct(ctx.parsed.y)}` },
        },
      },
      scales: {
        y: { ticks: { callback: (v) => fmtPct(v, 1) } },
      },
    },
  });
}

function renderConcentrationChart(model) {
  const c = getConcentrationFromPositions(model);
  const kpis = $("#concentrationKpis");
  if (kpis) {
    kpis.innerHTML = `<div class="conc-kpi-row">
      <span>Cash <b>${fmtPct(c.cashPct, 1)}</b></span>
      <span>Top 1 <b>${fmtPct(c.top1, 1)}</b></span>
      <span>Top 3 <b>${fmtPct(c.top3, 1)}</b></span>
      <span>Top 5 <b>${fmtPct(c.top5, 1)}</b></span>
      <span>HHI <b>${fmtNum(c.hhi, 3)}</b></span>
    </div>`;
  }
  if (!c.topN.length) {
    destroyChart("concentrationChart");
    const leg = $("#concentrationLegend");
    if (leg) leg.innerHTML = "<p class='muted'>No non-cash holdings to chart.</p>";
    return;
  }
  createChart("concentrationChart", {
    type: "bar",
    data: {
      labels: c.topN.map((x) => x.sym),
      datasets: [
        {
          label: "Weight %",
          data: c.topN.map((x) => x.weight),
          backgroundColor: "rgba(85,214,255,0.6)",
          borderColor: COLORS.accent,
          borderWidth: 1,
          borderRadius: 3,
        },
      ],
    },
    options: {
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${fmtNum(ctx.parsed.x, 2)}% · ${fmtUsd(c.topN[ctx.dataIndex].value)}`,
          },
        },
      },
      scales: {
        x: { ticks: { callback: (v) => `${fmtNum(v, 0)}%` } },
        y: { ticks: { font: { size: 10, weight: "600" } }, grid: { display: false } },
      },
    },
  });
  const leg = $("#concentrationLegend");
  if (leg) {
    leg.innerHTML = c.topN
      .map(
        (x) =>
          `<div class="conc-item"><span>${x.label}</span><span class="mono">${fmtUsd(x.value)}</span></div>`,
      )
      .join("");
  }
}

function renderSparkline(canvasId, values, color) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const data = values.map((v) => (v == null || !Number.isFinite(v) ? null : v));
  if (!data.some((v) => v != null)) return;
  const cfg = {
    type: "line",
    data: {
      labels: data.map((_, i) => i),
      datasets: [
        {
          data,
          borderColor: color,
          borderWidth: 1.5,
          tension: 0.35,
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
      elements: { line: { spanGaps: true } },
    },
  };
  chartInstances[canvasId] = new Chart(ctx, cfg);
}

function renderKpiSparklines(model) {
  const cum = getCumulativeBenchmarkSeries(model);
  const nav = getNavSeries(model);
  if (cum) {
    renderSparkline("sparkCumul", cum.cumulative, COLORS.accent);
    renderSparkline("sparkDrawdown", drawdownFromCumulativePct(cum.cumulative).drawdowns, COLORS.red);
  }
  if (nav) renderSparkline("sparkNav", nav.nav, COLORS.green);
}
