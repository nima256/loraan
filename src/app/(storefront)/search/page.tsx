import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { ShopView } from "@/components/shop/ShopView";
import { EmptyState } from "@/components/ui/Feedback";
import { ButtonLink } from "@/components/ui/Button";
import { brands, categories } from "@/data/catalog";
import { getFacets, POPULAR_SEARCHES, searchProducts } from "@/lib/api/products";
import { parseFilters, type RawParams } from "@/lib/shop-params";

export const metadata: Metadata = { title: "نتیجه جست‌وجو", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const query = filters.q ?? "";
  const result = await searchProducts(filters);

  if (!query.trim()) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={<SearchX className="size-7" aria-hidden />}
          title="عبارتی برای جست‌وجو وارد نشده"
          description="از نوار جست‌وجوی بالای صفحه استفاده کنید یا یکی از جست‌وجوهای پرطرفدار را امتحان کنید."
          action={<ButtonLink href="/shop">دیدن همه محصولات</ButtonLink>}
        />
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {POPULAR_SEARCHES.map((term) => (
            <ButtonLink key={term} href={`/search?q=${encodeURIComponent(term)}`} variant="secondary" size="sm">
              {term}
            </ButtonLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ShopView
      result={result}
      filters={filters}
      facets={getFacets()}
      categories={categories}
      brands={brands}
      basePath="/search"
      heading={`نتیجه جست‌وجو برای «${query}»`}
      description={result.total > 0 ? undefined : "چیزی پیدا نشد. می‌توانید املای عبارت را بررسی کنید یا فیلترها را تغییر دهید."}
    />
  );
}
