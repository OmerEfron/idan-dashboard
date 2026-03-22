/* Beginner-friendly terminology + tooltip helpers */
const TERM_GLOSSARY = {
  "section.cumulativeVsBenchmarks": { friendly: "Portfolio Growth vs Market Indexes", tip: "Shows your total return over time compared with common market indexes (benchmarks)." },
  "section.navAndAllocation": { friendly: "Total Portfolio Value and Mix Over Time", tip: "Tracks how your portfolio value changes and how much is in stocks vs cash over time." },
  "section.currentAllocation": { friendly: "Current Portfolio Mix", tip: "Breaks down where your money is currently invested by instrument type." },
  "section.monthlyReturns": { friendly: "Monthly Performance Snapshot", tip: "Each row shows how your portfolio and benchmarks performed in a given month." },
  "section.symbolContribution": { friendly: "Which Holdings Helped or Hurt Most", tip: "Shows how much each symbol contributed to your overall return." },
  "section.sectorAttribution": { friendly: "Sector-Level Impact vs S&P 500", tip: "Compares how your sector exposure affected performance versus the S&P 500 benchmark." },
  "section.riskMeasures": { friendly: "Risk and Stability Metrics", tip: "Measures how bumpy returns were and how much downside risk your portfolio took." },
  "section.tradeSummary": { friendly: "Closed Trade Results (Realized Profit/Loss)", tip: "Profit or loss from trades that were opened and closed during the period." },
  "section.openPositions": { friendly: "Current Holdings (Open Positions)", tip: "Investments you still own, including market value and unrealized gain/loss." },
  "section.esgRatings": { friendly: "Sustainability and Governance Scores", tip: "ESG scores estimate environmental, social, and governance risk quality." },
  "section.projectedIncome": { friendly: "Estimated Future Income", tip: "Expected dividend or distribution income based on current holdings and rates." },
  "kpi.endingNav": { friendly: "Current Portfolio Value", tip: "Net Asset Value (NAV): total assets minus liabilities at the end of the period." },
  "kpi.cumulativeReturn": { friendly: "Total Return", tip: "Overall percent gain or loss across the selected period." },
  "kpi.maxDrawdown": { friendly: "Largest Drop From Peak", tip: "Maximum drawdown: the biggest decline from a prior high before recovery." },
  "kpi.sharpeRatio": { friendly: "Return per Unit of Total Risk", tip: "Sharpe ratio compares excess return to total volatility. Higher is generally better." },
  "kpi.sortinoRatio": { friendly: "Return per Unit of Downside Risk", tip: "Sortino ratio is like Sharpe, but only penalizes harmful downside volatility." },
  "kpi.stdDeviation": { friendly: "Return Volatility", tip: "Standard deviation shows how much returns typically swing around their average." },
  "kpi.bestDay": { friendly: "Best Single Day", tip: "Highest one-day return in the selected period." },
  "kpi.worstDay": { friendly: "Worst Single Day", tip: "Lowest one-day return in the selected period." },
  "kpi.changeNav": { friendly: "Net Value Change", tip: "Difference between beginning and ending portfolio value over the period." },
  "kpi.mtm": { friendly: "Unrealized Value Change (MTM)", tip: "Mark-to-market (MTM): gain/loss based on current prices for open positions." },
  "kpi.fees": { friendly: "Fees and Trading Costs", tip: "Commissions and other costs paid to execute trades." },
  "kpi.beginningNav": { friendly: "Starting Portfolio Value", tip: "Portfolio NAV at the beginning of the selected period." },
  "table.account": { friendly: "Your Portfolio", tip: "Your account values and returns." },
  "bench.SPXTR": { friendly: "S&P 500 Total Return", tip: "S&P 500 with dividends reinvested; a common U.S. large-cap benchmark." },
  "bench.EFA": { friendly: "Developed Markets ex-US (EFA)", tip: "Tracks large and mid-cap stocks in developed markets outside the U.S. and Canada." },
  "bench.VT": { friendly: "Global Stock Market (VT)", tip: "Broad global equity benchmark covering U.S. and international stocks." },
  "table.metric": { friendly: "Metric", tip: "A measurement used to evaluate return, risk, or consistency." },
  "table.month": { friendly: "Month", tip: "Calendar month for the row of performance data." },
  "table.vs": { friendly: "vs", tip: "Compared against this benchmark." },
  "table.relativeMetric": { friendly: "Relative Metric", tip: "Shows your portfolio's risk/return behavior relative to each benchmark." },
  "table.symbol": { friendly: "Ticker Symbol", tip: "Short market code used to identify an investment (for example, AAPL)." },
  "table.description": { friendly: "Holding Name", tip: "Company or fund name associated with the symbol." },
  "table.sector": { friendly: "Business Sector", tip: "Industry group the company belongs to (such as Technology or Healthcare)." },
  "table.frequency": { friendly: "Payment Frequency", tip: "How often expected income is paid (for example monthly or quarterly)." },
  "table.qty": { friendly: "Units", tip: "Number of shares or units currently held." },
  "table.qtyBought": { friendly: "Units Bought", tip: "Total shares or units purchased in the period." },
  "table.qtySold": { friendly: "Units Sold", tip: "Total shares or units sold in the period." },
  "table.avgBuyPrice": { friendly: "Average Buy Price", tip: "Average price paid per unit across buy trades." },
  "table.avgSellPrice": { friendly: "Average Sell Price", tip: "Average price received per unit across sell trades." },
  "table.totalBuyCost": { friendly: "Total Buy Cost", tip: "Total amount spent on purchases." },
  "table.saleProceeds": { friendly: "Total Sale Proceeds", tip: "Total amount received from completed sales." },
  "table.netRealizedPL": { friendly: "Net Realized Profit/Loss", tip: "Profit or loss from closed trades after buys and sells are matched." },
  "table.marketPrice": { friendly: "Current Price", tip: "Latest price per unit used in this report." },
  "table.marketValue": { friendly: "Current Market Value", tip: "Current price multiplied by units held." },
  "table.costBasis": { friendly: "Total Amount Invested (Cost Basis)", tip: "Original cost used to calculate gain/loss when compared with current value." },
  "table.unrealizedPL": { friendly: "Open Profit/Loss", tip: "Gain or loss on positions not sold yet (paper P/L)." },
  "table.unrealizedPct": { friendly: "Open Gain/Loss %", tip: "Open profit/loss as a percentage of cost basis." },
  "table.portfolioWeight": { friendly: "Share of Portfolio %", tip: "How much of your total portfolio this position represents." },
  "table.yieldPct": { friendly: "Income Yield %", tip: "Estimated annual income divided by current value, expressed as a percentage." },
  "table.estimatedAnnualIncome": { friendly: "Estimated Annual Income", tip: "Projected income over the next 12 months based on current rates." },
  "table.estimatedRemainingIncome": { friendly: "Estimated Remaining This Year", tip: "Projected income expected for the rest of the current year." },
  "table.year": { friendly: "Year", tip: "Calendar year shown in the return grid." },
  "table.yearlyAverage": { friendly: "Average Monthly Return", tip: "Average of available monthly returns for that year." },
  "risk.Ending VAMI": { friendly: "Growth Index Ending Value (VAMI)", tip: "VAMI tracks growth of a hypothetical investment over time; this is the ending level." },
  "risk.Max Drawdown": { friendly: "Largest Peak-to-Trough Drop", tip: "The worst percentage decline from a high point before a new high is reached." },
  "risk.Peak-To-Valley": { friendly: "Drop Period (Peak to Trough Dates)", tip: "Date range from the prior high point to the lowest point of that drawdown." },
  "risk.Recovery": { friendly: "Recovered Yet?", tip: "Shows whether returns have climbed back to the previous peak." },
  "risk.Sharpe Ratio": { friendly: "Return per Unit of Total Risk (Sharpe)", tip: "Risk-adjusted return using total volatility; higher generally indicates better efficiency." },
  "risk.Sortino Ratio": { friendly: "Return per Unit of Downside Risk (Sortino)", tip: "Risk-adjusted return focusing only on downside volatility." },
  "risk.Standard Deviation": { friendly: "Volatility (Standard Deviation)", tip: "How widely returns vary around their average." },
  "risk.Downside Deviation": { friendly: "Downside Volatility", tip: "Volatility measured only from negative returns." },
  "risk.Mean Return": { friendly: "Average Return per Period", tip: "Arithmetic average return over the sampled periods." },
  "risk.Positive Periods": { friendly: "Winning Periods", tip: "Number and percentage of periods with positive returns." },
  "risk.Negative Periods": { friendly: "Losing Periods", tip: "Number and percentage of periods with negative returns." },
  "risk.Correlation": { friendly: "Moves With Benchmark (Correlation)", tip: "How closely your returns moved with each benchmark. 1 means very closely, 0 means unrelated." },
  "risk.Beta": { friendly: "Sensitivity to Benchmark (Beta)", tip: "Estimated move vs benchmark moves. Beta > 1 is more sensitive; < 1 is less sensitive." },
  "risk.Alpha": { friendly: "Excess Return vs Benchmark (Alpha)", tip: "Return beyond what beta exposure would predict. Positive alpha implies outperformance." },
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tipIcon(tip) {
  if (!tip) return "";
  const safeTip = escapeHtml(tip);
  return `<span class="term-tip" tabindex="0" role="img" aria-label="${safeTip}" data-tip="${safeTip}">i</span>`;
}

function termText(key, fallback = "") {
  return TERM_GLOSSARY[key]?.friendly || fallback || key;
}

function termHtml(key, fallback = "") {
  const term = TERM_GLOSSARY[key];
  const label = escapeHtml(term?.friendly || fallback || key);
  return `<span class="term-label">${label}</span>${tipIcon(term?.tip)}`;
}

function benchmarkHtml(code) {
  const key = `bench.${String(code || "").trim()}`;
  return termHtml(key, code);
}

function riskMetricHtml(rawMetric) {
  const clean = String(rawMetric || "").replace(/:\s*$/, "").trim();
  const key = `risk.${clean}`;
  if (TERM_GLOSSARY[key]) return termHtml(key, clean);
  return `${escapeHtml(clean)}${tipIcon("Risk metric reported by your broker. Hover for details where available.")}`;
}
