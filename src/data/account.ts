import { products } from "./catalog";
import { calculateTotals } from "@/lib/cart";
import type { Address, AnyOrderStatus, CartItem, Order, ReturnRequest, User } from "@/types";

/**
 * Mock customer data for the account area.
 *
 * Built from the real catalog so order lines reference products that actually
 * exist and can be re-opened from the order detail page.
 *
 * ▶ Backend swap: these become `GET /me`, `GET /me/addresses`, `GET /me/orders`.
 */

export const mockUser: User = {
  id: "u-1",
  phone: "09131234567",
  firstName: "نیما",
  lastName: "رضوانی",
  email: "nima@example.com",
  birthDate: "1997-06-14",
  createdAt: "2024-02-11T08:30:00.000Z",
  smsNotifications: true,
};

export const mockAddresses: Address[] = [
  {
    id: "a-1",
    title: "خانه",
    recipientFirstName: "نیما",
    recipientLastName: "رضوانی",
    phone: "09131234567",
    province: "یزد",
    city: "یزد",
    addressLine: "بلوار دانشجو، کوچه شهید مرادی، مجتمع نگین",
    postalCode: "8916745231",
    plaque: "۱۲",
    unit: "۴",
    isDefault: true,
  },
  {
    id: "a-2",
    title: "محل کار",
    recipientFirstName: "نیما",
    recipientLastName: "رضوانی",
    phone: "09131234567",
    province: "یزد",
    city: "یزد",
    addressLine: "خیابان کاشانی، ساختمان اداری آرمان، طبقه سوم",
    postalCode: "8917634522",
    plaque: "۴۸",
    isDefault: false,
  },
];

/** Deterministic line item from a catalog product. */
function lineFrom(productIndex: number, quantity: number, colorIndex = 0, sizeOffset = 2) {
  const product = products[productIndex % products.length];
  const color = product.colors[colorIndex % product.colors.length];
  const sizes = [...new Set(product.variants.map((v) => v.size))].sort((a, b) => a - b);
  const size = sizes[Math.min(sizeOffset, sizes.length - 1)];
  const variant = product.variants.find((v) => v.colorId === color.id && v.size === size)!;
  return {
    productId: product.id,
    variantId: variant.id,
    slug: product.slug,
    name: product.name,
    image: color.images[0],
    colorName: color.name,
    colorHex: color.hex,
    size,
    quantity,
    unitPrice: product.price,
    compareAtPrice: product.compareAtPrice,
  };
}

function buildOrder(config: {
  number: string;
  status: AnyOrderStatus;
  daysAgo: number;
  lines: ReturnType<typeof lineFrom>[];
  couponCode?: string;
  couponDiscount?: number;
  trackingCode?: string;
  addressId?: string;
  paymentMethod?: Order["paymentMethod"];
}): Order {
  const createdAt = new Date(Date.now() - config.daysAgo * 86_400_000).toISOString();
  const cartItems: CartItem[] = config.lines.map((l) => ({
    productId: l.productId,
    variantId: l.variantId,
    slug: l.slug,
    name: l.name,
    image: l.image,
    colorId: "",
    colorName: l.colorName,
    colorHex: l.colorHex,
    size: l.size,
    price: l.unitPrice,
    compareAtPrice: l.compareAtPrice,
    quantity: l.quantity,
    maxQuantity: 10,
  }));

  const totals = calculateTotals(cartItems, { shippingMethodId: "tipax" });
  if (config.couponDiscount) {
    totals.couponDiscount = config.couponDiscount;
    totals.payableOnline = Math.max(0, totals.payableOnline - config.couponDiscount);
    totals.grandTotal = Math.max(0, totals.grandTotal - config.couponDiscount);
  }

  // Build the timeline up to (and including) the order's current status.
  const flow: AnyOrderStatus[] = ["awaiting_payment", "preparing", "packaged", "shipped", "delivered"];
  const reachedIndex = flow.indexOf(config.status);
  const timeline =
    reachedIndex >= 0
      ? flow.slice(0, reachedIndex + 1).map((status, i) => ({
          status,
          at: new Date(Date.now() - (config.daysAgo - i) * 86_400_000).toISOString(),
        }))
      : [
          { status: "awaiting_payment" as AnyOrderStatus, at: createdAt },
          { status: config.status, at: new Date(Date.now() - (config.daysAgo - 1) * 86_400_000).toISOString() },
        ];

  const paid = config.status !== "awaiting_payment" && config.status !== "payment_failed" && config.status !== "expired";

  return {
    id: config.number.toLowerCase(),
    number: config.number,
    status: config.status,
    createdAt,
    items: config.lines,
    totals,
    couponCode: config.couponCode,
    address: mockAddresses.find((a) => a.id === (config.addressId ?? "a-1"))!,
    shippingMethod: "tipax",
    trackingCode: config.trackingCode,
    paymentMethod: config.paymentMethod ?? "online",
    paymentRef: paid
      ? String(73_000_000 + (Math.abs(hash(config.number)) % 900_000)).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])
      : undefined,
    paidAt: paid ? new Date(Date.now() - (config.daysAgo - 0.2) * 86_400_000).toISOString() : undefined,
    timeline,
    estimatedDelivery:
      config.status === "shipped"
        ? new Date(Date.now() + 2 * 86_400_000).toISOString()
        : undefined,
    smsNotifications: true,
  };
}

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h << 5) - h + value.charCodeAt(i);
  return h;
}

