'use client';

import React, { useMemo } from 'react';
import { Provider } from 'react-redux';
import { store } from '../src/store/store';
import dynamic from 'next/dynamic';
import { Box, Container, CssBaseline } from '@mui/material';
import { useAppSelector } from '../src/hooks';
import { createTheme, ThemeProvider } from '@mui/material/styles';


const DataTable = dynamic(() => import('../src/components/DataTable'), { ssr: false });
const ThemeToggle = dynamic(() => import('../src/components/ThemeToggle'), { ssr: false });


function AppContent() {
  const themeMode = useAppSelector(state => state.table.theme);

 
  const theme = useMemo(() => createTheme({
    palette: {
      mode: themeMode,
    },
  }), [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
     
      <Container maxWidth="xl" sx={{ py: 2, px: { xs: 1, md: 2 } }}> 
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <h1>Dynamic Data Table</h1>
          <ThemeToggle />
        </Box>
        <DataTable />
      </Container>
    </ThemeProvider>
  );
}


export default function Home() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}