import React from 'react';
import { useAppSelector, useAppDispatch } from '../hooks';
import { setTheme, persistState } from '../store/tableSlice';
import { IconButton } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

export default function ThemeToggle() {
  const theme = useAppSelector(s => s.table.theme);
  const dispatch = useAppDispatch();
  return (
    <IconButton
      onClick={() => {
        const next = theme === 'light' ? 'dark' : 'light';
        dispatch(setTheme(next));
        dispatch(persistState());
      }}
      aria-label="toggle theme"
    >
      {theme === 'light' ? <DarkModeIcon/> : <LightModeIcon/>}
    </IconButton>
  );
}