import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Clock3,
  Loader2,
  MapPin,
  RefreshCw,
  ShoppingBag,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
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
  getItemsBySupplier,
  getSuppliers,
  getTodayOrderForActiveDate,
} from "../utils/lunch";
import {
  getOfflineAwareMessage,
  OFFLINE_MESSAGE,
  withTimeout,
} from "../utils/network";
import type { LunchSummaryState } from "../types/lunch";

type CountdownState = {
  label: string;
  value: string;
  tone: "open" | "warning" | "closed";
};

const lunchPanelClass =
  "app-page-surface rounded-[28px]";

const lunchInnerPanelClass =
  "app-page-soft-panel rounded-[22px]";

const lunchSuccessClass =
  "rounded-[22px] border border-[rgba(135,188,255,0.28)] bg-[linear-gradient(135deg,rgba(31,97,200,0.24)_0%,rgba(92,166,255,0.14)_100%)] text-[#dfeeff] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_34px_rgba(18,82,178,0.14)]";

const lunchSuccessBannerClass =
  "rounded-2xl border border-[rgba(135,188,255,0.24)] bg-[linear-gradient(135deg,rgba(31,97,200,0.18)_0%,rgba(92,166,255,0.12)_100%)] px-4 py-3 text-sm font-medium text-[#e7f3ff]";
