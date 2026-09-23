"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileText, Printer, Truck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";
import { PriceInline } from "@/components/ui/Price";
import { OrderStatusBadge, OrderTimeline } from "@/components/account/OrderStatus";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { useToast } from "@/components/ui/Toast";
import { getOrderByNumber } from "@/data/account";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/orders";
import { formatDateTime, formatPhone, toPersianDigits } from "@/lib/format";
import type { AnyOrderStatus } from "@/types";

const EXCEPTION_STATUSES: AnyOrderStatus[] = ["cancelled", "returned", "refunded", "payment_failed", "expired"];

export default function AdminOrderDetailPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = use(params);
  const order = getOrderByNumber(decodeURIComponent(number));
  const { toast } = useToast();
  const [status, setStatus] = useState<AnyOrderStatus | null>(order?.status ?? null);
  const [tracking, setTracking] = useState(order?.trackingCode ?? "");

  if (!order || !status) notFound();

  const updateStatus = (next: AnyOrderStatus) => {
    setStatus(next);
    toast({
      tone: "success",
      title: "وضعیت سفارش تغییر کرد",
      description: `وضعیت جدید: ${ORDER_STATUS_LABELS[next]}. (در این نسخه نمایشی پیامکی ارسال نمی‌شود.)`,
    });
  };

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex min-h-9 items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowRight className="size-4" aria-hidden />
        بازگشت به سفارش‌ها
      </Link>

      <AdminPageHeader
        title={order.number}
        description={`ثبت شده در ${formatDateTime(order.createdAt)}`}
        actions={
          <>
            <Link
              href={`/account/orders/${order.number}/invoice`}
              className="inline-flex h-12 items-center gap-2 rounded-md border border-border-strong bg-surface px-5 text-sm font-medium text-fg hover:bg-surface-2"
            >
              <FileText className="size-4" aria-hidden />
              فاکتور
            </Link>
            <Button variant="secondary" icon={<Printer className="size-4" aria-hidden />}>
              چاپ برگه بسته‌بندی
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr] xl:items-start">
        <div className="space-y-4">
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-fg">وضعیت سفارش</h2>
              <OrderStatusBadge status={status} />
            </div>

            <OrderTimeline status={status} timeline={order.timeline} />

            <div className="mt-6 border-t border-border pt-4">
              <h3 className="mb-3 text-sm font-medium text-fg">تغییر وضعیت</h3>
              <div className="flex flex-wrap gap-2">
                {ORDER_STATUS_FLOW.map((flowStatus) => (
                  <Button
                    key={flowStatus}
                    size="sm"
                    variant={flowStatus === status ? "primary" : "secondary"}
                    onClick={() => updateStatus(flowStatus)}
                  >
                    {ORDER_STATUS_LABELS[flowStatus]}
                  </Button>
                ))}
              </div>

              <h3 className="mb-2 mt-5 text-sm font-medium text-fg">وضعیت‌های استثنا</h3>
              <div className="flex flex-wrap gap-2">
                {EXCEPTION_STATUSES.map((exception) => (
                  <Button
                    key={exception}
                    size="sm"
                    variant="ghost"
                    onClick={() => updateStatus(exception)}
                    className={exception === status ? "bg-danger-soft text-danger" : "text-fg-muted hover:text-danger"}
                  >
                    {ORDER_STATUS_LABELS[exception]}
                  </Button>
                ))}
              </div>

              <Alert tone="info" className="mt-4">
                با تغییر وضعیت، در نسخه نهایی یک پیامک اطلاع‌رسانی برای مشتری ارسال خواهد شد.
              </Alert>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-2 font-bold text-fg">
              <Truck className="size-4 text-fg-subtle" aria-hidden />
              اطلاعات ارسال
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="شیوه ارسال"
                defaultValue={order.shippingMethod}
                options={[
                  { value: "tipax", label: "تیپاکس (پس‌کرایه)" },
                  { value: "post", label: "پست پیشتاز (غیرفعال)", disabled: true },
                  { value: "courier", label: "پیک فوری (غیرفعال)", disabled: true },
                ]}
              />
              <Input
                label="کد رهگیری"
                dir="ltr"
                className="[&_input]:text-start"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="TPX…"
                hint="پس از تحویل به تیپاکس وارد کنید."
              />
            </div>
          </Card>

          <Card padded={false}>
            <h2 className="border-b border-border p-4 font-bold text-fg">
              اقلام سفارش ({toPersianDigits(order.items.length)} مورد)
            </h2>
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.variantId} className="flex gap-3 p-4">
                  <Link href={`/admin/products/${item.slug}`} className="relative size-16 shrink-0 overflow-hidden rounded-md bg-surface-inset">
                    <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${item.slug}`} className="line-clamp-2 text-sm font-medium text-fg hover:text-primary dark:hover:text-[color:var(--primary-soft-fg)]">
                      {item.name}
                    </Link>
                    <p className="tnum mt-1 flex flex-wrap gap-x-3 text-xs text-fg-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden className="size-3 rounded-full border border-border" style={{ background: item.colorHex }} />
                        {item.colorName}
                      </span>
                      <span>سایز {toPersianDigits(item.size)}</span>
                      <span>تعداد {toPersianDigits(item.quantity)}</span>
                    </p>
                  </div>
                  <PriceInline value={item.unitPrice * item.quantity} className="shrink-0 text-sm" />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 font-bold text-fg">مشتری</h2>
            <p className="font-medium text-fg">
              {order.address.recipientFirstName} {order.address.recipientLastName}
            </p>
            <p className="tnum mt-1 text-sm text-fg-muted" dir="ltr">{formatPhone(order.address.phone)}</p>
            <Link href="/admin/customers" className="mt-3 inline-flex min-h-9 items-center text-sm text-primary hover:underline dark:text-[color:var(--primary-soft-fg)]">
              مشاهده پروفایل مشتری
            </Link>
          </Card>

          <Card>
            <h2 className="mb-3 font-bold text-fg">آدرس تحویل</h2>
            <p className="text-sm leading-7 text-fg-muted">
              {order.address.province}، {order.address.city}، {order.address.addressLine}
            </p>
            <p className="tnum mt-1 text-sm text-fg-muted">
              کد پستی: {toPersianDigits(order.address.postalCode)}
            </p>
          </Card>

          <Card>
            <h2 className="mb-3 font-bold text-fg">پرداخت</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-fg-muted">روش</dt>
                <dd className="text-fg">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</dd>
              </div>
              {order.paymentRef && (
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-muted">کد پیگیری</dt>
                  <dd className="tnum break-token text-fg" dir="ltr">{order.paymentRef}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-fg-muted">وضعیت</dt>
                <dd>
                  {order.paidAt
                    ? <Badge tone="success" size="sm">پرداخت شده</Badge>
                    : <Badge tone="warning" size="sm">پرداخت نشده</Badge>}
                </dd>
              </div>
            </dl>
          </Card>

          <OrderSummary
            totals={order.totals}
            couponCode={order.couponCode}
            shippingMethodId={order.shippingMethod}
            compact
          />
        </div>
      </div>
    </>
  );
}
