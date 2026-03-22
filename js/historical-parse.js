/* Historical XLS parser — extracts structured transaction data */

function parseSpreadsheetXml(xmlText) {
  const source = String(xmlText || "");
  const cleaned = source.replace(/^\uFEFF?[\s\r\n\t]+/, "");
  const parser = new DOMParser();
  let xmlDoc = parser.parseFromString(cleaned, "text/xml");
  if (_hasXmlErr(xmlDoc)) {
    xmlDoc = parser.parseFromString(_extractWb(source), "text/xml");
  }
  if (_hasXmlErr(xmlDoc)) return { title: "Historical Movements", rows: [], headerIndex: -1 };

  const ws = _first(xmlDoc, "Worksheet");
  if (!ws) return { title: "Historical Movements", rows: [], headerIndex: -1 };

  const table = _first(ws, "Table");
  if (!table) return { title: _wsName(ws), rows: [], headerIndex: -1 };

  const rowNodes = _all(table, "Row");
  const rows = rowNodes.map(_parseRow);
  const maxCols = rows.reduce((max, r) => Math.max(max, r.length), 0);
  const normalized = rows.map((r) => _padRow(r, maxCols));
  const compactRows = normalized.map(_trimRow);

  return { title: _wsName(ws), rows: compactRows, headerIndex: _detectHeader(compactRows) };
}

function buildHistoricalModel(parsed) {
  const { rows, headerIndex } = parsed;
  if (!rows.length || headerIndex < 0) return { transactions: [], meta: [] };

  const headers = rows[headerIndex];
  const bodyRows = rows.slice(headerIndex + 1).filter((r) => r.some(Boolean));
  const meta = headerIndex > 0 ? rows.slice(0, headerIndex).filter((r) => r.some(Boolean)) : [];

  const FIELD_MAP = {
    securityId: "מספר נייר",
    name: "שם",
    action: "פעולה",
    execDate: "תאריך ביצוע",
    payDate: "תאריך תשלום",
    quantity: "כמות",
    price: "שער",
    proceeds: "תמורה",
    commission: "עמלה",
    tax: "מס",
    currency: "מטבע",
  };

  const colIdx = {};
  for (const [key, heb] of Object.entries(FIELD_MAP)) {
    colIdx[key] = headers.findIndex((h) => h.trim() === heb);
    if (colIdx[key] < 0) colIdx[key] = headers.findIndex((h) => h.includes(heb));
  }

  const transactions = bodyRows.map((row) => {
    const get = (key) => (colIdx[key] >= 0 ? (row[colIdx[key]] || "").trim() : "");
    const n = (key) => {
      const raw = get(key);
      const v = Number(String(raw).replace(/,/g, ""));
      return Number.isFinite(v) ? v : 0;
    };
    return {
      securityId: get("securityId"),
      name: get("name"),
      action: get("action"),
      execDate: _parseHebDate(get("execDate")),
      payDate: _parseHebDate(get("payDate")),
      quantity: n("quantity"),
      price: n("price"),
      proceeds: n("proceeds"),
      commission: n("commission"),
      tax: n("tax"),
      currency: get("currency"),
    };
  });

  return { transactions, meta };
}

