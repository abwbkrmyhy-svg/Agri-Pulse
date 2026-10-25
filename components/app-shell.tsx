"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  CloudSun,
  Droplets,
  LayoutDashboard,
  Map,
  Menu,
  Settings,
  Sprout,
  Sun,
  X,
  CheckCircle2,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Wordmark } from "@/components/logo";
import { useFarm } from "@/providers/farm-provider";
import { ALERTS, FARM } from "@/lib/data";
import { severityMeta } from "@/lib/format";
import { cx } from "@/lib/format";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard, hint: "Today on the farm" },
  { href: "/fields", label: "Fields & map", icon: Map, hint: "Plots and boundaries" },
  { href: "/irrigation", label: "Irrigation", icon: Droplets, hint: "Water balance & plans" },
  { href: "/weather", label: "Weather", icon: CloudSun, hint: "Forecast & warnings" },
  { href: "/health", label: "Crop health", icon: Sprout, hint: "NDVI & soil analytics" },
];

const TITLES: Record<string, { title: string; sub: string }> = {
  "/": { title: "Farm overview", sub: "Everything that needs your attention today" },
  "/fields": { title: "Fields & map", sub: "Map, measure and manage every plot" },
  "/irrigation": { title: "Irrigation studio", sub: "FAO-56 water balance and application plans" },
  "/weather": { title: "Weather", sub: "Hyper-local forecast for Riverside Farm" },
  "/health": { title: "Crop health", sub: "Satellite NDVI, soil tests and growth stages" },
  "/settings": { title: "Settings", sub: "Farm profile, integrations and devices" },
};

