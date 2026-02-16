import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MapPin, Edit, Check, X, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDepartment } from '@/context/DepartmentContext';

interface LocationItem {
  key: string;
  label: string;
}

const LocationManagement: React.FC = () => {
  const { t } = useTranslation();
  const { isDemoMode } = useAuth();
  const { toast } = useToast();
  const { selectedDepartmentId } = useDepartment();
  
  const storageKey = `location-data-${selectedDepartmentId || 'default'}`;

  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [newLocationName, setNewLocationName] = useState('');

  // Load locations from localStorage – scoped per department
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setLocations(Array.isArray(parsed) ? parsed : []);
      } else {
        setLocations([]);
      }
    } catch {
      setLocations([]);
    }
  }, [storageKey]);

  const saveLocations = (updated: LocationItem[]) => {
    setLocations(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleAddLocation = () => {
    const name = newLocationName.trim();
    if (!name) return;
    const key = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_æøå]/g, '');
    if (locations.some(l => l.key === key)) {
      toast({ title: t('admin.locations.alreadyExists') || 'Lokation findes allerede', variant: 'destructive' });
      return;
    }
    saveLocations([...locations, { key, label: name }]);
    setNewLocationName('');
    toast({ title: t('admin.locations.added') || 'Lokation tilføjet' });
  };

  const startEditing = (loc: LocationItem) => {
    setEditingKey(loc.key);
    setEditValue(loc.label);
  };

  const saveEdit = () => {
    if (!editingKey || !editValue.trim()) return;
    const updated = locations.map(l => l.key === editingKey ? { ...l, label: editValue.trim() } : l);
    saveLocations(updated);
    setEditingKey(null);
    toast({ title: t('admin.locations.renamed') || 'Lokationsnavn opdateret' });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleDelete = async () => {
    if (!deleteKey) return;

    if (!isDemoMode) {
      try {
        await supabase
          .from('warehouse_items')
          .update({ hall: null })
          .eq('hall', deleteKey);
      } catch (err) {
        if (import.meta.env.DEV) console.error('Error clearing hall from items:', err);
      }
    }

    saveLocations(locations.filter(l => l.key !== deleteKey));
    setDeleteKey(null);
    toast({ title: t('admin.locations.deleted') || 'Lokation slettet' });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('admin.tabs.locations') || 'Lokationer'}
          </CardTitle>
          <CardDescription>
            {t('admin.locations.description') || 'Administrer lagerlokationer og deres navne'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add location */}
          <div className="flex items-center gap-2">
            <Input
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder={t('admin.locations.addPlaceholder') || 'Navn på ny lokation...'}
              className="h-9"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddLocation(); }}
            />
            <Button size="sm" onClick={handleAddLocation} disabled={!newLocationName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              {t('admin.locations.add') || 'Tilføj'}
            </Button>
          </div>

          {locations.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('admin.locations.noLocations') || 'Ingen lokationer'}</p>
          ) : (
            <div className="space-y-3">
              {locations.map((location) => (
                <div
                  key={location.key}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                >
                  {editingKey === location.key ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                      />
                      <Button size="sm" variant="ghost" onClick={saveEdit}>
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{location.label}</p>
                          <p className="text-xs text-muted-foreground">ID: {location.key}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => startEditing(location)} title={t('admin.locations.editName') || 'Rediger navn'}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteKey(location.key)} title={t('admin.locations.delete') || 'Slet lokation'}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteKey} onOpenChange={(open) => !open && setDeleteKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.locations.deleteConfirm') || 'Slet lokation?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.locations.deleteWarning') || "Alle opbevaringer tilknyttet denne lokation vil få deres lokation sat til 'Ingen'. Denne handling kan ikke fortrydes."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel') || 'Annuller'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete') || 'Slet'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LocationManagement;
