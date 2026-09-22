"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { Card, DataTable } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Navigation";
import { EmptyState } from "@/components/ui/Feedback";
import { PriceInline } from "@/components/ui/Price";
import { OrderStatusBadge } from "@/components/account/OrderStatus";
import { mockOrders } from "@/data/account";
import { formatDate, toLatinDigits, toPersianDigits } from "@/lib/format";
import type { AnyOrderStatus, Order } from "@/types";

const TABS: { value: string; label: string; statuses: AnyOrderStatus[] | null }[] = [
  { value: "all", label: "همه", statuses: null },
  { value: "awaiting_payment", label: "در انتظار پرداخت", statuses: ["awaiting_payment"] },
  { value: "preparing", label: "آماده‌سازی", statuses: ["preparing"] },
  { value: "packaged", label: "بسته‌بندی‌شده", statuses: ["packaged"] },
  { value: "shipped", label: "ارسال‌شده", statuses: ["shipped"] },
  { value: "delivered", label: "تحویل‌شده", statuses: ["delivered"] },
  { value: "problem", label: "لغو و مرجوعی", statuses: ["cancelled", "returned", "refunded", "payment_failed", "expired"] },
];

export default function AdminOrdersPage() {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const statuses = TABS.find((t) => t.value === tab)?.statuses;
    const term = toLatinDigits(query).trim().toLowerCase();
    return mockOrders.filter((order) => {
      if (statuses && !statuses.includes(order.status)) return false;
      if (!term) return true;
      return (
        order.number.toLowerCase().includes(term) ||
        `${order.address.recipientFirstName} ${order.address.recipientLastName}`.includes(query.trim()) ||
        order.address.phone.includes(term)
      );
    });
  }, [tab, query]);

  return (
    <>
      <AdminPageHeader
        title="سفارش‌ها"
        description={`${toPersianDigits(mockOrders.length)} سفارش ثبت‌شده`}
      />

      <Card className="mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-fg-subtle" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="شماره سفارش، نام مشتری یا شماره موبایل"
            aria-label="جست‌وجوی سفارش"
            className="h-11 w-full rounded-md border border-border-strong bg-surface px-3 ps-10 text-sm
                       focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
      </Card>

      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={TABS.map((t) => ({
          value: t.value,
          label: t.label,
          count: t.statuses ? mockOrders.filter((o) => t.statuses!.includes(o.status)).length : mockOrders.length,
        }))}
      />

      <DataTable<Order>
        rows={filtered}
        getKey={(order) => order.id}
        empty={
          <EmptyState
            title="سفارشی در این وضعیت نیست"
            description="فیلتر یا عبارت جست‌وجو را تغییر دهید."
            action={<Button variant="secondary" onClick={() => { setTab("all"); setQuery(""); }}>نمایش همه سفارش‌ها</Button>}
          />
        }
        renderCard={(order) => (
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/admin/orders/${order.number}`} className="tnum break-token font-medium text-fg hover:text-primary dark:hover:text-[color:var(--primary-soft-fg)]" dir="ltr">
                  {order.number}
                </Link>
                <p className="mt-1 text-xs text-fg-muted">
                  {order.address.recipientFirstName} {order.address.recipientLastName}
                </p>
                <p className="mt-0.5 text-xs text-fg-subtle">{formatDate(order.createdAt)}</p>
              </div>
              <OrderStatusBadge status={order.status} size="sm" />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
              <span className="tnum text-xs text-fg-muted">{toPersianDigits(order.items.length)} کالا</span>
              <PriceInline value={order.totals.payableOnline} className="text-sm" />
            </div>
          </Card>
        )}
        columns={[
          {
            key: "number",
            header: "شماره سفارش",
            cell: (order) => (
              <Link href={`/admin/orders/${order.number}`} className="tnum break-token font-medium text-fg hover:text-primary dark:hover:text-[color:var(--primary-soft-fg)]" dir="ltr">
                {order.number}
              </Link>
            ),
          },
          {
            key: "customer",
            header: "مشتری",
            cell: (order) => (
              <div>
                <p className="text-fg">{order.address.recipientFirstName} {order.address.recipientLastName}</p>
                <p className="tnum text-xs text-fg-subtle" dir="ltr">{order.address.phone}</p>
              </div>
            ),
          },
          { key: "city", header: "شهر", hideOn: "md", cell: (order) => <span className="text-fg-muted">{order.address.city}</span> },
          { key: "date", header: "تاریخ", cell: (order) => <span className="text-fg-muted">{formatDate(order.createdAt)}</span> },
          { key: "items", header: "اقلام", align: "center", cell: (order) => <span className="tnum text-fg-muted">{toPersianDigits(order.items.length)}</span> },
          { key: "total", header: "مبلغ", align: "end", cell: (order) => <PriceInline value={order.totals.payableOnline} className="text-sm" /> },
          { key: "status", header: "وضعیت", cell: (order) => <OrderStatusBadge status={order.status} size="sm" /> },
          {
            key: "actions",
            header: "عملیات",
            align: "end",
            cell: (order) => (
              <Link
                href={`/admin/orders/${order.number}`}
                className="inline-flex h-9 items-center rounded-md border border-border px-2.5 text-xs text-fg-muted hover:text-fg"
              >
                مدیریت
              </Link>
            ),
          },
        ]}
      />
    </>
  );
}
