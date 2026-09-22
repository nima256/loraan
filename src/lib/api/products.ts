import { brandById, categoryBySlug, products, productBySlug, reviews } from "@/data/catalog";
import { discountPercent } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";
import type {
  PaginatedResult, Product, ProductFilters, ProductSummary, RatingBreakdown, Review, SortKey,
} from "@/types";

/**
 * Catalog queries.
 *
 * Everything the storefront reads about products comes through this module.
 * Each function is already async so that replacing the in-memory filtering with
 * `fetch("/api/products?…")` is a body swap, not a refactor.
 */

/** Adds the computed fields every product surface needs (price badge, stock). */
export function toSummary(product: Product): ProductSummary {
  const totalStock = product.variants.reduce((n, v) => n + v.stock, 0);
  return {
    ...product,
    brandName: brandById.get(product.brandId)?.name ?? "لوران",
    discountPercent: discountPercent(product.price, product.compareAtPrice),
    inStock: totalStock > 0,
    totalStock,
  };
}

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    // Arabic ی/ک and the ZWNJ are typed inconsistently by Persian users.
    .replace(/[يﻱ]/g, "ی")
    .replace(/[كﻙ]/g, "ک")
    .replace(/‌/g, " ")
    .replace(/\s+/g, " ");

function matchesQuery(product: Product, query: string) {
  const q = normalize(query);
  if (!q) return true;
  const haystack = normalize(
    [
      product.name,
      product.subtitle ?? "",
      brandById.get(product.brandId)?.name ?? "",
      ...product.colors.map((c) => c.name),
      ...product.categoryIds.map((id) => categoryBySlug.get(id)?.name ?? ""),
      product.description,
    ].join(" ")
  );
  // Every word must appear somewhere — narrows results as the user types more.
  return q.split(" ").every((word) => haystack.includes(word));
}

const SORTERS: Record<SortKey, (a: ProductSummary, b: ProductSummary) => number> = {
  newest: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  bestselling: (a, b) => b.soldCount - a.soldCount,
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
  discount: (a, b) => b.discountPercent - a.discountPercent,
};

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "جدیدترین" },
  { value: "bestselling", label: "پرفروش‌ترین" },
  { value: "price-asc", label: "ارزان‌ترین" },
  { value: "price-desc", label: "گران‌ترین" },
  { value: "discount", label: "بیشترین تخفیف" },
  { value: "rating", label: "بالاترین امتیاز" },
];

export function filterProducts(filters: ProductFilters): ProductSummary[] {
  const {
    q, categories: cats, genders, brands: brandSlugs, sizes, colors,
    minPrice, maxPrice, inStockOnly, onSaleOnly, sort = "newest",
  } = filters;

  const result = products
    .filter((p) => {
      if (q && !matchesQuery(p, q)) return false;
      if (cats?.length) {
        const slugs = p.categoryIds.map((id) => [...categoryBySlug.values()].find((c) => c.id === id)?.slug);
        if (!cats.some((slug) => slugs.includes(slug))) return false;
      }
      if (genders?.length && !genders.includes(p.gender)) return false;
      if (brandSlugs?.length) {
        const slug = [...brandById.values()].find((b) => b.id === p.brandId)?.slug;
        if (!slug || !brandSlugs.includes(slug)) return false;
      }
      if (minPrice != null && p.price < minPrice) return false;
      if (maxPrice != null && p.price > maxPrice) return false;
      if (onSaleOnly && !p.compareAtPrice) return false;

      // Size and colour filters mean "available in this size/colour", so they
      // are answered from the variants, not from the product's colour list.
      if (sizes?.length) {
        const ok = p.variants.some((v) => sizes.includes(v.size) && (!inStockOnly || v.stock > 0));
        if (!ok) return false;
      }
      if (colors?.length) {
        const ok = p.colors.some((c) => colors.includes(c.id));
        if (!ok) return false;
      }
      if (inStockOnly && !p.variants.some((v) => v.stock > 0)) return false;
      return true;
    })
    .map(toSummary);

  return result.sort(SORTERS[sort] ?? SORTERS.newest);
}

export function paginate<T>(items: T[], page = 1, pageSize = siteConfig.commerce.productsPerPage): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    items: items.slice((current - 1) * pageSize, current * pageSize),
    total: items.length,
    page: current,
    pageSize,
    totalPages,
  };
}

