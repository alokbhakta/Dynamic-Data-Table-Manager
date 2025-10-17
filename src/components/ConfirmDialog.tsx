import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

type Props = {
  open: boolean;
  title?: string;
  content?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({ open, title='Confirm', content, onClose, onConfirm }: Props) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => { onConfirm(); onClose(); }} variant="contained">Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}