import Papa from 'papaparse';
import { Row } from '../types';
export function parseCsv(file: File): Promise<{ data: Row[]; errors: any[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Row[];
        resolve({ data, errors: results.errors });
      },
      error: (err) => reject(err)
    });
  });
}

export function toCsv(rows: any[], columns: string[]) {
  const header = columns;
  const csvRows = [header.join(',')];
  for (const row of rows) {
    const line = columns.map(c => {
      const val = row[c] ?? '';
      const cell = typeof val === 'string' ? val.replace(/"/g, '""') : String(val);
      return `"${cell}"`;
    }).join(',');
    csvRows.push(line);
  }
  return csvRows.join('\r\n');
}