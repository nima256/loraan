"use client";

import { use, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Navigation";
import { Alert } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { brands, categories, productBySlug } from "@/data/catalog";
import { formatAmount, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Product editor.
 *
 * The inventory tab is a colour × size matrix — the shape the data actually has.
 * Each cell is one variant's stock, so "Black/41 in stock, Black/42 sold out,
 * White/42 available" is a normal thing to express rather than a special case.
 */
export default function AdminProductEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const product = productBySlug.get(decodeURIComponent(slug));
  const { toast } = useToast();
  const [tab, setTab] = useState("general");

  // Local, unsaved edit state — there is no backend to persist to.
  const [stock, setStock] = useState<Record<string, number>>(() =>
    product ? Object.fromEntries(product.variants.map((v) => [v.id, v.stock])) : {}
  );
  const [dirty, setDirty] = useState(false);

  const sizes = useMemo(
    () => (product ? [...new Set(product.variants.map((v) => v.size))].sort((a, b) => a - b) : []),
    [product]
  );

  if (!product) notFound();

  const variantAt = (colorId: string, size: number) =>
    product.variants.find((v) => v.colorId === colorId && v.size === size);

  const totalStock = Object.values(stock).reduce((n, v) => n + v, 0);
  const soldOut = Object.values(stock).filter((v) => v === 0).length;

  const save = () => {
    setDirty(false);
    toast({
      tone: "success",
      title: "تغییرات ذخیره شد",
      description: "در این نسخه نمایشی، تغییرات فقط در مرورگر نگهداری می‌شود.",
    });
  };

  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex min-h-9 items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowRight className="size-4" aria-hidden />
        بازگشت به فهرست محصولات
      </Link>

      <AdminPageHeader
        title={product.name}
        description={`شناسه: ${product.id}، ${toPersianDigits(product.colors.length)} رنگ، ${toPersianDigits(product.variants.length)} تنوع`}
        actions={
          <>
            <Link
              href={`/product/${product.slug}`}
              className="inline-flex h-12 items-center rounded-md border border-border-strong bg-surface px-5 text-sm font-medium text-fg hover:bg-surface-2"
            >
              مشاهده در فروشگاه
            </Link>
            <Button onClick={save} disabled={!dirty} icon={<Save className="size-4" aria-hidden />}>
              ذخیره تغییرات
            </Button>
          </>
        }
      />

      {dirty && (
        <Alert tone="warning" role="status" className="mb-4">
          تغییرات ذخیره‌نشده دارید.
        </Alert>
      )}

      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "general", label: "اطلاعات کلی" },
          { value: "media", label: "تصاویر", count: product.colors.reduce((n, c) => n + c.images.length, 0) },
          { value: "inventory", label: "تنوع و موجودی", count: product.variants.length },
          { value: "pricing", label: "قیمت و تخفیف" },
        ]}
      />

      {tab === "general" && (
        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr] xl:items-start">
          <Card className="space-y-4">
            <Input label="نام محصول" defaultValue={product.name} onChange={() => setDirty(true)} />
            <Input label="نامک (slug)" dir="ltr" className="[&_input]:text-start" defaultValue={product.slug}
              onChange={() => setDirty(true)} hint="در آدرس صفحه محصول استفاده می‌شود." />
            <Input label="زیرعنوان" defaultValue={product.subtitle} onChange={() => setDirty(true)} />
            <Textarea label="توضیحات" rows={6} defaultValue={product.description} onChange={() => setDirty(true)} />
          </Card>

          <div className="space-y-4">
            <Card className="space-y-4">
              <Select
                label="دسته‌بندی"
                defaultValue={product.categoryIds[0]}
                onChange={() => setDirty(true)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
              <Select
                label="کالکشن"
                defaultValue={product.brandId}
                onChange={() => setDirty(true)}
                options={brands.map((b) => ({ value: b.id, label: b.name }))}
              />
              <Select
                label="جنسیت"
                defaultValue={product.gender}
                onChange={() => setDirty(true)}
                options={[
                  { value: "men", label: "مردانه" },
                  { value: "women", label: "زنانه" },
                  { value: "unisex", label: "یونیسکس" },
                  { value: "kids", label: "بچگانه" },
                ]}
              />
            </Card>

            <Card>
              <h2 className="mb-3 font-bold text-fg">برچسب‌ها</h2>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "new", label: "جدید" },
                  { id: "bestseller", label: "پرفروش" },
                  { id: "sale", label: "حراج" },
                  { id: "limited", label: "تعداد محدود" },
                ].map((tag) => {
                  const active = product.tags.includes(tag.id as never);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setDirty(true)}
                      aria-pressed={active}
                      className={cn(
                        "h-10 rounded-full border px-4 text-sm transition-colors",
                        active ? "border-primary bg-primary text-primary-fg" : "border-border text-fg-muted hover:text-fg"
                      )}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "media" && (
        <div className="space-y-4">
          {product.colors.map((color) => (
            <Card key={color.id}>
              <h2 className="mb-3 flex items-center gap-2 font-bold text-fg">
                <span aria-hidden className="size-5 rounded-full border border-border" style={{ background: color.hex }} />
                تصاویر رنگ {color.name}
              </h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {color.images.map((src, i) => (
                  <figure key={src} className="group relative">
                    <span className="relative block aspect-square overflow-hidden rounded-md border border-border bg-surface-inset">
                      <Image src={src} alt={`${color.name} — تصویر ${toPersianDigits(i + 1)}`} fill sizes="160px" className="object-cover" />
                    </span>
                    <figcaption className="mt-1 text-center text-[0.6875rem] text-fg-subtle">
                      {i === 0 ? "تصویر اصلی" : `تصویر ${toPersianDigits(i + 1)}`}
                    </figcaption>
                    <button
                      type="button"
                      aria-label={`حذف تصویر ${toPersianDigits(i + 1)} رنگ ${color.name}`}
                      onClick={() => setDirty(true)}
                      className="absolute end-1 top-1 grid size-8 place-items-center rounded-md bg-surface/90 text-fg-muted opacity-0 transition-opacity hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </figure>
                ))}
                <button
                  type="button"
                  onClick={() => setDirty(true)}
                  className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong text-fg-subtle hover:border-primary hover:text-primary"
                >
                  <ImagePlus className="size-6" aria-hidden />
                  <span className="text-xs">افزودن تصویر</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "inventory" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <p className="text-xs text-fg-muted">موجودی کل</p>
              <p className="tnum mt-1.5 text-xl font-bold text-fg">{toPersianDigits(totalStock)} عدد</p>
            </Card>
            <Card>
              <p className="text-xs text-fg-muted">تنوع‌های ناموجود</p>
              <p className="tnum mt-1.5 text-xl font-bold text-danger">{toPersianDigits(soldOut)}</p>
            </Card>
            <Card>
              <p className="text-xs text-fg-muted">ارزش موجودی</p>
              <p className="tnum mt-1.5 text-xl font-bold text-fg">{formatAmount(totalStock * product.price)}</p>
            </Card>
          </div>

          <Card padded={false}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div>
                <h2 className="font-bold text-fg">موجودی به تفکیک رنگ و سایز</h2>
                <p className="mt-1 text-xs text-fg-muted">
                  هر خانه، موجودی یک تنوع (SKU) است. عدد صفر یعنی آن ترکیب ناموجود است.
                </p>
              </div>
              <Button variant="secondary" size="sm" icon={<Plus className="size-4" aria-hidden />} onClick={() => setDirty(true)}>
                افزودن رنگ
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] text-sm">
                <caption className="sr-only">جدول موجودی به تفکیک رنگ و سایز</caption>
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th scope="col" className="sticky start-0 bg-surface-2 px-4 py-3 text-start font-medium text-fg-muted">
                      رنگ
                    </th>
                    {sizes.map((size) => (
                      <th key={size} scope="col" className="tnum px-2 py-3 text-center font-medium text-fg-muted">
                        {toPersianDigits(size)}
                      </th>
                    ))}
                    <th scope="col" className="px-4 py-3 text-center font-medium text-fg-muted">جمع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {product.colors.map((color) => {
                    const rowTotal = sizes.reduce((n, size) => {
                      const v = variantAt(color.id, size);
                      return n + (v ? stock[v.id] ?? 0 : 0);
                    }, 0);
                    return (
                      <tr key={color.id}>
                        <th scope="row" className="sticky start-0 bg-surface px-4 py-2 text-start font-medium">
                          <span className="flex items-center gap-2">
                            <span aria-hidden className="size-4 shrink-0 rounded-full border border-border" style={{ background: color.hex }} />
                            <span className="whitespace-nowrap text-fg">{color.name}</span>
                          </span>
                        </th>
                        {sizes.map((size) => {
                          const variant = variantAt(color.id, size);
                          if (!variant) {
                            return (
                              <td key={size} className="px-2 py-2 text-center text-fg-subtle" title="این ترکیب تعریف نشده است">
                                —
                              </td>
                            );
                          }
                          const value = stock[variant.id] ?? 0;
                          return (
                            <td key={size} className="px-1 py-2">
                              <input
                                type="number"
                                min={0}
                                value={value}
                                aria-label={`موجودی رنگ ${color.name} سایز ${toPersianDigits(size)} — کد ${variant.sku}`}
                                onChange={(e) => {
                                  setStock((s) => ({ ...s, [variant.id]: Math.max(0, Number(e.target.value) || 0) }));
                                  setDirty(true);
                                }}
                                className={cn(
                                  "tnum h-10 w-14 rounded-md border bg-surface text-center text-sm",
                                  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25",
                                  value === 0
                                    ? "border-danger/40 bg-danger-soft text-danger"
                                    : value <= 2
                                      ? "border-warning/40 bg-warning-soft text-fg"
                                      : "border-border text-fg"
                                )}
                              />
                            </td>
                          );
                        })}
                        <td className="tnum px-4 py-2 text-center font-medium text-fg">{toPersianDigits(rowTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-border p-4 text-xs text-fg-muted">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="size-3 rounded border border-danger/40 bg-danger-soft" />
                ناموجود
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="size-3 rounded border border-warning/40 bg-warning-soft" />
                موجودی کم (۱ تا ۲)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="size-3 rounded border border-border bg-surface" />
                موجود
              </span>
            </div>
          </Card>
        </div>
      )}

      {tab === "pricing" && (
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr] xl:items-start">
          <Card className="space-y-4">
            <Input
              label="قیمت فروش (تومان)"
              inputMode="numeric"
              dir="ltr"
              className="[&_input]:text-start"
              defaultValue={product.price}
              onChange={() => setDirty(true)}
            />
            <Input
              label="قیمت پیش از تخفیف (تومان)"
              inputMode="numeric"
              dir="ltr"
              className="[&_input]:text-start"
              defaultValue={product.compareAtPrice ?? ""}
              onChange={() => setDirty(true)}
              hint="خالی بگذارید تا محصول بدون تخفیف نمایش داده شود."
            />
            <div className="rounded-md bg-surface-2 p-3 text-sm">
              <p className="text-fg-muted">پیش‌نمایش در فروشگاه:</p>
              <p className="tnum mt-2 flex items-center gap-2">
                <span className="font-bold text-fg">{formatAmount(product.price)} تومان</span>
                {product.compareAtPrice && (
                  <>
                    <span className="text-fg-subtle line-through">{formatAmount(product.compareAtPrice)}</span>
                    <Badge tone="sale" size="sm" className="tnum">
                      {toPersianDigits(Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100))}٪
                    </Badge>
                  </>
                )}
              </p>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 font-bold text-fg">قیمت‌گذاری در سطح تنوع</h2>
            <p className="text-sm leading-7 text-fg-muted">
              در صورت نیاز می‌توانید برای یک تنوع خاص (مثلاً سایزهای بزرگ) قیمت متفاوتی تعیین
              کنید. اگر قیمتی وارد نشود، قیمت اصلی محصول اعمال می‌شود.
            </p>
            <Button variant="secondary" className="mt-4" icon={<Plus className="size-4" aria-hidden />} onClick={() => setDirty(true)}>
              افزودن قیمت اختصاصی
            </Button>
          </Card>
        </div>
      )}
    </>
  );
}
