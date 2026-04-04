
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from '@/context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (import.meta.env.DEV) console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Modern Page Header */}
        <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-foreground">
                {t('common.pageNotFound') || 'Page Not Found'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('common.pageNotFoundDescription') || 'The page you are looking for does not exist'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-lg bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* 404 Content Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="p-12">
            <Card className="border-0 shadow-none max-w-md mx-auto text-center">
              <CardHeader className="space-y-4">
                <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-12 w-12 text-red-500" />
                </div>
                <CardTitle className="text-6xl font-bold text-foreground">404</CardTitle>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    {t('common.pageNotFound') || 'Page Not Found'}
                  </h2>
                  <p className="text-muted-foreground">
                    {t('common.pageNotFoundDescription') || 'The page you are looking for does not exist or has been moved.'}
                  </p>
                  <p className="text-sm text-muted-foreground font-mono bg-muted px-3 py-1 rounded">
                    {location.pathname}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={handleGoHome}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    {t('common.goHome') || 'Go to Dashboard'}
                  </Button>
                  <Button 
                    onClick={handleGoBack}
                    variant="outline"
                    className="border-border hover:bg-muted/50"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('common.goBack') || 'Go Back'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
