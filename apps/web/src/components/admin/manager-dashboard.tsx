"use client";

import type {
  LucideIcon,
} from "lucide-react";

import {
  Boxes,
  BriefcaseBusiness,
  FileSpreadsheet,
  LayoutDashboard,
  Scissors,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  AppShell,
} from "@/components/layout/app-shell";

import {
  PersonnelSection,
} from "@/components/admin/personnel-section";

import type {
  AuthUser,
} from "@/lib/auth";

type Section =
  | "overview"
  | "personnel"
  | "owners"
  | "operations"
  | "batches"
  | "approvals"
  | "accounts"
  | "reports";

type NavItem = {
  id: Section;
  label: string;
  icon: LucideIcon;
};

type OverviewCard = {
  id: Section;
  title: string;
  description: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  {
    id:
      "overview",
    label:
      "داشبورد",
    icon:
      LayoutDashboard,
  },
  {
    id:
      "personnel",
    label:
      "پرسنل",
    icon:
      UsersRound,
  },
  {
    id:
      "owners",
    label:
      "صاحبکارها",
    icon:
      BriefcaseBusiness,
  },
  {
    id:
      "operations",
    label:
      "عملیات",
    icon:
      Scissors,
  },
  {
    id:
      "batches",
    label:
      "سری‌کارها",
    icon:
      Boxes,
  },
  {
    id:
      "approvals",
    label:
      "تأییدها",
    icon:
      ShieldCheck,
  },
  {
    id:
      "accounts",
    label:
      "حساب‌ها",
    icon:
      WalletCards,
  },
  {
    id:
      "reports",
    label:
      "گزارش‌ها",
    icon:
      FileSpreadsheet,
  },
];

const overviewCards: OverviewCard[] = [
  {
    id:
      "personnel",
    title:
      "پرسنل",
    description:
      "ثبت، ویرایش و دسترسی نیروها",
    icon:
      UsersRound,
  },
  {
    id:
      "owners",
    title:
      "صاحبکارها",
    description:
      "مدیریت طرف‌های حساب",
    icon:
      BriefcaseBusiness,
  },
  {
    id:
      "operations",
    title:
      "عملیات تولید",
    description:
      "عملیات و نرخ‌های دانه‌ای",
    icon:
      Scissors,
  },
  {
    id:
      "batches",
    title:
      "سری‌کارها",
    description:
      "تعریف و کنترل تولید",
    icon:
      Boxes,
  },
];

const upcomingLabels: Record<
  Exclude<
    Section,
    "overview" | "personnel"
  >,
  {
    title: string;
    description: string;
  }
> = {
  owners: {
    title:
      "صاحبکارها",
    description:
      "ثبت و مدیریت صاحبکارها در Stage 15B فعال می‌شود.",
  },

  operations: {
    title:
      "عملیات و نرخ‌ها",
    description:
      "مدیریت عملیات و تاریخچه نرخ‌ها در Stage 15B فعال می‌شود.",
  },

  batches: {
    title:
      "سری‌کارها",
    description:
      "ساخت سری و چک‌لیست عملیات در Stage 15B فعال می‌شود.",
  },

  approvals: {
    title:
      "تأییدها",
    description:
      "صف تأیید کار و ساعت در بخش بعدی پنل مدیر فعال می‌شود.",
  },

  accounts: {
    title:
      "حساب‌ها",
    description:
      "حساب کارکنان و صاحبکارها در بخش مالی فعال می‌شود.",
  },

  reports: {
    title:
      "گزارش‌ها",
    description:
      "گزارش‌های مالی و Excel در بخش گزارش‌ها فعال می‌شود.",
  },
};

export function ManagerDashboard({
  user,
}: {
  user: AuthUser;
}) {
  const [
    section,
    setSection,
  ] =
    useState<Section>(
      "overview",
    );

  const pendingSection =
    section !==
      "overview" &&
    section !==
      "personnel"
      ? upcomingLabels[
          section
        ]
      : null;

  return (
    <AppShell
      user={user}
      eyebrow="پنل مدیریت"
      title="مدیریت تولیدی"
      description="پرسنل، تولید، حساب‌ها و گزارش‌ها از همین پنل مدیریت می‌شوند."
    >
      <div className="mb-5 overflow-x-auto pb-1">
        <nav className="flex min-w-max gap-2 rounded-[22px] border border-[var(--line)] bg-white p-1.5 shadow-[0_6px_24px_rgba(15,23,42,.025)]">
          {navItems.map(
            (
              item,
            ) => {
              const Icon =
                item.icon;

              const active =
                section ===
                item.id;

              return (
                <button
                  key={
                    item.id
                  }
                  type="button"
                  onClick={
                    () =>
                      setSection(
                        item.id,
                      )
                  }
                  className={`flex h-11 items-center gap-2 rounded-2xl px-4 text-xs font-black transition ${
                    active
                      ? "bg-[var(--brand)] text-white shadow-[0_8px_20px_rgba(13,116,109,.16)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-soft)]"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            },
          )}
        </nav>
      </div>

      {section ===
        "overview" && (
        <section>
          <div className="overflow-hidden rounded-[28px] bg-[#102827] p-6 text-white shadow-[0_18px_45px_rgba(16,40,39,.14)] sm:p-8">
            <p className="text-xs font-black text-emerald-200/70">
              مدیریت تولیدی باقری
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              سلام {user.fullName}
            </h2>

            <p className="mt-3 max-w-2xl text-xs leading-7 text-white/55">
              پنل مدیر از این مرحله وارد حالت عملیاتی می‌شود. ابتدا مدیریت کامل پرسنل را می‌بندیم و سپس صاحبکار، عملیات، سری‌کار، حساب و گزارش‌ها روی همین ساختار اضافه می‌شوند.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map(
              (
                card,
              ) => {
                const Icon =
                  card.icon;

                return (
                  <button
                    key={
                      card.id
                    }
                    type="button"
                    onClick={
                      () =>
                        setSection(
                          card.id,
                        )
                    }
                    className="rounded-[24px] border border-[var(--line)] bg-white p-5 text-right shadow-[0_6px_24px_rgba(15,23,42,.025)] transition hover:-translate-y-0.5 hover:border-slate-300"
                  >
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
                      <Icon className="size-4" />
                    </div>

                    <p className="mt-4 text-sm font-black">
                      {card.title}
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
                      {card.description}
                    </p>
                  </button>
                );
              },
            )}
          </div>

          <div className="mt-4 rounded-[24px] border border-[var(--line)] bg-white p-5">
            <p className="text-sm font-black">
              وضعیت توسعه پنل
            </p>

            <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
              بخش پرسنل در همین Stage عملیاتی است. بقیه گزینه‌ها عمداً در منو حاضرند تا معماری نهایی پنل از همین حالا ثابت بماند و در Stageهای بعدی فقط محتوای واقعی آن‌ها اضافه شود.
            </p>
          </div>
        </section>
      )}

      {section ===
        "personnel" && (
        <PersonnelSection />
      )}

      {pendingSection && (
        <section className="rounded-[28px] border border-dashed border-[var(--line-strong)] bg-white p-10 text-center">
          <p className="text-base font-black">
            {pendingSection.title}
          </p>

          <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-[var(--muted)]">
            {pendingSection.description}
          </p>
        </section>
      )}
    </AppShell>
  );
}