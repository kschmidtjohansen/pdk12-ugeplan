
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Assignment } from '@/types/assignment';
import { getCarIds } from '@/utils/carUtils';

const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin } = usePermissions();
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Mock data for testing - replace with actual data fetching
  useEffect(() => {
    // This would be replaced with actual API call
    setAssignments([]);
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('navigation.admin')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Assignment Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Assignments:</span>
                <Badge variant="outline">{assignments.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>With Cars:</span>
                <Badge variant="outline">
                  {assignments.filter(a => {
                    const carIds = getCarIds(a.car);
                    return carIds.length > 0;
                  }).length}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Published:</span>
                <Badge variant="outline">
                  {assignments.filter(a => a.published).length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Database: Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">API: Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Authentication: Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">
                View All Users
              </button>
              <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">
                Manage Permissions
              </button>
              <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">
                System Settings
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
