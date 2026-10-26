import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TranslationProvider } from '@/context/TranslationContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppTopBar from '@/components/Layout/AppTopBar';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <MemoryRouter initialEntries={['/planner']}>
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <SidebarProvider>
          <div className="flex min-h-svh w-full flex-col">
            <AppTopBar />
          </div>
        </SidebarProvider>
      </TranslationProvider>
    </QueryClientProvider>
  </MemoryRouter>
);
