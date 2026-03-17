import React, { useState, useEffect } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useTranslation } from '@/context/TranslationContext';
import { useChangeLogs } from '@/context/ChangeLogContext';
import { usePermissions } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays } from 'date-fns';
import { FileEdit, FilePlus, FileX, Upload, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ChangeLogPage: React.FC = () => {
  const { t } = useTranslation();
  const { fetchChangeLogsByDateRange } = useChangeLogs();
  const navigate = useNavigate();
  const { isEffectiveAdmin, isEffectiveSkadeleder } = usePermissions();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('14'); // days
  const [operationFilter, setOperationFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLogs();
  }, [dateRange]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));
      const data = await fetchChangeLogsByDateRange(startDate, endDate);
      setLogs(data);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'CREATE':
        return <FilePlus className="h-4 w-4 text-green-500" />;
      case 'UPDATE':
        return <FileEdit className="h-4 w-4 text-blue-500" />;
      case 'DELETE':
        return <FileX className="h-4 w-4 text-red-500" />;
      case 'PUBLISH':
        return <Upload className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getChangeDescription = (log: any): string => {
    const details = log.change_details || {};
    const caseNumber = details.case_number || details.title || '-';
    
    if (log.operation === 'CREATE') {
      return `${t('changeLog.created')} ${caseNumber}`;
    }
    
    if (log.operation === 'DELETE') {
      const formattedDate = details.date ? formatDateForDisplay(details.date) : '';
      const dateText = formattedDate ? ` ${t('changeLog.fromDate')} ${formattedDate}` : '';
      return `${t('changeLog.deleted')} ${caseNumber}${dateText}`;
    }
    
    if (log.operation === 'PUBLISH') {
      const count = details.count || 1;
      return `${t('changeLog.published')} ${count} ${t('changeLog.tasks')}`;
    }
    
    if (log.operation === 'UPDATE') {
      const changes = details.changes || {};
      
      if (changes.employees) {
        const { added, removed } = changes.employees;
        if (removed && removed.length > 0) {
          return `${t('changeLog.removed')} ${removed.join(', ')} ${t('changeLog.from')} ${caseNumber}`;
        }
        if (added && added.length > 0) {
          return `${t('changeLog.added')} ${added.join(', ')} ${t('changeLog.to')} ${caseNumber}`;
        }
      }
      
      return `Opdateret ${caseNumber}`;
    }
    
    return 'Unknown operation';
  };

  const filteredLogs = logs.filter(log => {
    // Filter by operation type
    if (operationFilter !== 'ALL' && log.operation !== operationFilter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const caseNumber = log.change_details?.case_number || '';
      const userName = (log.changed_by_first_name || log.changed_by_name || '').toLowerCase();
      return caseNumber.toLowerCase().includes(searchLower) || userName.includes(searchLower);
    }
    
    return true;
  });

  const handleRowClick = (log: any) => {
    if (log.assignment_id) {
      navigate('/planner');
    }
  };

  // Role-gate: Only admin and skadeleder can access
  if (!isEffectiveAdmin && !isEffectiveSkadeleder) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('accessDenied.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('accessDenied.restricted')}</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <DataFetchErrorBoundary>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('changeLog.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('changeLog.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{t('changeLog.last7Days')}</SelectItem>
                  <SelectItem value="14">{t('changeLog.last14Days')}</SelectItem>
                  <SelectItem value="30">{t('changeLog.last30Days')}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={operationFilter} onValueChange={setOperationFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('changeLog.allOperations')}</SelectItem>
                  <SelectItem value="CREATE">{t('changeLog.operations.CREATE')}</SelectItem>
                  <SelectItem value="UPDATE">{t('changeLog.operations.UPDATE')}</SelectItem>
                  <SelectItem value="DELETE">{t('changeLog.operations.DELETE')}</SelectItem>
                  <SelectItem value="PUBLISH">{t('changeLog.operations.PUBLISH')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex gap-4">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-4 bg-muted rounded flex-1"></div>
                  </div>
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('changeLog.noChanges')}
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">{t('changeLog.time')}</TableHead>
                      <TableHead className="w-[150px]">{t('changeLog.user')}</TableHead>
                      <TableHead>{t('changeLog.action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow
                        key={log.id}
                        onClick={() => handleRowClick(log)}
                        className="cursor-pointer hover:bg-accent"
                      >
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), 'HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getOperationIcon(log.operation)}
                            <span className="font-medium">
                              {log.changed_by_first_name || log.changed_by_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getChangeDescription(log)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DataFetchErrorBoundary>
  );
};

export default ChangeLogPage;
