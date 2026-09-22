"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Boxes, PackageX, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { Card, DataTable } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Navigation";
import { EmptyState } from "@/components/ui/Feedback";
import { StatTile } from "@/components/admin/Charts";
import { PriceInline } from "@/components/ui/Price";
import { products } from "@/data/catalog";
import { inventoryValue, outOfStockCount, totalVariants } from "@/data/analytics";
import { formatCompactPrice, toLatinDigits, toPersianDigits } from "@/lib/format";

/** Every variant flattened into one list — the view an stock-taker needs. */
const allVariants = products.flatMap((product) =>
  product.variants.map((variant) => {
    const color = product.colors.find((c) => c.id === variant.colorId)!;
    return {
      key: variant.id,
      sku: variant.sku,
      productName: product.name,
      slug: product.slug,
      colorName: color.name,
      colorHex: color.hex,
      size: variant.size,
      stock: variant.stock,
      price: variant.price ?? product.price,
    };
  })
);

type Row = (typeof allVariants)[number];

const TABS = [
  { value: "low", label: "موجودی کم" },
  { value: "out", label: "ناموجود" },
  { value: "all", label: "همه تنوع‌ها" },
];

export default function AdminInventoryPage() {
  const [tab, setTab] = useState("low");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = toLatinDigits(query).trim().toLowerCase();
    return allVariants
      .filter((v) => {
        if (tab === "low" && !(v.stock > 0 && v.stock <= 3)) return false;
        if (tab === "out" && v.stock !== 0) return false;
        if (!term) return true;
        return v.sku.toLowerCase().includes(term) || v.productName.includes(query.trim());
      })
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 200);
  }, [tab, query]);

  const lowCount = allVariants.filter((v) => v.stock > 0 && v.stock <= 3).length;

  return (
    <>
      <AdminPageHeader
        title="موجودی انبار"
        description="موجودی در سطح تنوع (رنگ × سایز) نگهداری می‌شود."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="کل تنوع‌ها" value={toPersianDigits(totalVariants)} icon={<Boxes className="size-4" aria-hidden />} />
        <StatTile label="موجودی کم (≤ ۳)" value={toPersianDigits(lowCount)} icon={<AlertTriangle className="size-4" aria-hidden />} />
        <StatTile label="ناموجود" value={toPersianDigits(outOfStockCount)} icon={<PackageX className="size-4" aria-hidden />} />
        <StatTile label="ارزش موجودی" value={formatCompactPrice(inventoryValue)} />
      </div>

      <Card className="mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-fg-subtle" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جست‌وجوی کد تنوع (SKU) یا نام محصول"
            aria-label="جست‌وجوی موجودی"
            className="h-11 w-full rounded-md border border-border-strong bg-surface px-3 ps-10 text-sm
                       focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
      </Card>

      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "low", label: TABS[0].label, count: lowCount },
          { value: "out", label: TABS[1].label, count: outOfStockCount },
          { value: "all", label: TABS[2].label, count: totalVariants },
        ]}
      />

      <p className="tnum mb-3 text-xs text-fg-muted" aria-live="polite">
        {toPersianDigits(filtered.length)} تنوع نمایش داده می‌شود
        {filtered.length === 200 && " (حداکثر ۲۰۰ ردیف)"}
      </p>

      <DataTable<Row>
        rows={filtered}
        getKey={(row) => row.key}
        empty={
          <EmptyState
            title="تنوعی در این وضعیت نیست"
            description="خبر خوبی است — در این دسته موردی برای رسیدگی وجود ندارد."
            action={<Button variant="secondary" onClick={() => { setTab("all"); setQuery(""); }}>نمایش همه تنوع‌ها</Button>}
          />
        }
        renderCard={(row) => (
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/admin/products/${row.slug}`} className="line-clamp-2 text-sm font-medium text-fg">
                  {row.productName}
                </Link>
                <p className="tnum mt-1 text-xs text-fg-subtle" dir="ltr">{row.sku}</p>
              </div>
              {row.stock === 0
                ? <Badge tone="danger" size="sm">ناموجود</Badge>
                : <Badge tone={row.stock <= 3 ? "warning" : "success"} size="sm" className="tnum">{toPersianDigits(row.stock)} عدد</Badge>}
            </div>
            <p className="tnum mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs text-fg-muted">
              <span aria-hidden className="size-3 rounded-full border border-border" style={{ background: row.colorHex }} />
              {row.colorName}، سایز {toPersianDigits(row.size)}
            </p>
          </Card>
        )}
        columns={[
          {
            key: "product",
            header: "محصول",
            cell: (row) => (
              <Link href={`/admin/products/${row.slug}`} className="line-clamp-1 font-medium text-fg hover:text-primary dark:hover:text-[color:var(--primary-soft-fg)]">
                {row.productName}
              </Link>
            ),
          },
          { key: "sku", header: "کد تنوع (SKU)", cell: (row) => <span className="tnum text-xs text-fg-muted" dir="ltr">{row.sku}</span> },
          {
            key: "color",
            header: "رنگ",
            cell: (row) => (
              <span className="inline-flex items-center gap-2 text-fg-muted">
                <span aria-hidden className="size-4 rounded-full border border-border" style={{ background: row.colorHex }} />
                {row.colorName}
              </span>
            ),
          },
          { key: "size", header: "سایز", align: "center", cell: (row) => <span className="tnum text-fg">{toPersianDigits(row.size)}</span> },
          { key: "price", header: "قیمت", align: "end", hideOn: "md", cell: (row) => <PriceInline value={row.price} className="text-sm" muted /> },
          {
            key: "stock",
            header: "موجودی",
            align: "center",
            cell: (row) =>
              row.stock === 0
                ? <Badge tone="danger" size="sm">ناموجود</Badge>
                : <Badge tone={row.stock <= 3 ? "warning" : "success"} size="sm" className="tnum">{toPersianDigits(row.stock)}</Badge>,
          },
          {
            key: "actions",
            header: "عملیات",
            align: "end",
            cell: (row) => (
              <Link
                href={`/admin/products/${row.slug}`}
                className="inline-flex h-9 items-center rounded-md border border-border px-2.5 text-xs text-fg-muted hover:text-fg"
              >
                ویرایش موجودی
              </Link>
            ),
          },
        ]}
      />
    </>
  );
}