export async function searchProducts(filters: ProductFilters): Promise<PaginatedResult<ProductSummary>> {
  return paginate(filterProducts(filters), filters.page ?? 1);
}

export async function getProduct(slug: string): Promise<ProductSummary | null> {
  const product = productBySlug.get(slug);
  return product ? toSummary(product) : null;
}

export function getAllProductSlugs(): string[] {
  return products.map((p) => p.slug);
}

export async function getBestSellers(limit = 8): Promise<ProductSummary[]> {
  return products.map(toSummary).sort((a, b) => b.soldCount - a.soldCount).slice(0, limit);
}

export async function getOnSale(limit = 8): Promise<ProductSummary[]> {
  return products
    .map(toSummary)
    .filter((p) => p.discountPercent > 0)
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, limit);
}

export async function getNewArrivals(limit = 8): Promise<ProductSummary[]> {
  return products.map(toSummary).sort(SORTERS.newest).slice(0, limit);
}

/** Same category first, then anything else, never the product itself. */
export async function getRelatedProducts(product: Product, limit = 8): Promise<ProductSummary[]> {
  const sameCategory = products.filter(
    (p) => p.id !== product.id && p.categoryIds.some((id) => product.categoryIds.includes(id))
  );
  const fallback = products.filter((p) => p.id !== product.id && !sameCategory.includes(p));
  return [...sameCategory, ...fallback].slice(0, limit).map(toSummary);
}

/** Top search suggestions for the header overlay. */
export async function getSearchSuggestions(query: string, limit = 6): Promise<ProductSummary[]> {
  if (!query.trim()) return [];
  return products.filter((p) => matchesQuery(p, query)).slice(0, limit).map(toSummary);
}

export const POPULAR_SEARCHES = [
  "کتانی مردانه",
  "اسنیکر سفید",
  "نیم‌بوت زنانه",
  "کفش رانینگ",
  "کفش کلاسیک چرم",
  "کتانی بچگانه",
];

/* -------------------------------------------------------------------------- */
/* Reviews                                                                     */
/* -------------------------------------------------------------------------- */

export async function getProductReviews(productId: string): Promise<Review[]> {
  return reviews
    .filter((r) => r.productId === productId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function getRatingBreakdown(productId: string, fallbackAverage: number): RatingBreakdown {
  const list = reviews.filter((r) => r.productId === productId);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as RatingBreakdown["distribution"];
  const sizeFeedback = { small: 0, true: 0, large: 0 };
  for (const r of list) {
    distribution[Math.round(r.rating) as 1 | 2 | 3 | 4 | 5]++;
    if (r.sizeFeedback) sizeFeedback[r.sizeFeedback]++;
  }
  const average = list.length
    ? +(list.reduce((n, r) => n + r.rating, 0) / list.length).toFixed(1)
    : fallbackAverage;
  return { average, total: list.length, distribution, sizeFeedback };
}

/* -------------------------------------------------------------------------- */
/* Facets — derived from the catalog so filters never drift from the data.     */
/* -------------------------------------------------------------------------- */

export function getFacets() {
  const colorMap = new Map<string, { id: string; name: string; hex: string; count: number }>();
  const sizeMap = new Map<number, number>();
  const genderMap = new Map<string, number>();

  for (const p of products) {
    for (const c of p.colors) {
      const entry = colorMap.get(c.id) ?? { id: c.id, name: c.name, hex: c.hex, count: 0 };
      entry.count++;
      colorMap.set(c.id, entry);
    }
    for (const size of new Set(p.variants.map((v) => v.size))) {
      sizeMap.set(size, (sizeMap.get(size) ?? 0) + 1);
    }
    genderMap.set(p.gender, (genderMap.get(p.gender) ?? 0) + 1);
  }

  const prices = products.map((p) => p.price);
  return {
    colors: [...colorMap.values()].sort((a, b) => b.count - a.count),
    sizes: [...sizeMap.entries()].sort((a, b) => a[0] - b[0]).map(([size, count]) => ({ size, count })),
    genders: [...genderMap.entries()].map(([gender, count]) => ({ gender, count })),
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
  };
}

export function getCategoryCounts() {
  const counts = new Map<string, number>();
  for (const p of products) for (const id of p.categoryIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}
