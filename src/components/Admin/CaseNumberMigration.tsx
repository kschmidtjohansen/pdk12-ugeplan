import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  Loader2,
  Database
} from 'lucide-react';
import { migrateCaseNumbers, analyzeCaseNumbers, cleanupAssignmentTitles, type MigrationResult } from '@/utils/caseNumberMigration';

export const CaseNumberMigration: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeCaseNumbers();
      setAnalysisResult(result);
      
      toast({
        title: "Analyse fuldført",
        description: `Fandt ${result.potentialMigrations.length} opgaver der kan migreres`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Fejl ved analyse",
        description: "Kunne ikke analysere sagsnumre",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleMigrate = async (dryRun: boolean = false) => {
    setMigrating(true);
    try {
      const result = await migrateCaseNumbers(dryRun);
      setMigrationResult(result);
      
      if (dryRun) {
        toast({
          title: "Test migrering fuldført",
          description: `${result.migratedCount} opgaver ville blive migreret`,
        });
      } else {
        toast({
          title: "Migrering fuldført",
          description: `${result.migratedCount} opgaver blev migreret succesfuldt`,
        });
        
        // Refresh analysis after successful migration
        if (result.migratedCount > 0) {
          setTimeout(() => handleAnalyze(), 1000);
        }
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: "Fejl ved migrering",
        description: "Kunne ikke migrere sagsnumre",
        variant: "destructive"
      });
    } finally {
      setMigrating(false);
    }
  };

  const handleCleanup = async (dryRun: boolean = false) => {
    setCleaning(true);
    try {
      const result = await cleanupAssignmentTitles(dryRun);
      setCleanupResult(result);
      
      if (dryRun) {
        toast({
          title: "Test oprydning fuldført",
          description: `${result.cleanedCount} titler ville blive ryddet op`,
        });
      } else {
        toast({
          title: "Oprydning fuldført",
          description: `${result.cleanedCount} titler blev ryddet op`,
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      toast({
        title: "Fejl ved oprydning",
        description: "Kunne ikke rydde op i titler",
        variant: "destructive"
      });
    } finally {
      setCleaning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sagsnummer Migrering
        </CardTitle>
        <CardDescription>
          Migrer sagsnumre fra opgavetitler til dedikerede sagsnummer-felter for OneDrive integration
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Analysis Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">1. Analyser eksisterende data</h4>
            <Button 
              onClick={handleAnalyze} 
              disabled={analyzing}
              variant="outline"
              size="sm"
            >
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Analyser
            </Button>
          </div>
          
          {analysisResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Analyse resultat:</strong> {analysisResult.totalAssignments} total opgaver, 
                {' '}<Badge variant="secondary">{analysisResult.potentialMigrations.length}</Badge> kan migreres
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Migration Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">2. Migrer sagsnumre</h4>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleMigrate(true)} 
                disabled={migrating || !analysisResult}
                variant="outline"
                size="sm"
              >
                {migrating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                Test
              </Button>
              <Button 
                onClick={() => handleMigrate(false)} 
                disabled={migrating || !analysisResult || analysisResult.potentialMigrations.length === 0}
                size="sm"
              >
                {migrating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                Migrer
              </Button>
            </div>
          </div>
          
          {migrationResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Migrering resultat:</strong> {migrationResult.migratedCount} opgaver migreret
                {migrationResult.errors.length > 0 && (
                  <span className="text-red-600"> ({migrationResult.errors.length} fejl)</span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Cleanup Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">3. Ryd op i titler (valgfri)</h4>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleCleanup(true)} 
                disabled={cleaning}
                variant="outline"
                size="sm"
              >
                {cleaning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                Test
              </Button>
              <Button 
                onClick={() => handleCleanup(false)} 
                disabled={cleaning}
                variant="secondary"
                size="sm"
              >
                {cleaning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                Ryd op
              </Button>
            </div>
          </div>
          
          {cleanupResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Oprydning resultat:</strong> {cleanupResult.cleanedCount} titler ryddet op
                {cleanupResult.errors.length > 0 && (
                  <span className="text-red-600"> ({cleanupResult.errors.length} fejl)</span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Process Overview */}
        {analysisResult && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">Migrering oversigt</h4>
              {analysisResult.potentialMigrations.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {analysisResult.potentialMigrations.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="truncate flex-1 mr-2">{item.title}</span>
                      <Badge variant="outline">{item.extractedCaseNumber}</Badge>
                    </div>
                  ))}
                  {analysisResult.potentialMigrations.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ... og {analysisResult.potentialMigrations.length - 5} flere
                    </p>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Ingen opgaver fundet der kræver migrering. Alle sagsnumre er allerede korrekt placeret.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Vigtigt:</strong> Kør først "Test" for at se hvad der vil blive ændret før du kører den faktiske migrering.
            Sagsnumre bliver flyttet fra titel-feltet til det dedikerede sagsnummer-felt.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};