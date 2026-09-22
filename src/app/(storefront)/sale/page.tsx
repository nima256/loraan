import type { Metadata } from "next";
import { TicketPercent } from "lucide-react";
import { ShopView } from "@/components/shop/ShopView";
import { brands, categories } from "@/data/catalog";
import { getFacets, searchProducts } from "@/lib/api/products";
import { parseFilters, type RawParams } from "@/lib/shop-params";
import { coupons } from "@/data/commerce";
import { formatAmount, toPersianDigits } from "@/lib/format";

export const metadata: Metadata = {
  title: "تخفیف‌ها و حراج",
  description: "همه محصولات تخفیف‌دار لوران در یک صفحه، به همراه کدهای تخفیف فعال.",
};

export default async function SalePage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams;
  // The sale page is the shop with `onSale` locked on.
  const filters = { ...parseFilters(params), onSaleOnly: true, sort: parseFilters(params).sort ?? "discount" };
  const result = await searchProducts(filters);

  const activeCoupons = coupons.filter((c) => !c.expiresAt || new Date(c.expiresAt) > new Date());

  return (
    <>
      {/* Campaign banner — brand colours, no aggressive marketplace styling. */}
      <section className="bg-primary text-primary-fg">
        <div aria-hidden className="brand-grid absolute inset-x-0 opacity-15" />
        <div className="container-page relative py-8 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-primary-fg/80">کمپین فعال</p>
              <h1 className="mt-2 text-2xl font-bold leading-10 sm:text-3xl">
                تخفیف‌های این فصل لوران
              </h1>
              <p className="mt-3 text-sm leading-8 text-primary-fg/85">
                {toPersianDigits(result.total)} مدل با قیمت حراج. موجودی هر سایز محدود است و
                قیمت‌ها تا پایان موجودی معتبرند.
              </p>
            </div>

            <ul className="flex flex-wrap gap-2">
              {activeCoupons.slice(0, 3).map((coupon) => (
                <li
                  key={coupon.code}
                  className="rounded-lg border border-dashed border-primary-fg/40 bg-white/10 p-3 backdrop-blur-sm"
                >
                  <p className="flex items-center gap-1.5 text-xs text-primary-fg/80">
                    <TicketPercent className="size-3.5" aria-hidden />
                    کد تخفیف
                  </p>
                  <p className="mt-1 font-bold tracking-wider" dir="ltr">{coupon.code}</p>
                  <p className="mt-1 max-w-48 text-xs leading-5 text-primary-fg/80">{coupon.description}</p>
                  {coupon.minSubtotal && (
                    <p className="tnum mt-1 text-[0.6875rem] text-primary-fg/70">
                      حداقل خرید {formatAmount(coupon.minSubtotal)} تومان
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <ShopView
        result={result}
        filters={filters}
        facets={getFacets()}
        categories={categories}
        brands={brands}
        basePath="/sale"
        heading="محصولات تخفیف‌دار"
        description="فقط کالاهایی که همین حالا تخفیف دارند."
      />
    </>
  );
}
