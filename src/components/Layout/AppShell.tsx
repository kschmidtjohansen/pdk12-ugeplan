import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import AppTopBar from './AppTopBar';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppTopBar />
          <main className="flex-1 w-full">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppShell;
