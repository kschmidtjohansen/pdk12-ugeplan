import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Shield, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProfileAccessRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequest: (request: {
    reason: string;
    context: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  }) => void;
  loading?: boolean;
}

export const ProfileAccessRequestDialog: React.FC<ProfileAccessRequestDialogProps> = ({
  open,
  onOpenChange,
  onRequest,
  loading = false,
}) => {
  const [context, setContext] = useState('');
  const [reason, setReason] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const handleSubmit = () => {
    if (reason.trim().length < 10) return;
    
    onRequest({
      reason: reason.trim(),
      context: context.trim() || 'General administrative access',
      urgency,
    });
    
    // Reset form
    setContext('');
    setReason('');
    setUrgency('medium');
  };

  const isValidRequest = reason.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            Request Full Profile Access
          </DialogTitle>
          <DialogDescription>
            You are requesting access to unmasked employee personal data including email addresses and phone numbers.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> This request will be logged and audited. Only request full access when absolutely necessary for legitimate business purposes.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="context">Business Context</Label>
            <Input
              id="context"
              placeholder="e.g., Employee onboarding, Emergency contact, etc."
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="urgency">Urgency Level</Label>
            <Select value={urgency} onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => setUrgency(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Routine administrative task</SelectItem>
                <SelectItem value="medium">Medium - Standard business need</SelectItem>
                <SelectItem value="high">High - Important business requirement</SelectItem>
                <SelectItem value="critical">Critical - Emergency or urgent matter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Detailed Justification *</Label>
            <Textarea
              id="reason"
              placeholder="Provide a detailed explanation of why you need access to unmasked personal data. This will be logged for audit purposes."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-20"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 10 characters required. Current: {reason.length}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValidRequest || loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Eye className="h-4 w-4 mr-2" />
            {loading ? 'Requesting...' : 'Request Access'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};