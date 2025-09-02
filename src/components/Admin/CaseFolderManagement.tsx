import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CaseNumberInput } from '@/components/ui/case-number-input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  FolderOpen,
  Save,
  X,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Download
} from 'lucide-react';
import { OneDriveUrlService } from '@/services/OneDriveUrlService';

interface CaseFolderMapping {
  id: string;
  case_number: string;
  custom_folder_name: string;
  folder_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CaseFolderManagementProps {
  className?: string;
}

export const CaseFolderManagement: React.FC<CaseFolderManagementProps> = ({ className }) => {
  const [mappings, setMappings] = useState<CaseFolderMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<CaseFolderMapping | null>(null);
  const [saving, setSaving] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  
  const [formData, setFormData] = useState({
    case_number: '',
    custom_folder_name: '',
    folder_url: '',
    notes: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    try {
      const { data, error } = await supabase
        .from('case_folder_mappings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMappings(data || []);
    } catch (error) {
      console.error('Error loading mappings:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke indlæse mappeoversigter",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      case_number: '',
      custom_folder_name: '',
      folder_url: '',
      notes: ''
    });
    setEditingMapping(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (mapping: CaseFolderMapping) => {
    setFormData({
      case_number: mapping.case_number,
      custom_folder_name: mapping.custom_folder_name,
      folder_url: mapping.folder_url || '',
      notes: mapping.notes || ''
    });
    setEditingMapping(mapping);
    setIsAddDialogOpen(true);
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!formData.case_number.trim() || !formData.custom_folder_name.trim()) {
      toast({
        title: "Manglende oplysninger",
        description: "Sagsnummer og mappenavn er påkrævet",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      if (editingMapping) {
        // Update existing mapping
        const { error } = await supabase
          .from('case_folder_mappings')
          .update({
            case_number: formData.case_number.trim(),
            custom_folder_name: formData.custom_folder_name.trim(),
            folder_url: formData.folder_url.trim() || null,
            notes: formData.notes.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMapping.id);

        if (error) throw error;

        toast({
          title: "Opdateret",
          description: "Mappeoversigten er blevet opdateret"
        });
      } else {
        // Create new mapping
        const { error } = await supabase
          .from('case_folder_mappings')
          .insert({
            case_number: formData.case_number.trim(),
            custom_folder_name: formData.custom_folder_name.trim(),
            folder_url: formData.folder_url.trim() || null,
            notes: formData.notes.trim() || null
          });

        if (error) throw error;

        toast({
          title: "Oprettet",
          description: "Ny mappeoversigt er blevet oprettet"
        });
      }

      closeDialog();
      loadMappings();
    } catch (error: any) {
      console.error('Error saving mapping:', error);
      
      if (error.code === '23505') {
        toast({
          title: "Sagsnummer findes allerede",
          description: "Dette sagsnummer har allerede en mappeoversigt",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Fejl",
          description: "Kunne ikke gemme mappeoversigten",
          variant: "destructive"
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, caseNumber: string) => {
    if (!confirm(`Er du sikker på, at du vil slette mappeoversigten for sagsnummer ${caseNumber}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('case_folder_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Slettet",
        description: "Mappeoversigten er blevet slettet"
      });

      loadMappings();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke slette mappeoversigten",
        variant: "destructive"
      });
    }
  };

  const handleDiscoverFolders = async () => {
    setDiscovering(true);
    
    try {
      const suggestions = await OneDriveUrlService.suggestMappings();
      
      if (suggestions.length === 0) {
        toast({
          title: "Ingen mapper fundet",
          description: "Der blev ikke fundet nogen OneDrive mapper med sagsnummer-mønster",
        });
        return;
      }

      // Create mappings for folders that have corresponding assignments
      const mappingsToCreate = suggestions.filter(s => s.hasAssignment);
      
      if (mappingsToCreate.length === 0) {
        toast({
          title: "Ingen matchende opgaver",
          description: `Fandt ${suggestions.length} mapper, men ingen har tilsvarende opgaver i systemet`,
          variant: "destructive"
        });
        return;
      }

      // Batch create mappings
      const { error } = await supabase
        .from('case_folder_mappings')
        .upsert(
          mappingsToCreate.map(mapping => ({
            case_number: mapping.caseNumber,
            custom_folder_name: mapping.folderName,
            folder_url: mapping.folderUrl,
            notes: 'Automatisk opdaget fra OneDrive'
          })),
          { onConflict: 'case_number' }
        );

      if (error) throw error;

      toast({
        title: "Mapper opdaget",
        description: `Oprettede ${mappingsToCreate.length} nye mappeoversigter fra OneDrive`,
      });

      loadMappings();
    } catch (error) {
      console.error('Error discovering folders:', error);
      toast({
        title: "Fejl ved opdagelse",
        description: "Kunne ikke opdage OneDrive mapper. Kontroller forbindelsen.",
        variant: "destructive"
      });
    } finally {
      setDiscovering(false);
    }
  };

  const filteredMappings = mappings.filter(mapping =>
    mapping.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.custom_folder_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openFolder = (mapping: CaseFolderMapping) => {
    if (mapping.folder_url) {
      window.open(mapping.folder_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Sag Mappe Oversigt
            </CardTitle>
            <CardDescription>
              Administrer tilpassede mappestier for specifikke sagsnumre
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleDiscoverFolders} 
              disabled={discovering}
              variant="outline"
              className="flex items-center gap-2"
            >
              {discovering ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Opdage Mapper
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Ny Oversigt
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingMapping ? 'Rediger Mappeoversigt' : 'Ny Mappeoversigt'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Sagsnummer *</Label>
                  <CaseNumberInput
                    value={formData.case_number}
                    onChange={(value) => setFormData(prev => ({ ...prev, case_number: value }))}
                    placeholder="12-XXXXXX"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="folder-name">Tilpasset Mappenavn *</Label>
                  <Input
                    id="folder-name"
                    value={formData.custom_folder_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_folder_name: e.target.value }))}
                    placeholder="fx. 12-ABC123 - Særligt projektnavn"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Dette mappenavn vil blive brugt i stedet for standard-mønsteret
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="folder-url">Direkte Mappe URL (valgfri)</Label>
                  <Input
                    id="folder-url"
                    value={formData.folder_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, folder_url: e.target.value }))}
                    placeholder="https://yourcompany.sharepoint.com/.../mappenavn"
                  />
                  <p className="text-xs text-muted-foreground">
                    Hvis angivet, vil denne URL blive brugt direkte i stedet for at konstruere en
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Noter (valgfri)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Eventuelle noter om denne mappeoversigt..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {editingMapping ? 'Opdater' : 'Opret'}
                  </Button>
                  <Button variant="outline" onClick={closeDialog}>
                    <X className="h-4 w-4 mr-2" />
                    Annuller
                  </Button>
                </div>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søg efter sagsnummer eller mappenavn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        <Separator />

        {filteredMappings.length === 0 ? (
          <div className="text-center py-8">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {searchTerm ? 'Ingen mappeoversigter matcher din søgning' : 'Ingen mappeoversigter oprettet endnu'}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sagsnummer</TableHead>
                  <TableHead>Mappenavn</TableHead>
                  <TableHead>Direkte URL</TableHead>
                  <TableHead>Noter</TableHead>
                  <TableHead className="w-[140px]">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      <Badge variant="outline">{mapping.case_number}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {mapping.custom_folder_name}
                    </TableCell>
                    <TableCell>
                      {mapping.folder_url ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Ja</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openFolder(mapping)}
                            className="p-1 h-6 w-6"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="outline">Standard</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {mapping.notes ? (
                        <span className="text-sm text-muted-foreground">
                          {mapping.notes.length > 50 
                            ? `${mapping.notes.substring(0, 50)}...` 
                            : mapping.notes}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(mapping)}
                          className="p-2 h-8 w-8"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(mapping.id, mapping.case_number)}
                          className="p-2 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};