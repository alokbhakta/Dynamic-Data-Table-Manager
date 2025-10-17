import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Row, ColumnDef } from '../types';
const STORAGE_KEY = 'ddt_state_v1';

type TableState = {
  rows: Row[];
  columns: ColumnDef[];
  editedRows: Record<string, Partial<Row>>;
  theme: 'light' | 'dark';
};

const defaultColumns: ColumnDef[] = [
  { key: 'name', label: 'Name', visible: true },
  { key: 'email', label: 'Email', visible: true },
  { key: 'age', label: 'Age', visible: true },
  { key: 'role', label: 'Role', visible: true }
];
const initialState: TableState = (() => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    rows: [
      { id: 'r1', name: 'Alok Kumar Bhakta', email: 'alokbhakta2018@gmail.com', age: 23, role: 'frontend Developer' },
      { id: 'r2', name: 'Harsh Goyal', email: 'harsh@gmail.com', age: 22, role: 'Developer' },
      { id: 'r3', name: 'Amit Yadav', email: 'amit@gmail.com', age: 23, role: 'Backend Developer' }
    ],
    columns: defaultColumns,
    editedRows: {},
    theme: 'light'
  };
})();
const slice = createSlice({
  name: 'table',
  initialState,
  reducers: {
    setRows(state, action: PayloadAction<Row[]>) {
      state.rows = action.payload;
    },
    addRow(state, action: PayloadAction<Row>) {
      state.rows.unshift(action.payload);
    },
    updateRow(state, action: PayloadAction<{ id: string; data: Partial<Row> }>) {
      const { id, data } = action.payload;
      state.rows = state.rows.map(r => (r.id === id ? { ...r, ...data } : r));
    },
    deleteRow(state, action: PayloadAction<string>) {
      state.rows = state.rows.filter(r => r.id !== action.payload);
    },
    setColumns(state, action: PayloadAction<ColumnDef[]>) {
      state.columns = action.payload;
    },
    setEditedRow(state, action: PayloadAction<{ id: string; data: Partial<Row> | null }>) {
      const { id, data } = action.payload;
      if (data) state.editedRows[id] = { ...(state.editedRows[id] || {}), ...data };
      else delete state.editedRows[id];
    },
    clearEditedRows(state) {
      state.editedRows = {};
    },
    applyAllEdits(state) {
      for (const id in state.editedRows) {
        state.rows = state.rows.map(r => (r.id === id ? { ...r, ...state.editedRows[id] } : r));
      }
      state.editedRows = {};
    },
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload;
    },
    persistState(state) {
      try {
        const s = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, s);
      } catch (e) {
        console.error('persist error', e);
      }
    }
  }
});

export const {
  setRows,
  addRow,
  updateRow,
  deleteRow,
  setColumns,
  setEditedRow,
  clearEditedRows,
  applyAllEdits,
  setTheme,
  persistState
} = slice.actions;
export default slice.reducer;
