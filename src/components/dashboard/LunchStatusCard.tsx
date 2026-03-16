import { useEffect, useMemo, useState } from "react";
import { Loader2, ShoppingBag, Trash2, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSession } from "../../utils/session";

import {
  cancelOrder,
  deleteOrder,
  getActiveDate,
  getOrdersByEmployee,
  verifyEmployee,
} from "../../services/lunchService";

import {
  canCancelLunch,
  canDeleteLunch,
  canPlaceLunch,
  formatLunchDate,

  getRemovalMode,
  getTodayOrderForActiveDate,
} from "../../utils/lunch";

import type { LunchSummaryState } from "../../types/lunch";

export default function LunchStatusCard() {
  const navigate = useNavigate();
  const user = getSession();

  const [state, setState] = useState<LunchSummaryState>({
    employee: null,
    activeDate: null,
    items: [],
    recentOrders: [],
    todayOrder: null,
    previousOrder: null,
  });

  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [errorText, setErrorText] = useState("");

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

  const removalMode = useMemo(
    () => getRemovalMode(state.activeDate),
    [state.activeDate]
  );

  const loadAll = async () => {
    if (!user?.username || !user?.mail) return;

    try {
      const [employee, activeDate] = await Promise.all([
        verifyEmployee(user.username, user.mail),
        getActiveDate(),
      ]);

      const orders = await getOrdersByEmployee(employee.id);

      const todayOrder = getTodayOrderForActiveDate(
        orders,
        activeDate.active_date
      );

      setState({
        employee,
        activeDate,
        items: [],
        recentOrders: orders,
        todayOrder,
        previousOrder: null,
      });
    } catch (error) {
      console.error(error);
      setErrorText("Failed to load lunch status.");
    } finally {
      setLoading(false);
    }
  };

  // INITIAL LOAD
  useEffect(() => {
    loadAll();
  }, [user?.username, user?.mail]);

  // AUTO REFRESH EVERY 60 SECONDS
  useEffect(() => {
    const interval = setInterval(() => {
      loadAll();
    }, 60000);

    return () => clearInterval(interval);
  }, [user?.username, user?.mail]);

  const handleRemoveOrder = async () => {
    if (!state.todayOrder || !removalMode) return;

    const ok = window.confirm(
      "Do you want to permanently delete this lunch?"
    );

    if (!ok) return;

    try {
      setRemoving(true);

      if (removalMode === "delete") {
        await deleteOrder(state.todayOrder.id);
      } else {
        await cancelOrder(state.todayOrder.id);
      }

      await loadAll();
    } catch (err) {
      setErrorText("Failed to remove lunch.");
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-[26px] p-4">
        <div className="flex min-h-[180px] items-center justify-center">
          <Loader2 size={26} className="animate-spin text-[#2f66cc]" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-[26px] p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2f66cc] text-white">
          <UtensilsCrossed size={20} />
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#1c2740]">Lunch</h3>

          <p className="text-sm text-[#6d7c99]">
            {state.activeDate
              ? formatLunchDate(state.activeDate.active_date)
              : "No active date"}
          </p>
        </div>
      </div>

      {state.todayOrder ? (
        <div className="rounded-[20px] bg-white/70 p-4">
          <p className="text-sm font-semibold text-[#1c2740]">
            Lunch placed
          </p>

          <p className="mt-2 text-sm text-[#5d6f91]">
            {state.todayOrder.supplier_name} • {state.todayOrder.item_name}
          </p>

          {(canDelete || canCancel) && (
            <button
              onClick={handleRemoveOrder}
              disabled={removing}
              className="mt-4 flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-500"
            >
              {removing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              Delete Order
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-[20px] bg-white/70 p-4">
          <p className="text-sm font-semibold text-[#1c2740]">
            No lunch placed
          </p>

          <button
            onClick={() => navigate("/lunch-orders")}
            disabled={!canPlace}
            className="mt-4 flex items-center gap-2 rounded-full bg-[#2f66cc] px-4 py-2 text-sm font-semibold text-white"
          >
            <ShoppingBag size={14} />
            Place Lunch
          </button>
        </div>
      )}

      {errorText && (
        <p className="mt-3 text-xs text-red-500">{errorText}</p>
      )}
    </div>
  );
}