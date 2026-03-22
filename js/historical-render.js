/* Historical dashboard renderers — KPIs, charts, table */

const _histCharts = {};

function renderHistoricalDashboard(model, stats) {
  _renderHistKpis(stats);
  _renderHistTimeline(stats);
  _renderHistActionDonut(stats);
  _renderHistSecurityChart(stats);
  _renderHistCurrencyDonut(stats);
  _renderHistFilters(model);
  _renderHistTable(model, stats);
}

function _renderHistKpis(stats) {
  const el = document.getElementById("histKpis");
  if (!el) return;

  const cards = [
    { label: "Total Transactions", value: stats.totalTransactions, fmt: "int" },
    { label: "Unique Securities", value: stats.uniqueSecurities, fmt: "int" },
    { label: "Buy Orders", value: stats.buyCount, fmt: "int", cls: "pos" },
    { label: "Sell Orders", value: stats.sellCount, fmt: "int", cls: "neg" },
    { label: "Buy Volume", value: stats.totalBuyVolume, fmt: "money" },
    { label: "Sell Proceeds", value: stats.totalSellVolume, fmt: "money" },
    { label: "Dividend Income", value: stats.totalDividendIncome, fmt: "money", cls: "pos" },
    { label: "Total Commissions", value: stats.totalCommission, fmt: "money", cls: "neg" },
    { label: "Total Tax", value: stats.totalTax, fmt: "money", cls: "neg" },
    { label: "Total Volume", value: stats.totalProceeds, fmt: "money" },
  ];

  el.innerHTML = cards
    .map((c) => {
      const val = c.fmt === "money" ? _fmtIls(c.value) : c.value.toLocaleString("en-US");
      return `<article class="kpi ${c.cls || ""}">
        <span class="kpi-label">${c.label}</span>
        <span class="kpi-value ${c.cls || ""}">${val}</span>
      </article>`;
    })
    .join("");
}

