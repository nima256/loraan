import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Navigation";
import { ShopView } from "@/components/shop/ShopView";
import { brands, categories, categoryBySlug } from "@/data/catalog";
import { getFacets, searchProducts } from "@/lib/api/products";
import { parseFilters, type RawParams } from "@/lib/shop-params";

export async function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryBySlug.get(slug);
  if (!category) return { title: "دسته‌بندی پیدا نشد" };
  return { title: category.name, description: category.description };
}

export default async function CategoryPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawParams>;
}) {
  const { slug } = await params;
  const category = categoryBySlug.get(slug);
  if (!category) notFound();

  const raw = await searchParams;
  // The category is fixed by the route; other filters still come from the URL.
  const filters = { ...parseFilters(raw), categories: [slug] };
  const result = await searchProducts(filters);

  return (
    <>
      <div className="container-page pt-5">
        <Breadcrumbs
          items={[
            { label: "خانه", href: "/" },
            { label: "فروشگاه", href: "/shop" },
            { label: category.name },
          ]}
        />
      </div>
      <ShopView
        result={result}
        filters={filters}
        facets={getFacets()}
        categories={categories}
        brands={brands}
        basePath={`/category/${slug}`}
        heading={category.name}
        description={category.description}
      />
    </>
  );
}
