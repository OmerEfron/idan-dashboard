/* Derived time series and portfolio analytics from the CSV model */

function getCumulativeBenchmarkSeries(model) {
  const t = getTable(model, "Cumulative Benchmark Comparison", ["Date"]);
  if (!t || !t.rows.length) return null;
  const rows = t.rows.map((r) => toObj(t.header, r));
  const accountKey =
    t.header.find((h) => /Return$/i.test(h) && !/^BM\d/i.test(h)) || t.header.at(-1);
  const labels = rows.map((r) => parseDateLabel(r.Date));
  const cumulative = rows.map((r) => num(r[accountKey]));
  return { labels, cumulative, accountKey };
}

function getNavSeries(model) {
  const t = getTable(model, "Allocation by Asset Class", ["Date", "NAV"]);
  if (!t || !t.rows.length) return null;
  const rows = t.rows.map((r) => toObj(t.header, r));
  return {
    labels: rows.map((r) => parseDateLabel(r.Date)),
    nav: rows.map((r) => num(r.NAV)),
  };
}

function drawdownFromCumulativePct(cumulativePct) {
  const drawdowns = [];
  let peak = -Infinity;
  let maxDd = 0;
  let maxIdx = 0;
  let current = null;
  cumulativePct.forEach((c, i) => {
    if (c == null || !Number.isFinite(c)) {
      drawdowns.push(null);
      return;
    }
    const eq = 1 + c / 100;
    if (eq > peak) peak = eq;
    const dd = (eq / peak - 1) * 100;
    drawdowns.push(dd);
    if (dd < maxDd) {
      maxDd = dd;
      maxIdx = i;
    }
    current = dd;
  });
  return { drawdowns, maxDrawdown: maxDd, maxDrawdownIndex: maxIdx, currentDrawdown: current };
}

function rollingReturnFromCumulative(cumulativePct, windowDays) {
  const out = cumulativePct.map(() => null);
  for (let i = windowDays; i < cumulativePct.length; i++) {
    const start = cumulativePct[i - windowDays];
    const end = cumulativePct[i];
    if (start == null || end == null) continue;
    const ra = 1 + start / 100;
    const rb = 1 + end / 100;
    if (ra === 0) continue;
    out[i] = (rb / ra - 1) * 100;
  }
  return out;
}

function getConcentrationFromPositions(model) {
  const rows = tableRows(model, "Open Position Summary", ["Symbol", "Value"]);
  const filtered = rows.filter(
    (r) =>
      r.Symbol &&
      !String(r.Symbol).startsWith("Total") &&
      r.Date !== "Total" &&
      /^\d/.test(String(r.Date || "")),
  );
  const total = filtered.reduce((s, r) => s + (num(r.Value) || 0), 0) || 1;
  const items = filtered
    .map((r) => {
      const v = num(r.Value) || 0;
      const isCash = r.FinancialInstrument === "Cash" || r.Symbol === "USD";
      return {
        sym: r.Symbol,
        label: (r.Description || r.Symbol).slice(0, 28),
        value: v,
        weight: (v / total) * 100,
        isCash,
      };
    })
    .sort((a, b) => b.weight - a.weight);

  const sorted = [...items].sort((a, b) => b.weight - a.weight);
  const nonCash = sorted.filter((i) => !i.isCash);
  const cashRow = sorted.find((i) => i.isCash);
  const topN = nonCash.slice(0, 10);
  const wSum = (arr) => arr.reduce((s, i) => s + i.weight / 100, 0);
  const hhi = sorted.reduce((s, i) => {
    const w = i.weight / 100;
    return s + w * w;
  }, 0);

  return {
    topN,
    cashPct: cashRow?.weight ?? 0,
    hhi,
    top1: sorted[0]?.weight ?? 0,
    top3: wSum(sorted.slice(0, 3)),
    top5: wSum(sorted.slice(0, 5)),
    total,
  };
}

function buildCalendarMatrix(model) {
  const t = getTable(model, "Historical Performance Benchmark Comparison", ["Month"]);
  if (!t) return null;
  const rows = t.rows.map((r) => toObj(t.header, r));
  const valid = rows.filter(
    (r) => r.Month && String(r.Month).length === 6 && num(r.AccountReturn) != null,
  );
  const byYear = {};
  valid.forEach((r) => {
    const y = r.Month.slice(0, 4);
    const m = parseInt(r.Month.slice(4, 6), 10);
    if (!byYear[y]) byYear[y] = {};
    byYear[y][m] = num(r.AccountReturn);
  });
  const years = Object.keys(byYear).sort();
  return years.length ? { byYear, years } : null;
}
