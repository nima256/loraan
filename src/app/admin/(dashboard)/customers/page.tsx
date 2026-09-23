"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { Card, DataTable } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Feedback";
import { StatTile } from "@/components/admin/Charts";
import { PriceInline } from "@/components/ui/Price";
import { mockCustomers } from "@/data/analytics";
import { formatCompactPrice, formatDate, formatPhone, toLatinDigits, toPersianDigits } from "@/lib/format";

type Row = (typeof mockCustomers)[number];

export default function AdminCustomersPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = toLatinDigits(query).trim().toLowerCase();
    if (!term) return mockCustomers;
    return mockCustomers.filter(
      (c) => c.name.includes(query.trim()) || c.phone.includes(term) || c.city.includes(query.trim())
    );
  }, [query]);

  const totalSpent = mockCustomers.reduce((n, c) => n + c.spent, 0);
  const repeat = mockCustomers.filter((c) => c.orders > 1).length;

  return (
    <>
      <AdminPageHeader
        title="مشتریان"
        description={`${toPersianDigits(mockCustomers.length)} مشتری ثبت‌شده`}
        actions={<Button variant="secondary" icon={<UserPlus className="size-4" aria-hidden />}>افزودن دستی</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatTile label="کل مشتریان" value={toPersianDigits(mockCustomers.length)} icon={<Users className="size-4" aria-hidden />} />
        <StatTile label="مشتریان تکرارشونده" value={toPersianDigits(repeat)} hint={`${toPersianDigits(Math.round((repeat / mockCustomers.length) * 100))}٪ از کل`} />
        <StatTile label="مجموع خرید" value={formatCompactPrice(totalSpent)} />
      </div>

      <Card className="mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-fg-subtle" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="نام، شماره موبایل یا شهر"
            aria-label="جست‌وجوی مشتری"
            className="h-11 w-full rounded-md border border-border-strong bg-surface px-3 ps-10 text-sm
                       focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
      </Card>

      <DataTable<Row>
        rows={filtered}
        getKey={(row) => row.id}
        empty={
          <EmptyState
            title="مشتری‌ای پیدا نشد"
            description="عبارت جست‌وجو را تغییر دهید."
            action={<Button variant="secondary" onClick={() => setQuery("")}>نمایش همه</Button>}
          />
        }
        renderCard={(row) => (
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-fg">{row.name}</p>
                <p className="tnum mt-1 text-xs text-fg-muted" dir="ltr">{formatPhone(row.phone)}</p>
                <p className="mt-0.5 text-xs text-fg-subtle">{row.city}</p>
              </div>
              {row.orders > 1 && <Badge tone="brand" size="sm">مشتری وفادار</Badge>}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
              <span className="tnum text-fg-muted">{toPersianDigits(row.orders)} سفارش</span>
              <PriceInline value={row.spent} className="text-sm" />
            </div>
          </Card>
        )}
        columns={[
          {
            key: "name",
            header: "مشتری",
            cell: (row) => (
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-3 text-sm font-bold text-fg-muted">
                  {row.name.charAt(0)}
                </span>
                <span className="font-medium text-fg">{row.name}</span>
              </div>
            ),
          },
          { key: "phone", header: "موبایل", cell: (row) => <span className="tnum text-fg-muted" dir="ltr">{formatPhone(row.phone)}</span> },
          { key: "city", header: "شهر", cell: (row) => <span className="text-fg-muted">{row.city}</span> },
          { key: "orders", header: "سفارش‌ها", align: "center", cell: (row) => <span className="tnum text-fg">{toPersianDigits(row.orders)}</span> },
          { key: "spent", header: "مجموع خرید", align: "end", cell: (row) => <PriceInline value={row.spent} className="text-sm" /> },
          { key: "joined", header: "عضویت", hideOn: "md", cell: (row) => <span className="text-fg-muted">{formatDate(row.joinedAt)}</span> },
          {
            key: "tag",
            header: "وضعیت",
            cell: (row) =>
              row.orders > 3 ? <Badge tone="brand" size="sm">مشتری وفادار</Badge>
              : row.orders > 1 ? <Badge tone="info" size="sm">تکرارشونده</Badge>
              : <Badge tone="neutral" size="sm">جدید</Badge>,
          },
        ]}
      />
    </>
  );
}
