import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '@/context/TranslationContext';
import AppTopBar from '@/components/Layout/AppTopBar';

createRoot(document.getElementById('root')!).render(
  <MemoryRouter initialEntries={['/planner']}>
    <TranslationProvider>
      <AppTopBar />
    </TranslationProvider>
  </MemoryRouter>
);
