import { ShieldCheck, Sparkles, Zap } from "lucide-react";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";

const headingFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

const highlights = [
  {
    icon: ShieldCheck,
    title: "Secure Stock Control",
    text: "Role-ready workflows and token-based sessions for reliable access.",
  },
  {
    icon: Zap,
    title: "Realtime Operations",
    text: "Track products, orders, and restock queues with instant visibility.",
  },
  {
    icon: Sparkles,
    title: "Actionable Insights",
    text: "Operational dashboards and activity timelines designed for scale.",
  },
];

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div
      className={`${headingFont.variable} ${bodyFont.variable} auth-mesh-bg min-h-screen text-slate-100`}
      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
    >
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden border-r border-white/10 px-10 py-12 lg:flex lg:flex-col lg:justify-between xl:px-14">
          <div className="auth-grid-pattern absolute inset-0" />
          <div className="auth-orb auth-orb-indigo absolute -left-24 top-12" />
          <div className="auth-orb auth-orb-cyan absolute -right-24 bottom-8" />

          <div className="relative z-10 max-w-xl space-y-6">
            <p className="inline-flex items-center rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs tracking-[0.18em] text-cyan-200">
              SMART INVENTORY MANAGEMENT
            </p>
            <h1
              className="text-4xl font-semibold leading-tight text-white xl:text-5xl"
              style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
            >
              Inventory clarity for fast-moving teams.
            </h1>
            <p className="max-w-lg text-base text-slate-300">
              Manage stock, products, categories, and orders in a single workspace
              built for modern operations.
            </p>
          </div>

          <ul className="relative z-10 mt-10 space-y-4">
            {highlights.map(({ icon: Icon, title: featureTitle, text }) => (
              <li
                key={featureTitle}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-lg bg-indigo-500/20 p-2 text-indigo-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p
                      className="text-sm font-semibold text-white"
                      style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
                    >
                      {featureTitle}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">{text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="relative flex items-center justify-center p-6 md:p-10">
          <div className="auth-orb auth-orb-indigo absolute -top-16 right-6 hidden md:block" />
          <div className="auth-orb auth-orb-cyan absolute -bottom-16 left-0 hidden md:block" />

          <div className="auth-glass-card w-full max-w-md p-7 sm:p-8">
            <div className="mb-6 auth-fade-up" style={{ animationDelay: "40ms" }}>
              <h2
                className="text-3xl font-semibold text-white"
                style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
              >
                {title}
              </h2>
              <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
            </div>

            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
