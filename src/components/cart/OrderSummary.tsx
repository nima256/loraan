import Link from "next/link";
import { Info } from "lucide-react";
import { PriceInline } from "@/components/ui/Price";
import { shippingMethods } from "@/data/commerce";
import { siteConfig } from "@/lib/site-config";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderTotals, ShippingMethodId } from "@/types";

/**
 * The money breakdown, shared by the cart, the checkout and the order detail.
 *
 * The Tipax line is the important one: its cost is called out as *not* part of
 * the online payment, because a customer who thinks shipping is prepaid and is
 * then asked to pay the courier has been mis-sold.
 */
export function OrderSummary({
  totals, couponCode, shippingMethodId = "tipax", className, footer, compact,
}: {
  totals: OrderTotals;
  couponCode?: string;
  shippingMethodId?: ShippingMethodId;
  className?: string;
  footer?: React.ReactNode;
  compact?: boolean;
}) {
  const method = shippingMethods.find((m) => m.id === shippingMethodId) ?? shippingMethods[0];
  const remainingForFree = siteConfig.commerce.freeShippingThreshold - totals.subtotal;

  return (
    <div className={cn("rounded-lg border border-border bg-surface", className)}>
      <div className="p-4 sm:p-5">
        {!compact && <h2 className="mb-4 font-bold text-fg">خلاصه سفارش</h2>}

        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-fg-muted">قیمت کالاها</dt>
            <dd><PriceInline value={totals.subtotal + totals.productDiscount} muted /></dd>
          </div>

          {totals.productDiscount > 0 && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-fg-muted">تخفیف محصولات</dt>
              <dd className="tnum whitespace-nowrap font-medium text-success">
                − {formatAmount(totals.productDiscount)} <span className="text-xs font-normal">تومان</span>
              </dd>
            </div>
          )}

          {totals.couponDiscount > 0 && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-fg-muted">
                کد تخفیف{" "}
                {couponCode && <span dir="ltr" className="text-xs text-fg-subtle">({couponCode})</span>}
              </dt>
              <dd className="tnum whitespace-nowrap font-medium text-success">
                − {formatAmount(totals.couponDiscount)} <span className="text-xs font-normal">تومان</span>
              </dd>
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <dt className="text-fg-muted">
              هزینه ارسال
              <span className="block text-xs text-fg-subtle">{method.name}</span>
            </dt>
            <dd className="text-end">
              {method.paidOnDelivery ? (
                <span className="text-sm font-medium text-warning">پس‌کرایه</span>
              ) : (
                <PriceInline value={method.cost} />
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold text-fg">مبلغ قابل پرداخت آنلاین</span>
            <PriceInline value={totals.payableOnline} className="text-lg font-bold" />
          </div>

          {method.paidOnDelivery && (
            <p className="mt-3 flex gap-2 rounded-md bg-warning-soft p-3 text-xs leading-6 text-fg">
              <Info className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <span>
                هزینه ارسال در این مبلغ محاسبه <strong>نشده</strong> است. کرایه مرسوله را هنگام تحویل،
                نزد مأمور تیپاکس پرداخت می‌کنید.
              </span>
            </p>
          )}
        </div>

        {!compact && remainingForFree > 0 && totals.subtotal > 0 && (
          <div className="mt-4 rounded-md bg-surface-2 p-3">
            <p className="tnum text-xs leading-6 text-fg-muted">
              با <strong className="text-fg">{formatAmount(remainingForFree)} تومان</strong> خرید بیشتر،
              ارسال سفارش شما رایگان می‌شود.
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-[--dur-slow]"
                style={{ width: `${Math.min(100, (totals.subtotal / siteConfig.commerce.freeShippingThreshold) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {footer && <div className="border-t border-border p-4 sm:p-5">{footer}</div>}

      {!compact && (
        <p className="border-t border-border px-4 py-3 text-xs leading-6 text-fg-subtle sm:px-5">
          با ثبت سفارش،{" "}
          <Link href="/terms" className="text-primary hover:underline dark:text-[color:var(--primary-soft-fg)]">
            قوانین و مقررات لوران
          </Link>{" "}
          را می‌پذیرید.
        </p>
      )}
    </div>
  );
}
