import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopView } from "@/components/shop/ShopView";
import { ProductGridSkeleton } from "@/components/ui/Feedback";
import { brands, categories } from "@/data/catalog";
import { getFacets, searchProducts } from "@/lib/api/products";
import { parseFilters, type RawParams } from "@/lib/shop-params";

export const metadata: Metadata = {
  title: "فروشگاه",
  description: "همه کفش‌های لوران؛ فیلتر بر اساس دسته‌بندی، سایز، رنگ و قیمت.",
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const result = await searchProducts(filters);

  return (
    <Suspense fallback={<div className="container-page py-8"><ProductGridSkeleton /></div>}>
      <ShopView
        result={result}
        filters={filters}
        facets={getFacets()}
        categories={categories}
        brands={brands}
        heading="فروشگاه لوران"
        description="همه مدل‌های موجود در یک صفحه. با فیلترهای سایز، رنگ و قیمت سریع‌تر به انتخاب برسید."
      />
    </Suspense>
  );
}
