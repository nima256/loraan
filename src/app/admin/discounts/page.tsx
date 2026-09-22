"use client";

import { useState } from "react";
import { Copy, Pencil, Plus, TicketPercent, TrendingUp } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { Card, DataTable } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Overlay";
import { Input, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";
import { RankedBarChart, StatTile } from "@/components/admin/Charts";
import { useToast } from "@/components/ui/Toast";
import { PriceInline } from "@/components/ui/Price";
import { coupons } from "@/data/commerce";
import { couponPerformance } from "@/data/analytics";
import { formatCompactPrice, formatDate, toPersianDigits } from "@/lib/format";

type Row = (typeof coupons)[number];

const CAMPAIGNS = [
  { id: "cmp-1", name: "حراج پاییز", status: "active", products: 32, discount: "تا ۴۵٪", starts: "2025-09-01", ends: "2025-10-15" },
  { id: "cmp-2", name: "کمپین یزد", status: "active", products: 18, discount: "۲۰٪ با کد", starts: "2025-09-10", ends: "2025-09-30" },
  { id: "cmp-3", name: "بازگشت به مدرسه", status: "ended", products: 24, discount: "تا ۳۰٪", starts: "2025-08-01", ends: "2025-09-05" },
  { id: "cmp-4", name: "حراج زمستان", status: "scheduled", products: 0, discount: "—", starts: "2025-12-01", ends: "2026-01-15" },
];

const CAMPAIGN_STATUS = {
  active: { label: "فعال", tone: "success" as const },
  scheduled: { label: "زمان‌بندی‌شده", tone: "info" as const },
  ended: { label: "پایان‌یافته", tone: "neutral" as const },
};

export default function AdminDiscountsPage() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);

  const totalDiscount = couponPerformance.reduce((n, c) => n + c.discountGiven, 0);
  const totalRevenue = couponPerformance.reduce((n, c) => n + c.revenue, 0);
  const totalUses = couponPerformance.reduce((n, c) => n + c.uses, 0);

  return (
    <>
      <AdminPageHeader
        title="تخفیف‌ها و کمپین‌ها"
        description="کدهای تخفیف، کمپین‌های فعال و عملکرد آن‌ها."
        actions={<Button onClick={() => setCreateOpen(true)} icon={<Plus className="size-4" aria-hidden />}>کد تخفیف جدید</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatTile label="دفعات استفاده" value={toPersianDigits(totalUses)} icon={<TicketPercent className="size-4" aria-hidden />} />
        <StatTile label="فروش حاصل از کدها" value={formatCompactPrice(totalRevenue)} icon={<TrendingUp className="size-4" aria-hidden />} />
        <StatTile label="تخفیف پرداخت‌شده" value={formatCompactPrice(totalDiscount)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr] xl:items-start">
        <div className="space-y-4">
          <div>
            <h2 className="mb-3 font-bold text-fg">کدهای تخفیف</h2>
            <DataTable<Row>
              rows={coupons}
              getKey={(row) => row.code}
              renderCard={(row) => {
                const expired = !!row.expiresAt && new Date(row.expiresAt) < new Date();
                return (
                  <Card>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold tracking-wider text-fg" dir="ltr">{row.code}</p>
                        <p className="mt-1 text-xs leading-6 text-fg-muted">{row.description}</p>
                      </div>
                      <Badge tone={expired ? "neutral" : "success"} size="sm">
                        {expired ? "منقضی" : "فعال"}
                      </Badge>
                    </div>
                  </Card>
                );
              }}
              columns={[
                {
                  key: "code",
                  header: "کد",
                  cell: (row) => (
                    <span className="inline-flex items-center gap-2">
                      <span className="font-bold tracking-wider text-fg" dir="ltr">{row.code}</span>
                      <button
                        type="button"
                        aria-label={`کپی کد ${row.code}`}
                        onClick={() => {
                          navigator.clipboard?.writeText(row.code);
                          toast({ tone: "success", title: "کد کپی شد" });
                        }}
                        className="grid size-8 place-items-center rounded-md text-fg-subtle hover:bg-surface-2 hover:text-fg"
                      >
                        <Copy className="size-3.5" aria-hidden />
                      </button>
                    </span>
                  ),
                },
                {
                  key: "type",
                  header: "نوع",
                  cell: (row) => (
                    <span className="tnum text-fg-muted">
                      {row.type === "percent" ? `${toPersianDigits(row.value)}٪` : `${row.value.toLocaleString("fa-IR")} تومان`}
                    </span>
                  ),
                },
                {
                  key: "limits",
                  header: "شرایط",
                  hideOn: "md",
                  cell: (row) => (
                    <span className="tnum text-xs text-fg-muted">
                      {row.maxDiscount && <span className="block">سقف {row.maxDiscount.toLocaleString("fa-IR")}</span>}
                      {row.minSubtotal && <span className="block">حداقل خرید {row.minSubtotal.toLocaleString("fa-IR")}</span>}
                      {!row.maxDiscount && !row.minSubtotal && "بدون محدودیت"}
                    </span>
                  ),
                },
                {
                  key: "uses",
                  header: "استفاده",
                  align: "center",
                  cell: (row) => {
                    const perf = couponPerformance.find((c) => c.code === row.code);
                    return <span className="tnum text-fg">{perf ? toPersianDigits(perf.uses) : "—"}</span>;
                  },
                },
                {
                  key: "status",
                  header: "وضعیت",
                  cell: (row) => {
                    const expired = !!row.expiresAt && new Date(row.expiresAt) < new Date();
                    return <Badge tone={expired ? "neutral" : "success"} size="sm">{expired ? "منقضی" : "فعال"}</Badge>;
                  },
                },
                {
                  key: "actions",
                  header: "عملیات",
                  align: "end",
                  cell: () => (
                    <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs text-fg-muted hover:text-fg">
                      <Pencil className="size-3.5" aria-hidden />
                      ویرایش
                    </button>
                  ),
                },
              ]}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-bold text-fg">کمپین‌ها</h2>
              <Button variant="secondary" size="sm" icon={<Plus className="size-4" aria-hidden />}>کمپین جدید</Button>
            </div>
            <ul className="space-y-3">
              {CAMPAIGNS.map((campaign) => {
                const status = CAMPAIGN_STATUS[campaign.status as keyof typeof CAMPAIGN_STATUS];
                return (
                  <li key={campaign.id}>
                    <Card className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 font-medium text-fg">
                          {campaign.name}
                          <Badge tone={status.tone} size="sm">{status.label}</Badge>
                        </p>
                        <p className="tnum mt-1 text-xs text-fg-muted">
                          {formatDate(campaign.starts)} تا {formatDate(campaign.ends)}،{" "}
                          {toPersianDigits(campaign.products)} محصول، {campaign.discount}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" icon={<Pencil className="size-4" aria-hidden />}>ویرایش</Button>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <Card>
          <h2 className="mb-1 font-bold text-fg">عملکرد کدهای تخفیف</h2>
          <p className="mb-4 text-xs text-fg-muted">فروش ایجادشده توسط هر کد (تومان)</p>
          <RankedBarChart
            points={couponPerformance.map((c) => ({ label: c.code, value: c.revenue }))}
            title="فروش ایجادشده به تفکیک کد تخفیف"
            format="compactPrice"
            showShare
          />
          <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            {couponPerformance.map((c) => (
              <div key={c.code} className="flex items-center justify-between gap-3">
                <span className="font-medium text-fg" dir="ltr">{c.code}</span>
                <span className="tnum text-xs text-fg-muted">
                  {toPersianDigits(c.uses)} استفاده، تخفیف <PriceInline value={c.discountGiven} muted className="text-xs" />
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="کد تخفیف جدید"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>انصراف</Button>
            <Button onClick={() => { setCreateOpen(false); toast({ tone: "success", title: "کد تخفیف ساخته شد (نمایشی)" }); }}>
              ساخت کد
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="کد" required dir="ltr" className="[&_input]:text-start [&_input]:uppercase" placeholder="LORAN10" hint="فقط حروف انگلیسی و عدد." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="نوع تخفیف"
              options={[{ value: "percent", label: "درصدی" }, { value: "fixed", label: "مبلغ ثابت" }]}
            />
            <Input label="مقدار" required inputMode="numeric" dir="ltr" className="[&_input]:text-start" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="سقف تخفیف (تومان)" inputMode="numeric" dir="ltr" className="[&_input]:text-start" hint="فقط برای تخفیف درصدی." />
            <Input label="حداقل مبلغ سفارش (تومان)" inputMode="numeric" dir="ltr" className="[&_input]:text-start" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="تاریخ شروع" type="date" dir="ltr" className="[&_input]:text-start" />
            <Input label="تاریخ پایان" type="date" dir="ltr" className="[&_input]:text-start" />
          </div>
          <Alert tone="info">
            پس از اتصال بک‌اند، محدودیت تعداد استفاده و اختصاص کد به دسته‌بندی یا مشتری خاص هم
            در همین فرم اضافه می‌شود.
          </Alert>
        </div>
      </Modal>
    </>
  );
}
