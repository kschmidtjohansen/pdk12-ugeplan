import * as React from 'react';
const { useState } = React;
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalibrationForm } from '@/components/Calibration/CalibrationForm';
import { CalibrationManuals } from '@/components/Calibration/CalibrationManuals';
import { CalibrationReportsList } from '@/components/Calibration/CalibrationReportsList';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { FileText, BookOpen, Plus } from 'lucide-react';

export const CalibrationPage = () => {
  const { t } = useTranslation();
  const { user, isAdmin, isSkadeleder } = useAuth();
  const [activeTab, setActiveTab] = useState('reports');
  const [showForm, setShowForm] = useState(false);

  // Check if user has required permissions
  if (!user || (!isAdmin && !isSkadeleder)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('calibration.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('calibration.subtitle')}
            </p>
          </div>
          <Button 
            onClick={() => {
              setShowForm(true);
              setActiveTab('form');
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('calibration.newReport')}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('calibration.tabs.reports')}
            </TabsTrigger>
            <TabsTrigger value="form" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('calibration.tabs.form')}
            </TabsTrigger>
            <TabsTrigger value="manuals" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t('calibration.tabs.manuals')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('calibration.reportsSection.title')}</CardTitle>
                <CardDescription>
                  {t('calibration.reportsSection.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CalibrationReportsList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="form" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('calibration.newReport')}</CardTitle>
                <CardDescription>
                  {t('calibration.formSection.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CalibrationForm onCancel={() => setActiveTab('reports')} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manuals" className="space-y-4">
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
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};