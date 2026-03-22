/* CSV parsing and section-based model builder */

function parseCSV(text) {
  const rows = [];
  let row = [], cell = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQ && text[i + 1] === '"') { cell += '"'; i++; }
      else inQ = !inQ;
    } else if (c === "," && !inQ) {
      row.push(cell); cell = "";
    } else if ((c === "\n" || c === "\r") && !inQ) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row.map((x) => x.trim()));
      row = []; cell = "";
    } else cell += c;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row.map((x) => x.trim()));
  }
  return rows.filter((r) => r.some((x) => x !== ""));
}

function buildModel(rows) {
  const map = new Map();
  rows.forEach((r) => {
    const [section, type, ...rest] = r;
    if (!map.has(section)) map.set(section, { meta: [], tables: [] });
    const sec = map.get(section);
    if (type === "MetaInfo") sec.meta.push(rest);
    if (type === "Header") sec.tables.push({ header: rest, rows: [] });
    if (type === "Data") {
      const tbl = sec.tables.length
        ? sec.tables[sec.tables.length - 1]
        : (() => { const t = { header: rest.map((_, i) => `col${i + 1}`), rows: [] }; sec.tables.push(t); return t; })();
      tbl.rows.push(rest);
    }
  });
  return map;
}

function getTable(model, section, headerNeedles = []) {
  const sec = model.get(section);
  if (!sec) return null;
  return sec.tables.find((t) =>
    headerNeedles.every((h) => t.header.includes(h))
  ) || sec.tables[0] || null;
}

function tableRows(model, section, headerNeedles = []) {
  const t = getTable(model, section, headerNeedles);
  if (!t) return [];
  return t.rows.map((r) => toObj(t.header, r));
}

function toObj(header, row) {
  return Object.fromEntries(header.map((h, i) => [h, row[i] ?? ""]));
}
