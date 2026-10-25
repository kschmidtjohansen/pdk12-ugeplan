import React, { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import AppTopBar from './AppTopBar';
import MobileBottomNav from './MobileBottomNav';
import { applyColorScheme, getStoredColorScheme } from '@/hooks/useColorScheme';
import AssignmentDetailsDialog from '@/components/Planner/AssignmentDetailsDialog';
import { UnreadMessagesProvider } from '@/context/UnreadMessagesContext';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  useEffect(() => {
    applyColorScheme(getStoredColorScheme());
  }, []);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Gå til indhold
      </a>
      <UnreadMessagesProvider>
        <SidebarProvider defaultOpen={true} className="operations-shell">
          <div className="flex min-h-dvh w-full bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0 border-l border-border">
              <AppTopBar />
              <main
                id="main-content"
                role="main"
                tabIndex={-1}
                className="flex-1 w-full pt-4 pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-4"
              >
                {children}
              </main>
            </div>
          </div>
          <MobileBottomNav />
          <AssignmentDetailsDialog />
        </SidebarProvider>
      </UnreadMessagesProvider>
    </>
  );
};

export default AppShell;
