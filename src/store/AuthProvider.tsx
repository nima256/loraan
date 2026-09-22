"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { mockAddresses, mockUser } from "@/data/account";
import { toLatinDigits } from "@/lib/format";
import type { Address, User } from "@/types";

const STORAGE_KEY = "loran:auth";

/**
 * Mock authentication.
 *
 * ⚠️ There is no auth server and no real OTP — the code below accepts a fixed
 * demo code and stores a flag in localStorage. It exists so every screen and
 * state in the sign-in flow is designed and reachable.
 *
 * ▶ Backend swap: `requestOtp` → `POST /auth/otp`, `verifyOtp` → `POST /auth/verify`
 *   returning a session cookie. Nothing else in the UI changes.
 */
export const DEMO_OTP = "11111";

interface AuthContextValue {
  user: User | null;
  addresses: Address[];
  isAuthenticated: boolean;
  hydrating: boolean;
  /** Phone currently going through verification. */
  pendingPhone: string | null;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<{ ok: boolean; isNewUser: boolean; message?: string }>;
  completeProfile: (data: { firstName: string; lastName: string; email?: string }) => void;
  updateUser: (data: Partial<User>) => void;
  addAddress: (address: Omit<Address, "id">) => Address;
  updateAddress: (id: string, data: Partial<Address>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { user?: User; addresses?: Address[] };
        if (parsed.user) setUser(parsed.user);
        if (parsed.addresses?.length) setAddresses(parsed.addresses);
      }
    } catch {
      // Ignore a corrupted session and stay signed out.
    }
    setHydrating(false);
  }, []);

  const persist = useCallback((nextUser: User | null, nextAddresses: Address[]) => {
    try {
      if (nextUser) localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, addresses: nextAddresses }));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Non-fatal: the session simply won't survive a reload.
    }
  }, []);

  const requestOtp = useCallback(async (phone: string) => {
    setPendingPhone(toLatinDigits(phone).replace(/\s/g, ""));
    await new Promise((r) => setTimeout(r, 700));
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    await new Promise((r) => setTimeout(r, 700));
    if (toLatinDigits(code) !== DEMO_OTP) {
      return { ok: false, isNewUser: false, message: "کد وارد شده صحیح نیست. دوباره تلاش کنید." };
    }
    // Demo rule: the seeded account signs straight in, any other number is new.
    const isKnown = pendingPhone === mockUser.phone;
    const nextUser: User = isKnown
      ? mockUser
      : {
          id: `u-${Date.now()}`,
          phone: pendingPhone ?? "",
          createdAt: new Date().toISOString(),
          smsNotifications: true,
        };
    const nextAddresses = isKnown ? mockAddresses : [];
    setUser(nextUser);
    setAddresses(nextAddresses);
    persist(nextUser, nextAddresses);
    return { ok: true, isNewUser: !isKnown };
  }, [pendingPhone, persist]);

  const completeProfile = useCallback((data: { firstName: string; lastName: string; email?: string }) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...data };
      persist(next, addresses);
      return next;
    });
  }, [addresses, persist]);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...data };
      persist(next, addresses);
      return next;
    });
  }, [addresses, persist]);

  const addAddress = useCallback((address: Omit<Address, "id">) => {
    const created: Address = { ...address, id: `a-${Date.now()}` };
    setAddresses((list) => {
      const next = created.isDefault
        ? [...list.map((a) => ({ ...a, isDefault: false })), created]
        : [...list, created];
      persist(user, next);
      return next;
    });
    return created;
  }, [user, persist]);

  const updateAddress = useCallback((id: string, data: Partial<Address>) => {
    setAddresses((list) => {
      const next = list.map((a) => (a.id === id ? { ...a, ...data } : a));
      persist(user, next);
      return next;
    });
  }, [user, persist]);

  const removeAddress = useCallback((id: string) => {
    setAddresses((list) => {
      const next = list.filter((a) => a.id !== id);
      // Never leave the account without a default address.
      if (next.length && !next.some((a) => a.isDefault)) next[0] = { ...next[0], isDefault: true };
      persist(user, next);
      return next;
    });
  }, [user, persist]);

  const setDefaultAddress = useCallback((id: string) => {
    setAddresses((list) => {
      const next = list.map((a) => ({ ...a, isDefault: a.id === id }));
      persist(user, next);
      return next;
    });
  }, [user, persist]);

  const logout = useCallback(() => {
    setUser(null);
    setPendingPhone(null);
    persist(null, addresses);
  }, [addresses, persist]);

  const value = useMemo<AuthContextValue>(() => ({
    user, addresses, isAuthenticated: !!user, hydrating, pendingPhone,
    requestOtp, verifyOtp, completeProfile, updateUser,
    addAddress, updateAddress, removeAddress, setDefaultAddress, logout,
  }), [user, addresses, hydrating, pendingPhone, requestOtp, verifyOtp, completeProfile,
       updateUser, addAddress, updateAddress, removeAddress, setDefaultAddress, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
