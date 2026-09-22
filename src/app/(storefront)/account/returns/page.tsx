"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Overlay";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Select, Textarea } from "@/components/ui/Input";
import { PriceInline } from "@/components/ui/Price";
import { useToast } from "@/components/ui/Toast";
import { mockOrders, mockReturnRequests } from "@/data/account";
import { RETURN_STATUS_LABELS, RETURN_STATUS_TONE } from "@/lib/orders";
import { formatDate, toPersianDigits } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";
import type { ReturnRequest } from "@/types";

const TONE_TO_BADGE: Record<string, BadgeTone> = {
  neutral: "neutral", info: "info", success: "success", warning: "warning", danger: "danger",
};

const REASONS = [
  { value: "size", label: "سایز مناسب نبود" },
  { value: "defect", label: "کالا ایراد داشت" },
  { value: "wrong", label: "کالای اشتباه ارسال شد" },
  { value: "different", label: "با تصویر سایت تفاوت داشت" },
  { value: "other", label: "دلیل دیگر" },
];

function ReturnsView() {
  const params = useSearchParams();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(!!params.get("order"));
  const [requests, setRequests] = useState<ReturnRequest[]>(mockReturnRequests);

  const eligible = mockOrders.filter((o) => o.status === "delivered");

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-fg sm:text-2xl">مرجوعی و تعویض</h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            درخواست‌های ثبت‌شده و وضعیت رسیدگی به آن‌ها.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} icon={<Plus className="size-4" aria-hidden />} disabled={eligible.length === 0}>
          درخواست جدید
        </Button>
      </header>

      <Alert tone="info" title={`مهلت ${toPersianDigits(siteConfig.commerce.returnWindowDays)} روزه`}>
        تا {toPersianDigits(siteConfig.commerce.returnWindowDays)} روز پس از تحویل، در صورتی که کفش
        استفاده نشده و بسته‌بندی آن سالم باشد، امکان تعویض یا مرجوعی وجود دارد.{" "}
        <Link href="/returns" className="text-primary hover:underline dark:text-[color:var(--primary-soft-fg)]">
          شرایط کامل
        </Link>
      </Alert>

      {requests.length === 0 ? (
        <EmptyState
          icon={<RotateCcw className="size-7" aria-hidden />}
          title="درخواست مرجوعی ندارید"
          description="اگر یکی از خریدهایتان مناسب نبود، از اینجا درخواست تعویض یا مرجوعی ثبت کنید."
          action={eligible.length > 0 ? <Button onClick={() => setFormOpen(true)}>ثبت درخواست</Button> : <ButtonLink href="/shop">رفتن به فروشگاه</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {requests.map((request) => (
            <li key={request.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-fg">
                      {request.type === "return" ? "مرجوعی" : "تعویض"}
                      <span className="tnum break-token text-sm font-normal text-fg-muted" dir="ltr">
                        {request.orderNumber}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-fg-muted">ثبت شده در {formatDate(request.createdAt)}</p>
                  </div>
                  <Badge tone={TONE_TO_BADGE[RETURN_STATUS_TONE[request.status]]}>
                    {RETURN_STATUS_LABELS[request.status]}
                  </Badge>
                </div>

                <dl className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-fg-muted">دلیل</dt>
                    <dd className="text-end text-fg">{request.reason}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-fg-muted">کالاها</dt>
                    <dd className="tnum text-end text-fg">
                      {request.items.map((i) => `${i.name} (${i.colorName}، سایز ${toPersianDigits(i.size)})`).join("، ")}
                    </dd>
                  </div>
                  {request.refundAmount > 0 && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-fg-muted">مبلغ بازگشتی</dt>
                      <dd><PriceInline value={request.refundAmount} /></dd>
                    </div>
                  )}
                </dl>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ReturnRequestModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultOrder={params.get("order") ?? eligible[0]?.number}
        orders={eligible.map((o) => ({ number: o.number, label: `${o.number} — ${formatDate(o.createdAt)}` }))}
        onSubmit={(request) => {
          setRequests((list) => [request, ...list]);
          setFormOpen(false);
          toast({
            tone: "success",
            title: "درخواست شما ثبت شد",
            description: "کارشناس لوران طی یک روز کاری با شما تماس می‌گیرد.",
          });
        }}
      />
    </div>
  );
}

function ReturnRequestModal({
  open, onClose, orders, defaultOrder, onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  orders: { number: string; label: string }[];
  defaultOrder?: string;
  onSubmit: (request: ReturnRequest) => void;
}) {
  const [orderNumber, setOrderNumber] = useState(defaultOrder ?? orders[0]?.number ?? "");
  const [type, setType] = useState<"return" | "exchange">("exchange");
  const [reason, setReason] = useState("size");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ note?: string; orderNumber?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!orderNumber) next.orderNumber = "سفارش موردنظر را انتخاب کنید.";
    if (note.trim().length < 10) next.note = "توضیح کوتاهی درباره مشکل بنویسید (حداقل ۱۰ حرف).";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);

    const order = mockOrders.find((o) => o.number === orderNumber)!;
    onSubmit({
      id: `rt-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      status: "requested",
      reason: REASONS.find((r) => r.value === reason)?.label ?? "دلیل دیگر",
      items: order.items.map((i) => ({ name: i.name, colorName: i.colorName, size: i.size, quantity: i.quantity })),
      refundAmount: type === "return" ? order.totals.payableOnline : 0,
      type,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ثبت درخواست مرجوعی یا تعویض"
      description="پس از ثبت، کارشناس لوران برای هماهنگی جمع‌آوری مرسوله تماس می‌گیرد."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>انصراف</Button>
          <Button type="submit" form="return-form" loading={loading}>ثبت درخواست</Button>
        </div>
      }
    >
      <form id="return-form" onSubmit={submit} noValidate className="space-y-4">
        <Select
          label="سفارش موردنظر"
          required
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          error={errors.orderNumber}
          options={orders.map((o) => ({ value: o.number, label: o.label }))}
          placeholder={orders.length ? undefined : "سفارش تحویل‌شده‌ای ندارید"}
        />

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg">نوع درخواست</legend>
          <div className="grid grid-cols-2 gap-2">
            {([["exchange", "تعویض سایز"], ["return", "مرجوعی و بازگشت وجه"]] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                aria-pressed={type === value}
                className={[
                  "flex min-h-12 items-center justify-center rounded-md border px-3 text-sm transition-colors",
                  type === value
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-border bg-surface text-fg-muted hover:text-fg",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <Select
          label="دلیل"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          options={REASONS}
        />

        <Textarea
          label="توضیحات"
          required
          rows={4}
          value={note}
          onChange={(e) => { setNote(e.target.value); setErrors((s) => ({ ...s, note: undefined })); }}
          error={errors.note}
          hint="هرچه دقیق‌تر بنویسید، رسیدگی سریع‌تر انجام می‌شود."
          placeholder="مثلاً: سایز ۴۲ سفارش دادم ولی کمی تنگ است و سایز ۴۳ می‌خواهم."
        />

        <Alert tone="warning">
          کالا باید استفاده‌نشده و همراه جعبه و برچسب اصلی باشد. هزینه ارسال مرجوعی طبق شرایط
          درج‌شده در صفحه مرجوعی محاسبه می‌شود.
        </Alert>
      </form>
    </Modal>
  );
}

export default function ReturnsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-lg" />}>
      <ReturnsView />
    </Suspense>
  );
}
