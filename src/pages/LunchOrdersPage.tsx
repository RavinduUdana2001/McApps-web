import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Loader2,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { getSession } from "../utils/session";
import {
  addLunchOrder,
  cancelOrder,
  deleteOrder,
  getActiveDate,
  getDropdownItems,
  getOrdersByEmployee,
  verifyEmployee,
} from "../services/lunchService";
import {
  canCancelLunch,
  canDeleteLunch,
  canPlaceLunch,
  formatLunchDate,
  formatLunchDateTime,
  getItemsBySupplier,
  getSuppliers,
  getTodayOrderForActiveDate,
} from "../utils/lunch";
import type { DropdownItem, LunchSummaryState } from "../types/lunch";

type CountdownState = {
  label: string;
  value: string;
  tone: "open" | "warning" | "closed";
};

function getCountdownState(
  activeDate: LunchSummaryState["activeDate"]
): CountdownState {
  if (!activeDate?.active_end_datetime) {
    return {
      label: "Remaining time",
      value: "--:--:--",
      tone: "closed",
    };
  }

  const end = new Date(activeDate.active_end_datetime).getTime();

  if (Number.isNaN(end)) {
    return {
      label: "Remaining time",
      value: "--:--:--",
      tone: "closed",
    };
  }

  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) {
    return {
      label: "Window status",
      value: "Ended",
      tone: "closed",
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const padded = [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");

  return {
    label: "Remaining time",
    value: padded,
    tone: diff <= 30 * 60 * 1000 ? "warning" : "open",
  };
}

export default function LunchOrdersPage() {
  const user = getSession();

  const [state, setState] = useState<LunchSummaryState>({
    employee: null,
    activeDate: null,
    items: [],
    recentOrders: [],
    todayOrder: null,
    previousOrder: null,
  });

  const [supplierId, setSupplierId] = useState<number | "">("");
  const [itemId, setItemId] = useState<number | "">("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionOrderId, setActionOrderId] = useState<number | null>(null);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteOrderId, setPendingDeleteOrderId] = useState<number | null>(
    null
  );

  const [nowTick, setNowTick] = useState(Date.now());

  const suppliers = useMemo(() => getSuppliers(state.items), [state.items]);

  const filteredItems = useMemo(
    () => getItemsBySupplier(state.items, supplierId || undefined),
    [state.items, supplierId]
  );

  const canPlace = useMemo(
    () => canPlaceLunch(state.activeDate),
    [state.activeDate]
  );

  const canDelete = useMemo(
    () => canDeleteLunch(state.activeDate),
    [state.activeDate]
  );

  const canCancel = useMemo(
    () => canCancelLunch(state.activeDate),
    [state.activeDate]
  );

  const countdown = useMemo(() => {
    void nowTick;
    return getCountdownState(state.activeDate);
  }, [state.activeDate, nowTick]);

  const loadAll = async () => {
    if (!user?.username || !user?.mail) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorText("");

      const [employee, activeDate, items] = await Promise.all([
        verifyEmployee(user.username, user.mail),
        getActiveDate(),
        getDropdownItems(),
      ]);

      const orders = await getOrdersByEmployee(employee.id);
      const todayOrder = getTodayOrderForActiveDate(orders, activeDate.active_date);

      setState({
        employee,
        activeDate,
        items,
        recentOrders: orders,
        todayOrder,
        previousOrder: null,
      });
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Failed to load lunch data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [user?.username, user?.mail]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadAll();
    }, 60000);

    return () => window.clearInterval(interval);
  }, [user?.username, user?.mail]);

  useEffect(() => {
    if (!deleteModalOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [deleteModalOpen]);

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();

    if (!state.employee || !supplierId || !itemId) {
      setErrorText("Please select supplier and item.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorText("");
      setSuccessText("");

      await addLunchOrder({
        employee_id: state.employee.id,
        supplier_id: Number(supplierId),
        item_id: Number(itemId),
      });

      setSupplierId("");
      setItemId("");
      setSuccessText("Lunch order placed successfully.");
      await loadAll();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Failed to place lunch order."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (orderId: number) => {
    setPendingDeleteOrderId(orderId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (actionOrderId !== null) return;
    setDeleteModalOpen(false);
    setPendingDeleteOrderId(null);
  };

  const confirmRemoveOrder = async () => {
    if (pendingDeleteOrderId === null) return;

    try {
      setActionOrderId(pendingDeleteOrderId);
      setErrorText("");
      setSuccessText("");

      if (canDelete) {
        await deleteOrder(pendingDeleteOrderId);
      } else if (canCancel) {
        await cancelOrder(pendingDeleteOrderId);
      } else {
        throw new Error("Order cannot be removed at this time.");
      }

      setSuccessText("Order removed successfully.");
      setDeleteModalOpen(false);
      setPendingDeleteOrderId(null);
      await loadAll();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Failed to remove order."
      );
    } finally {
      setActionOrderId(null);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[320px] items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#2f66cc]" />
        </div>
      </AppShell>
    );
  }

  const todayOrder = state.todayOrder;

  return (
    <AppShell>
      <>
        <div className="space-y-4 lg:h-[calc(100vh-2rem)] lg:overflow-hidden">
          <section className="glass shrink-0 rounded-[28px] p-4 md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1.5 text-xs font-semibold text-[#2f66cc]">
                  <ShoppingBag size={14} />
                  Lunch Ordering
                </div>

                <h1 className="mt-3 text-2xl font-bold text-[#1c2740] md:text-3xl">
                  Lunch Orders
                </h1>

                <p className="mt-2 max-w-[820px] text-sm leading-6 text-[#6d7c99]">
                  Place lunch for the active date, monitor the remaining order
                  window, and manage your latest lunch history from one screen.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[620px]">
                <InfoMiniCard
                  icon={<CalendarDays size={18} className="text-[#2f66cc]" />}
                  title="Active Date"
                  value={
                    state.activeDate
                      ? formatLunchDate(state.activeDate.active_date)
                      : "-"
                  }
                  helper={
                    state.activeDate
                      ? `${formatLunchDateTime(
                          state.activeDate.active_start_datetime
                        )} – ${formatLunchDateTime(
                          state.activeDate.active_end_datetime
                        )}`
                      : "No active date"
                  }
                />

                <InfoMiniCard
                  icon={<Clock3 size={18} className="text-[#2f66cc]" />}
                  title={countdown.label}
                  value={countdown.value}
                  helper={
                    countdown.tone === "open"
                      ? "Lunch order window is active"
                      : countdown.tone === "warning"
                      ? "Ending soon"
                      : "Ordering window closed"
                  }
                  valueClassName={
                    countdown.tone === "open"
                      ? "text-emerald-600"
                      : countdown.tone === "warning"
                      ? "text-amber-600"
                      : "text-slate-600"
                  }
                />

                <InfoMiniCard
                  icon={<ShoppingBag size={18} className="text-[#2f66cc]" />}
                  title="Window"
                  value={
                    canPlace ? "Order Open" : canCancel ? "Remove Only" : "Closed"
                  }
                  helper={
                    canPlace
                      ? "You can place or delete"
                      : canCancel
                      ? "Only removal is allowed"
                      : "No actions available"
                  }
                  valueClassName={
                    canPlace
                      ? "text-emerald-600"
                      : canCancel
                      ? "text-amber-600"
                      : "text-slate-600"
                  }
                />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:overflow-hidden">
            <div className="flex min-h-0 flex-col gap-4 lg:overflow-hidden">
              <div className="glass shrink-0 rounded-[28px] p-5 md:p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-[#1c2740]">Place Lunch</h2>
                  <p className="mt-1 text-sm text-[#6d7c99]">
                    Select supplier and meal for the active date
                  </p>
                </div>

                {todayOrder ? (
                  <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
                    <p className="text-sm">
                      Lunch placed for {formatLunchDate(todayOrder.date)}
                    </p>

                    <div className="mt-2 text-base font-semibold">
                      {todayOrder.supplier_name} • {todayOrder.item_name}
                    </div>

                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => openDeleteModal(todayOrder.id)}
                        disabled={actionOrderId === todayOrder.id}
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-500 disabled:opacity-60"
                      >
                        {actionOrderId === todayOrder.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Delete Order
                      </button>
                    ) : null}
                  </div>
                ) : canPlace ? (
                  <form onSubmit={handlePlaceOrder} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#33415d]">
                          Supplier
                        </label>
                        <select
                          value={supplierId}
                          onChange={(e) => {
                            setSupplierId(e.target.value ? Number(e.target.value) : "");
                            setItemId("");
                          }}
                          disabled={!canPlace}
                          className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-[#1f2a44] outline-none"
                        >
                          <option value="">Select supplier</option>
                          {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#33415d]">
                          Item
                        </label>
                        <select
                          value={itemId}
                          onChange={(e) =>
                            setItemId(e.target.value ? Number(e.target.value) : "")
                          }
                          disabled={!supplierId || !canPlace}
                          className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-[#1f2a44] outline-none"
                        >
                          <option value="">Select item</option>
                          {filteredItems.map((item: DropdownItem) => (
                            <option key={item.link_id} value={item.item_id}>
                              {item.item_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting || !canPlace}
                        className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#2f66cc_0%,#5f89da_100%)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {submitting ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ShoppingBag size={16} />
                        )}
                        Place Order
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-[20px] bg-white/60 p-4 text-sm text-[#6d7c99]">
                    Lunch ordering is currently closed.
                  </div>
                )}

                {errorText ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {errorText}
                  </div>
                ) : null}

                {successText ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">
                    {successText}
                  </div>
                ) : null}
              </div>

              <div className="glass min-h-0 flex-1 rounded-[28px] p-5 md:p-6 lg:overflow-hidden">
                <div className="mb-4 shrink-0">
                  <h2 className="text-xl font-bold text-[#1c2740]">Lunch History</h2>
                  <p className="mt-1 text-sm text-[#6d7c99]">
                    Last 5 lunch orders for your account
                  </p>
                </div>

                <div className="space-y-3 pr-1 lg:max-h-full lg:overflow-y-auto">
                  {state.recentOrders.length === 0 ? (
                    <div className="rounded-[20px] bg-white/60 p-4 text-sm text-[#6d7c99]">
                      No orders found.
                    </div>
                  ) : (
                    state.recentOrders.slice(0, 5).map((order) => {
                      const currentTodayOrderId = todayOrder?.id ?? null;
                      const isTodayCurrent = currentTodayOrderId === order.id;

                      return (
                        <div
                          key={order.id}
                          className="rounded-[20px] bg-white/65 p-4"
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#1c2740]">
                                {order.supplier_name} • {order.item_name}
                              </p>
                              <p className="mt-1 text-xs text-[#8ea0bf]">
                                {formatLunchDate(order.date)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {order.status === -1 ? (
                                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500">
                                  Removed
                                </span>
                              ) : null}

                              {canCancel && isTodayCurrent ? (
                                <button
                                  type="button"
                                  onClick={() => openDeleteModal(order.id)}
                                  disabled={actionOrderId === order.id}
                                  className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 disabled:opacity-60"
                                >
                                  {actionOrderId === order.id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={13} />
                                  )}
                                  Delete Order
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <aside className="flex min-h-0 flex-col gap-4">
              <div className="glass rounded-[28px] p-5 md:p-6">
                <h2 className="text-xl font-bold text-[#1c2740]">Current Status</h2>

                <div className="mt-4 space-y-3">
                  <StatusCard
                    title="Employee"
                    value={state.employee?.display_name || "-"}
                  />

                  <StatusCard
                    title="Today Order"
                    value={
                      todayOrder
                        ? `${todayOrder.supplier_name} • ${todayOrder.item_name}`
                        : "Not placed yet"
                    }
                  />

                  <StatusCard
                    title="Window"
                    value={
                      canPlace
                        ? "You can place or delete orders now."
                        : canCancel
                        ? "You can only remove today's lunch now."
                        : "Ordering and removal are closed."
                    }
                  />
                </div>
              </div>

              <div className="glass rounded-[28px] p-5 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#2f66cc]">
                    <Clock3 size={22} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#1c2740]">
                      Lunch Closing Countdown
                    </p>
                    <p className="text-sm text-[#6d7c99]">
                      Live remaining time for the current lunch window
                    </p>
                  </div>
                </div>

                <div
                  className={`mt-5 rounded-[24px] px-4 py-5 text-center ${
                    countdown.tone === "open"
                      ? "bg-emerald-50"
                      : countdown.tone === "warning"
                      ? "bg-amber-50"
                      : "bg-slate-100"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b89a5]">
                    {countdown.label}
                  </p>
                  <p
                    className={`mt-2 text-3xl font-bold tracking-[0.08em] ${
                      countdown.tone === "open"
                        ? "text-emerald-600"
                        : countdown.tone === "warning"
                        ? "text-amber-600"
                        : "text-slate-600"
                    }`}
                  >
                    {countdown.value}
                  </p>
                </div>
              </div>
            </aside>
          </section>
        </div>

        {deleteModalOpen ? (
          <DeleteLunchModal
            loading={actionOrderId !== null}
            onClose={closeDeleteModal}
            onConfirm={confirmRemoveOrder}
          />
        ) : null}
      </>
    </AppShell>
  );
}

function InfoMiniCard({
  icon,
  title,
  value,
  helper,
  valueClassName = "text-[#1c2740]",
}: {
  icon: ReactNode;
  title: string;
  value: string;
  helper: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-[22px] bg-white/65 p-4">
      <div className="flex items-center gap-3">
        {icon}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1c2740]">{title}</p>
          <p className={`mt-1 truncate text-sm font-semibold ${valueClassName}`}>
            {value}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-[#6d7c99]">{helper}</p>
    </div>
  );
}

function StatusCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] bg-white/65 p-4">
      <p className="text-sm font-semibold text-[#1c2740]">{title}</p>
      <p className="mt-1 text-sm text-[#5d6f91]">{value}</p>
    </div>
  );
}

function DeleteLunchModal({
  loading,
  onClose,
  onConfirm,
}: {
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close delete modal overlay"
        onClick={onClose}
        className="absolute inset-0 bg-[#0f172a]/45 backdrop-blur-[4px]"
      />

      <div className="relative z-[121] w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(245,249,255,0.96)_100%)] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.20)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 shadow-sm">
            <AlertTriangle size={24} />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-[#6d7c99] transition hover:bg-white disabled:opacity-60"
          >
            <X size={18} />
          </button>
        </div>

        <h3 className="mt-5 text-2xl font-bold text-[#1c2740]">
          Delete this lunch?
        </h3>

        <p className="mt-3 text-sm leading-7 text-[#6d7c99]">
          This action will remove the selected lunch order. Please confirm only
          if you are sure you want to permanently delete it.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full bg-[#edf4ff] px-5 py-2.5 text-sm font-semibold text-[#2f66cc] transition hover:bg-[#e4efff] disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex min-w-[128px] items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ef4444_0%,#dc2626_100%)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(220,38,38,0.24)] transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}