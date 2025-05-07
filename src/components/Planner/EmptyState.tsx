import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
interface EmptyStateProps {
  onCreateNew: () => void;
  canCreate?: boolean;
  selectedWeek?: number;
}
const EmptyState: React.FC<EmptyStateProps> = ({
  onCreateNew,
  canCreate = true,
  selectedWeek
}) => {
  const {
    t
  } = useTranslation();
  return <Card className="text-center p-8">
      <p className="text-muted-foreground mb-4">
        {selectedWeek ? t("planner.noAssignmentsForWeek", {
        week: selectedWeek
      }) : t("planner.noAssignments")}
      </p>
      {canCreate}
    </Card>;
};
export default EmptyState;