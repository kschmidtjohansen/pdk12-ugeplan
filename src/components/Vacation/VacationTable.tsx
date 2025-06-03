
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Vacation } from '@/types/vacation';
import { format, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import { CheckCircle, XCircle, Edit } from 'lucide-react';

interface VacationTableProps {
  vacations: Vacation[];
  onApprove: (vacation: Vacation) => void;
  onReject: (vacation: Vacation) => void;
  onEdit?: (vacation: Vacation) => void;
  isLoading?: boolean;
}

const VacationTable: React.FC<VacationTableProps> = ({
  vacations,
  onApprove,
  onReject,
  onEdit,
  isLoading = false
}) => {
  const { t, currentLanguage } = useTranslation();
  const { isAdmin } = usePermissions();

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      const locale = currentLanguage === 'da' ? da : undefined;
      return format(date, 'd. MMM yyyy', { locale });
    } catch (error) {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">{t('vacation.approved')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t('vacation.rejected')}</Badge>;
      default:
        return <Badge variant="secondary">{t('vacation.pending')}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-t-2 border-polygon-blue rounded-full"></div>
      </div>
    );
  }

  if (vacations.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>{t("vacation.noRequests")}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('vacation.employee')}</TableHead>
            <TableHead>{t('vacation.period')}</TableHead>
            <TableHead>{t('vacation.reason')}</TableHead>
            <TableHead>{t('vacation.status')}</TableHead>
            <TableHead className="text-right">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vacations.map((vacation) => (
            <TableRow key={vacation.id}>
              <TableCell className="font-medium">
                {vacation.employeeName || t('vacation.unknownEmployee')}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{formatDate(vacation.startDate)} -</div>
                  <div>{formatDate(vacation.endDate)}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={vacation.reason || ''}>
                  {vacation.reason || '-'}
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(vacation.status)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {isAdmin && vacation.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onApprove(vacation)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReject(vacation)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {isAdmin && onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(vacation)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default VacationTable;
