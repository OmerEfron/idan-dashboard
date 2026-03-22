/* Historical sheet — tab switching and orchestration */

(function initHistoricalSheet() {
  initTabs();
  loadHistoricalSheet();
})();

function initTabs() {
  const buttons = document.querySelectorAll(".tab-btn[data-tab-target]");
  const panels = document.querySelectorAll(".tab-panel");
  if (!buttons.length || !panels.length) return;

  const activate = (targetId) => {
    buttons.forEach((btn) => {
      const active = btn.dataset.tabTarget === targetId;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    panels.forEach((panel) => {
      const active = panel.id === targetId;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });
  };

  buttons.forEach((btn, idx) => {
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
    btn.addEventListener("click", () => activate(btn.dataset.tabTarget));
  });
}

async function loadHistoricalSheet() {
  const container = document.getElementById("historicalSheetContainer");
  if (!container) return;

  if (location.protocol === "file:") {
    container.innerHTML = "<p class='muted'>Unable to load XLS in local file mode. Open via a local server.</p>";
    return;
  }

  container.innerHTML = "<p class='muted'>Loading sheet...</p>";
  try {
    const response = await fetch("./תנועות היסטוריות.xls");
    if (!response.ok) throw new Error("Failed to fetch historical XLS");

    const xmlText = await response.text();
    const parsed = parseSpreadsheetXml(xmlText);
    const model = buildHistoricalModel(parsed);
    const stats = computeHistoricalStats(model.transactions);

    const periodLabel = document.getElementById("histPeriodLabel");
    if (periodLabel && model.meta.length) {
      periodLabel.innerHTML = model.meta
        .map((row) => row.filter(Boolean).join(" — "))
        .join(" | ");
    }

    renderHistoricalDashboard(model, stats);
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p class='muted'>Could not load historical movements sheet.</p>";
  }
}
