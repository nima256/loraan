"use client";

import { AdminPageHeader } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";
import { shippingMethods } from "@/data/commerce";
import { siteConfig } from "@/lib/site-config";
import { formatAmount } from "@/lib/format";

/**
 * Store settings.
 *
 * Every field here maps to a value in `src/lib/site-config.ts` today. Once the
 * backend exists these become real settings rows; the screen is the visual
 * target for that work.
 */
export default function AdminSettingsPage() {
  return (
    <>
      <AdminPageHeader
        title="تنظیمات فروشگاه"
        description="اطلاعات پایه، ارسال و روش‌های پرداخت."
        actions={<Button>ذخیره تغییرات</Button>}
      />

      <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
        <div className="space-y-4">
          <Card className="space-y-4">
            <h2 className="font-bold text-fg">اطلاعات فروشگاه</h2>
            <Input label="نام فروشگاه" defaultValue={siteConfig.name} />
            <Input label="نام رسمی (روی فاکتور)" defaultValue={siteConfig.legalName} />
            <Input label="دامنه" dir="ltr" className="[&_input]:text-start" defaultValue={siteConfig.domain} />
            <Input label="تلفن پشتیبانی" dir="ltr" className="[&_input]:text-start" defaultValue={siteConfig.contact.supportPhone} />
            <Input label="ایمیل پشتیبانی" dir="ltr" className="[&_input]:text-start" defaultValue={siteConfig.contact.email} />
            <Input label="ساعات پاسخ‌گویی" defaultValue={siteConfig.contact.workingHours} />
          </Card>

          <Card className="space-y-4">
            <h2 className="font-bold text-fg">قوانین فروش</h2>
            <Input
              label="سقف ارسال رایگان (تومان)"
              dir="ltr"
              className="[&_input]:text-start"
              defaultValue={siteConfig.commerce.freeShippingThreshold}
              hint={`در حال حاضر: ${formatAmount(siteConfig.commerce.freeShippingThreshold)} تومان`}
            />
            <Input
              label="مهلت مرجوعی (روز)"
              dir="ltr"
              className="[&_input]:text-start"
              defaultValue={siteConfig.commerce.returnWindowDays}
            />
            <Input
              label="تعداد محصول در هر صفحه"
              dir="ltr"
              className="[&_input]:text-start"
              defaultValue={siteConfig.commerce.productsPerPage}
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card padded={false}>
            <h2 className="border-b border-border p-4 font-bold text-fg">شیوه‌های ارسال</h2>
            <ul className="divide-y divide-border">
              {shippingMethods.map((method) => (
                <li key={method.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-fg">
                      {method.name}
                      {method.available
                        ? <Badge tone="success" size="sm">فعال</Badge>
                        : <Badge tone="neutral" size="sm">غیرفعال</Badge>}
                      {method.paidOnDelivery && <Badge tone="warning" size="sm">پس‌کرایه</Badge>}
                    </p>
                    <p className="tnum mt-1 text-xs text-fg-muted">
                      {method.estimate}
                      {!method.paidOnDelivery && `، ${formatAmount(method.cost)} تومان`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">ویرایش</Button>
                </li>
              ))}
            </ul>
          </Card>

          <Card padded={false}>
            <h2 className="border-b border-border p-4 font-bold text-fg">روش‌های پرداخت</h2>
            <ul className="divide-y divide-border">
              {[
                { name: "درگاه پرداخت اینترنتی", status: "active", note: "کارت‌های عضو شتاب" },
                { name: "اسنپ‌پی (خرید اعتباری)", status: "planned", note: "در انتظار اتصال به سرویس" },
                { name: "ترب‌پی (خرید اعتباری)", status: "planned", note: "در انتظار اتصال به سرویس" },
              ].map((gateway) => (
                <li key={gateway.name} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-fg">
                      {gateway.name}
                      {gateway.status === "active"
                        ? <Badge tone="success" size="sm">فعال</Badge>
                        : <Badge tone="neutral" size="sm">به‌زودی</Badge>}
                    </p>
                    <p className="mt-1 text-xs text-fg-muted">{gateway.note}</p>
                  </div>
                  <Button variant="ghost" size="sm" disabled={gateway.status !== "active"}>تنظیمات</Button>
                </li>
              ))}
            </ul>
          </Card>

          <Alert tone="warning" title="مقادیر موقت">
            اطلاعات تماس و نشانی شعبه‌ها در فایل <code dir="ltr" className="rounded bg-surface px-1">src/lib/site-config.ts</code>{" "}
            به‌صورت موقت ثبت شده‌اند و باید با مقادیر واقعی جایگزین شوند.
          </Alert>
        </div>
      </div>
    </>
  );
}
