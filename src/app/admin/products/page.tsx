"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Filter, Pencil, Plus, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { Card, DataTable } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Feedback";
import { PriceInline } from "@/components/ui/Price";
import { products, categoryById, brandById } from "@/data/catalog";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

type Row = (typeof rows)[number];

const rows = products.map((product) => {
  const totalStock = product.variants.reduce((n, v) => n + v.stock, 0);
  const soldOutVariants = product.variants.filter((v) => v.stock === 0).length;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    image: product.colors[0].images[0],
    category: categoryById.get(product.categoryIds[0])?.name ?? "—",
    brand: brandById.get(product.brandId)?.name ?? "—",
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    colors: product.colors.length,
    variants: product.variants.length,
    soldOutVariants,
    totalStock,
    sold: product.soldCount,
  };
});

const STATUS_FILTERS = [
  { value: "all", label: "همه" },
  { value: "low", label: "موجودی کم" },
  { value: "out", label: "ناموجود" },
  { value: "sale", label: "تخفیف‌دار" },
];

export default function AdminProductsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const term = query.trim();
    return rows.filter((row) => {
      if (term && !row.name.includes(term) && !row.slug.includes(term)) return false;
      if (status === "low") return row.totalStock > 0 && row.totalStock <= 10;
      if (status === "out") return row.totalStock === 0;
      if (status === "sale") return !!row.compareAtPrice;
      return true;
    });
  }, [query, status]);

  const stockBadge = (row: Row) =>
    row.totalStock === 0 ? <Badge tone="danger" size="sm">ناموجود</Badge>
    : row.totalStock <= 10 ? <Badge tone="warning" size="sm" className="tnum">{toPersianDigits(row.totalStock)} عدد</Badge>
    : <Badge tone="success" size="sm" className="tnum">{toPersianDigits(row.totalStock)} عدد</Badge>;

  return (
    <>
      <AdminPageHeader
        title="محصولات"
        description={`${toPersianDigits(products.length)} محصول فعال در فروشگاه`}
        actions={
          <Button icon={<Plus className="size-4" aria-hidden />}>افزودن محصول</Button>
        }
      />

      {/* Filters in one row above the table. */}
      <Card className="mb-4" padded>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-fg-subtle" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جست‌وجوی نام یا شناسه محصول"
              aria-label="جست‌وجوی محصول"
              className="h-11 w-full rounded-md border border-border-strong bg-surface px-3 ps-10 text-sm
                         focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <div className="flex items-center gap-1.5" role="group" aria-label="فیلتر وضعیت">
            <Filter className="size-4 shrink-0 text-fg-subtle" aria-hidden />
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatus(f.value)}
                aria-pressed={status === f.value}
                className={cn(
                  "h-10 rounded-full border px-3 text-sm transition-colors",
                  status === f.value
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-border bg-surface text-fg-muted hover:text-fg"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <p className="tnum mt-3 text-xs text-fg-muted" aria-live="polite">
          {toPersianDigits(filtered.length)} محصول نمایش داده می‌شود
        </p>
      </Card>

      <DataTable<Row>
        rows={filtered}
        getKey={(row) => row.id}
        empty={
          <EmptyState
            title="محصولی پیدا نشد"
            description="عبارت جست‌وجو یا فیلترها را تغییر دهید."
            action={<Button variant="secondary" onClick={() => { setQuery(""); setStatus("all"); }}>حذف فیلترها</Button>}
          />
        }
        renderCard={(row) => (
          <Card className="flex gap-3">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-surface-inset">
              <Image src={row.image} alt="" fill sizes="64px" className="object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium text-fg">{row.name}</p>
              <p className="mt-1 text-xs text-fg-subtle">{row.category}، {row.brand}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <PriceInline value={row.price} className="text-sm" />
                {stockBadge(row)}
              </div>
              <p className="tnum mt-2 text-xs text-fg-muted">
                {toPersianDigits(row.colors)} رنگ، {toPersianDigits(row.variants)} تنوع
                {row.soldOutVariants > 0 && `، ${toPersianDigits(row.soldOutVariants)} ناموجود`}
              </p>
              <Link
                href={`/admin/products/${row.slug}`}
                className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-fg-muted hover:text-fg"
              >
                <Pencil className="size-3.5" aria-hidden />
                ویرایش
              </Link>
            </div>
          </Card>
        )}
        columns={[
          {
            key: "product",
            header: "محصول",
            cell: (row) => (
              <div className="flex items-center gap-3">
                <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-surface-inset">
                  <Image src={row.image} alt="" fill sizes="44px" className="object-cover" />
                </span>
                <div className="min-w-0">
                  <p className="line-clamp-1 font-medium text-fg">{row.name}</p>
                  <p className="tnum text-xs text-fg-subtle" dir="ltr">{row.id}</p>
                </div>
              </div>
            ),
          },
          { key: "category", header: "دسته‌بندی", cell: (row) => <span className="text-fg-muted">{row.category}</span> },
          { key: "brand", header: "کالکشن", hideOn: "md", cell: (row) => <span className="text-fg-muted">{row.brand}</span> },
          {
            key: "price",
            header: "قیمت",
            align: "end",
            cell: (row) => (
              <div className="flex flex-col items-end">
                <PriceInline value={row.price} className="text-sm" />
                {row.compareAtPrice && (
                  <span className="tnum text-xs text-fg-subtle line-through">
                    {row.compareAtPrice.toLocaleString("fa-IR")}
                  </span>
                )}
              </div>
            ),
          },
          {
            key: "variants",
            header: "تنوع‌ها",
            align: "center",
            cell: (row) => (
              <span className="tnum text-xs text-fg-muted">
                {toPersianDigits(row.colors)} رنگ / {toPersianDigits(row.variants)} تنوع
                {row.soldOutVariants > 0 && (
                  <span className="mt-0.5 block text-danger">{toPersianDigits(row.soldOutVariants)} ناموجود</span>
                )}
              </span>
            ),
          },
          { key: "stock", header: "موجودی کل", align: "center", cell: stockBadge },
          { key: "sold", header: "فروش", align: "center", hideOn: "md", cell: (row) => <span className="tnum text-fg-muted">{toPersianDigits(row.sold)}</span> },
          {
            key: "actions",
            header: "عملیات",
            align: "end",
            cell: (row) => (
              <Link
                href={`/admin/products/${row.slug}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs text-fg-muted hover:text-fg"
              >
                <Pencil className="size-3.5" aria-hidden />
                ویرایش
              </Link>
            ),
          },
        ]}
      />
    </>
  );
}
