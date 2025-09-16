import * as React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalibrationForm } from '@/components/Calibration/CalibrationForm';
import { CalibrationManuals } from '@/components/Calibration/CalibrationManuals';
import { CalibrationReportsList } from '@/components/Calibration/CalibrationReportsList';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Plus } from 'lucide-react';
import type { CalibrationReport, EquipmentEntry } from '@/hooks/useCalibration';
const { useState } = React;

type PageType = 'rapporter' | 'ny-rapport' | 'manualer';

export const FugtafdelingenPage = () => {
  const { t } = useTranslation();
  const { user, isAdmin, isSkadeleder } = useAuth();
  const { section } = useParams<{ section: string }>();
  const [editingReport, setEditingReport] = useState<{ report: CalibrationReport; equipment: EquipmentEntry[] } | null>(null);

  // Check if user has required permissions
  if (!user || (!isAdmin && !isSkadeleder)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Default to rapporter if no section specified
  const currentSection = (section as PageType) || 'rapporter';

  const handleEditReport = (report: CalibrationReport, equipment: EquipmentEntry[]) => {
    setEditingReport({ report, equipment });
    // Navigate to new report page when editing
    window.location.href = '/fugtafdelingen/ny-rapport';
  };

  const handleCancelForm = () => {
    setEditingReport(null);
    // Navigate back to reports
    window.location.href = '/fugtafdelingen/rapporter';
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'rapporter':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('calibration.reportsSection.title')}</CardTitle>
                  <CardDescription>
                    {t('calibration.reportsSection.description')}
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => window.location.href = '/fugtafdelingen/ny-rapport'}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t('calibration.newReport')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CalibrationReportsList onEditReport={handleEditReport} />
            </CardContent>
          </Card>
        );

      case 'ny-rapport':
        return (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingReport ? t('calibration.actions.editReport') : t('calibration.newReport')}
              </CardTitle>
              <CardDescription>
                {t('calibration.formSection.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalibrationForm 
                onCancel={handleCancelForm}
                editingReport={editingReport?.report}
                editingEquipment={editingReport?.equipment}
              />
            </CardContent>
          </Card>
        );

      case 'manualer':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t('calibration.manuals')}</CardTitle>
              <CardDescription>
                {t('calibration.manualsSection.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalibrationManuals />
            </CardContent>
          </Card>
        );

      default:
        return <Navigate to="/fugtafdelingen/rapporter" replace />;
    }
  };

  const getPageTitle = () => {
    switch (currentSection) {
      case 'rapporter':
        return t('navigation.rapporter');
      case 'ny-rapport':
        return t('navigation.nyRapport');
      case 'manualer':
        return t('navigation.manualer');
      default:
        return t('navigation.fugtafdelingen');
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="text-muted-foreground">
            {t('calibration.subtitle')}
          </p>
        </div>

        {renderContent()}
      </div>
    </MainLayout>
  );
};