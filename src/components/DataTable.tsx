import React, { useMemo, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, TextField, Button, Paper, Box, Tooltip, TableContainer
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ManageColumnsModal from './ManageColumnsModal';
import ImportExport from './ImportExport';
import ConfirmDialog from './ConfirmDialog';
import { setColumns, setEditedRow, applyAllEdits, clearEditedRows, deleteRow, persistState } from '../store/tableSlice';
import { ColumnDef, Row } from '../types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// --- InlineCell Component Implementation (Crucial for inline editing) ---
type InlineCellProps = {
  row: Row;
  colKey: string;
  edited: any; // Partial<Row>[keyof Partial<Row>]
  onChange: (value: any) => void;
};

const InlineCell: React.FC<InlineCellProps> = ({ row, colKey, edited, onChange }) => {
  const isEditing = edited !== undefined;
  const value = isEditing ? edited : row[colKey];

  // Logic to determine if the row has been explicitly marked as edited
  const isRowEdited = useAppSelector(s => !!s.table.editedRows[row.id]);
  
  // Use TextField for editing if the row is marked as edited
  if (isRowEdited) {
    return (
      <TextField
        value={value === null || value === undefined ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        onDoubleClick={(e) => e.stopPropagation()} // Prevent double-click action from bubbling up
        size="small"
        fullWidth
        // Basic type-based input-handling for better UX
        type={colKey === 'age' ? 'number' : 'text'}
        inputProps={colKey === 'age' ? { min: 0 } : {}}
      />
    );
  }

  // Display the original or saved value otherwise
  return <span>{value}</span>;
};
// ------------------------------------------

export default function DataTable() {
  const dispatch = useAppDispatch();
  const rows = useAppSelector(s => s.table.rows);
  const columns = useAppSelector(s => s.table.columns);
  const editedRows = useAppSelector(s => s.table.editedRows);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<{key:string, dir:'asc'|'desc'|null}>({key:'', dir:null});
  const [manageOpen, setManageOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);

  // Filtering & searching
  const visibleColumns = columns.filter(c => c.visible);
  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    // Searches all *visible* fields for the query string
    return rows.filter(r => visibleColumns.some(c => String(r[c.key] ?? '').toLowerCase().includes(q)));
  }, [rows, query, visibleColumns]);

  // Sorting
  const sorted = useMemo(() => {
    if (!sortBy.dir) return filtered;
    const s = [...filtered].sort((a, b) => {
      const va = a[sortBy.key] ?? '';
      const vb = b[sortBy.key] ?? '';
      if (va < vb) return sortBy.dir === 'asc' ? -1 : 1;
      if (va > vb) return sortBy.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return s;
  }, [filtered, sortBy]);

  const paged = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  function toggleSort(key: string) {
    setSortBy(prev => {
      if (prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return { key: '', dir: null };
    });
  }

  function onEditCell(id: string, key: string, value: any) {
    // Basic validation: if key === 'age', numeric conversion
    const validated = key === 'age' ? (value === '' ? '' : Number(value)) : value;
    dispatch(setEditedRow({ id, data: { [key]: validated } }));
  }

  function saveAll() {
    // Validate that ages are numbers
    for (const id in editedRows) {
      const ed = editedRows[id];
      const ageVal = ed.age;
    if (ageVal === undefined || ageVal === null || isNaN(Number(ageVal))) {
      alert('Age must be a valid number for all edited rows.');
      return;
    }
    }
    dispatch(applyAllEdits());
    dispatch(persistState());
  }

  function cancelAll() {
    dispatch(clearEditedRows());
  }

  function confirmDelete(id: string) {
    setToDelete(id);
    setConfirmOpen(true);
  }

  function handleDeleteConfirm() {
    if (!toDelete) return;
    dispatch(deleteRow(toDelete));
    dispatch(persistState());
    setToDelete(null);
  }

  function onColChange(cols: ColumnDef[]) {
    dispatch(setColumns(cols));
    dispatch(persistState());
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const arr = [...columns];
    const [moved] = arr.splice(result.source.index, 1);
    arr.splice(result.destination.index, 0, moved);
    onColChange(arr);
  }

  return (
    <Paper sx={{ p: { xs: 1, md: 2 } }}>
      
      {/* Main Control Bar: Flex wrap on small screens */}
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', sm: 'row' }} // Stack vertically on xs, row on sm+
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }} 
        mb={2} 
        gap={2} // Add gap when stacked
      >
        
        {/* Left Side: Search, Manage, Import/Export */}
        <Box 
          display="flex" 
          flexDirection={{ xs: 'column', sm: 'row' }} // Stack search/buttons vertically on xs
          gap={1} 
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          width={{ xs: '100%', sm: 'auto' }}
        >
          {/* Search Field */}
          <TextField 
            placeholder="Global search..." 
            value={query} 
            onChange={(e)=>{ setQuery(e.target.value); setPage(0); }} 
            size="small"
            sx={{ width: { xs: '100%', sm: 200 } }} // Full width on small screens
          />
          <Button variant="outlined" onClick={()=>setManageOpen(true)} sx={{ minWidth: 'auto' }}>Manage Columns</Button>
          {/* ImportExport component manages its own internal responsiveness */}
          <ImportExport /> 
        </Box>
        
        {/* Right Side: Save/Cancel All */}
        <Box display="flex" gap={1} alignItems="center">
          <Button startIcon={<SaveIcon/>} variant="contained" onClick={saveAll} disabled={Object.keys(editedRows).length===0} size="small">Save All</Button>
          <Button startIcon={<CancelIcon/>} variant="outlined" onClick={cancelAll} disabled={Object.keys(editedRows).length===0} size="small">Cancel All</Button>
        </Box>
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="table-cols" direction="horizontal">
          {(provided)=>(
            <div ref={provided.innerRef} {...provided.droppableProps}>
              <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {/* Render table headers, which are draggable */}
                    {columns.map((col, idx) => (
                      col.visible ? (
                        <Draggable key={col.key} draggableId={col.key} index={idx}>
                          {(prov) => (
                            <TableCell 
                              ref={prov.innerRef} 
                              {...prov.draggableProps} 
                              {...prov.dragHandleProps} 
                              onClick={()=>toggleSort(col.key)} 
                              sx={{ cursor: 'pointer' }}
                            >
                              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                <span>{col.label}</span>
                                <small>{sortBy.key===col.key ? (sortBy.dir==='asc'?'▲':'▼') : ''}</small>
                              </div>
                            </TableCell>
                          )}
                        </Draggable>
                      ) : null
                    ))}
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Render table rows with pagination */}
                  {paged.map(row => (
                    <TableRow key={row.id}>
                      {columns.map(col => (
                        col.visible ? (
                          <TableCell 
                            key={col.key} 
                            // Enables inline editing initialization by marking the row as edited
                            onDoubleClick={() => {
                                if (!editedRows[row.id]) {
                                     dispatch(setEditedRow({ id: row.id, data: { ...row } }));
                                }
                            }}
                          >
                            <InlineCell
                              row={row}
                              colKey={col.key}
                              edited={editedRows[row.id] ? editedRows[row.id][col.key] : undefined}
                              onChange={(v)=>onEditCell(row.id, col.key, v)}
                            />
                          </TableCell>
                        ) : null
                      ))}
                      <TableCell>
                        {/* Edit Button: Initializes editing state for the row */}
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => {
                            // If row is not yet in edit mode, copy all row data to editedRows as initial values
                            if (!editedRows[row.id]) {
                                dispatch(setEditedRow({ id: row.id, data: { ...row } }));
                            }
                          }}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {/* Delete Button: Opens confirmation dialog */}
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => confirmDelete(row.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </TableContainer>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Pagination control */}
      <TablePagination
        component="div"
        count={sorted.length}
        page={page}
        onPageChange={(_, p)=> setPage(p)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10]}
      />

      {/* Modals and Dialogs */}
      <ManageColumnsModal 
        open={manageOpen} 
        onClose={()=>setManageOpen(false)} 
        columns={columns} 
        onChange={onColChange}
      />
      <ConfirmDialog 
        open={confirmOpen} 
        onClose={()=>setConfirmOpen(false)} 
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        content="Are you sure you want to delete this row? This action cannot be undone."
      />
    </Paper>
  );
}