import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Pencil, Check, X } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface FalckSubscriptionButtonProps {
  isAdmin: boolean;
}

const FalckSubscriptionButton: React.FC<FalckSubscriptionButtonProps> = ({ isAdmin }) => {
  const { t } = useTranslation();
  const { selectedDepartmentId } = useDepartment();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const queryKey = ['falck-subscription', selectedDepartmentId];

  const { data: subscriptionNumber } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!selectedDepartmentId) return '';
      const { data, error } = await supabase
        .from('department_settings' as any)
        .select('setting_value')
        .eq('department_id', selectedDepartmentId)
        .eq('setting_key', 'falck_subscription_number')
        .maybeSingle();
      if (error) throw error;
      return (data as any)?.setting_value || '';
    },
    enabled: !!selectedDepartmentId,
  });

  const mutation = useMutation({
    mutationFn: async (value: string) => {
      if (!selectedDepartmentId) return;
      
      // Try upsert
      const { error } = await supabase
        .from('department_settings' as any)
        .upsert(
          {
            department_id: selectedDepartmentId,
            setting_key: 'falck_subscription_number',
            setting_value: value,
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: 'department_id,setting_key' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditing(false);
      toast.success(t('cars.falckSubscriptionUpdated'));
    },
    onError: () => {
      toast.error(t('common.error'));
    },
  });

  const handleStartEdit = () => {
    setEditValue(subscriptionNumber || '');
    setEditing(true);
  };

  const handleSave = () => {
    mutation.mutate(editValue.trim());
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg"
      >
        <Shield className="mr-2 h-4 w-4" />
        {t('cars.falckSubscription')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {t('cars.falckSubscription')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t('cars.falckSubscriptionNumber')}
            </label>

            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="F.eks. 123456789"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={handleSave} disabled={mutation.isPending}>
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <span className={`text-lg font-mono ${!subscriptionNumber ? 'text-muted-foreground italic text-sm' : ''}`}>
                  {subscriptionNumber || t('cars.falckSubscriptionEmpty')}
                </span>
                {isAdmin && (
                  <Button size="icon" variant="ghost" onClick={handleStartEdit}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FalckSubscriptionButton;
