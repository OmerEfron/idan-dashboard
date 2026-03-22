/* Trade summary and open positions tables */

function renderTradeTable(model) {
  const rows = tableRows(model, "Trade Summary", ["Symbol", "Description"]);
  const trades = rows.filter((r) => r.Symbol);

  const el = $("#tradeTable");
  if (!trades.length) {
    el.innerHTML = "<p class='muted'>No trade data.</p>";
    return;
  }

  const lines = trades.map((r) => {
    const buyProc = num(r["Proceeds Bought"]) || 0;
    const sellProc = num(r["Proceeds Sold"]) || 0;
    const qtyBought = num(r["Quantity Bought"]) || 0;
    const qtySold = num(r["Quantity Sold"]) || 0;
    const hasRoundTrip = qtyBought > 0 && qtySold > 0;
    const net = hasRoundTrip ? buyProc + sellProc : null;
    return { r, buyProc, sellProc, qtyBought, qtySold, net };
  });

  let sumQtyB = 0;
  let sumQtyS = 0;
  let sumCost = 0;
  let sumSell = 0;
  let sumNet = 0;
  let netRows = 0;
  lines.forEach(({ buyProc, sellProc, qtyBought, qtySold, net }) => {
    sumQtyB += qtyBought;
    sumQtyS += qtySold;
    if (buyProc) sumCost += Math.abs(buyProc);
    if (sellProc) sumSell += sellProc;
    if (net != null) {
      sumNet += net;
      netRows++;
    }
  });

  el.innerHTML = `<table class="table-zebra"><thead><tr>
    <th>${termHtml("table.symbol", "Symbol")}</th>
    <th>${termHtml("table.description", "Description")}</th>
    <th>${termHtml("table.sector", "Sector")}</th>
    <th class="r">${termHtml("table.qtyBought", "Qty Bought")}</th>
    <th class="r">${termHtml("table.avgBuyPrice", "Avg Buy")}</th>
    <th class="r">${termHtml("table.totalBuyCost", "Cost")}</th>
    <th class="r">${termHtml("table.qtySold", "Qty Sold")}</th>
    <th class="r">${termHtml("table.avgSellPrice", "Avg Sell")}</th>
    <th class="r">${termHtml("table.saleProceeds", "Proceeds")}</th>
    <th class="r">${termHtml("table.netRealizedPL", "Net P&L")}</th>
  </tr></thead><tbody>
  ${lines
    .map(({ r, buyProc, sellProc, qtyBought, qtySold, net }) => {
      const cls = net != null ? signCls(net) : "";
      return `<tr>
      <td><strong>${r.Symbol}</strong></td>
      <td class="truncate">${r.Description || ""}</td>
      <td>${r.Sector || ""}</td>
      <td class="mono r">${qtyBought || "—"}</td>
      <td class="mono r">${fmtUsd(num(r["Average Price Bought"]))}</td>
      <td class="mono r">${buyProc ? fmtUsd(Math.abs(buyProc)) : "—"}</td>
      <td class="mono r">${qtySold || "—"}</td>
      <td class="mono r">${fmtUsd(num(r["Average Price Sold"]))}</td>
      <td class="mono r">${sellProc ? fmtUsd(sellProc) : "—"}</td>
      <td class="mono r ${cls}"><strong>${net != null ? fmtUsd(net) : "—"}</strong></td>
    </tr>`;
    })
    .join("")}
  <tr class="total-row">
    <td colspan="3"><strong>Totals</strong></td>
    <td class="mono r"><strong>${sumQtyB ? fmtNum(sumQtyB, 0) : "—"}</strong></td>
    <td class="r">—</td>
    <td class="mono r"><strong>${sumCost ? fmtUsd(sumCost) : "—"}</strong></td>
    <td class="mono r"><strong>${sumQtyS ? fmtNum(sumQtyS, 0) : "—"}</strong></td>
    <td class="r">—</td>
    <td class="mono r"><strong>${sumSell ? fmtUsd(sumSell) : "—"}</strong></td>
    <td class="mono r ${signCls(sumNet)}"><strong>${netRows ? fmtUsd(sumNet) : "—"}</strong></td>
  </tr>
  </tbody></table>`;
}

function renderPositions(model) {
  const rows = tableRows(model, "Open Position Summary", ["Symbol", "Value"]);
  const positions = rows.filter((r) => r.Symbol && !r.Symbol.startsWith("Total") && r.Date !== "Total");

  const el = $("#positionsTable");
  if (!positions.length) {
    el.innerHTML = "<p class='muted'>No positions found.</p>";
    return;
  }

  const totalNav = positions.reduce((s, p) => s + (num(p.Value) || 0), 0) || 1;

  el.innerHTML = `<table class="table-zebra"><thead><tr>
    <th>${termHtml("table.symbol", "Symbol")}</th>
    <th>${termHtml("table.description", "Description")}</th>
    <th>${termHtml("table.sector", "Sector")}</th>
    <th class="r">${termHtml("table.qty", "Qty")}</th>
    <th class="r">${termHtml("table.marketPrice", "Price")}</th>
    <th class="r">${termHtml("table.marketValue", "Value")}</th>
    <th class="r">${termHtml("table.costBasis", "Cost Basis")}</th>
    <th class="r">${termHtml("table.unrealizedPL", "Unrealized P&L")}</th>
    <th class="r">${termHtml("table.unrealizedPct", "% Unreal.")}</th>
    <th class="r">${termHtml("table.portfolioWeight", "% Portfolio")}</th>
  </tr></thead><tbody>
  ${positions
    .map((r) => {
      const val = num(r.Value);
      const cost = num(r["Cost Basis"]);
      const pl = num(r["UnrealizedP&L"]);
      const pct = val ? (val / totalNav) * 100 : null;
      const plPct =
        cost != null && Math.abs(cost) > 1e-6 && pl != null ? (pl / cost) * 100 : null;
      const plPctCls = plPct != null ? signCls(plPct) : "";
      return `<tr>
      <td><strong>${r.Symbol}</strong></td>
      <td class="truncate">${r.Description || ""}</td>
      <td>${r.Sector || ""}</td>
      <td class="mono r">${fmtNum(num(r.Quantity), 0)}</td>
      <td class="mono r">${fmtUsd(num(r.ClosePrice))}</td>
      <td class="mono r">${fmtUsd(val)}</td>
      <td class="mono r">${fmtUsd(cost)}</td>
      <td class="mono r ${signCls(pl)}">${fmtUsd(pl)}</td>
      <td class="mono r ${plPctCls}">${plPct != null ? fmtPct(plPct, 1) : "—"}</td>
      <td class="mono r">${pct != null ? fmtPct(pct, 1) : "—"}</td>
    </tr>`;
    })
    .join("")}
  </tbody></table>`;
}
