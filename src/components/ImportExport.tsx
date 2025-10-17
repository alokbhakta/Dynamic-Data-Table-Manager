import React, { useRef } from 'react';
import { Button } from '@mui/material';
import { parseCsv, toCsv } from '../lib/csv';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setRows, persistState } from '../store/tableSlice';
import { saveAs } from 'file-saver';



export default function ImportExport() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const dispatch = useAppDispatch();
  const rows = useAppSelector(s => s.table.rows);
  const columns = useAppSelector(s => s.table.columns);
  async function onImport() {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    try {
      const res = await parseCsv(f);
      // Map parsed data to Row[] format, ensuring each imported row has a unique 'id'
      const parsed = res.data.map((r, i) => ({ id: `imp_${Date.now()}_${i}`, ...r }));
      dispatch(setRows(parsed));
      dispatch(persistState());
      alert('Imported ' + parsed.length + ' rows');
    } catch (e) {
      alert('Import failed: ' + (e as Error).message);
    }
  }

  function onExport() {
    const visibleCols = columns.filter(c => c.visible).map(c => c.key);
    const csv = toCsv(rows, visibleCols);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'table-export.csv');
  }

  return (
    <div style={{ display:'flex', gap:8 }}>
      <input type="file" accept=".csv" ref={fileRef} style={{ display:'none' }} id="csv-import"/>
      <label htmlFor="csv-import">
        <Button variant="outlined" component="span" onClick={() => fileRef.current?.click()}>Choose CSV</Button>
      </label>
      <Button variant="contained" onClick={onImport}>Import CSV</Button>
      <Button variant="outlined" onClick={onExport}>Export CSV</Button>
    </div>
  );
}