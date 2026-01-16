import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';

interface PlannerSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const PlannerSearchFilter: React.FC<PlannerSearchFilterProps> = ({
  searchQuery,
  onSearchChange
}) => {
  const { t, currentLanguage } = useTranslation();
  
  const placeholder = currentLanguage === 'da' 
    ? 'Søg efter sagsnr., adresse eller medarbejder...'
    : 'Search by case no., address or employee...';

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-9 pr-9 h-9 bg-background/80 border-border/50"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSearchChange('')}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};

export default PlannerSearchFilter;
