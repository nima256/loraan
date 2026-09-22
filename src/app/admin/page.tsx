import Link from "next/link";
import { AlertTriangle, ArrowLeft, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { BarChart, RankedBarChart, StatTile, TrendChart } from "@/components/admin/Charts";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OrderStatusBadge } from "@/components/account/OrderStatus";
import { PriceInline } from "@/components/ui/Price";
import {
  bestSellers, lowStockVariants, ordersByDay, outOfStockCount, revenueByCategory,
  revenueByMonth, summary,
} from "@/data/analytics";
import { mockOrders } from "@/data/account";
import { formatCompactPrice, formatDate, formatPrice, toPersianDigits } from "@/lib/format";

export default function AdminDashboard() {
  const pendingOrders = mockOrders.filter((o) => ["awaiting_payment", "preparing", "packaged"].includes(o.status));

  return (
    <>
      <AdminPageHeader
        title="پیشخوان"
        description="نمای کلی فروش، سفارش‌ها و وضعیت انبار."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="درآمد این ماه"
          value={formatCompactPrice(summary.revenueThisMonth)}
          delta={{ value: summary.revenueDelta }}
          hint="نسبت به ماه گذشته"
          icon={<TrendingUp className="size-4" aria-hidden />}
        />
        <StatTile
          label="سفارش‌های این ماه"
          value={toPersianDigits(summary.ordersThisMonth)}
          delta={{ value: summary.ordersDelta }}
          hint="نسبت به ماه گذشته"
          icon={<ShoppingCart className="size-4" aria-hidden />}
        />
        <StatTile
          label="میانگین ارزش سفارش"
          value={formatCompactPrice(summary.averageOrderValue)}
          delta={{ value: summary.aovDelta }}
          hint="نسبت به ماه گذشته"
          icon={<Package className="size-4" aria-hidden />}
        />
        <StatTile
          label="مشتریان جدید"
          value={toPersianDigits(summary.newCustomers)}
          delta={{ value: summary.customersDelta }}
          hint="در ۳۰ روز گذشته"
          icon={<Users className="size-4" aria-hidden />}
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <h2 className="mb-1 font-bold text-fg">روند درآمد</h2>
          <p className="mb-4 text-xs text-fg-muted">مجموع فروش به تفکیک ماه (تومان)</p>
          <TrendChart points={revenueByMonth} title="روند درآمد ماهانه" />
        </Card>

        <Card>
          <h2 className="mb-1 font-bold text-fg">سفارش‌ها در هفته</h2>
          <p className="mb-4 text-xs text-fg-muted">تعداد سفارش ثبت‌شده به تفکیک روز</p>
          <BarChart points={ordersByDay} title="تعداد سفارش به تفکیک روز هفته" />
        </Card>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-1 font-bold text-fg">سهم دسته‌بندی‌ها از فروش</h2>
          <p className="mb-4 text-xs text-fg-muted">درآمد ۳۰ روز گذشته</p>
          <RankedBarChart
            points={revenueByCategory}
            title="سهم هر دسته‌بندی از درآمد"
            format="compactPrice"
            showShare
          />
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-fg">پرفروش‌ترین محصولات</h2>
              <p className="mt-1 text-xs text-fg-muted">بر اساس تعداد فروش</p>
            </div>
            <Link href="/admin/reports" className="inline-flex min-h-9 items-center gap-1 text-sm text-primary hover:underline dark:text-[color:var(--primary-soft-fg)]">
              گزارش کامل
              <ArrowLeft className="size-3.5" aria-hidden />
            </Link>
          </div>
          <RankedBarChart
            points={bestSellers.map((p) => ({ label: p.label, value: p.value }))}
            title="پرفروش‌ترین محصولات بر اساس تعداد"
            format="count"
          />
        </Card>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {/* Low stock — the thing an operator actually needs to act on. */}
        <Card padded={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <h2 className="flex items-center gap-2 font-bold text-fg">
              <AlertTriangle className="size-4 text-warning" aria-hidden />
              هشدار موجودی کم
            </h2>
            <Link href="/admin/inventory" className="inline-flex min-h-9 items-center gap-1 text-sm text-primary hover:underline dark:text-[color:var(--primary-soft-fg)]">
              مدیریت انبار
              <ArrowLeft className="size-3.5" aria-hidden />
            </Link>
          </div>

          <p className="border-b border-border bg-warning-soft px-4 py-2 text-xs text-fg">
            {toPersianDigits(lowStockVariants.length)} تنوع کالا کمتر از ۳ عدد موجودی دارند و{" "}
            {toPersianDigits(outOfStockCount)} تنوع کاملاً ناموجود است.
          </p>

          <ul className="divide-y divide-border">
            {lowStockVariants.slice(0, 6).map((variant) => (
              <li key={variant.sku} className="flex items-start gap-3 p-3">
                <span aria-hidden className="mt-1 size-4 shrink-0 rounded-full border border-border" style={{ background: variant.colorHex }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-fg">{variant.productName}</p>
                  <p className="tnum mt-0.5 flex flex-wrap gap-x-2 text-xs text-fg-subtle">
                    <span dir="ltr">{variant.sku}</span>
                    <span>{variant.colorName} / {toPersianDigits(variant.size)}</span>
                  </p>
                </div>
                <Badge tone={variant.stock <= 1 ? "danger" : "warning"} size="sm" className="tnum shrink-0">
                  {toPersianDigits(variant.stock)} عدد
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        {/* Orders needing attention */}
        <Card padded={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <h2 className="font-bold text-fg">سفارش‌های در انتظار اقدام</h2>
            <Link href="/admin/orders" className="inline-flex min-h-9 items-center gap-1 text-sm text-primary hover:underline dark:text-[color:var(--primary-soft-fg)]">
              همه سفارش‌ها
              <ArrowLeft className="size-3.5" aria-hidden />
            </Link>
          </div>

          <ul className="divide-y divide-border">
            {pendingOrders.map((order) => (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.number}`} className="flex flex-wrap items-center justify-between gap-3 p-3 hover:bg-surface-2">
                  <div className="min-w-0">
                    <p className="tnum break-token text-sm font-medium text-fg" dir="ltr">{order.number}</p>
                    <p className="mt-0.5 text-xs text-fg-subtle">
                      {order.address.recipientFirstName} {order.address.recipientLastName}، {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <PriceInline value={order.totals.payableOnline} className="text-sm" />
                    <OrderStatusBadge status={order.status} size="sm" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <p className="border-t border-border p-3 text-xs text-fg-subtle">
            ارزش کل سفارش‌های در انتظار:{" "}
            <span className="tnum font-medium text-fg">
              {formatPrice(pendingOrders.reduce((n, o) => n + o.totals.payableOnline, 0))}
            </span>
          </p>
        </Card>
      </div>
    </>
  );
}
