"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, TrendingUp } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BarChart, RankedBarChart, StatTile, TrendChart } from "@/components/admin/Charts";
import {
  bestSellers, couponPerformance, inventoryValue, ordersByDay, outOfStockCount,
  revenueByCategory, revenueByMonth, summary, totalVariants,
} from "@/data/analytics";
import { formatCompactPrice, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: "30d", label: "۳۰ روز گذشته" },
  { value: "3m", label: "۳ ماه گذشته" },
  { value: "12m", label: "۱۲ ماه گذشته" },
];

export default function AdminReportsPage() {
  const [range, setRange] = useState("12m");

  // The mock data covers a year; shorter ranges slice the tail.
  const revenue = range === "30d" ? revenueByMonth.slice(-1) : range === "3m" ? revenueByMonth.slice(-3) : revenueByMonth;
  const totalRevenue = revenue.reduce((n, p) => n + p.value, 0);

  return (
    <>
      <AdminPageHeader
        title="گزارش‌ها"
        description="فروش، محصولات و عملکرد تخفیف‌ها."
        actions={<Button variant="secondary" icon={<Download className="size-4" aria-hidden />}>خروجی CSV</Button>}
      />

      {/* One filter row above the charts. */}
      <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="بازه زمانی گزارش">
        {RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRange(r.value)}
            aria-pressed={range === r.value}
            className={cn(
              "h-10 rounded-full border px-4 text-sm transition-colors",
              range === r.value
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-surface text-fg-muted hover:text-fg"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="درآمد بازه" value={formatCompactPrice(totalRevenue)} delta={{ value: summary.revenueDelta }} icon={<TrendingUp className="size-4" aria-hidden />} />
        <StatTile label="میانگین ارزش سفارش" value={formatCompactPrice(summary.averageOrderValue)} delta={{ value: summary.aovDelta }} />
        <StatTile label="تنوع‌های ناموجود" value={toPersianDigits(outOfStockCount)} hint={`از ${toPersianDigits(totalVariants)} تنوع`} delta={{ value: 4, positiveIsGood: false }} />
        <StatTile label="ارزش موجودی انبار" value={formatCompactPrice(inventoryValue)} />
      </div>

      <div className="mt-5 grid gap-4">
        <Card>
          <h2 className="mb-1 font-bold text-fg">روند درآمد</h2>
          <p className="mb-4 text-xs text-fg-muted">مجموع فروش به تفکیک ماه (تومان)</p>
          <TrendChart points={revenue} title="روند درآمد" height={220} />
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <h2 className="mb-1 font-bold text-fg">سفارش‌ها در هفته</h2>
            <p className="mb-4 text-xs text-fg-muted">تعداد سفارش به تفکیک روز</p>
            <BarChart points={ordersByDay} title="تعداد سفارش به تفکیک روز هفته" />
          </Card>

          <Card>
            <h2 className="mb-1 font-bold text-fg">فروش به تفکیک دسته‌بندی</h2>
            <p className="mb-4 text-xs text-fg-muted">سهم هر دسته از درآمد بازه</p>
            <RankedBarChart points={revenueByCategory} title="درآمد به تفکیک دسته‌بندی" format="compactPrice" showShare />
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card padded={false}>
            <h2 className="border-b border-border p-4 font-bold text-fg">پرفروش‌ترین محصولات</h2>
            <ul className="divide-y divide-border">
              {bestSellers.map((product, i) => (
                <li key={product.slug} className="flex items-center gap-3 p-3">
                  <span className="tnum grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-bold text-fg-muted">
                    {toPersianDigits(i + 1)}
                  </span>
                  <Link href={`/admin/products/${product.slug}`} className="min-w-0 flex-1 truncate text-sm text-fg hover:text-primary dark:hover:text-[color:var(--primary-soft-fg)]">
                    {product.label}
                  </Link>
                  <span className="tnum shrink-0 text-xs text-fg-muted">{toPersianDigits(product.value)} فروش</span>
                  <span className="tnum hidden shrink-0 text-xs font-medium text-fg sm:inline">
                    {formatCompactPrice(product.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="mb-1 font-bold text-fg">عملکرد کدهای تخفیف</h2>
            <p className="mb-4 text-xs text-fg-muted">فروش ایجادشده به ازای هر کد (تومان)</p>
            <RankedBarChart
              points={couponPerformance.map((c) => ({ label: c.code, value: c.revenue }))}
              title="فروش ایجادشده به تفکیک کد تخفیف"
              format="compactPrice"
            />
          </Card>
        </div>
      </div>
    </>
  );
}
