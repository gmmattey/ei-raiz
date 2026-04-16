export const parseCsv = (content: string, delimiter = ";"): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];
    const next = content[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      row.push(field);
      field = "";
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += ch;
  }

  row.push(field);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return rows;
};

export const toObjects = (rows: string[][]): Array<Record<string, string>> => {
  if (rows.length === 0) return [];
  const headers = rows[0].map((item) => item.trim());
  return rows.slice(1).map((cols) => {
    const item: Record<string, string> = {};
    headers.forEach((header, idx) => {
      item[header] = (cols[idx] ?? "").trim();
    });
    return item;
  });
};
