import React from 'react';
import { format } from 'date-fns';
import { Plus, Edit, Trash2, Send } from 'lucide-react';
import { useChangeLogs } from '@/context/ChangeLogContext';
import { useTranslation } from '@/context/TranslationContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ChangeLogList: React.FC = () => {
  const { changeLogs, loading: isLoading } = useChangeLogs();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'CREATE':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'PUBLISH':
        return <Send className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getChangeDescription = (log: any): string => {
    const details = log.change_details || {};
    const caseNumber = details.case_number || '-';
    
    if (log.operation === 'CREATE') {
      return `${t('changeLog.created')} ${caseNumber}`;
    }
    
    if (log.operation === 'DELETE') {
      return `${t('changeLog.deleted')} ${caseNumber}`;
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

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const handleLogClick = (log: any) => {
    if (log.assignment_id && log.operation !== 'DELETE') {
      navigate('/planner');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">{t('changeLog.recentChanges')}</h3>
        </div>
        <div className="p-4 text-center text-sm text-muted-foreground">
          {t('common.loading')}
        </div>
        <div className="p-3 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/changelog')}
          >
            {t('changeLog.viewAll')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">{t('changeLog.recentChanges')}</h3>
      </div>
      
      <ScrollArea className="h-[350px]">
        <div className="p-2">
          {changeLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {t('changeLog.noRecentChanges')}
            </div>
          ) : (
            changeLogs.map((log) => (
              <button
                key={log.id}
                onClick={() => handleLogClick(log)}
                className="w-full text-left p-3 hover:bg-accent rounded-lg transition-colors mb-1"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getOperationIcon(log.operation)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {formatTime(log.created_at)} {log.changed_by_first_name || log.changed_by_name} - {getChangeDescription(log)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-3 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/changelog')}
        >
          {t('changeLog.viewAll')}
        </Button>
      </div>
    </div>
  );
};

export default ChangeLogList;
