import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import WarehouseTable from './WarehouseTable';
import MobileWarehouseCard from './MobileWarehouseCard';
import { WarehouseListProps } from './types';

const WarehouseList: React.FC<WarehouseListProps> = ({ items, onEdit, onDelete, canEdit }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-4">
        {items.map((item) => (
          <MobileWarehouseCard
            key={item.id}
            item={item}
            onEdit={onEdit}
            onDelete={onDelete}
            canEdit={canEdit}
          />
        ))}
      </div>
    );
  }

  return <WarehouseTable items={items} onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} />;
};

export default WarehouseList;