const TODAY_LABEL = "Thu 22 Oct";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sunlight, toggleSunlight, notices, dismissNotice } = useFarm();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const meta = TITLES[pathname] ?? TITLES["/"];

  useEffect(() => {
    setMobileOpen(false);
    setAlertsOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (popRef.current && !popRef.current.contains(event.target as Node)) {
        setAlertsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="relative hidden overflow-hidden bg-canopy-950 lg:flex lg:h-screen lg:flex-col lg:sticky lg:top-0">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #9ed44b 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-canopy-500/25 blur-3xl" />
        <div className="relative flex h-full flex-col px-4 pb-4 pt-6">
          <Link href="/" className="px-2" aria-label="AgriPulse home">
            <Wordmark />
          </Link>

          <button
            type="button"
            className="mt-7 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-left transition hover:bg-white/10"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime-400/15 text-lime-400">
              <Sprout size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-white">
                {FARM.name}
              </span>
              <span className="block truncate text-[10px] text-canopy-300">
                {FARM.location} · {FARM.elevationM} m
              </span>
            </span>
            <ChevronDown size={14} className="text-canopy-300" />
          </button>

          <nav className="mt-6 space-y-1" aria-label="Main">
            <p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-canopy-400">
              Workspace
            </p>
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
                    active
                      ? "bg-white/[0.09] text-white"
                      : "text-canopy-200 hover:bg-white/[0.05] hover:text-white",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-lime-400" />
                  )}
                  <Icon
                    size={17}
                    className={active ? "text-lime-400" : "text-canopy-300 group-hover:text-lime-400"}
                    strokeWidth={active ? 2.2 : 1.9}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/" && (
                    <span className="rounded-md bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-200">
                      2
                    </span>
                  )}
                </Link>
              );
            })}

            <p className="px-3 pb-2 pt-5 text-[9px] font-semibold uppercase tracking-[0.2em] text-canopy-400">
              Farm
            </p>
            <Link
              href="/settings"
              className={cx(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
                pathname === "/settings"
                  ? "bg-white/[0.09] text-white"
                  : "text-canopy-200 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              <Settings size={17} className="text-canopy-300 group-hover:text-lime-400" />
              Settings
            </Link>
          </nav>

          <div className="mt-auto space-y-3">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-canopy-800/80 to-canopy-900/60 p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-canopy-300">
                  Water saved
                </p>
                <span className="text-[11px] font-bold text-lime-400">+24%</span>
              </div>
              <p className="mt-1 font-display text-[22px] font-semibold leading-none text-white">
                1,284 m³
              </p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-lime-500 to-lime-400" />
              </div>
              <p className="mt-2 text-[10px] text-canopy-300">
                vs. the same period last season
              </p>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl px-1 py-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-400 text-[11px] font-bold text-canopy-950">
                AW
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-white">
                  {FARM.manager}
                </p>
                <p className="text-[10px] text-canopy-300">Farm manager</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-lime-400" title="Online" />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-canopy-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[280px] flex-col bg-canopy-950 p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <Wordmark />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-canopy-200 hover:bg-white/10"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="mt-6 space-y-1">
              {[...NAV, { href: "/settings", label: "Settings", icon: Settings, hint: "" }].map(
                (item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cx(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",
                        active
                          ? "bg-white/10 text-white"
                          : "text-canopy-200 hover:bg-white/5",
                      )}
                    >
                      <Icon size={18} className={active ? "text-lime-400" : "text-canopy-300"} />
                      {item.label}
                    </Link>
                  );
                },
              )}
            </nav>
            <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-canopy-300">Farm</p>
              <p className="mt-1 text-sm font-semibold text-white">{FARM.name}</p>
              <p className="text-[11px] text-canopy-300">{FARM.location}</p>
            </div>
          </div>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-[#e3e6dd]/80 bg-[#f7f7f2]/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:h-[72px] lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-ink hover:bg-canopy-50 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-[17px] font-semibold tracking-[-0.02em] text-ink sm:text-[19px]">
                {meta.title}
              </h1>
              <p className="hidden truncate text-[11px] text-[#5b6b61] sm:block">
                {meta.sub}
              </p>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <span className="flex items-center gap-2 rounded-full border border-[#e3e6dd] bg-white px-3 py-1.5 text-[11px] font-semibold text-ink shadow-sm">
                <CloudSun size={15} className="text-canopy-600" />
                27°C
                <span className="h-3 w-px bg-[#e3e6dd]" />
                <span className="font-medium text-[#5b6b61]">{TODAY_LABEL}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={toggleSunlight}
              aria-pressed={sunlight}
              className={cx(
                "flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition sm:px-3",
                sunlight
                  ? "border-amber-300 bg-amber-100 text-amber-900"
                  : "border-[#e3e6dd] bg-white text-[#415047] hover:border-canopy-300",
              )}
              title="Toggle high-contrast sunlight mode"
            >
              <Sun size={15} className={sunlight ? "text-amber-700" : "text-amber-500"} />
              <span className="hidden sm:inline">
                {sunlight ? "Sunlight on" : "Sunlight mode"}
              </span>
            </button>

            <div className="relative" ref={popRef}>
              <button
                type="button"
                onClick={() => setAlertsOpen((o) => !o)}
                className="relative rounded-full border border-[#e3e6dd] bg-white p-2 text-[#415047] transition hover:border-canopy-300 hover:text-canopy-800"
                aria-label="Alerts"
                aria-expanded={alertsOpen}
              >
                <Bell size={17} />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              {alertsOpen && (
                <div className="absolute right-0 top-12 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#e3e6dd] bg-white shadow-lift">
                  <div className="flex items-center justify-between border-b border-[#eef0e9] px-4 py-3">
                    <p className="text-sm font-semibold">Alerts</p>
                    <span className="chip bg-red-50 text-red-700">2 critical</span>
                  </div>
                  <ul className="max-h-[340px] divide-y divide-[#f1f3ed] overflow-y-auto">
                    {ALERTS.map((alert) => {
                      const tone = severityMeta(alert.severity);
                      return (
                        <li key={alert.id} className="px-4 py-3">
                          <div className="flex items-start gap-2.5">
                            <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", tone.dot)} />
                            <div>
                              <p className="text-[12.5px] font-semibold leading-snug">
                                {alert.title}
                              </p>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-[#5b6b61]">
                                {alert.body}
                              </p>
                              <p className="mt-1 text-[10px] text-[#5f6e64]">{alert.time}</p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <Link
                    href="/irrigation"
                    className="block border-t border-[#eef0e9] px-4 py-3 text-center text-[12px] font-semibold text-canopy-700 hover:bg-canopy-50"
                  >
                    Open irrigation planner
                  </Link>
                </div>
              )}
            </div>

            <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-canopy-800 text-[11px] font-bold text-lime-400 sm:flex">
              AW
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dfe4d9] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "flex min-h-[60px] flex-col items-center justify-center gap-1 text-[9px] font-semibold transition",
                  active ? "text-canopy-800" : "text-[#5b6b61]",
                )}
              >
                <span
                  className={cx(
                    "flex h-8 w-12 items-center justify-center rounded-full transition",
                    active ? "bg-canopy-100" : "bg-transparent",
                  )}
                >
                  <Icon size={19} strokeWidth={active ? 2.3 : 1.9} />
                </span>
                {item.label.split(" ")[0]}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2 lg:bottom-6">
        {notices.map((notice) => {
          const Icon =
            notice.tone === "warning"
              ? AlertTriangle
              : notice.tone === "info"
                ? Info
                : CheckCircle2;
          return (
            <div
              key={notice.id}
              className={cx(
                "toast-in pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-white px-3.5 py-3 shadow-lift",
                notice.tone === "warning"
                  ? "border-amber-200"
                  : notice.tone === "info"
                    ? "border-sky-200"
                    : "border-canopy-200",
              )}
              role="status"
            >
              <Icon
                size={17}
                className={cx(
                  "mt-0.5 shrink-0",
                  notice.tone === "warning"
                    ? "text-amber-600"
                    : notice.tone === "info"
                      ? "text-sky-600"
                      : "text-canopy-600",
                )}
              />
              <p className="flex-1 text-[12px] font-medium leading-snug text-ink">
                {notice.message}
              </p>
              <button
                type="button"
                onClick={() => dismissNotice(notice.id)}
                className="rounded p-0.5 text-[#5f6e64] hover:bg-sand-100 hover:text-ink"
                aria-label="Dismiss"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
