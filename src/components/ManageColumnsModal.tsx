import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, FormControlLabel, TextField, IconButton } from '@mui/material';
import { ColumnDef } from '../types';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Draggable, DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';

type Props = {
  open: boolean;
  onClose: () => void;
  columns: ColumnDef[];
  onChange: (cols: ColumnDef[]) => void;
};
export default function ManageColumnsModal({ open, onClose, columns, onChange }: Props) {
  const [local, setLocal] = useState<ColumnDef[]>(columns);
  React.useEffect(()=> setLocal(columns), [columns, open]);

  function toggle(idx: number) {
    const copy = [...local];
    copy[idx] = { ...copy[idx], visible: !copy[idx].visible };
    setLocal(copy);
  }

  function addColumn() {
    const id = `col_${Date.now()}`;
    setLocal([...local, { key: id, label: 'New Column', visible: true }]);
  }

  function updateLabel(idx: number, label: string) {
    const copy = [...local];
    copy[idx] = { ...copy[idx], label };
    setLocal(copy);
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const arr = [...local];
    const [moved] = arr.splice(result.source.index, 1);
    arr.splice(result.destination.index, 0, moved);
    setLocal(arr);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Manage Columns</DialogTitle>
      <DialogContent>
        <Button onClick={addColumn} variant="outlined" sx={{ mb: 2 }}>Add Column</Button>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="cols">
            {(provided)=> (
              <div ref={provided.innerRef} {...provided.droppableProps}>
             
                {local.map((c, i) => (
                  <Draggable key={c.key} draggableId={c.key} index={i}>
                    {(prov) => (
                      <div ref={prov.innerRef} {...prov.draggableProps} style={{ display:'flex', alignItems:'center', gap:8, padding:8, ...prov.draggableProps.style }}>
                    
                        <div {...prov.dragHandleProps}><DragIndicatorIcon/></div>
                        <FormControlLabel control={<Checkbox checked={c.visible} onChange={()=>toggle(i)}/>} label="" />
                        <TextField value={c.label} onChange={(e)=>updateLabel(i,e.target.value)} size="small" />
                      </div>
                
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
  
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => { onChange(local); onClose(); }} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}