import { coupons } from "@/data/commerce";
import { shippingMethods } from "@/data/commerce";
import type { CartItem, Coupon, OrderTotals, ShippingMethodId } from "@/types";

/**
 * All cart money maths lives here so the cart page, the mini-cart, the checkout
 * summary and the invoice can never disagree about a number.
 */

export function lineTotal(item: CartItem): number {
  return item.price * item.quantity;
}

export function lineCompareTotal(item: CartItem): number {
  return (item.compareAtPrice ?? item.price) * item.quantity;
}

export function itemCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function findCoupon(code: string): Coupon | undefined {
  return coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
}

export type CouponValidation =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; message: string };

export function validateCoupon(code: string, subtotal: number): CouponValidation {
  const coupon = findCoupon(code);
  if (!coupon) return { ok: false, message: "کد تخفیف نامعتبر است. املای آن را بررسی کنید." };

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { ok: false, message: "اعتبار این کد تخفیف به پایان رسیده است." };
  }
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      message: `این کد برای سفارش‌های بالای ${coupon.minSubtotal.toLocaleString("fa-IR")} تومان فعال می‌شود.`,
    };
  }
  return { ok: true, coupon, discount: couponDiscount(coupon, subtotal) };
}

export function couponDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.type === "fixed") return Math.min(coupon.value, subtotal);
  const raw = Math.round((subtotal * coupon.value) / 100);
  return Math.min(raw, coupon.maxDiscount ?? raw, subtotal);
}

/**
 * `shippingCost` is reported separately and is **excluded** from `payableOnline`
 * whenever the courier collects it on delivery (Tipax today). `grandTotal` is
 * what the customer ends up spending in total, online plus at the door.
 */
export function calculateTotals(
  items: CartItem[],
  options: { coupon?: Coupon | null; shippingMethodId?: ShippingMethodId } = {}
): OrderTotals {
  const subtotal = items.reduce((n, i) => n + lineTotal(i), 0);
  const compareSubtotal = items.reduce((n, i) => n + lineCompareTotal(i), 0);
  const productDiscount = compareSubtotal - subtotal;

  const method =
    shippingMethods.find((m) => m.id === options.shippingMethodId) ?? shippingMethods[0];
  const shippingCost = method.cost;
  const couponDiscountValue = options.coupon ? couponDiscount(options.coupon, subtotal) : 0;

  const afterCoupon = Math.max(0, subtotal - couponDiscountValue);
  const payableOnline = method.paidOnDelivery ? afterCoupon : afterCoupon + shippingCost;

  return {
    subtotal,
    productDiscount,
    couponDiscount: couponDiscountValue,
    shippingCost,
    payableOnline,
    grandTotal: afterCoupon + shippingCost,
  };
}
