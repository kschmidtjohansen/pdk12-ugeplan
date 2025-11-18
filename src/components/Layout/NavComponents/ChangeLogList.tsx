import React from 'react';
import { format } from 'date-fns';
import { Plus, Edit, Trash2, Send, FileText } from 'lucide-react';
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
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOperationText = (operation: string) => {
    switch (operation) {
      case 'CREATE':
        return t('planner.changeLog.created') || 'oprettede';
      case 'UPDATE':
        return t('planner.changeLog.updated') || 'opdaterede';
      case 'DELETE':
        return t('planner.changeLog.deleted') || 'slettede';
      case 'PUBLISH':
        return t('planner.changeLog.published') || 'publicerede';
      default:
        return operation;
    }
  };

  const getChangeDescription = (log: any): string => {
    const details = log.change_details || {};
    const caseNumber = details.case_number;
    
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
      
      // Handle employee changes - show in Danish format
      if (changes.employees) {
        const { added, removed } = changes.employees;
        if (removed && removed.length > 0) {
          return `${t('changeLog.removed')} ${removed.join(', ')} ${t('changeLog.from')} ${caseNumber}`;
        }
        if (added && added.length > 0) {
          return `${t('changeLog.added')} ${added.join(', ')} ${t('changeLog.to')} ${caseNumber}`;
        }
      }
      
      // Other changes
      const otherFields = Object.keys(changes).filter(f => f !== 'employees');
      if (otherFields.length > 0) {
        return `Opdateret ${caseNumber}`;
      }
      
      return `Opdateret ${caseNumber}`;
    }
    
    return 'Unknown operation';
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const handleLogClick = (log: any) => {
    // Navigate to planner if assignment still exists
    if (log.assignment_id && log.operation !== 'DELETE') {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        {t('common.loading') || 'Indlæser...'}
      </div>
    );
  }

  if (changeLogs.length === 0) {
    return (
      <div className="p-8 text-center">
        <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          {t('planner.changeLog.noChanges') || 'Ingen ændringer endnu'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-96">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">
          {t('planner.changeLog.title') || 'Planner Ændringer'}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('planner.changeLog.subtitle') || 'Seneste aktivitet i planneren'}
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {changeLogs.map((log, index) => (
            <React.Fragment key={log.id}>
              <div
                className="p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleLogClick(log)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getOperationIcon(log.operation)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{log.changed_by_name}</span>
                      {' '}
                      <span className="text-muted-foreground">
                        {getOperationText(log.operation)}
                      </span>
                      {' '}
                      <span className="font-medium">{getChangeDescription(log)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(log.created_at)}
                    </p>
                  </div>
                </div>
              </div>
              {index < changeLogs.length - 1 && <Separator className="my-1" />}
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChangeLogList;
