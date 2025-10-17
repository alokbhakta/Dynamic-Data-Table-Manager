'use client';

import React, { useMemo } from 'react';
import { Provider } from 'react-redux';
import { store } from '../src/store/store';
import dynamic from 'next/dynamic';
import { Box, Container, CssBaseline } from '@mui/material';
import { useAppSelector } from '../src/hooks';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Dynamic imports for components that use client-side features (like Redux, local storage)
const DataTable = dynamic(() => import('../src/components/DataTable'), { ssr: false });
const ThemeToggle = dynamic(() => import('../src/components/ThemeToggle'), { ssr: false });

/**
 * The main component that applies the MUI theme based on Redux state.
 */
function AppContent() {
  const themeMode = useAppSelector(state => state.table.theme);

  // Create a theme instance.
  const theme = useMemo(() => createTheme({
    palette: {
      mode: themeMode,
    },
  }), [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Container ensures proper horizontal padding and max-width based on screen size */}
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

/**
 * The root page component providing the Redux store.
 */
export default function Home() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}