"use client";

import Image from "next/image";
import Link from "next/link";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Feedback";
import { categories } from "@/data/catalog";
import { getCategoryCounts } from "@/server/services/catalog";
import { allSizes } from "@/data/commerce";
import { toPersianDigits } from "@/lib/format";

const CATEGORY_IMAGES: Record<string, string> = {
  sneaker: "/products/sneaker-burgundy-side.svg",
  running: "/products/runner-navy-side.svg",
  casual: "/products/sneaker-cream-side.svg",
  classic: "/products/loafer-brown-side.svg",
  boots: "/products/boot-tan-side.svg",
  loafer: "/products/loafer-black-side.svg",
  sandal: "/products/sandal-tan-side.svg",
  kids: "/products/runner-skyblue-side.svg",
};

const COLOR_LIBRARY = [
  { name: "مشکی", hex: "#1A1A1C" }, { name: "سفید", hex: "#F2F1EE" },
  { name: "کرم", hex: "#E7DCC9" }, { name: "زرشکی", hex: "#9A1C21" },
  { name: "سرمه‌ای", hex: "#1F2E4A" }, { name: "طوسی", hex: "#7E7B78" },
  { name: "عسلی", hex: "#9C6B3E" }, { name: "زیتونی", hex: "#54603C" },
  { name: "آبی روشن", hex: "#6FA3C9" }, { name: "قهوه‌ای", hex: "#4E3527" },
  { name: "صورتی کهنه", hex: "#C99A94" }, { name: "نقره‌ای", hex: "#B9B7B2" },
];

export default function AdminCategoriesPage() {
  const counts = getCategoryCounts();

  return (
    <>
      <AdminPageHeader
        title="دسته‌بندی‌ها، سایزها و رنگ‌ها"
        description="ساختار پایه‌ای که محصولات بر اساس آن دسته‌بندی و تنوع‌بندی می‌شوند."
        actions={<Button icon={<Plus className="size-4" aria-hidden />}>افزودن دسته‌بندی</Button>}
      />

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr] xl:items-start">
        <Card padded={false}>
          <div className="border-b border-border p-4">
            <h2 className="font-bold text-fg">دسته‌بندی‌ها</h2>
            <p className="mt-1 text-xs text-fg-muted">ترتیب نمایش در منو و صفحه اصلی با جابه‌جایی ردیف‌ها تغییر می‌کند.</p>
          </div>

          <ul className="divide-y divide-border">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center gap-3 p-4">
                <button
                  type="button"
                  aria-label={`جابه‌جایی ترتیب ${category.name}`}
                  className="grid size-9 shrink-0 cursor-grab place-items-center rounded-md text-fg-subtle hover:bg-surface-2"
                >
                  <GripVertical className="size-4" aria-hidden />
                </button>

                <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-surface-inset">
                  <Image src={CATEGORY_IMAGES[category.slug]} alt="" fill sizes="48px" className="object-cover" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-fg">
                    {category.name}
                    {category.featured && <Badge tone="brand" size="sm">نمایش در صفحه اصلی</Badge>}
                  </p>
                  <p className="tnum mt-0.5 text-xs text-fg-subtle" dir="ltr">/{category.slug}</p>
                </div>

                <span className="tnum shrink-0 text-xs text-fg-muted">
                  {toPersianDigits(counts.get(category.id) ?? 0)} محصول
                </span>

                <div className="flex shrink-0 gap-1">
                  <Link
                    href={`/category/${category.slug}`}
                    aria-label={`مشاهده ${category.name} در فروشگاه`}
                    className="grid size-9 place-items-center rounded-md text-fg-subtle hover:bg-surface-2 hover:text-fg"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Link>
                  <button
                    type="button"
                    aria-label={`حذف ${category.name}`}
                    disabled={(counts.get(category.id) ?? 0) > 0}
                    title={(counts.get(category.id) ?? 0) > 0 ? "دسته‌بندی دارای محصول حذف نمی‌شود" : "حذف"}
                    className="grid size-9 place-items-center rounded-md text-fg-subtle hover:bg-surface-2 hover:text-danger disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-fg-subtle"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-bold text-fg">سایزهای تعریف‌شده</h2>
              <Button variant="ghost" size="sm" icon={<Plus className="size-4" aria-hidden />}>افزودن</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allSizes.map((size) => (
                <span
                  key={size}
                  className="tnum grid h-10 min-w-10 place-items-center rounded-md border border-border bg-surface px-2 text-sm text-fg"
                >
                  {toPersianDigits(size)}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs leading-6 text-fg-muted">
              سایز ۲۸ تا ۳۵ برای محصولات بچگانه و ۳۶ تا ۴۶ برای بزرگسال استفاده می‌شود.
            </p>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-bold text-fg">کتابخانه رنگ</h2>
              <Button variant="ghost" size="sm" icon={<Plus className="size-4" aria-hidden />}>افزودن</Button>
            </div>
            <ul className="grid grid-cols-2 gap-2">
              {COLOR_LIBRARY.map((color) => (
                <li key={color.hex} className="flex items-center gap-2 rounded-md border border-border p-2">
                  <span aria-hidden className="size-6 shrink-0 rounded-md border border-border" style={{ background: color.hex }} />
                  <span className="min-w-0 flex-1 truncate text-sm text-fg">{color.name}</span>
                  <span className="tnum shrink-0 text-[0.625rem] text-fg-subtle" dir="ltr">{color.hex}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Alert tone="info">
            رنگ‌ها و سایزها در سطح فروشگاه تعریف می‌شوند؛ ترکیب آن‌ها برای هر محصول، تنوع‌های
            آن محصول را می‌سازد و موجودی روی همان تنوع ثبت می‌شود.
          </Alert>
        </div>
      </div>
    </>
  );
}
