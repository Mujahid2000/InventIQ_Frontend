"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import AuthShell from "@/components/auth/AuthShell";

type LoginFormValues = {
  email: string;
  password: string;
};

function errorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }
  return fallback;
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldPrefillDemo = params.get("demo") === "1";
    if (!shouldPrefillDemo) return;

    const email = params.get("email") || "demo@test.com";
    const password = params.get("password") || "demo123";

    setValue("email", email, { shouldValidate: true });
    setValue("password", password, { shouldValidate: true });
  }, [setValue]);

  async function onSubmit(values: LoginFormValues) {
    try {
      const { data } = await api.post("/api/auth/login", values);
      login(data.token, data.user);

      toast.success("Login successful! Welcome back.");
      router.replace("/dashboard");
    } catch (error: unknown) {
      const status =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { status?: number } }).response?.status === "number"
          ? (error as { response: { status: number } }).response.status
          : undefined;

      if (status === 401) {
        toast.error("Invalid email or password.");
        return;
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        !(error as { response?: unknown }).response
      ) {
        toast.error("Something went wrong. Try again.");
        return;
      }

      toast.error("Something went wrong. Try again.");
    }
  }

  function onInvalid() {
    toast.error("Please check your input and try again.");
  }

  function fillDemoCredentials() {
    setValue("email", "demo@test.com", { shouldValidate: true });
    setValue("password", "demo123", { shouldValidate: true });
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage inventory, orders, and restock workflows."
    >
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
        <div className="auth-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="relative">
            <input
              id="email"
              type="email"
              placeholder=" "
              autoComplete="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: "Please enter a valid email",
                },
              })}
              className={`peer w-full rounded-xl border bg-white/5 px-4 pb-2 pt-6 text-sm text-white outline-none transition duration-200 placeholder:text-transparent focus:border-cyan-400 focus:shadow-[0_0_0_4px_rgba(6,182,212,0.2)] ${
                errors.email
                  ? "auth-shake border-red-400/90 shadow-[0_0_0_4px_rgba(248,113,113,0.18)]"
                  : "border-white/20"
              }`}
            />
            <label
              htmlFor="email"
              className="pointer-events-none absolute left-4 top-2 text-xs text-slate-300 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-cyan-300"
            >
              Email Address
            </label>
          </div>
        </div>

        <div className="auth-fade-up" style={{ animationDelay: "180ms" }}>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder=" "
              autoComplete="current-password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              className={`peer w-full rounded-xl border bg-white/5 px-4 pb-2 pt-6 pr-12 text-sm text-white outline-none transition duration-200 placeholder:text-transparent focus:border-cyan-400 focus:shadow-[0_0_0_4px_rgba(6,182,212,0.2)] ${
                errors.password
                  ? "auth-shake border-red-400/90 shadow-[0_0_0_4px_rgba(248,113,113,0.18)]"
                  : "border-white/20"
              }`}
            />
            <label
              htmlFor="password"
              className="pointer-events-none absolute left-4 top-2 text-xs text-slate-300 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-cyan-300"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-3 auth-fade-up" style={{ animationDelay: "240ms" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:scale-[1.01] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          <button
            type="button"
            onClick={fillDemoCredentials}
            className="w-full rounded-xl border border-cyan-300/40 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200 transition duration-200 hover:scale-[1.01] hover:bg-cyan-500/20"
          >
            Demo Login
          </button>
        </div>

        <p
          className="text-center text-sm text-slate-300 auth-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          New to Smart Inventory?{" "}
          <Link
            href="/signup"
            className="font-semibold text-cyan-300 transition hover:text-cyan-200"
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
