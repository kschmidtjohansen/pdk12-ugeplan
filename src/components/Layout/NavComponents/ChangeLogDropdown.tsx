import React, { useState } from 'react';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChangeLogs } from '@/context/ChangeLogContext';
import ChangeLogList from './ChangeLogList';

const ChangeLogDropdown: React.FC = () => {
  const { unviewedCount, markAsViewed, fetchChangeLogs } = useChangeLogs();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Refresh logs and mark as viewed when dropdown is opened
      await fetchChangeLogs();
      markAsViewed();
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-accent"
          aria-label="View planner changes"
        >
          <History className="h-5 w-5" />
          {unviewedCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unviewedCount > 9 ? '9+' : unviewedCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <ChangeLogList />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChangeLogDropdown;
