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
import { setColumns, setEditedRow, applyAllEdits, clearEditedRows, deleteRow, persistState, addRow } from '../store/tableSlice';
import { ColumnDef, Row } from '../types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

type InlineCellProps = {
  row: Row;
  colKey: string;
  edited: any; 
  onChange: (value: any) => void;
};

const InlineCell: React.FC<InlineCellProps> = ({ row, colKey, edited, onChange }) => {
  const isEditing = edited !== undefined;
  const value = isEditing ? edited : row[colKey];

  
  const isRowEdited = useAppSelector(s => !!s.table.editedRows[row.id]);
  
 
  if (isRowEdited) {
    return (
      <TextField
        value={value === null || value === undefined ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        onDoubleClick={(e) => e.stopPropagation()} 
        size="small"
        fullWidth
       
        type={colKey === 'age' ? 'number' : 'text'}
        inputProps={colKey === 'age' ? { min: 0 } : {}}
      />
    );
  }

 
  return <span>{value}</span>;
};


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

  
  const visibleColumns = columns.filter(c => c.visible);
  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    
    return rows.filter(r => visibleColumns.some(c => String(r[c.key] ?? '').toLowerCase().includes(q)));
  }, [rows, query, visibleColumns]);

  
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
    
    const validated = key === 'age' ? (value === '' ? '' : Number(value)) : value;
    dispatch(setEditedRow({ id, data: { [key]: validated } }));
  }

  function saveAll() {
    
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
  function handleNewRow() {
    // Generate a unique ID for the new row
    const newId = `r_${Date.now()}`;
    
    // Create a new empty row structure based on visible columns
    const newRow: Row = {
        id: newId,
        name: '',
        email: '',
        age: 0,
        role: '',
        // Initialize all *other* custom columns to empty string/0/null
        ...columns.reduce((acc, col) => {
            if (col.key !== 'name' && col.key !== 'email' && col.key !== 'age' && col.key !== 'role') {
                acc[col.key] = ''; // Default to empty string for new columns
            }
            return acc;
        }, {} as Partial<Row>)
    };

    dispatch(addRow(newRow));
    dispatch(persistState());
    
    // Optional: Immediately open the new row for editing
    // This allows the user to start entering data right away.
    dispatch(setEditedRow({ id: newId, data: newRow }));
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
      
      
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }} 
        mb={2} 
        gap={2} 
      >
        
        
        <Box 
          display="flex" 
          flexDirection={{ xs: 'column', sm: 'row' }} 
          gap={1} 
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          width={{ xs: '100%', sm: 'auto' }}
        >
          
          <TextField 
            placeholder="Global search..." 
            value={query} 
            onChange={(e)=>{ setQuery(e.target.value); setPage(0); }} 
            size="small"
            sx={{ width: { xs: '100%', sm: 200 } }} 
          />
          <Button variant="outlined" onClick={()=>setManageOpen(true)} sx={{ minWidth: 'auto' }}>Manage Columns</Button>
          
          <ImportExport /> 
          <Button 
            variant="contained" 
            onClick={handleNewRow} 
            sx={{ minWidth: 'auto', bgcolor: 'success.main' }}
          >
            Add Row
          </Button>
        </Box>
        
        
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
                  
                  {paged.map(row => (
                    <TableRow key={row.id}>
                      {columns.map(col => (
                        col.visible ? (
                          <TableCell 
                            key={col.key} 
                            
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
                        
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => {
                            
                            if (!editedRows[row.id]) {
                                dispatch(setEditedRow({ id: row.id, data: { ...row } }));
                            }
                          }}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        
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

      
      <TablePagination
        component="div"
        count={sorted.length}
        page={page}
        onPageChange={(_, p)=> setPage(p)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10]}
      />

      
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