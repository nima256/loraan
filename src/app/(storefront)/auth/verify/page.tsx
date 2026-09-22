"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/store/AuthProvider";
import { formatPhone, formatTimer, toLatinDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 5;
const RESEND_SECONDS = 90;

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const { pendingPhone, verifyOtp, requestOtp, completeProfile } = useAuth();
  const redirect = params.get("redirect") ?? "/account";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [needsProfile, setNeedsProfile] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // No phone in flight means the user landed here directly.
  useEffect(() => {
    if (!pendingPhone) router.replace(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
  }, [pendingPhone, router, redirect]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  const submit = useCallback(async (code: string) => {
    setLoading(true);
    const result = await verifyOtp(code);
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? "کد وارد شده صحیح نیست.");
      setDigits(Array(OTP_LENGTH).fill(""));
      inputs.current[0]?.focus();
      return;
    }
    if (result.isNewUser) {
      setNeedsProfile(true);
      return;
    }
    toast({ tone: "success", title: "خوش آمدید", description: "با موفقیت وارد حساب خود شدید." });
    router.push(redirect);
  }, [verifyOtp, router, redirect, toast]);

  const setDigit = (index: number, value: string) => {
    const clean = toLatinDigits(value).replace(/\D/g, "");
    setError(null);

    // Pasting the whole code fills every box at once.
    if (clean.length > 1) {
      const next = clean.slice(0, OTP_LENGTH).split("");
      const filled = [...Array(OTP_LENGTH)].map((_, i) => next[i] ?? "");
      setDigits(filled);
      if (next.length >= OTP_LENGTH) submit(filled.join(""));
      else inputs.current[next.length]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
    if (next.every((d) => d)) submit(next.join(""));
  };

  const onKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
    // RTL note: the boxes read right-to-left, so ArrowRight moves to the previous box.
    if (event.key === "ArrowRight" && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const resend = async () => {
    if (!pendingPhone || seconds > 0) return;
    await requestOtp(pendingPhone);
    setSeconds(RESEND_SECONDS);
    setDigits(Array(OTP_LENGTH).fill(""));
    setError(null);
    inputs.current[0]?.focus();
    toast({ tone: "info", title: "کد تأیید دوباره ارسال شد" });
  };

  if (needsProfile) {
    return <CompleteProfile onDone={(data) => { completeProfile(data); router.push(redirect); }} />;
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
      <Link
        href={`/auth/login?redirect=${encodeURIComponent(redirect)}`}
        className="inline-flex min-h-9 items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowRight className="size-4" aria-hidden />
        تغییر شماره موبایل
      </Link>

      <h1 className="mt-4 text-xl font-bold text-fg">کد تأیید را وارد کنید</h1>
      <p className="mt-2 text-sm leading-7 text-fg-muted">
        کد ۵ رقمی به شماره{" "}
        <span className="tnum font-medium text-fg" dir="ltr">{pendingPhone ? formatPhone(pendingPhone) : ""}</span>{" "}
        پیامک شد.
      </p>

      <div
        className="mt-6 flex justify-center gap-2"
        role="group"
        aria-label="کد تأیید پنج رقمی"
        dir="ltr"
      >
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={OTP_LENGTH}
            value={digit}
            aria-label={`رقم ${i + 1} از ۵`}
            aria-invalid={!!error || undefined}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            className={cn(
              "tnum size-14 rounded-md border bg-surface text-center text-2xl font-bold text-fg",
              "focus:outline-none focus:ring-2 focus:ring-primary/25",
              error ? "border-danger focus:border-danger" : "border-border-strong focus:border-primary"
            )}
          />
        ))}
      </div>

      {error && <p role="alert" className="mt-3 text-center text-sm text-danger">{error}</p>}

      <Button
        size="lg"
        fullWidth
        className="mt-6"
        loading={loading}
        disabled={digits.some((d) => !d)}
        onClick={() => submit(digits.join(""))}
      >
        تأیید و ورود
      </Button>

      <div className="mt-4 text-center text-sm">
        {seconds > 0 ? (
          <p className="tnum text-fg-muted" aria-live="polite">
            ارسال دوباره کد تا {formatTimer(seconds)} دیگر
          </p>
        ) : (
          <button type="button" onClick={resend} className="min-h-11 font-medium text-primary hover:underline dark:text-[color:var(--primary-soft-fg)]">
            ارسال دوباره کد تأیید
          </button>
        )}
      </div>

      <Alert tone="info" className="mt-6">
        حالت نمایشی: کد <strong className="tnum" dir="ltr">۱۱۱۱۱</strong> را وارد کنید.
      </Alert>
    </div>
  );
}

/** Shown only for a phone number that has no account yet. */
function CompleteProfile({ onDone }: { onDone: (data: { firstName: string; lastName: string; email?: string }) => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!firstName.trim()) next.firstName = "نام را وارد کنید.";
    if (!lastName.trim()) next.lastName = "نام خانوادگی را وارد کنید.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    onDone({ firstName: firstName.trim(), lastName: lastName.trim() });
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
      <h1 className="text-xl font-bold text-fg">تکمیل حساب کاربری</h1>
      <p className="mt-2 text-sm leading-7 text-fg-muted">
        شماره شما تأیید شد. برای اینکه سفارش‌ها به نام شما ثبت شود، نام و نام خانوادگی را وارد کنید.
      </p>
      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <Input
          label="نام"
          required
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => { setFirstName(e.target.value); setErrors((s) => ({ ...s, firstName: undefined })); }}
          error={errors.firstName}
        />
        <Input
          label="نام خانوادگی"
          required
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => { setLastName(e.target.value); setErrors((s) => ({ ...s, lastName: undefined })); }}
          error={errors.lastName}
        />
        <Button type="submit" size="lg" fullWidth loading={loading}>ادامه</Button>
      </form>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-xl" />}>
      <VerifyForm />
    </Suspense>
  );
}