/** Covers all five primary statuses plus every exception state. */
export const mockOrders: Order[] = [
  buildOrder({
    number: "LRN-140406-0912",
    status: "shipped",
    daysAgo: 3,
    lines: [lineFrom(4, 1, 0, 3), lineFrom(19, 1, 1, 2)],
    couponCode: "LORAN10",
    couponDiscount: 320_000,
    trackingCode: "TPX۴۸۲۳۹۱۷۶",
  }),
  buildOrder({ number: "LRN-140406-0887", status: "preparing", daysAgo: 1, lines: [lineFrom(31, 2, 0, 4)] }),
  buildOrder({ number: "LRN-140405-0841", status: "awaiting_payment", daysAgo: 0, lines: [lineFrom(52, 1, 0, 2)] }),
  buildOrder({ number: "LRN-140404-0798", status: "packaged", daysAgo: 2, lines: [lineFrom(8, 1, 1, 3), lineFrom(45, 1, 0, 1)] }),
  buildOrder({
    number: "LRN-140328-0654", status: "delivered", daysAgo: 21,
    lines: [lineFrom(12, 1, 0, 3)], couponCode: "WELCOME", couponDiscount: 200_000,
    trackingCode: "TPX۴۷۱۱۸۸۰۲", addressId: "a-2",
  }),
  buildOrder({ number: "LRN-140320-0512", status: "delivered", daysAgo: 38, lines: [lineFrom(67, 1, 2, 2), lineFrom(70, 1, 0, 5)], trackingCode: "TPX۴۶۰۲۳۳۱۹" }),
  buildOrder({ number: "LRN-140312-0403", status: "returned", daysAgo: 54, lines: [lineFrom(23, 1, 0, 4)] }),
  buildOrder({ number: "LRN-140308-0377", status: "cancelled", daysAgo: 61, lines: [lineFrom(88, 1, 1, 2)] }),
  buildOrder({ number: "LRN-140302-0298", status: "payment_failed", daysAgo: 72, lines: [lineFrom(3, 1, 0, 3)] }),
  buildOrder({ number: "LRN-140228-0241", status: "refunded", daysAgo: 84, lines: [lineFrom(56, 1, 0, 2)] }),
  buildOrder({ number: "LRN-140220-0177", status: "expired", daysAgo: 95, lines: [lineFrom(41, 1, 1, 3)] }),
  buildOrder({ number: "LRN-140214-0106", status: "delivered", daysAgo: 108, lines: [lineFrom(77, 2, 0, 4)], trackingCode: "TPX۴۴۸۱۰۵۶۷" }),
];

export const mockReturnRequests: ReturnRequest[] = [
  {
    id: "rt-1",
    orderNumber: "LRN-140312-0403",
    createdAt: new Date(Date.now() - 50 * 86_400_000).toISOString(),
    status: "refunded",
    reason: "سایز کوچک بود",
    items: [{ name: mockOrders[6].items[0].name, colorName: mockOrders[6].items[0].colorName, size: mockOrders[6].items[0].size, quantity: 1 }],
    refundAmount: mockOrders[6].totals.payableOnline,
    type: "return",
  },
  {
    id: "rt-2",
    orderNumber: "LRN-140320-0512",
    createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    status: "in_transit",
    reason: "تعویض با یک سایز بزرگ‌تر",
    items: [{ name: mockOrders[5].items[0].name, colorName: mockOrders[5].items[0].colorName, size: mockOrders[5].items[0].size, quantity: 1 }],
    refundAmount: 0,
    type: "exchange",
  },
];

export function getOrderByNumber(number: string): Order | undefined {
  return mockOrders.find((o) => o.number.toLowerCase() === number.toLowerCase());
}
