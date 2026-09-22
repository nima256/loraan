"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/Badge";
import { BottomSheet } from "@/components/ui/Overlay";
import { EmptyState, ProductGridSkeleton } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Navigation";
import { ProductGrid } from "@/components/product/ProductCard";
import { FilterPanel, type FacetData } from "./FilterPanel";
import { buildQuery, countActiveFilters, GENDER_LABELS, hasActiveFilters } from "@/lib/shop-params";
import { SORT_OPTIONS } from "@/lib/api/products";
import { formatAmount, toPersianDigits } from "@/lib/format";
import type { Brand, Category, Gender, PaginatedResult, ProductFilters, ProductSummary, SortKey } from "@/types";

/**
 * Product listing view.
 *
 * Filtering happens on the server (the page re-renders from the URL); this
 * component owns the controls and the pending state. On phones the filters live
 * in a bottom sheet with a staged "apply" so the list doesn't reshuffle under
 * the user's finger while they are still choosing.
 */
export function ShopView({
  result, filters, facets, categories, brands, basePath = "/shop", heading, description,
}: {
  result: PaginatedResult<ProductSummary>;
  filters: ProductFilters;
  facets: FacetData;
  categories: Category[];
  brands: Brand[];
  basePath?: string;
  heading: string;
  description?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<ProductFilters>(filters);

  const push = useCallback((next: ProductFilters) => {
    startTransition(() => router.push(`${basePath}${buildQuery(next)}`, { scroll: false }));
  }, [router, basePath]);

  const activeCount = countActiveFilters(filters);
  const anyActive = hasActiveFilters(filters);

  const openSheet = () => { setDraft(filters); setSheetOpen(true); };
  const applySheet = () => { setSheetOpen(false); push(draft); };

  const clearAll = () =>
    push({ q: filters.q, sort: filters.sort, page: 1 });

  /** Human-readable chips for everything currently narrowing the list. */
  const chips = useMemo(() => {
    const out: { key: string; label: string; remove: () => void }[] = [];
    const drop = <K extends keyof ProductFilters>(key: K, value: string | number) => () => {
      const current = (filters[key] as (string | number)[]) ?? [];
      push({ ...filters, [key]: current.filter((v) => v !== value), page: 1 });
    };

    filters.categories?.forEach((slug) => {
      const name = categories.find((c) => c.slug === slug)?.name ?? slug;
      out.push({ key: `cat-${slug}`, label: name, remove: drop("categories", slug) });
    });
    filters.genders?.forEach((gender) =>
      out.push({ key: `g-${gender}`, label: GENDER_LABELS[gender as Gender], remove: drop("genders", gender) })
    );
    filters.sizes?.forEach((size) =>
      out.push({ key: `s-${size}`, label: `سایز ${toPersianDigits(size)}`, remove: drop("sizes", size) })
    );
    filters.colors?.forEach((id) => {
      const name = facets.colors.find((c) => c.id === id)?.name ?? id;
      out.push({ key: `c-${id}`, label: `رنگ ${name}`, remove: drop("colors", id) });
    });
    filters.brands?.forEach((slug) => {
      const name = brands.find((b) => b.slug === slug)?.name ?? slug;
      out.push({ key: `b-${slug}`, label: name, remove: drop("brands", slug) });
    });
    if (filters.minPrice != null || filters.maxPrice != null) {
      const from = filters.minPrice != null ? formatAmount(filters.minPrice) : "۰";
      const to = filters.maxPrice != null ? formatAmount(filters.maxPrice) : "بی‌نهایت";
      out.push({
        key: "price",
        label: `قیمت ${from} تا ${to}`,
        remove: () => push({ ...filters, minPrice: undefined, maxPrice: undefined, page: 1 }),
      });
    }
    if (filters.inStockOnly) {
      out.push({ key: "stock", label: "فقط موجود", remove: () => push({ ...filters, inStockOnly: false, page: 1 }) });
    }
    if (filters.onSaleOnly) {
      out.push({ key: "sale", label: "فقط تخفیف‌دار", remove: () => push({ ...filters, onSaleOnly: false, page: 1 }) });
    }
    return out;
  }, [filters, categories, brands, facets.colors, push]);

  const SortSelect = ({ id }: { id: string }) => (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="shrink-0 text-sm text-fg-muted">مرتب‌سازی</label>
      <select
        id={id}
        value={filters.sort ?? "newest"}
        onChange={(e) => push({ ...filters, sort: e.target.value as SortKey, page: 1 })}
        className="h-11 rounded-md border border-border bg-surface px-3 pe-8 text-sm text-fg
                   focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
      >
        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className="container-page py-6 lg:py-8">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-fg sm:text-3xl">{heading}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-7 text-fg-muted">{description}</p>}
      </header>

      <div className="lg:grid lg:grid-cols-[17rem_1fr] lg:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-h)+1rem)] max-h-[calc(100dvh-6rem)] overflow-y-auto pb-6 pe-1">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-fg">فیلترها</h2>
              {anyActive && (
                <button type="button" onClick={clearAll} className="text-sm text-primary hover:underline dark:text-[color:var(--primary-soft-fg)]">
                  حذف همه
                </button>
              )}
            </div>
            <FilterPanel
              filters={filters}
              facets={facets}
              categories={categories}
              brands={brands}
              onChange={push}
            />
          </div>
        </aside>

        <div className="min-w-0">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="tnum text-sm text-fg-muted" aria-live="polite">
              {toPersianDigits(result.total)} محصول
              {result.totalPages > 1 && (
                <span className="text-fg-subtle">
                  ، صفحه {toPersianDigits(result.page)} از {toPersianDigits(result.totalPages)}
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block"><SortSelect id="sort-desktop" /></div>
              <Button
                variant="secondary"
                size="sm"
                onClick={openSheet}
                icon={<SlidersHorizontal className="size-4" aria-hidden />}
                className="lg:hidden"
              >
                فیلترها
                {activeCount > 0 && (
                  <span className="tnum grid size-5 place-items-center rounded-full bg-primary text-[0.6875rem] text-primary-fg">
                    {toPersianDigits(activeCount)}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Mobile sort sits on its own row so it never crowds the filter button. */}
          <div className="mb-4 sm:hidden"><SortSelect id="sort-mobile" /></div>

          {/* Active filters — always visible, always removable. */}
          {chips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {chips.map((chip) => <FilterChip key={chip.key} label={chip.label} onRemove={chip.remove} />)}
              <button
                type="button"
                onClick={clearAll}
                className="min-h-9 px-2 text-sm font-medium text-primary hover:underline dark:text-[color:var(--primary-soft-fg)]"
              >
                حذف همه فیلترها
              </button>
            </div>
          )}

          {pending ? (
            <ProductGridSkeleton count={8} />
          ) : result.items.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-7" aria-hidden />}
              title="محصولی با این فیلترها پیدا نشد"
              description="می‌توانید بعضی از فیلترها را بردارید یا محدوده قیمت را بازتر کنید."
              action={anyActive ? <Button onClick={clearAll}>حذف همه فیلترها</Button> : undefined}
              secondaryAction={
                <Button variant="secondary" onClick={() => push({ sort: "bestselling", page: 1 })}>
                  دیدن پرفروش‌ترین‌ها
                </Button>
              }
            />
          ) : (
            <>
              <ProductGrid products={result.items} priorityCount={4} />
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                buildHref={(page) => `${basePath}${buildQuery({ ...filters, page })}`}
                className="mt-10"
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="فیلترها"
        description="انتخاب کنید و سپس «نمایش نتیجه‌ها» را بزنید."
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setDraft({ q: filters.q, sort: filters.sort, page: 1 })}>
              پاک کردن
            </Button>
            <Button onClick={applySheet}>نمایش نتیجه‌ها</Button>
          </div>
        }
      >
        <FilterPanel
          filters={draft}
          facets={facets}
          categories={categories}
          brands={brands}
          onChange={setDraft}
        />
      </BottomSheet>
    </div>
  );
}
