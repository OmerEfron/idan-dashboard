/* Formatting and helper utilities */

const $ = (s) => document.querySelector(s);

function num(v) {
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function fmtNum(v, dec = 2) {
  if (v == null) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(v);
}

function fmtUsd(v) {
  if (v == null) return "—";
  const abs = Math.abs(v);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return v < 0 ? `-$${formatted}` : `$${formatted}`;
}

function fmtPct(v, dec = 2) {
  return v == null ? "—" : `${Number(v).toFixed(dec)}%`;
}

function signCls(v) {
  return v > 0.001 ? "pos" : v < -0.001 ? "neg" : "";
}

function parseDate(s) {
  if (!s) return null;
  const d = s.replace(/\//g, "");
  if (d.length === 8) {
    const y = d.slice(0, 4), m = d.slice(4, 6), day = d.slice(6, 8);
    return `${m}/${day}/${y}`;
  }
  return s;
}

function parseDateLabel(s) {
  if (!s) return "";
  const clean = s.replace(/\//g, "");
  if (clean.length === 8) {
    return `${clean.slice(4, 6)}/${clean.slice(6, 8)}`;
  }
  return s;
}

function monthName(yyyymm) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const m = parseInt(yyyymm.slice(4, 6), 10);
  return months[m - 1] || yyyymm;
}

function fmtRiskVal(raw) {
  if (!raw || raw === "—") return "—";
  if (/^\d{8}\s*-\s*\d{8}$/.test(raw.trim())) {
    return raw.trim().replace(/(\d{4})(\d{2})(\d{2})/g, "$2/$3/$1");
  }
  if (raw === "Ongoing") return raw;
  const n = num(raw);
  if (n != null) return fmtNum(n, 3);
  const pMatch = raw.match(/([\d.]+)\s*\(([\d.]+)\)/);
  if (pMatch) return `${parseInt(pMatch[1])} (${Number(pMatch[2]).toFixed(1)}%)`;
  return raw;
}

const COLORS = {
  accent: "#55d6ff",
  green: "#5dd39e",
  red: "#ff7c8f",
  purple: "#c084fc",
  orange: "#ffb86c",
  yellow: "#f9e784",
  pink: "#ff79c6",
  teal: "#2dd4bf",
  blue: "#6366f1",
  slate: "#94a3b8",
};

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#9fb0dd", font: { size: 11 } } },
    tooltip: {
      backgroundColor: "#1a2548",
      titleColor: "#e6ecff",
      bodyColor: "#9fb0dd",
      borderColor: "#2d427f",
      borderWidth: 1,
      cornerRadius: 6,
      padding: 10,
    },
  },
  scales: {
    x: { ticks: { color: "#7a8fc4", maxRotation: 45 }, grid: { color: "#1e2e5a" } },
    y: { ticks: { color: "#7a8fc4" }, grid: { color: "#1e2e5a" } },
  },
};

function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      out[key] = deepMerge(out[key] || {}, source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}
