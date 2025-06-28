
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import SystemHealthDashboard from '@/components/SystemHealthDashboard';

const SystemHealthPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
        {/* Header */}
        <Card className="border-2 border-border/50 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">
                  System Health Monitor
                </CardTitle>
                <p className="text-blue-100 text-sm font-medium">
                  Comprehensive system diagnostics and data access verification
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Health Dashboard */}
        <SystemHealthDashboard />
      </div>
    </div>
  );
};

export default SystemHealthPage;
