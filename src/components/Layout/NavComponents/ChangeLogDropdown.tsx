import React, { useState } from 'react';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useChangeLogs } from '@/context/ChangeLogContext';
import ChangeLogList from './ChangeLogList';
import { useTranslation } from '@/context/TranslationContext';

const ChangeLogDropdown: React.FC = () => {
  const { unviewedCount, markAsViewed, fetchChangeLogs } = useChangeLogs();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open) {
      await fetchChangeLogs();
      markAsViewed();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-accent h-8 w-8"
          aria-label="View planner changes"
        >
          <History className="h-[15px] w-[15px]" />
          {unviewedCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-red-500">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-base">
            {t('changeLog.recentChanges') || 'Seneste ændringer'}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <ChangeLogList onNavigate={() => setIsOpen(false)} hideHeader />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChangeLogDropdown;
