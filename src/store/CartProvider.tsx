"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { calculateTotals, itemCount, validateCoupon } from "@/lib/cart";
import type { CartItem, Coupon, CouponState, OrderTotals, ShippingMethodId } from "@/types";

const STORAGE_KEY = "loran:cart";

interface CartContextValue {
  items: CartItem[];
  count: number;
  totals: OrderTotals;
  coupon: Coupon | null;
  couponState: CouponState;
  shippingMethodId: ShippingMethodId;
  /** True until the persisted cart has been read — used to avoid flashing "empty". */
  hydrating: boolean;
  miniCartOpen: boolean;
  setMiniCartOpen: (open: boolean) => void;
  addItem: (item: CartItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => CartItem | undefined;
  restoreItem: (item: CartItem) => void;
  clear: () => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  setShippingMethodId: (id: ShippingMethodId) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/**
 * Cart state, persisted to localStorage.
 *
 * ▶ Backend swap: the reducers below become API calls (`POST /cart/items`, …).
 *   The context surface is what components depend on, so it stays the same.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponState, setCouponState] = useState<CouponState>({ status: "idle" });
  const [shippingMethodId, setShippingMethodId] = useState<ShippingMethodId>("tipax");
  const [hydrating, setHydrating] = useState(true);
  const [miniCartOpen, setMiniCartOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { items?: CartItem[]; couponCode?: string };
        if (Array.isArray(parsed.items)) setItems(parsed.items);
        if (parsed.couponCode) {
          // Re-validate rather than trusting the stored discount: prices and the
          // cart may have changed since it was applied.
          const subtotal = (parsed.items ?? []).reduce((n, i) => n + i.price * i.quantity, 0);
          const result = validateCoupon(parsed.couponCode, subtotal);
          if (result.ok) {
            setCoupon(result.coupon);
            setCouponState({ status: "applied", coupon: result.coupon, discount: result.discount });
          }
        }
      }
    } catch {
      // A corrupted cart should never block the shop — start clean instead.
    }
    setHydrating(false);
  }, []);

  useEffect(() => {
    if (hydrating) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, couponCode: coupon?.code }));
    } catch {
      // Storage can be full or blocked (private mode); the cart still works in memory.
    }
  }, [items, coupon, hydrating]);

  const addItem = useCallback((item: CartItem) => {
    setItems((list) => {
      const existing = list.find((i) => i.variantId === item.variantId);
      if (!existing) return [...list, item];
      // Adding an already-present variant tops it up, capped at its stock.
      return list.map((i) =>
        i.variantId === item.variantId
          ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxQuantity) }
          : i
      );
    });
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((list) =>
      list.map((i) => (i.variantId === variantId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxQuantity)) } : i))
    );
  }, []);

  const removeItem = useCallback((variantId: string) => {
    let removed: CartItem | undefined;
    setItems((list) => {
      removed = list.find((i) => i.variantId === variantId);
      return list.filter((i) => i.variantId !== variantId);
    });
    return removed;
  }, []);

  const restoreItem = useCallback((item: CartItem) => {
    setItems((list) => (list.some((i) => i.variantId === item.variantId) ? list : [...list, item]));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setCoupon(null);
    setCouponState({ status: "idle" });
  }, []);

  const subtotal = useMemo(() => items.reduce((n, i) => n + i.price * i.quantity, 0), [items]);

  const applyCoupon = useCallback((code: string) => {
    setCouponState({ status: "loading" });
    // Mock latency so the loading state is real and reachable.
    setTimeout(() => {
      const result = validateCoupon(code, subtotal);
      if (result.ok) {
        setCoupon(result.coupon);
        setCouponState({ status: "applied", coupon: result.coupon, discount: result.discount });
      } else {
        setCoupon(null);
        setCouponState({ status: "invalid", message: result.message });
      }
    }, 600);
  }, [subtotal]);

  const removeCoupon = useCallback(() => {
    setCoupon(null);
    setCouponState({ status: "idle" });
  }, []);

  // A coupon with a minimum can stop qualifying when the cart shrinks.
  useEffect(() => {
    if (!coupon) return;
    const result = validateCoupon(coupon.code, subtotal);
    if (!result.ok) {
      setCoupon(null);
      setCouponState({ status: "invalid", message: result.message });
    } else if (couponState.status === "applied" && couponState.discount !== result.discount) {
      setCouponState({ status: "applied", coupon: result.coupon, discount: result.discount });
    }
  }, [subtotal, coupon, couponState]);

  const totals = useMemo(
    () => calculateTotals(items, { coupon, shippingMethodId }),
    [items, coupon, shippingMethodId]
  );

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: itemCount(items),
    totals,
    coupon,
    couponState,
    shippingMethodId,
    hydrating,
    miniCartOpen,
    setMiniCartOpen,
    addItem,
    updateQuantity,
    removeItem,
    restoreItem,
    clear,
    applyCoupon,
    removeCoupon,
    setShippingMethodId,
  }), [items, totals, coupon, couponState, shippingMethodId, hydrating, miniCartOpen,
       addItem, updateQuantity, removeItem, restoreItem, clear, applyCoupon, removeCoupon]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