function computeHistoricalStats(transactions) {
  const real = transactions.filter((t) => t.action && !t.action.includes("ביטול"));

  const buys = real.filter((t) => t.action === "קניה");
  const sells = real.filter((t) => t.action === "מכירה");
  const dividends = real.filter((t) => t.action === "דיבידנד");

  const totalProceeds = real.reduce((s, t) => s + Math.abs(t.proceeds), 0);
  const totalCommission = real.reduce((s, t) => s + Math.abs(t.commission), 0);
  const totalTax = real.reduce((s, t) => s + Math.abs(t.tax), 0);
  const totalDividendIncome = dividends.reduce((s, t) => s + Math.abs(t.proceeds), 0);
  const totalBuyVolume = buys.reduce((s, t) => s + Math.abs(t.proceeds), 0);
  const totalSellVolume = sells.reduce((s, t) => s + Math.abs(t.proceeds), 0);

  const actionCounts = {};
  real.forEach((t) => {
    actionCounts[t.action] = (actionCounts[t.action] || 0) + 1;
  });

  const currencyVolume = {};
  real.forEach((t) => {
    const key = t.currency || "Unknown";
    currencyVolume[key] = (currencyVolume[key] || 0) + Math.abs(t.proceeds);
  });

  const securityVolume = {};
  real.forEach((t) => {
    if (!t.name) return;
    securityVolume[t.name] = (securityVolume[t.name] || 0) + Math.abs(t.proceeds);
  });

  const timeline = {};
  real.forEach((t) => {
    const d = t.execDate || t.payDate;
    if (!d) return;
    const month = d.slice(0, 7);
    if (!timeline[month]) timeline[month] = { buys: 0, sells: 0, dividends: 0, other: 0 };
    if (t.action === "קניה") timeline[month].buys += Math.abs(t.proceeds);
    else if (t.action === "מכירה") timeline[month].sells += Math.abs(t.proceeds);
    else if (t.action === "דיבידנד") timeline[month].dividends += Math.abs(t.proceeds);
    else timeline[month].other += Math.abs(t.proceeds);
  });

  const uniqueSecurities = new Set(real.filter((t) => t.name).map((t) => t.name)).size;

  return {
    totalTransactions: real.length,
    buyCount: buys.length,
    sellCount: sells.length,
    dividendCount: dividends.length,
    totalProceeds,
    totalCommission,
    totalTax,
    totalDividendIncome,
    totalBuyVolume,
    totalSellVolume,
    actionCounts,
    currencyVolume,
    securityVolume,
    timeline,
    uniqueSecurities,
  };
}

function _parseHebDate(s) {
  if (!s) return "";
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
}

function _parseRow(rowNode) {
  const cells = [];
  let cursor = 0;
  _all(rowNode, "Cell").forEach((cellNode) => {
    const idxRaw = cellNode.getAttribute("ss:Index") || cellNode.getAttribute("Index");
    const idx = Number(idxRaw);
    if (Number.isFinite(idx) && idx > 0) cursor = idx - 1;
    const data = _first(cellNode, "Data");
    cells[cursor] = data ? data.textContent?.trim() || "" : "";
    cursor += 1;
  });
  return cells;
}

function _first(root, tag) {
  const ns = root.getElementsByTagNameNS("*", tag);
  if (ns?.length) return ns[0];
  const plain = root.getElementsByTagName(tag);
  return plain?.length ? plain[0] : null;
}

function _all(root, tag) {
  const ns = root.getElementsByTagNameNS("*", tag);
  return ns?.length ? Array.from(ns) : Array.from(root.getElementsByTagName(tag));
}

function _wsName(ws) {
  return (
    ws.getAttribute("ss:Name") ||
    ws.getAttributeNS("urn:schemas-microsoft-com:office:spreadsheet", "Name") ||
    ws.getAttribute("Name") ||
    "Historical Movements"
  );
}

function _hasXmlErr(doc) { return !!_first(doc, "parsererror"); }

function _extractWb(src) {
  const s = src.indexOf("<Workbook");
  const e = src.lastIndexOf("</Workbook>");
  return s === -1 || e === -1 ? src : src.slice(s, e + "</Workbook>".length);
}

function _padRow(row, len) {
  const out = new Array(len).fill("");
  row.forEach((v, i) => { out[i] = v ?? ""; });
  return out;
}

function _trimRow(row) {
  let end = row.length;
  while (end > 0 && !row[end - 1]) end -= 1;
  return row.slice(0, end);
}

function _detectHeader(rows) {
  const byKw = rows.findIndex((r) => r.filter(Boolean).length >= 6 && r.some((v) => v.includes("מספר נייר")));
  if (byKw >= 0) return byKw;
  return rows.findIndex((r) => r.filter(Boolean).length >= 5);
}
