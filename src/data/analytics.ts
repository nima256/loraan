import { products } from "./catalog";
import { mockOrders } from "./account";
import { toSummary } from "@/lib/api/products";
import { coupons } from "./commerce";

/**
 * Mock analytics for the admin dashboard.
 *
 * Derived from the catalog so the numbers stay internally consistent (the
 * best-seller list really is the best-selling products).
 *
 * ▶ Backend swap: each export becomes a reporting endpoint.
 */

const PERSIAN_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

/** Deterministic pseudo-random so the dashboard doesn't flicker between renders. */
let seed = 0xeee6dd;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = (min: number, max: number) => Math.round(min + rnd() * (max - min));

export const revenueByMonth = PERSIAN_MONTHS.map((label) => ({
  label,
  value: between(180_000_000, 620_000_000),
}));

export const ordersByDay = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"].map((label) => ({
  label,
  value: between(8, 46),
}));

export const bestSellers = products
  .map(toSummary)
  .sort((a, b) => b.soldCount - a.soldCount)
  .slice(0, 6)
  .map((p) => ({ label: p.name.replace("لوران مدل ", ""), value: p.soldCount, slug: p.slug, revenue: p.soldCount * p.price }));

export const revenueByCategory = [
  { label: "کتانی و اسنیکر", value: 412_000_000 },
  { label: "ورزشی و رانینگ", value: 318_000_000 },
  { label: "رسمی و کلاسیک", value: 276_000_000 },
  { label: "بوت و نیم‌بوت", value: 241_000_000 },
  { label: "روزمره و کژوال", value: 188_000_000 },
  { label: "کالج و لوفر", value: 132_000_000 },
  { label: "بچگانه", value: 96_000_000 },
  { label: "صندل و تابستانی", value: 54_000_000 },
];

/** Variants at or below the reorder point, worst first. */
export const lowStockVariants = products
  .flatMap((product) =>
    product.variants
      .filter((v) => v.stock > 0 && v.stock <= 2)
      .map((v) => ({
        productId: product.id,
        productName: product.name,
        slug: product.slug,
        sku: v.sku,
        colorName: product.colors.find((c) => c.id === v.colorId)?.name ?? "",
        colorHex: product.colors.find((c) => c.id === v.colorId)?.hex ?? "#000",
        size: v.size,
        stock: v.stock,
        price: product.price,
      }))
  )
  .sort((a, b) => a.stock - b.stock)
  .slice(0, 12);

export const outOfStockCount = products.reduce(
  (n, p) => n + p.variants.filter((v) => v.stock === 0).length,
  0
);

export const totalVariants = products.reduce((n, p) => n + p.variants.length, 0);

export const inventoryValue = products.reduce(
  (n, p) => n + p.variants.reduce((m, v) => m + v.stock * p.price, 0),
  0
);

/** Coupon performance, mocked but plausible. */
export const couponPerformance = coupons
  .filter((c) => !c.expiresAt || new Date(c.expiresAt) > new Date())
  .map((coupon) => ({
    code: coupon.code,
    description: coupon.description,
    uses: between(12, 240),
    revenue: between(40_000_000, 380_000_000),
    discountGiven: between(4_000_000, 42_000_000),
  }));

export const summary = {
  revenueThisMonth: revenueByMonth[revenueByMonth.length - 1].value,
  revenueDelta: 12,
  ordersThisMonth: ordersByDay.reduce((n, d) => n + d.value, 0) * 4,
  ordersDelta: 8,
  averageOrderValue: 2_340_000,
  aovDelta: -3,
  newCustomers: 128,
  customersDelta: 19,
};

/** Customers, derived from the seeded orders plus a plausible tail. */
export const mockCustomers = [
  { id: "c-1", name: "نیما رضوانی", phone: "09131234567", city: "یزد", orders: mockOrders.length, spent: mockOrders.reduce((n, o) => n + o.totals.payableOnline, 0), joinedAt: "2024-02-11T08:30:00.000Z" },
  { id: "c-2", name: "سارا محمدی", phone: "09121112233", city: "تهران", orders: 7, spent: 18_400_000, joinedAt: "2024-05-02T10:00:00.000Z" },
  { id: "c-3", name: "امیرحسین رضایی", phone: "09354445566", city: "اصفهان", orders: 5, spent: 12_150_000, joinedAt: "2024-07-19T14:20:00.000Z" },
  { id: "c-4", name: "نگار کاظمی", phone: "09127778899", city: "شیراز", orders: 4, spent: 9_800_000, joinedAt: "2024-09-01T09:05:00.000Z" },
  { id: "c-5", name: "مهدی قاسمی", phone: "09362223344", city: "مشهد", orders: 3, spent: 7_250_000, joinedAt: "2024-11-23T16:40:00.000Z" },
  { id: "c-6", name: "فاطمه حیدری", phone: "09195556677", city: "یزد", orders: 3, spent: 6_900_000, joinedAt: "2025-01-14T11:15:00.000Z" },
  { id: "c-7", name: "علی شریفی", phone: "09338889900", city: "کرج", orders: 2, spent: 4_150_000, joinedAt: "2025-03-08T13:00:00.000Z" },
  { id: "c-8", name: "زهرا موسوی", phone: "09101112244", city: "تبریز", orders: 1, spent: 2_300_000, joinedAt: "2025-05-27T08:45:00.000Z" },
];
