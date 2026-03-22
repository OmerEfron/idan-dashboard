/* Dashboard entry point — file loading and render orchestration */

const statusEl = $("#status");

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

  renderHeroKpis(model);
  renderCumulativeChart(model);
  renderDrawdownChart(model);
  renderNavChart(model);
  renderAllocDonut(model);
  renderRollingChart(model, 20);
  renderConcentrationChart(model);
  renderMonthlyReturns(model);
  renderCalendarReturns(model);
  renderSymbolChart(model);
  renderSectorChart(model);
  renderRiskTable(model);
  renderTradeTable(model);
  renderPositions(model);
  renderEsg(model);
  renderIncome(model);
  renderKpiSparklines(model);
  triggerSectionAnimations();
}
