"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Package, RotateCcw, Truck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { PriceInline } from "@/components/ui/Price";
import { OrderStatusBadge } from "@/components/account/OrderStatus";
import { mockOrders, mockReturnRequests } from "@/data/account";
import { useAuth } from "@/store/AuthProvider";
import { formatDate, toPersianDigits } from "@/lib/format";

export default function AccountDashboard() {
  const { user, addresses } = useAuth();
  const recent = mockOrders.slice(0, 3);
  const openOrders = mockOrders.filter((o) => ["preparing", "packaged", "shipped"].includes(o.status));

  const stats = [
    { label: "سفارش‌های من", value: toPersianDigits(mockOrders.length), href: "/account/orders", icon: Package },
    { label: "در حال پیگیری", value: toPersianDigits(openOrders.length), href: "/account/orders?status=open", icon: Truck },
    { label: "آدرس‌های ذخیره‌شده", value: toPersianDigits(addresses.length), href: "/account/addresses", icon: MapPin },
    { label: "مرجوعی و تعویض", value: toPersianDigits(mockReturnRequests.length), href: "/account/returns", icon: RotateCcw },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-fg sm:text-2xl">
          سلام {user?.firstName ?? "دوست عزیز"} 👋
        </h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          از اینجا سفارش‌ها، آدرس‌ها و اطلاعات حسابتان را مدیریت کنید.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong"
          >
            <Icon className="size-5 text-fg-subtle" aria-hidden />
            <p className="tnum mt-3 text-2xl font-bold text-fg">{value}</p>
            <p className="mt-0.5 text-xs text-fg-muted">{label}</p>
          </Link>
        ))}
      </div>

      {openOrders.length > 0 && (
        <Card padded={false}>
          <div className="flex items-center justify-between gap-3 border-b border-border p-4">
            <h2 className="font-bold text-fg">سفارش در حال پیگیری</h2>
            <Link href="/account/orders" className="inline-flex min-h-9 items-center gap-1 text-sm text-primary hover:underline dark:text-[color:var(--primary-soft-fg)]">
              همه سفارش‌ها
              <ArrowLeft className="size-3.5" aria-hidden />
            </Link>
          </div>
          <div className="p-4">
            <Link
              href={`/account/orders/${openOrders[0].number}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-2 p-4 hover:bg-surface-3"
            >
              <div className="min-w-0">
                <p className="tnum break-token text-sm font-semibold text-fg" dir="ltr">{openOrders[0].number}</p>
                <p className="mt-1 text-xs text-fg-muted">
                  ثبت شده در {formatDate(openOrders[0].createdAt)}، {toPersianDigits(openOrders[0].items.length)} کالا
                </p>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={openOrders[0].status} />
                <ArrowLeft className="size-4 text-fg-subtle" aria-hidden />
              </div>
            </Link>
          </div>
        </Card>
      )}

      <Card padded={false}>
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <h2 className="font-bold text-fg">آخرین سفارش‌ها</h2>
          <Link href="/account/orders" className="inline-flex min-h-9 items-center gap-1 text-sm text-primary hover:underline dark:text-[color:var(--primary-soft-fg)]">
            مشاهده همه
            <ArrowLeft className="size-3.5" aria-hidden />
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            className="border-0"
            icon={<Package className="size-7" aria-hidden />}
            title="هنوز سفارشی ثبت نکرده‌اید"
            description="اولین خریدتان را از فروشگاه لوران شروع کنید."
            action={<ButtonLink href="/shop">رفتن به فروشگاه</ButtonLink>}
          />
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((order) => (
              <li key={order.id}>
                <Link href={`/account/orders/${order.number}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-surface-2">
                  <div className="min-w-0">
                    <p className="tnum break-token text-sm font-medium text-fg" dir="ltr">{order.number}</p>
                    <p className="mt-1 text-xs text-fg-muted">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <PriceInline value={order.totals.payableOnline} className="text-sm" />
                    <OrderStatusBadge status={order.status} size="sm" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
