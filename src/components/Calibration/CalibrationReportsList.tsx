import * as React from 'react';
import { useCalibration, CalibrationReport } from '@/hooks/useCalibration';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { FileText, Download, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { useTranslation } from '@/context/TranslationContext';

export const CalibrationReportsList: React.FC = () => {
  const { t } = useTranslation();
  const { reports, loading } = useCalibration();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'draft':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return t('calibration.form.completed');
      case 'draft':
        return t('calibration.form.draft');
      default:
        return status;
    }
  };

  const downloadReport = (report: CalibrationReport) => {
    // This would generate and download the PDF
    console.log('Download report:', report.id);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (reports.length === 0) {
    return (
      <EmptyState
        icon="FileText"
        title={t('calibration.reportsList.noReports')}
        description={t('calibration.reportsList.noReportsDescription')}
      />
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">
                    {t('calibration.reportsList.reportNumber')}{report.report_number}
                  </h3>
                  <Badge variant={getStatusColor(report.status)}>
                    {getStatusText(report.status)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {report.department_and_employee}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('calibration.reportsList.controlDate')} {format(new Date(report.control_date), 'dd. MMM yyyy', { locale: da })}
                  </div>
                </div>

                {report.notes && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>{t('calibration.reportsList.notesLabel')}</strong> {report.notes}
                  </p>
                )}
                
                <p className="text-xs text-muted-foreground">
                  {t('calibration.reportsList.createdLabel')} {format(new Date(report.created_at), 'dd. MMM yyyy HH:mm', { locale: da })}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadReport(report)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {t('calibration.reportsList.downloadPdf')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};