"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Feedback";
import { Stars } from "@/components/ui/Rating";
import { mockOrders } from "@/data/account";
import { productBySlug } from "@/data/catalog";
import { formatDate, toPersianDigits } from "@/lib/format";

/**
 * "My reviews".
 *
 * Split into what the customer has written and what they can still write —
 * delivered items with no review yet. That second list is the useful half.
 */
export default function MyReviewsPage() {
  // Mock: the two oldest delivered orders are treated as already reviewed.
  const delivered = mockOrders.filter((o) => o.status === "delivered");
  const reviewed = delivered.slice(-1).flatMap((order) =>
    order.items.map((item) => ({
      ...item,
      orderNumber: order.number,
      rating: 5,
      body: "کیفیت دوخت و راحتی‌اش واقعاً خوب بود. بعد از چند ماه هنوز فرمش را حفظ کرده.",
      createdAt: order.timeline[order.timeline.length - 1].at,
    }))
  );
  const pending = delivered.slice(0, -1).flatMap((order) =>
    order.items.map((item) => ({ ...item, orderNumber: order.number, deliveredAt: order.timeline[order.timeline.length - 1].at }))
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-fg sm:text-2xl">دیدگاه‌های من</h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          تجربه شما به بقیه کمک می‌کند سایز و کیفیت را بهتر انتخاب کنند.
        </p>
      </header>

      <section aria-labelledby="pending-reviews">
        <h2 id="pending-reviews" className="mb-3 font-bold text-fg">
          در انتظار دیدگاه
          <span className="tnum ms-2 text-sm font-normal text-fg-muted">({toPersianDigits(pending.length)})</span>
        </h2>

        {pending.length === 0 ? (
          <EmptyState
            icon={<Star className="size-7" aria-hidden />}
            title="کالایی در انتظار دیدگاه ندارید"
            description="پس از تحویل هر سفارش، می‌توانید درباره آن بنویسید."
            action={<ButtonLink href="/shop">دیدن محصولات</ButtonLink>}
          />
        ) : (
          <ul className="space-y-3">
            {pending.map((item) => (
              <li key={`${item.orderNumber}-${item.variantId}`}>
                <Card className="flex flex-wrap items-center gap-4">
                  <Link href={`/product/${item.slug}`} className="relative size-16 shrink-0 overflow-hidden rounded-md bg-surface-inset">
                    <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${item.slug}`} className="line-clamp-1 text-sm font-medium text-fg hover:text-primary dark:hover:text-[color:var(--primary-soft-fg)]">
                      {item.name}
                    </Link>
                    <p className="tnum mt-1 text-xs text-fg-muted">
                      {item.colorName}، سایز {toPersianDigits(item.size)}، تحویل در {formatDate(item.deliveredAt)}
                    </p>
                  </div>
                  <ButtonLink href={`/product/${item.slug}#reviews`} variant="secondary" size="sm" className="shrink-0">
                    ثبت دیدگاه
                  </ButtonLink>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="my-reviews">
        <h2 id="my-reviews" className="mb-3 font-bold text-fg">
          دیدگاه‌های ثبت‌شده
          <span className="tnum ms-2 text-sm font-normal text-fg-muted">({toPersianDigits(reviewed.length)})</span>
        </h2>

        {reviewed.length === 0 ? (
          <EmptyState
            icon={<Star className="size-7" aria-hidden />}
            title="هنوز دیدگاهی ننوشته‌اید"
            description="اولین دیدگاهتان را برای یکی از خریدهای تحویل‌شده بنویسید."
          />
        ) : (
          <ul className="space-y-3">
            {reviewed.map((item) => {
              const product = productBySlug.get(item.slug);
              return (
                <li key={`${item.orderNumber}-${item.variantId}-done`}>
                  <Card>
                    <div className="flex flex-wrap items-start gap-4">
                      <Link href={`/product/${item.slug}`} className="relative size-16 shrink-0 overflow-hidden rounded-md bg-surface-inset">
                        <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Link href={`/product/${item.slug}`} className="line-clamp-1 text-sm font-medium text-fg hover:text-primary dark:hover:text-[color:var(--primary-soft-fg)]">
                            {product?.name ?? item.name}
                          </Link>
                          <Badge tone="success" size="sm">منتشر شده</Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Stars value={item.rating} size="sm" />
                          <span className="text-xs text-fg-subtle">{formatDate(item.createdAt)}</span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-fg-muted">{item.body}</p>
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