const LUNCH_PAGE_ERROR_MESSAGE =
  "Unable to load lunch data right now. Please try again.";

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
  const isOnline = useNetworkStatus();
  const userLocation = user?.location?.trim() || "-";

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
  const [reloadKey, setReloadKey] = useState(0);

  const suppliers = useMemo(() => getSuppliers(state.items), [state.items]);

  const filteredItems = useMemo(
    () => getItemsBySupplier(state.items, supplierId || undefined),
    [state.items, supplierId]
  );

  const supplierOptions = useMemo(
    () =>
      suppliers.map((supplier) => ({
        value: supplier.id,
        label: supplier.name,
      })),
    [suppliers]
  );

  const itemOptions = useMemo(
    () =>
      filteredItems.map((item) => ({
        value: item.item_id,
        label: item.item_name,
      })),
    [filteredItems]
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

  useEffect(() => {
    if (supplierOptions.length === 1) {
      const [onlySupplier] = supplierOptions;

      setSupplierId((current) =>
        current === onlySupplier.value ? current : onlySupplier.value
      );
      return;
    }

    if (
      supplierId !== "" &&
      !supplierOptions.some((option) => option.value === supplierId)
    ) {
      setSupplierId("");
      setItemId("");
    }
  }, [supplierId, supplierOptions]);

  useEffect(() => {
    if (itemId === "") return;

    const itemStillAvailable = itemOptions.some((option) => option.value === itemId);

    if (!itemStillAvailable) {
      setItemId("");
    }
  }, [itemId, itemOptions]);

  const loadAll = async ({
    silent = false,
  }: {
    silent?: boolean;
  } = {}) => {
    if (!user?.username || !user?.mail) {
      setLoading(false);
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
      }
      setErrorText("");

      if (!isOnline) {
        throw new Error(OFFLINE_MESSAGE);
      }

      const [employee, activeDate, items] = await withTimeout(
        Promise.all([
          verifyEmployee(user.username, user.mail),
          getActiveDate(),
          getDropdownItems(),
        ]),
        10000,
        OFFLINE_MESSAGE
      );

      const orders = await withTimeout(
        getOrdersByEmployee(employee.id),
        10000,
        OFFLINE_MESSAGE
      );
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
        getOfflineAwareMessage(error, LUNCH_PAGE_ERROR_MESSAGE)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, [isOnline, reloadKey, user?.username, user?.mail]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadAll({ silent: true });
    }, 300000);

    return () => window.clearInterval(interval);
  }, [isOnline, user?.username, user?.mail]);

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
      <AppShell desktopFitScreen>
        <div className="flex min-h-[320px] items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#8dbaff]" />
        </div>
      </AppShell>
    );
  }

  if (errorText && !state.employee) {
    return (
      <AppShell desktopFitScreen>
        <div className="app-page-surface rounded-[26px] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-[rgba(255,184,120,0.12)] text-[#ffd7b0]">
            {errorText === OFFLINE_MESSAGE ? (
              <WifiOff size={24} />
            ) : (
              <AlertTriangle size={24} />
            )}
          </div>

          <p className="mt-4 text-lg font-semibold text-white">
            {errorText === OFFLINE_MESSAGE
              ? "No internet connection"
              : "Unable to load lunch data"}
          </p>

          <p className="mx-auto mt-2 max-w-[520px] text-sm leading-6 text-[#d2def3]">
            {errorText}
          </p>

          <button
            onClick={() => setReloadKey((prev) => prev + 1)}
            className="theme-button-secondary mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  const todayOrder = state.todayOrder;
  const supplierSelectionLocked = supplierOptions.length === 1;

  return (
    <AppShell desktopFitScreen>
      <>
        <div className="space-y-3 lg:flex lg:h-full lg:flex-col lg:overflow-hidden">
          <section className={`${lunchPanelClass} shrink-0 p-4 md:p-5`}>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(720px,820px)] lg:items-center lg:gap-4">
              <div className="min-w-0">
                <h1 className="theme-page-title text-[1.6rem] font-bold md:text-[1.8rem]">
                  Lunch Orders
                </h1>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:justify-self-end">
                <InfoMiniCard
                  icon={<CalendarDays size={18} className="text-[#bdddff]" />}
                  title="Active Date"
                  value={
                    state.activeDate
                      ? formatLunchDate(state.activeDate.active_date)
                      : "-"
                  }
                />

                <InfoMiniCard
                  icon={<Clock3 size={18} className="text-[#bdddff]" />}
                  title="Order Window"
                  value={countdown.value}
                  valueClassName={
                    countdown.tone === "open"
                      ? "text-[#8ef0bc]"
                      : countdown.tone === "warning"
                      ? "text-[#ffd27d]"
                      : "text-[#90a8d0]"
                  }
                />

                <InfoMiniCard
                  icon={<ShoppingBag size={18} className="text-[#bdddff]" />}
                  title="Lunch"
                  value={
                    todayOrder ? "Placed" : canPlace ? "Open" : canCancel ? "Remove" : "Closed"
                  }
                  valueClassName={
                    todayOrder || canPlace
                      ? "text-[#bdddff]"
                      : canCancel
                      ? "text-[#ffd27d]"
                      : "text-[#90a8d0]"
                  }
                />

                <InfoMiniCard
                  icon={<MapPin size={18} className="text-[#bdddff]" />}
                  title="Location"
                  value={userLocation}
                />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:overflow-hidden">
            <div
              className={`${lunchPanelClass} flex min-h-0 flex-col p-5 md:p-6 lg:overflow-hidden`}
            >
              <div className="mb-4 shrink-0">
                <h2 className="text-xl font-bold text-white">Place Lunch</h2>
              </div>

              <div className="theme-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="space-y-4">
                  {errorText ? (
                    <div className="theme-danger rounded-2xl px-4 py-3 text-sm font-medium">
                      {errorText}
                    </div>
                  ) : null}

                  {successText && !todayOrder ? (
                    <div className={lunchSuccessBannerClass}>
                      {successText}
                    </div>
                  ) : null}

                  {todayOrder ? (
                    <div className={`${lunchSuccessClass} p-4 md:p-4.5`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#dfeeff]">Lunch placed</p>
                          <div className="mt-1 text-sm font-semibold text-white/90">
                            {formatLunchDate(todayOrder.date)}
                          </div>
                        </div>

                        {successText ? (
                          <span className="inline-flex shrink-0 rounded-full border border-[rgba(167,205,255,0.22)] bg-[rgba(255,255,255,0.08)] px-3 py-1 text-xs font-semibold text-[#e7f3ff]">
                            {successText}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-[18px] border border-[rgba(167,205,255,0.16)] bg-[rgba(255,255,255,0.07)] px-3.5 py-3">
                          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[#cfe5ff]">
                            Supplier
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-white">
                            {todayOrder.supplier_name}
                          </p>
                        </div>

                        <div className="rounded-[18px] border border-[rgba(167,205,255,0.16)] bg-[rgba(255,255,255,0.07)] px-3.5 py-3">
                          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[#cfe5ff]">
                            Item
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-white">
                            {todayOrder.item_name}
                          </p>
                        </div>
                      </div>

                      {canDelete ? (
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => openDeleteModal(todayOrder.id)}
                            disabled={actionOrderId === todayOrder.id}
                            className="theme-button-danger inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition disabled:opacity-60"
                          >
                            {actionOrderId === todayOrder.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                            Delete Order
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : canPlace ? (
                    <form onSubmit={handlePlaceOrder} className="lunch-order-form space-y-3.5">
                      <div className="space-y-3">
                        <LunchSelectField
                          label="Supplier"
                          value={supplierId}
                          options={supplierOptions}
                          placeholder="Select supplier"
                          emptyText="No suppliers available."
                          disabled={!canPlace || supplierSelectionLocked}
                          onChange={(nextValue) => {
                            setSupplierId(nextValue);
                            setItemId("");
                          }}
                        />

                        <LunchSelectField
                          label="Item"
                          value={itemId}
                          options={itemOptions}
                          placeholder="Select item"
                          emptyText={
                            supplierId
                              ? "No items available."
                              : "Select supplier first."
                          }
                          disabled={!supplierId || !canPlace}
                          onChange={(nextValue) => setItemId(nextValue)}
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={submitting || !canPlace}
                          className="theme-button-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[0.96rem] font-semibold transition disabled:opacity-60 sm:min-w-[190px] sm:w-auto"
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
                    <div className="theme-empty rounded-[20px] p-4 text-sm">
                      Lunch ordering is closed for the active date.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className={`${lunchPanelClass} flex min-h-0 flex-col p-5 md:p-6 lg:overflow-hidden`}
            >
              <div className="mb-4 shrink-0 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-white">Previous History</h2>
                <span
                  className={`${lunchInnerPanelClass} rounded-full px-3 py-1 text-xs font-semibold text-[#bdddff]`}
                >
                  {Math.min(state.recentOrders.length, 5)} Records
                </span>
              </div>

              <div className="theme-scrollbar space-y-3 pr-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                  {state.recentOrders.length === 0 ? (
                    <div className="theme-empty rounded-[20px] p-4 text-sm">
                      No orders found.
                    </div>
                  ) : (
                    state.recentOrders.slice(0, 5).map((order) => {
                      const currentTodayOrderId = todayOrder?.id ?? null;
                      const isTodayCurrent = currentTodayOrderId === order.id;

                      return (
                        <div
                          key={order.id}
                          className={`${lunchInnerPanelClass} rounded-[20px] p-4`}
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">
                                {order.supplier_name} | {order.item_name}
                              </p>
                              <p className="mt-1 text-xs text-[#8ea9d3]">
                                {formatLunchDate(order.date)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {order.status === -1 ? (
                                <span className="theme-danger rounded-full px-3 py-1 text-xs font-bold">
                                  Removed
                                </span>
                              ) : null}

                              {canCancel && isTodayCurrent ? (
                                <button
                                  type="button"
                                  onClick={() => openDeleteModal(order.id)}
                                  disabled={actionOrderId === order.id}
                                  className="theme-button-danger inline-flex w-full items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition disabled:opacity-60 sm:w-auto"
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

type LunchSelectOption = {
  value: number;
  label: string;
};

function LunchSelectField({
  label,
  value,
  options,
  placeholder,
  emptyText,
  disabled = false,
  onChange,
}: {
  label: string;
  value: number | "";
  options: LunchSelectOption[];
  placeholder: string;
  emptyText: string;
  disabled?: boolean;
  onChange: (value: number | "") => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? placeholder;
  const hasSelection = value !== "";

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  return (
    <div
      ref={rootRef}
      className={`lunch-order-row ${open ? "lunch-order-row-open" : ""}`}
    >
      <label className="lunch-order-label text-[#e7f1ff]">{label}</label>

      <div className="lunch-order-control">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className={`theme-input lunch-order-select lunch-order-trigger w-full ${
            open ? "lunch-order-trigger-open" : ""
          }`}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span
            className={`lunch-order-trigger-label ${
              hasSelection
                ? "lunch-order-trigger-value"
                : "lunch-order-trigger-placeholder"
            }`}
          >
            {selectedLabel}
          </span>
          <ChevronDown
            size={16}
            className={`lunch-order-trigger-icon ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {open ? (
        <div className="lunch-order-options theme-scrollbar" role="listbox">
          {options.length > 0 ? (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                aria-selected={option.value === value}
                className={`lunch-order-option ${
                  option.value === value ? "lunch-order-option-active" : ""
                }`}
              >
                <span className="truncate">{option.label}</span>
              </button>
            ))
          ) : (
            <div className="lunch-order-empty">{emptyText}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function InfoMiniCard({
  icon,
  title,
  value,
  valueClassName = "text-white",
}: {
  icon: ReactNode;
  title: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className={`${lunchInnerPanelClass} px-4 py-3.5`}>
      <div className="flex items-center gap-3">
        {icon}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className={`mt-1 truncate text-sm font-semibold ${valueClassName}`}>
            {value}
          </p>
        </div>
      </div>
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
        className="absolute inset-0 bg-[#020916]/72 backdrop-blur-[6px]"
      />

      <div className="glass relative z-[121] w-full max-w-[420px] overflow-hidden rounded-[28px] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(255,99,99,0.14)] text-[#ff8e8e] shadow-sm">
            <AlertTriangle size={24} />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-xl transition disabled:opacity-60"
          >
            <X size={18} />
          </button>
        </div>

        <h3 className="mt-5 text-2xl font-bold text-white">Delete this lunch?</h3>

        <p className="theme-muted mt-3 text-sm leading-7">
          This action will remove the selected lunch order. Please confirm only if you are sure you want to permanently delete it.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="theme-button-secondary rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="theme-button-danger inline-flex min-w-[128px] items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60"
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
