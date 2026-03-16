import type { LucideIcon } from "lucide-react";

export type QuickLink = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  href?: string;
  route?: string;
  gradient: string;
};

export type AlertItem = {
  id: number;
  priority: "Urgent" | "Warning" | "Info";
  title: string;
  description: string;
  time: string;
};

export type NewsItem = {
  id: number;
  title: string;
  description: string;
  created_at: string;
  image_url: string | null;
  like_count: number;
  is_liked: number;
};

export type BirthdayItem = {
  id: number;
  title: string;
  description: string;
  created_at: string;
  image_url: string | null;
  like_count: number;
  is_liked: number;
};

export type DirectoryPerson = {
  id: number;
  displayname: string;
  email: string;
  phone_no: string;
  department: string;
  company: string;
};

export type ActiveWindow = {
  active_date: string;
  active_start_datetime: string;
  active_end_datetime: string;
};

export type DropdownItem = {
  link_id: string;
  supplier_id: string;
  supplier_name: string;
  item_id: string;
  item_name: string;
};

export type OrderItem = {
  id: number;
  date: string;
  quantity: number;
  status: number;
  employee_name: string;
  supplier_name: string;
  item_name: string;
};