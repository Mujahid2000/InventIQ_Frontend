"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardList,
  LockKeyhole,
  Menu,
  Package,
  RefreshCcw,
  ShoppingCart,
  X,
} from "lucide-react";

type FeatureItem = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const FEATURES: FeatureItem[] = [
  {
    title: "Live Stock Tracking",
    description: "Automatically deduct inventory as orders are created and fulfilled.",
    icon: Package,
  },
  {
    title: "Order Management",
    description: "Handle the full order lifecycle from pending to delivered in one place.",
    icon: ShoppingCart,
  },
  {
    title: "Restock Queue",
    description: "Get priority-based alerts when products fall below thresholds.",
    icon: RefreshCcw,
  },
  {
    title: "Dashboard Analytics",
    description: "Track daily revenue, order trends, and inventory health instantly.",
    icon: BarChart3,
  },
  {
    title: "Secure Auth",
    description: "JWT-based authentication keeps access safe and role-aware.",
    icon: LockKeyhole,
  },
  {
    title: "Activity Logs",
    description: "Maintain a complete audit trail across products, orders, and restocks.",
    icon: ClipboardList,
  },
];

const HOW_STEPS = [
  {
    title: "Add Products & Categories",
    description: "Build your catalog and define minimum stock thresholds in minutes.",
  },
  {
    title: "Create & Manage Orders",
    description: "Process orders with clear status progression and live stock updates.",
  },
  {
    title: "Track Stock & Restock",
    description: "Act on low-stock alerts before they become lost sales.",
  },
];

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [howVisible, setHowVisible] = useState(false);
  const howRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("auth_token");
    if (token) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 14);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const node = howRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHowVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-[#080C14]" />;
  }

  return (
    <div
      className="relative min-h-screen bg-[#080C14] text-slate-100"
      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
    >
      <div className="pointer-events-none absolute inset-0 iq-dot-grid" />
      <div className="pointer-events-none absolute left-1/2 top-[-180px] h-[560px] w-[560px] -translate-x-1/2 rounded-full iq-hero-glow" />

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/10 bg-[#0b1220]/72 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl"
            : "border-b border-transparent bg-[#080C14]/72 backdrop-blur-lg"
        }`}
      >
        <nav className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04]">
              <Boxes className="h-4 w-4 text-indigo-300" />
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="iq-logo-pulse h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span
                className="text-lg font-extrabold tracking-tight text-white"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                InventIQ
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <div className="flex items-center gap-6 text-sm text-slate-300">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200 transition duration-200 hover:scale-[1.02] hover:bg-white/[0.07]"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(99,102,241,0.35)] transition duration-200 hover:scale-[1.02] hover:brightness-110"
              >
                Get Started
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] text-slate-100 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {mobileOpen ? (
          <div className="border-t border-white/10 bg-[#0b1220]/90 px-5 py-4 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-3 text-sm text-slate-200">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-2 py-1.5 hover:bg-white/[0.06]"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex items-center gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-center"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-xl bg-indigo-500 px-4 py-2 text-center font-semibold text-white"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24 pt-32 sm:px-8 sm:pt-36">
        <section className="pb-20 text-center sm:pb-24">
          <div className="iq-fade-up" style={{ animationDelay: "100ms" }}>
            <span className="iq-badge-shimmer relative inline-flex items-center overflow-hidden rounded-full border border-indigo-400/40 bg-indigo-500/18 px-4 py-1.5 text-xs font-medium text-indigo-100 shadow-[0_0_20px_rgba(99,102,241,0.28)]">
              ✦ Smart Inventory Platform
            </span>
          </div>

          <h1
            className="iq-fade-up mx-auto mt-7 max-w-4xl text-balance text-5xl font-extrabold leading-[1.05] text-white sm:text-6xl lg:text-7xl"
            style={{ animationDelay: "200ms", fontFamily: "var(--font-syne), sans-serif" }}
          >
            <span className="block">Manage stock.</span>
            <span className="block bg-gradient-to-r from-indigo-300 via-indigo-400 to-violet-300 bg-clip-text text-transparent">
              Ship faster.
            </span>
            <span className="block">Sell smarter.</span>
          </h1>

          <p
            className="iq-fade-up mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg"
            style={{ animationDelay: "300ms" }}
          >
            InventIQ gives modern teams a single command center for products, orders,
            restock automation, and operational visibility.
          </p>

          <div
            className="iq-fade-up mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "400ms" }}
          >
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.35)] transition duration-200 hover:scale-[1.02] hover:brightness-110"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login?demo=1"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-200 transition duration-200 hover:scale-[1.02] hover:bg-white/[0.08]"
            >
              Demo Login
            </Link>
          </div>

          <div
            className="iq-fade-up mx-auto mt-9 flex w-full max-w-2xl flex-wrap items-center justify-center gap-4 text-sm text-slate-300"
            style={{ animationDelay: "500ms" }}
          >
            <div className="px-1 font-medium text-slate-100">10k+ Orders</div>
            <span className="h-5 w-px bg-white/15" />
            <div className="px-1 font-medium text-slate-100">99.9% Uptime</div>
            <span className="h-5 w-px bg-white/15" />
            <div className="px-1 font-medium text-slate-100">500+ Businesses</div>
          </div>
        </section>

        <section id="features" className="scroll-mt-28 pb-20 sm:pb-24">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">
            Features
          </p>
          <h2
            className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            Everything you need to run your inventory
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="iq-feature-card rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
                >
                  <div className="inline-flex rounded-xl border border-indigo-300/30 bg-indigo-500/16 p-2.5 text-indigo-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" ref={howRef} className="scroll-mt-28 pb-20 sm:pb-24">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">
            How It Works
          </p>
          <h2
            className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            From setup to fulfillment in three clear steps
          </h2>

          <div className="relative mt-10">
            <div className="pointer-events-none absolute left-[12%] right-[12%] top-7 hidden border-t border-dashed border-white/20 lg:block" />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {HOW_STEPS.map((step, index) => (
                <article
                  key={step.title}
                  className={`rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition duration-500 ${
                    howVisible ? "iq-reveal-in" : "iq-reveal"
                  }`}
                  style={{ transitionDelay: `${index * 120}ms` }}
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-28 pb-20 sm:pb-24">
          <div className="rounded-3xl border border-indigo-400/35 bg-[#0f1729] px-6 py-10 shadow-[0_0_0_1px_rgba(167,139,250,0.14),0_18px_60px_rgba(99,102,241,0.2)] sm:px-10">
            <h2
              className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              Ready to take control of your inventory?
            </h2>
            <p className="mt-3 text-base text-slate-300">
              Start free. No credit card required.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.35)] transition duration-200 hover:scale-[1.02] hover:brightness-110"
              >
                Get Started
              </Link>
              <Link
                href="/login?demo=1"
                className="inline-flex items-center gap-1 text-sm font-medium text-violet-200 transition hover:text-white"
              >
                Or try demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.08]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="inline-flex items-center gap-2 text-white">
              <span className="iq-logo-pulse h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span style={{ fontFamily: "var(--font-syne), sans-serif" }}>InventIQ</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Smart Inventory & Order Management for modern teams.
            </p>
          </div>

          <div className="flex items-center gap-5 text-sm text-slate-300">
            <Link href="https://github.com" className="transition hover:text-white">
              GitHub
            </Link>
            <Link href="/login?demo=1" className="transition hover:text-white">
              Live Demo
            </Link>
            <Link href="/" className="transition hover:text-white">
              Documentation
            </Link>
          </div>
        </div>
        <div className="border-t border-white/[0.08] py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} InventIQ. All rights reserved.
        </div>
      </footer>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        @keyframes iqFadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes iqShimmer {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(170%);
          }
        }

        @keyframes iqPulse {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.35);
          }
          50% {
            transform: scale(1.22);
            box-shadow: 0 0 0 8px rgba(74, 222, 128, 0);
          }
        }

        .iq-fade-up {
          opacity: 0;
          transform: translateY(16px);
          animation: iqFadeUp 680ms cubic-bezier(0.2, 0.65, 0.2, 1) forwards;
        }

        .iq-logo-pulse {
          animation: iqPulse 1.8s ease-in-out infinite;
        }

        .iq-badge-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 40%;
          background: linear-gradient(
            100deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.25) 48%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: iqShimmer 2.5s linear infinite;
        }

        .iq-feature-card {
          transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
        }

        .iq-feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(99, 102, 241, 0.58);
          box-shadow: 0 14px 34px rgba(99, 102, 241, 0.18);
        }

        .iq-dot-grid {
          background-image: radial-gradient(rgba(255, 255, 255, 0.08) 0.6px, transparent 0.6px);
          background-size: 20px 20px;
          opacity: 0.28;
          mask-image: radial-gradient(ellipse at center, black 52%, transparent 100%);
        }

        .iq-hero-glow {
          background: radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(167, 139, 250, 0.09) 34%, rgba(8, 12, 20, 0) 72%);
          filter: blur(8px);
        }

        .iq-reveal {
          opacity: 0;
          transform: translateY(18px);
        }

        .iq-reveal-in {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          .iq-fade-up,
          .iq-logo-pulse,
          .iq-badge-shimmer::after {
            animation: none !important;
            opacity: 1;
            transform: none;
          }

          .iq-reveal,
          .iq-reveal-in {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
