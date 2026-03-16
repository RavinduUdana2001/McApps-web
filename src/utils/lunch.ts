import type {
  ActiveDateResponse,
  DropdownItem,
  OrderHistoryItem,
} from "../types/lunch";

export function formatLunchDate(dateString: string) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatLunchDateTime(dateString: string) {
  if (!dateString) return "-";

  const normalized = dateString.includes("T")
    ? dateString
    : dateString.replace(" ", "T");

  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return dateString;

  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getTodayOrderForActiveDate(
  orders: OrderHistoryItem[],
  activeDate?: string
) {
  if (!activeDate) return null;
  return orders.find((o) => o.date === activeDate && o.status !== -1) || null;
}

export function isWithinActiveWindow(active: ActiveDateResponse | null) {
  if (!active) return false;

  const now = new Date();
  const start = new Date(active.active_start_datetime.replace(" ", "T"));
  const end = new Date(active.active_end_datetime.replace(" ", "T"));

  return now >= start && now <= end;
}

export function isWithinCancelWindow(active: ActiveDateResponse | null) {
  if (!active) return false;

  const now = new Date();
  const end = new Date(active.active_end_datetime.replace(" ", "T"));

  const deadline = new Date(end);
  deadline.setDate(deadline.getDate() + 1);
  deadline.setHours(8, 0, 0, 0);

  return now > end && now <= deadline;
}

export function canPlaceLunch(active: ActiveDateResponse | null) {
  return isWithinActiveWindow(active);
}

export function canDeleteLunch(active: ActiveDateResponse | null) {
  return isWithinActiveWindow(active);
}

export function canCancelLunch(active: ActiveDateResponse | null) {
  return isWithinCancelWindow(active);
}

export function getRemovalMode(active: ActiveDateResponse | null) {
  if (isWithinActiveWindow(active)) return "delete";
  if (isWithinCancelWindow(active)) return "cancel";
  return null;
}

export function getSuppliers(items: DropdownItem[]) {
  const map = new Map<number, string>();

  items.forEach((item) => {
    if (!map.has(item.supplier_id)) {
      map.set(item.supplier_id, item.supplier_name);
    }
  });

  return Array.from(map.entries()).map(([id, name]) => ({
    id,
    name,
  }));
}

export function getItemsBySupplier(items: DropdownItem[], supplierId?: number) {
  if (!supplierId) return [];
  return items.filter((item) => item.supplier_id === supplierId);
}