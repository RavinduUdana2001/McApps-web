export type ActiveDateResponse = {
  active_date: string;
  active_start_datetime: string;
  active_end_datetime: string;
};

export type DropdownItem = {
  link_id: number;
  supplier_id: number;
  supplier_name: string;
  item_id: number;
  item_name: string;
};

export type VerifiedEmployee = {
  id: number;
  username: string;
  email: string;
  display_name: string;
  location_id: number;
};

export type OrderHistoryItem = {
  id: number;
  date: string;
  created_at: string;
  updated_at: string;
  quantity: number;
  status: number;
  employee_name: string;
  supplier_name: string;
  item_name: string;
};

export type OrderDetail = {
  order_id: number;
  date: string;
  created_at: string;
  updated_at: string;
  quantity: number;
  status: number;
  employee_name: string;
  supplier_name: string;
  item_name: string;
  employee_id: number;
  supplier_id: number;
  item_id: number;
};

export type LunchSummaryState = {
  employee: VerifiedEmployee | null;
  activeDate: ActiveDateResponse | null;
  items: DropdownItem[];
  recentOrders: OrderHistoryItem[];
  todayOrder: OrderHistoryItem | null;
  previousOrder: OrderHistoryItem | null;
};