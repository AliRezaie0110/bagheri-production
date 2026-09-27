import {
  BadgeCheck,
  BarChart3,
  Factory,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import {
  LoginForm,
} from "@/components/auth/login-form";

export function LoginScreen() {
  return (
    <main className="min-h-dvh bg-[var(--app-bg)] p-3 sm:p-6 lg:flex lg:items-center lg:justify-center">
      <div className="mx-auto grid min-h-[calc(100dvh-24px)] w-full max-w-[1180px] overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_30px_90px_rgba(15,23,42,.08)] sm:min-h-[calc(100dvh-48px)] lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative hidden overflow-hidden bg-[#0d2928] p-10 text-white lg:flex lg:flex-col">
          <div className="absolute -left-16 -top-20 size-72 rounded-full bg-emerald-300/10 blur-2xl" />
          <div className="absolute -bottom-24 -right-16 size-80 rounded-full bg-cyan-200/10 blur-3xl" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
              <Factory className="size-6" />
            </div>

            <div>
              <h2 className="text-lg font-black">
                تولیدی باقری
              </h2>

              <p className="mt-0.5 text-xs text-white/55">
                مدیریت یکپارچه تولید و حسابداری
              </p>
            </div>
          </div>

          <div className="relative z-10 my-auto max-w-lg py-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-emerald-100">
              <BadgeCheck className="size-3.5" />
              سامانه داخلی مجموعه
            </div>

            <h1 className="text-4xl font-black leading-[1.55] tracking-[-0.04em]">
              کار، ساعت و حساب‌ها
              <br />
              یک‌جا و بدون کاغذبازی
            </h1>

            <p className="mt-5 max-w-md text-sm leading-8 text-white/60">
              ثبت کار روزانه، کنترل سری‌کارها، تأیید سرپرست و حساب دقیق پرسنل در یک پنل ساده و قابل استفاده روی موبایل.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[.055] p-4">
                <UsersRound className="mb-4 size-5 text-emerald-200" />
                <p className="text-sm font-black">
                  پرسنل
                </p>
                <p className="mt-1 text-[11px] leading-5 text-white/45">
                  نقش و دسترسی مشخص
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[.055] p-4">
                <BarChart3 className="mb-4 size-5 text-emerald-200" />
                <p className="text-sm font-black">
                  حساب دقیق
                </p>
                <p className="mt-1 text-[11px] leading-5 text-white/45">
                  درآمد و مانده لحظه‌ای
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[.055] p-4">
                <ShieldCheck className="mb-4 size-5 text-emerald-200" />
                <p className="text-sm font-black">
                  کنترل‌شده
                </p>
                <p className="mt-1 text-[11px] leading-5 text-white/45">
                  ورود فقط با OTP
                </p>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-[11px] text-white/35">
            Bagheri Production Management System
          </p>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-[430px]">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}