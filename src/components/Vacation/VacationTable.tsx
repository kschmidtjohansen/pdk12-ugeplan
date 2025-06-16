
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Vacation } from '@/types/vacation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  const { isAdmin } = usePermissions();
  const { t, currentLanguage } = useTranslation();
  
  const canApprove = isAdmin;

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const locale = currentLanguage === 'da' ? 'da-DK' : 'en-GB';
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString(locale);
    }
    
    return `${startDate.toLocaleDateString(locale)} - ${endDate.toLocaleDateString(locale)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t("vacation.status.approved")}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{t("vacation.status.rejected")}</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{t("vacation.status.pending")}</Badge>;
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
            <TableHead>{t("employees.name")}</TableHead>
            <TableHead>{t("vacation.dateRange")}</TableHead>
            <TableHead>{t("vacation.reason")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("vacation.requestedOn")}</TableHead>
            {canApprove && <TableHead className="text-right">{t("common.actions")}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {vacations.map((vacation) => (
            <TableRow key={vacation.id}>
              <TableCell className="font-medium">
                {vacation.user?.name || 'Unknown Employee'}
              </TableCell>
              <TableCell>
                {formatDateRange(new Date(vacation.start_date), new Date(vacation.end_date))}
              </TableCell>
              <TableCell>
                <span className="max-w-xs truncate block" title={vacation.reason}>
                  {vacation.reason}
                </span>
              </TableCell>
              <TableCell>
                {getStatusBadge(vacation.status)}
              </TableCell>
              <TableCell>
                {new Date(vacation.created_at).toLocaleDateString(
                  currentLanguage === 'da' ? 'da-DK' : 'en-GB'
                )}
              </TableCell>
              {canApprove && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {vacation.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onApprove(vacation)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onReject(vacation)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {onEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(vacation)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default VacationTable;
