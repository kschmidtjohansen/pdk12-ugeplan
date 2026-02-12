import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MapPin, Edit, Check, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LocationItem {
  key: string;
  label: string;
  hidden?: boolean;
}

const STORAGE_KEY = 'location-custom-names';

const LocationManagement: React.FC = () => {
  const { t } = useTranslation();
  const { isDemoMode } = useAuth();
  const { toast } = useToast();
  
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [hiddenLocations, setHiddenLocations] = useState<string[]>([]);

  // Load custom names from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCustomNames(parsed.names || {});
        setHiddenLocations(parsed.hidden || []);
      }
    } catch { /* ignore */ }
  }, []);

  const saveToStorage = (names: Record<string, string>, hidden: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ names, hidden }));
  };

  const defaultLocations: LocationItem[] = [
    { key: 'hal_1', label: t('warehouse.halls.hal1') || 'Hal 1' },
    { key: 'sort_hal', label: t('warehouse.halls.sortHal') || 'Sort Hal' },
  ];

  const visibleLocations = defaultLocations.filter(l => !hiddenLocations.includes(l.key));

  const getDisplayName = (loc: LocationItem) => customNames[loc.key] || loc.label;

  const startEditing = (loc: LocationItem) => {
    setEditingKey(loc.key);
    setEditValue(getDisplayName(loc));
  };

  const saveEdit = () => {
    if (!editingKey || !editValue.trim()) return;
    const newNames = { ...customNames, [editingKey]: editValue.trim() };
    setCustomNames(newNames);
    saveToStorage(newNames, hiddenLocations);
    setEditingKey(null);
    toast({ title: t('admin.locations.renamed') || 'Lokationsnavn opdateret' });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleDelete = async () => {
    if (!deleteKey) return;

    // In production, set hall to null for all items with this location
    if (!isDemoMode) {
      try {
        await supabase
          .from('warehouse_items')
          .update({ hall: null })
          .eq('hall', deleteKey);
      } catch (err) {
        console.error('Error clearing hall from items:', err);
      }
    }

    const newHidden = [...hiddenLocations, deleteKey];
    setHiddenLocations(newHidden);
    saveToStorage(customNames, newHidden);
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
        <CardContent>
          {visibleLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('admin.locations.noLocations') || 'Ingen lokationer'}</p>
          ) : (
            <div className="space-y-3">
              {visibleLocations.map((location) => (
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
                          <p className="font-medium">{getDisplayName(location)}</p>
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
