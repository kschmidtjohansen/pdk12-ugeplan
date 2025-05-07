
export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationInsert {
  id?: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read?: boolean;
  created_at?: string;
}

export interface NotificationUpdate {
  id?: string;
  user_id?: string;
  type?: string;
  title?: string;
  message?: string;
  link?: string | null;
  read?: boolean;
  created_at?: string;
}
