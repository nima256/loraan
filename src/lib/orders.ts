import type { AnyOrderStatus, OrderStatus } from "@/types";

/**
 * Order status vocabulary.
 *
 * The five primary statuses are fixed by the business and define the timeline
 * in order. Exception statuses sit outside the timeline: an order in one of them
 * renders a terminal banner instead of a progress step.
 */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "awaiting_payment",
  "preparing",
  "packaged",
  "shipped",
  "delivered",
];

export const ORDER_STATUS_LABELS: Record<AnyOrderStatus, string> = {
  awaiting_payment: "در انتظار پرداخت",
  preparing: "در حال آماده‌سازی",
  packaged: "بسته‌بندی شد",
  shipped: "ارسال شد",
  delivered: "تحویل داده شد",
  cancelled: "لغو شده",
  returned: "مرجوع شده",
  refunded: "وجه بازگردانده شد",
  payment_failed: "پرداخت ناموفق",
  expired: "منقضی شده",
};

/** Short customer-facing explanation shown under the status chip. */
export const ORDER_STATUS_HINTS: Record<AnyOrderStatus, string> = {
  awaiting_payment: "سفارش شما ثبت شده اما هنوز پرداخت نشده است.",
  preparing: "سفارش شما در انبار در حال آماده‌سازی است.",
  packaged: "سفارش بسته‌بندی شد و آماده تحویل به تیپاکس است.",
  shipped: "مرسوله تحویل تیپاکس شد و در مسیر رسیدن به شماست.",
  delivered: "سفارش با موفقیت تحویل داده شد.",
  cancelled: "این سفارش لغو شده است.",
  returned: "کالاهای این سفارش مرجوع شده‌اند.",
  refunded: "مبلغ این سفارش به حساب شما بازگردانده شد.",
  payment_failed: "پرداخت این سفارش ناموفق بود. می‌توانید دوباره تلاش کنید.",
  expired: "مهلت پرداخت این سفارش به پایان رسید و سفارش باطل شد.",
};

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export const ORDER_STATUS_TONE: Record<AnyOrderStatus, StatusTone> = {
  awaiting_payment: "warning",
  preparing: "info",
  packaged: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "neutral",
  returned: "neutral",
  refunded: "success",
  payment_failed: "danger",
  expired: "neutral",
};

export function isExceptionStatus(status: AnyOrderStatus): boolean {
  return !ORDER_STATUS_FLOW.includes(status as OrderStatus);
}

/** Index in the five-step timeline, or -1 for exception statuses. */
export function statusStep(status: AnyOrderStatus): number {
  return ORDER_STATUS_FLOW.indexOf(status as OrderStatus);
}

export const PAYMENT_METHOD_LABELS = {
  online: "پرداخت اینترنتی",
  snapppay: "اسنپ‌پی (اعتباری)",
  torobpay: "ترب‌پی (اعتباری)",
} as const;

export const RETURN_STATUS_LABELS = {
  requested: "ثبت شده",
  approved: "تأیید شده",
  in_transit: "در مسیر بازگشت",
  refunded: "بازپرداخت شد",
  rejected: "رد شده",
} as const;

export const RETURN_STATUS_TONE: Record<keyof typeof RETURN_STATUS_LABELS, StatusTone> = {
  requested: "warning",
  approved: "info",
  in_transit: "info",
  refunded: "success",
  rejected: "danger",
};