function _renderHistTimeline(stats) {
  const canvas = document.getElementById("histTimelineChart");
  if (!canvas) return;
  if (_histCharts.timeline) _histCharts.timeline.destroy();

  const months = Object.keys(stats.timeline).sort();
  const labels = months.map((m) => {
    const [y, mo] = m.split("-");
    const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${names[+mo - 1]} ${y.slice(2)}`;
  });

  _histCharts.timeline = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Buys", data: months.map((m) => stats.timeline[m].buys), backgroundColor: "#5dd39e", borderRadius: 3 },
        { label: "Sells", data: months.map((m) => stats.timeline[m].sells), backgroundColor: "#ff7c8f", borderRadius: 3 },
        { label: "Dividends", data: months.map((m) => stats.timeline[m].dividends), backgroundColor: "#55d6ff", borderRadius: 3 },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: { ...CHART_DEFAULTS.plugins, legend: { ...CHART_DEFAULTS.plugins.legend, position: "top" } },
      scales: {
        ...CHART_DEFAULTS.scales,
        x: { ...CHART_DEFAULTS.scales.x, stacked: true },
        y: { ...CHART_DEFAULTS.scales.y, stacked: true, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: (v) => _shortNum(v) } },
      },
    },
  });
}

function _renderHistActionDonut(stats) {
  const canvas = document.getElementById("histActionDonut");
  const legendEl = document.getElementById("histActionLegend");
  if (!canvas) return;
  if (_histCharts.actionDonut) _histCharts.actionDonut.destroy();

  const actionMap = { "קניה": "Buy", "מכירה": "Sell", "דיבידנד": "Dividend", "הקצאה - זכויות": "Rights", "חישוב רווח/הפסד ו/או ניכוי המס": "P&L Calc", "תשובות לארוע חברה": "Corp Event" };
  const entries = Object.entries(stats.actionCounts).map(([k, v]) => [actionMap[k] || k, v]).sort((a, b) => b[1] - a[1]);
  const palette = ["#5dd39e", "#ff7c8f", "#55d6ff", "#c084fc", "#ffb86c", "#f9e784", "#ff79c6", "#2dd4bf"];

  _histCharts.actionDonut = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: entries.map(([l]) => l),
      datasets: [{ data: entries.map(([, v]) => v), backgroundColor: palette.slice(0, entries.length), borderWidth: 0 }],
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: "60%", plugins: { legend: { display: false }, tooltip: { ...CHART_DEFAULTS.plugins.tooltip } } },
  });

  if (legendEl) {
    const total = entries.reduce((s, [, v]) => s + v, 0);
    legendEl.innerHTML = entries
      .map(([label, val], i) => `<div class="alloc-item">
        <span class="alloc-dot" style="background:${palette[i]}"></span>
        <span class="alloc-label">${label}</span>
        <span class="alloc-val">${val}</span>
        <span class="alloc-pct">${((val / total) * 100).toFixed(1)}%</span>
      </div>`)
      .join("");
  }
}

function _renderHistSecurityChart(stats) {
  const canvas = document.getElementById("histSecurityChart");
  if (!canvas) return;
  if (_histCharts.security) _histCharts.security.destroy();

  const sorted = Object.entries(stats.securityVolume).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const labels = sorted.map(([name]) => _shortenName(name));
  const palette = ["#55d6ff", "#5dd39e", "#c084fc", "#ffb86c", "#ff7c8f", "#f9e784", "#ff79c6", "#2dd4bf"];

  _histCharts.security = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Volume", data: sorted.map(([, v]) => v), backgroundColor: palette, borderRadius: 4 }],
    },
    options: {
      ...CHART_DEFAULTS,
      indexAxis: "y",
      plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } },
      scales: {
        ...CHART_DEFAULTS.scales,
        x: { ...CHART_DEFAULTS.scales.x, ticks: { ...CHART_DEFAULTS.scales.x.ticks, callback: (v) => _shortNum(v) } },
        y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks, font: { size: 11 } } },
      },
    },
  });
}

function _renderHistCurrencyDonut(stats) {
  const canvas = document.getElementById("histCurrencyDonut");
  const legendEl = document.getElementById("histCurrencyLegend");
  if (!canvas) return;
  if (_histCharts.currency) _histCharts.currency.destroy();

  const entries = Object.entries(stats.currencyVolume).sort((a, b) => b[1] - a[1]);
  const palette = ["#55d6ff", "#5dd39e", "#c084fc", "#ffb86c"];

  _histCharts.currency = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: entries.map(([l]) => l),
      datasets: [{ data: entries.map(([, v]) => v), backgroundColor: palette.slice(0, entries.length), borderWidth: 0 }],
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: "60%", plugins: { legend: { display: false }, tooltip: { ...CHART_DEFAULTS.plugins.tooltip } } },
  });

  if (legendEl) {
    const total = entries.reduce((s, [, v]) => s + v, 0);
    legendEl.innerHTML = entries
      .map(([label, val], i) => `<div class="alloc-item">
        <span class="alloc-dot" style="background:${palette[i]}"></span>
        <span class="alloc-label">${label}</span>
        <span class="alloc-val">${_fmtIls(val)}</span>
        <span class="alloc-pct">${((val / total) * 100).toFixed(1)}%</span>
      </div>`)
      .join("");
  }
}

function _renderHistFilters(model) {
  const el = document.getElementById("histFilters");
  if (!el) return;

  const actions = [...new Set(model.transactions.map((t) => t.action).filter(Boolean))];
  const currencies = [...new Set(model.transactions.map((t) => t.currency).filter(Boolean))];

  el.innerHTML = `
    <select id="histFilterAction" class="hist-select"><option value="">All Actions</option>${actions.map((a) => `<option value="${_esc(a)}">${_esc(a)}</option>`).join("")}</select>
    <select id="histFilterCurrency" class="hist-select"><option value="">All Currencies</option>${currencies.map((c) => `<option value="${_esc(c)}">${_esc(c)}</option>`).join("")}</select>
    <input id="histSearch" type="text" class="hist-search" placeholder="Search security..." />
  `;

  const refilter = () => _applyHistFilters(model);
  el.querySelector("#histFilterAction").addEventListener("change", refilter);
  el.querySelector("#histFilterCurrency").addEventListener("change", refilter);
  el.querySelector("#histSearch").addEventListener("input", refilter);
}

function _applyHistFilters(model) {
  const action = document.getElementById("histFilterAction")?.value || "";
  const currency = document.getElementById("histFilterCurrency")?.value || "";
  const search = (document.getElementById("histSearch")?.value || "").toLowerCase();

  let filtered = model.transactions;
  if (action) filtered = filtered.filter((t) => t.action === action);
  if (currency) filtered = filtered.filter((t) => t.currency === currency);
  if (search) filtered = filtered.filter((t) => t.name.toLowerCase().includes(search) || t.securityId.includes(search));

  const stats = computeHistoricalStats(filtered);
  _renderHistKpis(stats);
  _renderHistTimeline(stats);
  _renderHistActionDonut(stats);
  _renderHistSecurityChart(stats);
  _renderHistCurrencyDonut(stats);
  _renderHistTableBody(filtered);
}

function _renderHistTable(model) {
  const container = document.getElementById("historicalSheetContainer");
  const metaEl = document.getElementById("historicalSheetMeta");
  if (!container) return;

  if (metaEl) {
    metaEl.innerHTML = model.meta
      .map((row) => `<span class="sheet-meta-item">${_esc(row.filter(Boolean).join("  |  "))}</span>`)
      .join("");
  }

  const controlsEl = document.getElementById("histTableControls");
  if (controlsEl) controlsEl.innerHTML = `<span class="hist-count" id="histRowCount">${model.transactions.length} transactions</span>`;

  container.innerHTML = `<table class="table-zebra sheet-table hist-table" dir="rtl">
    <thead><tr>
      <th class="hist-th-action">פעולה</th>
      <th>שם</th>
      <th>מספר נייר</th>
      <th>תאריך ביצוע</th>
      <th>תאריך תשלום</th>
      <th class="r">כמות</th>
      <th class="r">שער</th>
      <th class="r">תמורה</th>
      <th class="r">עמלה</th>
      <th class="r">מס</th>
      <th>מטבע</th>
    </tr></thead>
    <tbody id="histTableBody"></tbody>
  </table>`;

  _renderHistTableBody(model.transactions);
}

function _renderHistTableBody(transactions) {
  const tbody = document.getElementById("histTableBody");
  const countEl = document.getElementById("histRowCount");
  if (!tbody) return;

  if (countEl) countEl.textContent = `${transactions.length} transactions`;

  tbody.innerHTML = transactions
    .filter((t) => t.action)
    .map((t) => {
      const actionCls = t.action === "קניה" ? "hist-buy" : t.action === "מכירה" ? "hist-sell" : t.action === "דיבידנד" ? "hist-div" : "";
      const procCls = t.proceeds > 0 ? "pos" : t.proceeds < 0 ? "neg" : "";
      return `<tr class="${actionCls}">
        <td><span class="hist-action-badge ${actionCls}">${_esc(t.action)}</span></td>
        <td class="hist-name">${_esc(t.name)}</td>
        <td class="mono">${_esc(t.securityId)}</td>
        <td class="mono">${_fmtDate(t.execDate)}</td>
        <td class="mono">${_fmtDate(t.payDate)}</td>
        <td class="mono r">${t.quantity ? t.quantity.toLocaleString("en-US") : "—"}</td>
        <td class="mono r">${t.price ? t.price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}</td>
        <td class="mono r ${procCls}">${t.proceeds ? _fmtIls(t.proceeds) : "—"}</td>
        <td class="mono r">${t.commission ? _fmtIls(t.commission) : "—"}</td>
        <td class="mono r">${t.tax ? _fmtIls(Math.abs(t.tax)) : "—"}</td>
        <td>${_esc(t.currency)}</td>
      </tr>`;
    })
    .join("");
}

function _shortenName(name) {
  const match = name.match(/\(([^)]+)\)\s*(\w+)/);
  if (match) return match[2];
  return name.length > 18 ? name.slice(0, 16) + "…" : name;
}

function _fmtIls(v) {
  if (!v) return "—";
  return Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function _fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

function _shortNum(v) {
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(0) + "K";
  return v;
}

function _esc(v) {
  return String(v || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
