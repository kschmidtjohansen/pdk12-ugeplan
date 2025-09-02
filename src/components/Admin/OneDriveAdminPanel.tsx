import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OneDriveUrlService } from '@/services/OneDriveUrlService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CaseFolderManagement } from './CaseFolderManagement';
import { CaseNumberMigration } from './CaseNumberMigration';
import { 
  FolderOpen, 
  CheckCircle, 
  XCircle, 
  Settings, 
  ExternalLink,
  Loader2,
  Save,
  TestTube,
  AlertCircle
} from 'lucide-react';

interface OneDriveSettings {
  id: string;
  base_sharepoint_url: string;
  main_folder_path: string;
  folder_naming_pattern: string;
  is_active: boolean;
}

export const OneDriveAdminPanel: React.FC = () => {
  const [settings, setSettings] = useState<OneDriveSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    base_sharepoint_url: '',
    main_folder_path: '/sites/YourSite/Shared Documents/12 Sager',
    folder_naming_pattern: '{case_number}',
    is_active: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('onedrive_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading OneDrive settings:', error);
        toast({
          title: "Fejl",
          description: "Kunne ikke indlæse OneDrive indstillinger",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        setSettings(data);
        setFormData({
          base_sharepoint_url: data.base_sharepoint_url,
          main_folder_path: data.main_folder_path,
          folder_naming_pattern: data.folder_naming_pattern,
          is_active: data.is_active
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Validate URL format
      if (formData.base_sharepoint_url && !formData.base_sharepoint_url.includes('sharepoint.com')) {
        toast({
          title: "Fejl",
          description: "SharePoint URL skal indeholde 'sharepoint.com'",
          variant: "destructive"
        });
        return;
      }

      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from('onedrive_settings')
          .update({
            base_sharepoint_url: formData.base_sharepoint_url,
            main_folder_path: formData.main_folder_path,
            folder_naming_pattern: formData.folder_naming_pattern,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('onedrive_settings')
          .insert({
            base_sharepoint_url: formData.base_sharepoint_url,
            main_folder_path: formData.main_folder_path,
            folder_naming_pattern: formData.folder_naming_pattern,
            is_active: formData.is_active
          });

        if (error) throw error;
      }

      // Clear service cache
      OneDriveUrlService.clearCache();
      
      toast({
        title: "Gemt",
        description: "OneDrive indstillinger er blevet gemt",
      });

      // Reload settings to get updated data
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke gemme indstillinger",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionStatus(null);

    try {
      const isValid = await OneDriveUrlService.testConnection(
        formData.base_sharepoint_url,
        formData.main_folder_path
      );

      setConnectionStatus(isValid ? 'success' : 'error');
      
      if (isValid) {
        toast({
          title: "Forbindelse OK",
          description: "OneDrive konfiguration ser korrekt ud",
        });
      } else {
        toast({
          title: "Forbindelsesfejl",
          description: "OneDrive konfiguration er ikke korrekt",
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Test fejlede",
        description: "Kunne ikke teste forbindelsen",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const generatePreviewUrl = () => {
    const exampleCaseNumber = "12-ABC123";
    const folderName = formData.folder_naming_pattern.replace('{case_number}', exampleCaseNumber);
    return `${formData.base_sharepoint_url}${formData.main_folder_path}/${folderName}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Case Number Migration */}
      <CaseNumberMigration />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            OneDrive Konfiguration
          </CardTitle>
          <CardDescription>
            Konfigurer OneDrive/SharePoint integration for automatisk mappe adgang baseret på sagsnumre
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="active-toggle">OneDrive Integration</Label>
              <p className="text-sm text-muted-foreground">
                Aktiver eller deaktiver OneDrive integration
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="active-toggle"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Badge variant={formData.is_active ? "default" : "secondary"}>
                {formData.is_active ? "Aktiv" : "Inaktiv"}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* SharePoint URL */}
          <div className="space-y-2">
            <Label htmlFor="sharepoint-url">SharePoint Base URL *</Label>
            <Input
              id="sharepoint-url"
              placeholder="https://yourcompany.sharepoint.com"
              value={formData.base_sharepoint_url}
              onChange={(e) => setFormData(prev => ({ ...prev, base_sharepoint_url: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Den grundlæggende SharePoint URL for jeres organisation
            </p>
          </div>

          {/* Main Folder Path */}
          <div className="space-y-2">
            <Label htmlFor="folder-path">Hovedmappe Sti</Label>
            <Input
              id="folder-path"
              placeholder="/sites/YourSite/Shared Documents/12 Sager"
              value={formData.main_folder_path}
              onChange={(e) => setFormData(prev => ({ ...prev, main_folder_path: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Stien til hovedmappen hvor alle sagsmapper er placeret
            </p>
          </div>

          {/* Folder Naming Pattern */}
          <div className="space-y-2">
            <Label htmlFor="naming-pattern">Mappe Navngivning</Label>
            <Input
              id="naming-pattern"
              placeholder="{case_number}"
              value={formData.folder_naming_pattern}
              onChange={(e) => setFormData(prev => ({ ...prev, folder_naming_pattern: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Brug {'{case_number}'} som placeholder for sagsnummeret
            </p>
          </div>

          {/* Preview */}
          {formData.base_sharepoint_url && formData.main_folder_path && (
            <div className="space-y-2">
              <Label>Eksempel URL</Label>
              <div className="p-3 bg-gray-50 rounded-lg border text-sm font-mono break-all">
                {generatePreviewUrl()}
              </div>
              <p className="text-xs text-muted-foreground">
                Sådan vil URL'en se ud for sagsnummer "12-ABC123"
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Gem Indstillinger
            </Button>

            {formData.base_sharepoint_url && (
              <Button 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-2"
              >
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                Test Forbindelse
              </Button>
            )}

            {connectionStatus && (
              <div className="flex items-center gap-2">
                {connectionStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sådan Bruges OneDrive Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <p className="font-medium">Konfigurer SharePoint URL</p>
                <p className="text-sm text-muted-foreground">
                  Find jeres SharePoint URL (fx. https://yourcompany.sharepoint.com)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <p className="font-medium">Indstil Mappe Sti</p>
                <p className="text-sm text-muted-foreground">
                  Angiv stien til hovedmappen hvor sagsmapperne er placeret
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <p className="font-medium">Aktiver Integration</p>
                <p className="text-sm text-muted-foreground">
                  Slå integrationen til, og medarbejdere kan nu klikke på OneDrive knapper i opgaver
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Mobile Support:</strong> På mobile enheder vil systemet automatisk forsøge at åbne SharePoint appen. 
              Hvis appen ikke er installeret, åbnes mappen i browseren.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Case Folder Management */}
      <CaseFolderManagement />
    </div>
  );
};