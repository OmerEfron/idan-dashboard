/* Calendar-year return grid from monthly account returns */

function renderCalendarReturns(model) {
  const el = $("#calendarReturns");
  if (!el) return;
  const matrix = buildCalendarMatrix(model);
  if (!matrix) {
    el.innerHTML = "<p class='muted'>No calendar data.</p>";
    return;
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const { byYear, years } = matrix;
  let html = `<table class="calendar-table"><thead><tr><th>${termHtml("table.year", "Year")}</th>`;
  months.forEach((m) => {
    html += `<th>${m}</th>`;
  });
  html += `<th>${termHtml("table.yearlyAverage", "Yr Avg")}</th></tr></thead><tbody>`;
  years.forEach((y) => {
    const row = byYear[y];
    const vals = [];
    html += `<tr><td class="cal-year">${y}</td>`;
    for (let m = 1; m <= 12; m++) {
      const v = row[m];
      if (v == null) {
        html += "<td class='cal-cell muted'>—</td>";
      } else {
        vals.push(v);
        html += `<td class="cal-cell ${signCls(v)}" style="${heatBg(v)}">${fmtPct(v)}</td>`;
      }
    }
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    html += `<td class="cal-cell ${signCls(avg)} mono"><strong>${avg != null ? fmtPct(avg) : "—"}</strong></td></tr>`;
  });
  html += "</tbody></table>";
  el.innerHTML = html;
}
