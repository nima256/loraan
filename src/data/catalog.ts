import raw from "./catalog.json";
import type { Brand, Category, Product, Review } from "@/types";

/**
 * Typed access to the mock catalog.
 *
 * ▶ Backend swap: replace the three exports below with `fetch()` calls. Every
 *   consumer already goes through `src/lib/api/*`, so nothing else changes.
 */
export const categories = raw.categories as Category[];
export const brands = raw.brands as Brand[];
export const products = raw.products as unknown as Product[];
export const reviews = raw.reviews as unknown as Review[];

export const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
export const categoryById = new Map(categories.map((c) => [c.id, c]));
export const brandById = new Map(brands.map((b) => [b.id, b]));
export const productBySlug = new Map(products.map((p) => [p.slug, p]));
