import type { Coupon, ShippingMethod } from "@/types";

/**
 * Shipping options.
 *
 * Tipax is the only live courier today and it is **postpaid**: the customer pays
 * the courier on delivery, so its cost is deliberately excluded from the online
 * payable amount everywhere in the checkout. The array is ordered — add new
 * couriers here and the checkout renders them without further changes.
 */
export const shippingMethods: ShippingMethod[] = [
  {
    id: "tipax",
    name: "تیپاکس (پس‌کرایه)",
    description: "ارسال به سراسر ایران. هزینه ارسال هنگام تحویل مرسوله نزد مأمور تیپاکس پرداخت می‌شود.",
    cost: 0,
    paidOnDelivery: true,
    estimate: "۲ تا ۴ روز کاری",
    available: true,
  },
  {
    id: "post",
    name: "پست پیشتاز",
    description: "به‌زودی فعال می‌شود.",
    cost: 85_000,
    paidOnDelivery: false,
    estimate: "۳ تا ۷ روز کاری",
    available: false,
  },
  {
    id: "courier",
    name: "پیک فوری (ویژه یزد)",
    description: "به‌زودی فعال می‌شود.",
    cost: 120_000,
    paidOnDelivery: false,
    estimate: "همان روز",
    available: false,
  },
];

export const defaultShippingMethod = shippingMethods[0];

/** Mock coupon book. Codes are matched case-insensitively. */
export const coupons: Coupon[] = [
  {
    code: "LORAN10",
    type: "percent",
    value: 10,
    maxDiscount: 400_000,
    description: "۱۰٪ تخفیف تا سقف ۴۰۰٬۰۰۰ تومان",
  },
  {
    code: "WELCOME",
    type: "fixed",
    value: 200_000,
    minSubtotal: 1_500_000,
    description: "۲۰۰٬۰۰۰ تومان تخفیف اولین خرید (از ۱٬۵۰۰٬۰۰۰ تومان به بالا)",
  },
  {
    code: "YAZD20",
    type: "percent",
    value: 20,
    maxDiscount: 700_000,
    minSubtotal: 2_500_000,
    description: "۲۰٪ تخفیف کمپین یزد تا سقف ۷۰۰٬۰۰۰ تومان",
  },
  {
    code: "EXPIRED",
    type: "percent",
    value: 15,
    description: "کد منقضی‌شده (برای نمایش حالت خطا)",
    expiresAt: "2024-01-01T00:00:00.000Z",
  },
];

/** Iran's provinces, with the largest cities for each. Extend as needed. */
export const provinces: { name: string; cities: string[] }[] = [
  { name: "یزد", cities: ["یزد", "میبد", "اردکان", "بافق", "مهریز", "تفت", "ابرکوه", "اشکذر"] },
  { name: "تهران", cities: ["تهران", "اسلامشهر", "شهریار", "ورامین", "پاکدشت", "رباط‌کریم", "قدس", "ملارد"] },
  { name: "اصفهان", cities: ["اصفهان", "کاشان", "نجف‌آباد", "خمینی‌شهر", "شاهین‌شهر", "شهرضا", "فولادشهر"] },
  { name: "فارس", cities: ["شیراز", "مرودشت", "جهرم", "کازرون", "فسا", "داراب", "لار"] },
  { name: "خراسان رضوی", cities: ["مشهد", "نیشابور", "سبزوار", "تربت حیدریه", "قوچان", "کاشمر"] },
  { name: "آذربایجان شرقی", cities: ["تبریز", "مراغه", "مرند", "اهر", "میانه", "بناب"] },
  { name: "آذربایجان غربی", cities: ["ارومیه", "خوی", "میاندوآب", "مهاباد", "بوکان", "سلماس"] },
  { name: "البرز", cities: ["کرج", "فردیس", "نظرآباد", "هشتگرد", "اشتهارد"] },
  { name: "خوزستان", cities: ["اهواز", "آبادان", "خرمشهر", "دزفول", "اندیمشک", "بهبهان", "ماهشهر"] },
  { name: "کرمان", cities: ["کرمان", "سیرجان", "رفسنجان", "جیرفت", "بم", "زرند"] },
  { name: "گیلان", cities: ["رشت", "انزلی", "لاهیجان", "لنگرود", "آستارا", "تالش"] },
  { name: "مازندران", cities: ["ساری", "بابل", "آمل", "قائم‌شهر", "چالوس", "نوشهر", "تنکابن"] },
  { name: "قم", cities: ["قم"] },
  { name: "مرکزی", cities: ["اراک", "ساوه", "خمین", "محلات", "دلیجان"] },
  { name: "هرمزگان", cities: ["بندرعباس", "قشم", "کیش", "میناب", "بندرلنگه"] },
  { name: "کرمانشاه", cities: ["کرمانشاه", "اسلام‌آباد غرب", "هرسین", "کنگاور", "سنقر"] },
  { name: "همدان", cities: ["همدان", "ملایر", "نهاوند", "تویسرکان", "اسدآباد"] },
  { name: "گلستان", cities: ["گرگان", "گنبد کاووس", "علی‌آباد", "آق‌قلا", "کردکوی"] },
  { name: "اردبیل", cities: ["اردبیل", "پارس‌آباد", "مشگین‌شهر", "خلخال"] },
  { name: "قزوین", cities: ["قزوین", "تاکستان", "البرز", "آبیک"] },
  { name: "زنجان", cities: ["زنجان", "ابهر", "خرمدره", "قیدار"] },
  { name: "سیستان و بلوچستان", cities: ["زاهدان", "زابل", "چابهار", "ایرانشهر", "سراوان"] },
  { name: "لرستان", cities: ["خرم‌آباد", "بروجرد", "دورود", "الیگودرز", "کوهدشت"] },
  { name: "کردستان", cities: ["سنندج", "سقز", "مریوان", "بانه", "قروه"] },
  { name: "بوشهر", cities: ["بوشهر", "برازجان", "گناوه", "دیلم", "کنگان"] },
  { name: "چهارمحال و بختیاری", cities: ["شهرکرد", "بروجن", "فارسان", "لردگان"] },
  { name: "کهگیلویه و بویراحمد", cities: ["یاسوج", "دوگنبدان", "دهدشت"] },
  { name: "خراسان شمالی", cities: ["بجنورد", "شیروان", "اسفراین", "آشخانه"] },
  { name: "خراسان جنوبی", cities: ["بیرجند", "قاین", "طبس", "فردوس"] },
  { name: "سمنان", cities: ["سمنان", "شاهرود", "دامغان", "گرمسار"] },
  { name: "ایلام", cities: ["ایلام", "دهلران", "آبدانان", "مهران"] },
];

/** EU sizes offered site-wide, used by the shop filters and the size guide. */
export const allSizes = [28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46];
