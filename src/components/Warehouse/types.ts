import { WarehouseItem } from '@/types/warehouse';

export interface WarehouseListProps {
  items: WarehouseItem[];
  onEdit: (item: WarehouseItem) => void;
  onDelete: (item: WarehouseItem) => void;
  canEdit: boolean;
}

export interface WarehouseTableRowProps {
  item: WarehouseItem;
  onEdit: (item: WarehouseItem) => void;
  onDelete: (item: WarehouseItem) => void;
  canEdit: boolean;
}

export interface MobileWarehouseCardProps {
  item: WarehouseItem;
  onEdit: (item: WarehouseItem) => void;
  onDelete: (item: WarehouseItem) => void;
  canEdit: boolean;
}

export interface WarehouseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: WarehouseItem | null;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
}

export interface WarehouseDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WarehouseItem | null;
  onConfirm: () => Promise<void>;
  loading: boolean;
}
