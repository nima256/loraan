"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Printer } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { api, errorMessage } from "@/lib/api/client";
import { PAYMENT_METHOD_LABELS } from "@/lib/orders";
import { formatAmount, formatDate, formatPhone, toPersianDigits } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";
import type { Order } from "@/types";

/**
 * Printable invoice.
 *
 * Laid out on a white sheet with hairline rules so it prints legibly in mono;
 * everything that is screen-only (nav, buttons) carries `no-print`.
 *
 * Deliberately a simple customer invoice, not a legal/tax document: no VAT, no
 * business identifiers. It renders entirely from the order's own snapshot, so
 * an invoice printed today for a two-year-old order shows what was actually
 * bought and paid, not today's catalogue.
 */
type InvoiceOrder = Order & {
  shippingMethodName: string;
  shippingPaidOnDelivery: boolean;
  carrier?: string;
  paymentStatus: string;
  customerName: string;
  customerPhone: string;
};

export default function InvoicePage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = use(params);
  const [order, setOrder] = useState<InvoiceOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** The print dialog is blocked until the data is really on the page. */
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ order: InvoiceOrder }>(`/api/v1/account/orders/${encodeURIComponent(decodeURIComponent(number))}`)
      .then((data) => {
        if (!cancelled) setOrder(data.order);
      })
      .catch((caught) => {
        if (!cancelled) setError(errorMessage(caught));
      });
    return () => {
      cancelled = true;
    };
  }, [number]);

  const print = () => {
    setPrinting(true);
    // Let the pending label paint before the synchronous print dialog blocks
    // the main thread, otherwise the button looks unresponsive.
    requestAnimationFrame(() => {
      window.print();
      setPrinting(false);
    });
  };

  if (error) {
    return (
      <EmptyState
        title="فاکتور در دسترس نیست"
        description={error}
        action={<ButtonLink href="/account/orders">بازگشت به سفارش‌ها</ButtonLink>}
      />
    );
  }

  if (!order) {
    return (
      <div className="space-y-4" role="status" aria-label="در حال آماده‌سازی فاکتور">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[40rem] w-full rounded-lg" />
      </div>
    );
  }

  const method = {
    name: order.shippingMethodName,
    cost: order.totals.shippingCost,
    paidOnDelivery: order.shippingPaidOnDelivery,
  };
  const itemsTotal = order.totals.subtotal + order.totals.productDiscount;

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href={`/account/orders/${order.number}`} className="inline-flex min-h-9 items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
          <ArrowRight className="size-4" aria-hidden />
          بازگشت به سفارش
        </Link>
        <Button
          onClick={print}
          loading={printing}
          disabled={printing}
          icon={<Printer className="size-4" aria-hidden />}
        >
          {printing ? "در حال آماده‌سازی…" : "چاپ فاکتور"}
        </Button>
      </div>

      <article className="print-sheet rounded-lg border border-border bg-white p-6 text-[#211d1a] shadow-e1 sm:p-8 dark:bg-white">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#9A1C21] pb-5">
          <div className="flex items-center gap-3">
            <span className="grid size-14 place-items-center rounded-[0.9rem] bg-[#9A1C21] p-2">
              <Image src="/brand/loran-mark-cream.png" alt="" width={44} height={44} className="h-full w-full object-contain" />
            </span>
            <div>
              <Image src="/brand/loran-wordmark-burgundy.png" alt="لوران" width={110} height={28} className="h-6 w-auto" />
              <p className="mt-1 text-xs text-[#5f564e]">{siteConfig.legalName}</p>
              <p className="text-xs text-[#5f564e]">{siteConfig.domain}</p>
            </div>
          </div>
          <div className="text-end">
            <h1 className="text-lg font-bold">فاکتور فروش</h1>
            <p className="tnum mt-1 text-sm" dir="ltr">{order.number}</p>
            <p className="mt-0.5 text-xs text-[#5f564e]">تاریخ صدور: {formatDate(order.createdAt)}</p>
          </div>
        </header>

        {/* Parties */}
        <section className="grid gap-5 border-b border-[#e4dace] py-5 sm:grid-cols-2">
          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#5f564e]">فروشنده</h2>
            <p className="text-sm font-medium">{siteConfig.legalName}</p>
            <p className="mt-1 text-sm leading-6 text-[#5f564e]">{siteConfig.stores[0].address}</p>
            <p className="tnum text-sm text-[#5f564e]" dir="ltr">{siteConfig.contact.supportPhone}</p>
          </div>
          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#5f564e]">خریدار</h2>
            <p className="text-sm font-medium">
              {order.address.recipientFirstName} {order.address.recipientLastName}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#5f564e]">
              {order.address.province}، {order.address.city}، {order.address.addressLine}
              {order.address.plaque && `، پلاک ${order.address.plaque}`}
              {order.address.unit && `، واحد ${order.address.unit}`}
            </p>
            <p className="tnum text-sm text-[#5f564e]">کد پستی: {toPersianDigits(order.address.postalCode)}</p>
            <p className="tnum text-sm text-[#5f564e]" dir="ltr">{formatPhone(order.address.phone)}</p>
          </div>
        </section>

        {/* Line items */}
        <section className="py-5">
          <table className="w-full text-sm">
            <caption className="sr-only">اقلام فاکتور</caption>
            <thead>
              <tr className="border-b border-[#211d1a] text-xs">
                <th scope="col" className="w-8 py-2 text-start font-bold">#</th>
                <th scope="col" className="py-2 text-start font-bold">شرح کالا</th>
                <th scope="col" className="py-2 text-start font-bold">رنگ / سایز</th>
                <th scope="col" className="py-2 text-center font-bold">تعداد</th>
                <th scope="col" className="py-2 text-end font-bold">قیمت واحد</th>
                <th scope="col" className="py-2 text-end font-bold">مبلغ کل</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={`${item.variantId}-${i}`} className="border-b border-[#e4dace] align-top">
                  <td className="tnum py-3">{toPersianDigits(i + 1)}</td>
                  <td className="py-3 pe-2">{item.name}</td>
                  <td className="tnum py-3 pe-2 text-[#5f564e]">
                    {item.colorName} / {toPersianDigits(item.size)}
                  </td>
                  <td className="tnum py-3 text-center">{toPersianDigits(item.quantity)}</td>
                  <td className="tnum py-3 text-end">{formatAmount(item.unitPrice)}</td>
                  <td className="tnum py-3 text-end font-medium">{formatAmount(item.unitPrice * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-[#5f564e]">همه مبالغ به تومان است.</p>
        </section>

        {/* Totals */}
        <section className="flex justify-end border-t border-[#e4dace] pt-5">
          <dl className="w-full max-w-sm space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#5f564e]">جمع کالاها</dt>
              <dd className="tnum">{formatAmount(itemsTotal)}</dd>
            </div>
            {order.totals.productDiscount > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-[#5f564e]">تخفیف محصولات</dt>
                <dd className="tnum">− {formatAmount(order.totals.productDiscount)}</dd>
              </div>
            )}
            {order.totals.couponDiscount > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-[#5f564e]">
                  تخفیف کد {order.couponCode && <span dir="ltr">({order.couponCode})</span>}
                </dt>
                <dd className="tnum">− {formatAmount(order.totals.couponDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-[#5f564e]">هزینه ارسال — {method.name}</dt>
              <dd className="tnum">{method.paidOnDelivery ? "پس‌کرایه" : formatAmount(method.cost)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t-2 border-[#211d1a] pt-2 text-base font-bold">
              <dt>مبلغ پرداخت‌شده</dt>
              <dd className="tnum">{formatAmount(order.totals.payableOnline)} تومان</dd>
            </div>
          </dl>
        </section>

        {/* Payment + notes */}
        <section className="mt-5 grid gap-4 border-t border-[#e4dace] pt-5 text-xs sm:grid-cols-2">
          <div>
            <h3 className="mb-1.5 font-bold">اطلاعات پرداخت</h3>
            <p className="text-[#5f564e]">روش: {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
            {order.paymentRef && <p className="tnum text-[#5f564e]" dir="ltr">کد پیگیری: {order.paymentRef}</p>}
            {order.paidAt && <p className="text-[#5f564e]">تاریخ: {formatDate(order.paidAt)}</p>}
          </div>
          <div>
            <h3 className="mb-1.5 font-bold">اطلاعات ارسال</h3>
            <p className="text-[#5f564e]">{method.name}</p>
            {order.trackingCode && <p className="tnum text-[#5f564e]" dir="ltr">کد رهگیری: {order.trackingCode}</p>}
            {method.paidOnDelivery && (
              <p className="mt-1 font-medium">
                کرایه ارسال هنگام تحویل، نزد مأمور {order.carrier ?? method.name} پرداخت می‌شود.
              </p>
            )}
          </div>
        </section>

        <footer className="mt-6 border-t border-[#e4dace] pt-4 text-center text-[0.6875rem] leading-6 text-[#5f564e]">
          <p>
            این فاکتور به‌صورت الکترونیکی صادر شده و نیازی به مهر و امضا ندارد.
            {" "}شرایط مرجوعی تا {toPersianDigits(siteConfig.commerce.returnWindowDays)} روز پس از تحویل معتبر است.
          </p>
          <p className="mt-1">
            {siteConfig.domain} — پشتیبانی: <span className="tnum" dir="ltr">{siteConfig.contact.supportPhone}</span>
          </p>
        </footer>
      </article>
    </div>
  );
}
