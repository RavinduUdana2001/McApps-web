import { api, ensureSuccess } from "./api";
import type {
  ActiveDateResponse,
  DropdownItem,
  OrderDetail,
  OrderHistoryItem,
  VerifiedEmployee,
} from "../types/lunch";

export async function getActiveDate() {
  const res = await api.get("/dropdown/active_date");
  return ensureSuccess<ActiveDateResponse>(res.data);
}

export async function getDropdownItems() {
  const res = await api.get("/dropdown/items");
  return ensureSuccess<DropdownItem[]>(res.data);
}

export async function verifyEmployee(username: string, email: string) {
  const res = await api.post(
    "/orders/verify_employee",
    {
      username,
      email,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return ensureSuccess<VerifiedEmployee>(res.data);
}

export async function addLunchOrder(payload: {
  employee_id: number;
  supplier_id: number;
  item_id: number;
  special_note?: string;
}) {
  const res = await api.post("/orders/add", payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return ensureSuccess<{ id: number }>(res.data);
}

export async function getOrdersByEmployee(employeeId: number) {
  const res = await api.get("/orders/get_by_employee", {
    params: { employee_id: employeeId },
  });

  return ensureSuccess<OrderHistoryItem[]>(res.data);
}

export async function getOrderById(orderId: number) {
  const res = await api.get("/orders/get_by_order", {
    params: { order_id: orderId },
  });

  return ensureSuccess<OrderDetail>(res.data);
}

export async function deleteOrder(orderId: number) {
  const res = await api.get("/orders/delete", {
    params: { order_id: orderId },
  });

  return ensureSuccess<{ order_id: number }>(res.data);
}

export async function cancelOrder(orderId: number) {
  const res = await api.get("/orders/cancel", {
    params: { order_id: orderId },
  });

  return ensureSuccess<{ order_id: number }>(res.data);
}