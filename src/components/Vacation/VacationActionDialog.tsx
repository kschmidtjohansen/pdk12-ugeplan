
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Vacation } from '../../types/vacation';
import { useTranslation } from '../../context/TranslationContext';

interface VacationActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacation: Vacation | null;
  note: string;
  setNote: (note: string) => void;
  onAction: (e: React.FormEvent) => void;
}

const VacationActionDialog: React.FC<VacationActionDialogProps> = ({
  open,
  onOpenChange,
  vacation,
  note,
  setNote,
  onAction
}) => {
  const { t } = useTranslation();
  const isRejection = vacation?.status === 'rejected';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRejection ? t("vacation.rejectRequest") : t("vacation.approveRequest")}
          </DialogTitle>
          <DialogDescription>
            {isRejection ? t("vacation.rejectReasonDesc") : t("vacation.approveNoteDesc")}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={onAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">
              {isRejection ? t("vacation.rejectionReason") : t("vacation.noteOptional")}
            </Label>
            <Textarea 
              id="note" 
              value={note} 
              onChange={e => setNote(e.target.value)}
              placeholder={isRejection 
                ? t("vacation.rejectionReasonPlaceholder") 
                : t("vacation.approveNotePlaceholder")
              } 
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button 
              type="submit" 
              className={isRejection 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-green-600 hover:bg-green-700"
              }
            >
              {isRejection ? t("vacation.rejectRequestBtn") : t("vacation.approveRequestBtn")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VacationActionDialog;
