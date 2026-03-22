/* Dashboard entry point — file loading and render orchestration */

const statusEl = $("#status");
applyStaticTerminology();

$("#csvInput").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setStatus(`Loading ${file.name}...`);
  renderDashboard(await file.text(), file.name);
});

const printBtn = $("#btnPrintPdf");
if (printBtn) printBtn.addEventListener("click", () => window.print());

tryAutoLoad();

async function tryAutoLoad() {
  if (location.protocol === "file:") {
    setStatus("Local file mode — click 'Choose CSV' to load your portfolio sheet.");
    return;
  }
  const sample = "Idan_Rosen_January_01_2026_March_20_2026.csv";
  try {
    const res = await fetch(`./${sample}`);
    if (!res.ok) throw new Error("No default CSV");
    renderDashboard(await res.text(), sample);
  } catch {
    setStatus("Pick a CSV file to populate the dashboard.");
  }
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

function applyStaticTerminology() {
  document.querySelectorAll("[data-term]").forEach((el) => {
    const key = el.getAttribute("data-term");
    if (!key) return;
    el.innerHTML = termHtml(key, el.textContent.trim());
  });
}

function resetSectionAnimations() {
  document.querySelectorAll(".animate-section").forEach((el) => {
    el.classList.remove("is-visible");
    el.style.transitionDelay = "";
  });
}

function triggerSectionAnimations() {
  requestAnimationFrame(() => {
    document.querySelectorAll(".animate-section").forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 40, 480)}ms`;
      el.classList.add("is-visible");
    });
  });
}

function renderDashboard(text, sourceName) {
  resetSectionAnimations();
  const rows = parseCSV(text);
  const model = buildModel(rows);
  setStatus(`Loaded ${sourceName} — ${rows.length} rows parsed.`);

  const intro = model.get("Introduction");
  if (intro?.tables[0]?.rows[0]) {
    const info = toObj(intro.tables[0].header, intro.tables[0].rows[0]);
    const period = model.get("Key Statistics")?.meta?.[0]?.[1] || "";
    $("#periodLabel").textContent = `${info.Name || "Account"} — ${period || info.AnalysisPeriod || ""}`;
  }

  callRenderer("renderHeroKpis", model);
  callRenderer("renderCumulativeChart", model);
  callRenderer("renderDrawdownChart", model);
  callRenderer("renderNavChart", model);
  callRenderer("renderAllocDonut", model);
  callRenderer("renderRollingChart", model, 20);
  callRenderer("renderConcentrationChart", model);
  callRenderer("renderMonthlyReturns", model);
  callRenderer("renderCalendarReturns", model);
  callRenderer("renderSymbolChart", model);
  callRenderer("renderSectorChart", model);
  callRenderer("renderRiskTable", model);
  callRenderer("renderTradeTable", model);
  callRenderer("renderPositions", model);
  callRenderer("renderEsg", model);
  callRenderer("renderIncome", model);
  callRenderer("renderKpiSparklines", model);
  triggerSectionAnimations();
}

function callRenderer(name, ...args) {
  const fn = window[name];
  if (typeof fn !== "function") {
    console.warn(`Renderer "${name}" is not available.`);
    return;
  }
  fn(...args);
}
