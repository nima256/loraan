"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Boxes, ExternalLink, LayoutDashboard, Menu, Package, Settings, ShoppingCart,
  Palette, Tags, TicketPercent, Users, X,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Alert } from "@/components/ui/Feedback";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "پیشخوان", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "سفارش‌ها", href: "/admin/orders", icon: ShoppingCart },
  { label: "محصولات", href: "/admin/products", icon: Package },
  { label: "دسته‌بندی‌ها", href: "/admin/categories", icon: Tags },
  { label: "موجودی انبار", href: "/admin/inventory", icon: Boxes },
  { label: "تخفیف و کمپین", href: "/admin/discounts", icon: TicketPercent },
  { label: "مشتریان", href: "/admin/customers", icon: Users },
  { label: "گزارش‌ها", href: "/admin/reports", icon: BarChart3 },
  { label: "تنظیمات", href: "/admin/settings", icon: Settings },
  { label: "راهنمای طراحی", href: "/admin/design-system", icon: Palette },
];

/**
 * Admin shell.
 *
 * Visually distinct from the storefront — denser, darker rail, persistent
 * sidebar — while still unmistakably Loran. Nothing here is a real back office:
 * every screen reads mock data.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <ul className="space-y-0.5">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href, item.exact);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-fg font-medium"
                  : "text-fg-muted hover:bg-surface-2 hover:text-fg"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Top bar */}
      <header
        className="sticky top-0 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface px-4"
        style={{ zIndex: "var(--z-header)" }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="باز کردن منوی مدیریت"
            className="grid size-10 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <Logo size="sm" href="/admin" />
          <span className="hidden rounded-full border border-border px-2.5 py-1 text-[0.6875rem] font-medium text-fg-muted sm:inline">
            پنل مدیریت
          </span>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/"
            className="flex h-10 items-center gap-1.5 rounded-md px-3 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
          >
            <ExternalLink className="size-4" aria-hidden />
            <span className="hidden sm:inline">مشاهده فروشگاه</span>
          </Link>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[15rem_1fr]">
        {/* Desktop rail */}
        <aside className="hidden border-e border-border bg-surface lg:block">
          <nav aria-label="منوی پنل مدیریت" className="sticky top-14 p-3">
            <NavList />
          </nav>
        </aside>

        {/* Mobile drawer */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 bg-[#1b1310]/55 lg:hidden"
              style={{ zIndex: "var(--z-overlay)" }}
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="منوی پنل مدیریت"
              className="animate-drawer-start fixed inset-y-0 start-0 w-72 overflow-y-auto bg-surface p-3 shadow-e3 lg:hidden"
              style={{ zIndex: "var(--z-drawer)" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <Logo size="sm" href="/admin" />
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="بستن منو"
                  className="grid size-10 place-items-center rounded-md text-fg-muted hover:bg-surface-2"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              <NavList onNavigate={() => setMenuOpen(false)} />
            </div>
          </>
        )}

        <main className="min-w-0 p-4 lg:p-6">
          <Alert tone="info" className="mb-5" role="status" title="نمونه بصری پنل مدیریت">
            این بخش فقط طراحی رابط کاربری است. داده‌ها ساختگی‌اند و هیچ عملیاتی روی سرور انجام
            نمی‌شود. ساختار صفحه‌ها برای اتصال به بک‌اند آماده است.
          </Alert>
          {children}
        </main>
      </div>
    </div>
  );
}

/** Page header used across admin screens. */
export function AdminPageHeader({
  title, description, actions,
}: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-fg sm:text-2xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
