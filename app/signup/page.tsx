"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import AuthShell from "@/components/auth/AuthShell";

type SignupFormValues = {
  name: string;
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

export default function SignupPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    try {
      const { data } = await api.post("/api/auth/signup", values);
      login(data.token, data.user);

      toast.success("Account created! Redirecting...");
      router.replace("/dashboard");
    } catch (error: unknown) {
      const status =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { status?: number } }).response?.status === "number"
          ? (error as { response: { status: number } }).response.status
          : undefined;

      const message = errorMessage(error, "Something went wrong. Try again.");

      if (status === 400 && message.toLowerCase().includes("already")) {
        toast.error("Email already in use.");
        return;
      }

      toast.error(message);
    }
  }

  function onInvalid(fields: Partial<Record<keyof SignupFormValues, { message?: string }>>) {
    const firstField = fields.name || fields.email || fields.password;
    const message = firstField?.message || "Please check your input and try again.";
    toast.error(message);
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Get started with a secure, collaborative inventory workspace."
    >
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
        <div className="auth-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="relative">
            <input
              id="name"
              type="text"
              placeholder=" "
              autoComplete="name"
              {...register("name", {
                required: "Name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters",
                },
              })}
              className={`peer w-full rounded-xl border bg-white/5 px-4 pb-2 pt-6 text-sm text-white outline-none transition duration-200 placeholder:text-transparent focus:border-cyan-400 focus:shadow-[0_0_0_4px_rgba(6,182,212,0.2)] ${
                errors.name
                  ? "auth-shake border-red-400/90 shadow-[0_0_0_4px_rgba(248,113,113,0.18)]"
                  : "border-white/20"
              }`}
            />
            <label
              htmlFor="name"
              className="pointer-events-none absolute left-4 top-2 text-xs text-slate-300 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-cyan-300"
            >
              Full Name
            </label>
          </div>
        </div>

        <div className="auth-fade-up" style={{ animationDelay: "170ms" }}>
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

        <div className="auth-fade-up" style={{ animationDelay: "220ms" }}>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder=" "
              autoComplete="new-password"
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

        <div className="auth-fade-up" style={{ animationDelay: "280ms" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:scale-[1.01] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </div>

        <p
          className="text-center text-sm text-slate-300 auth-fade-up"
          style={{ animationDelay: "340ms" }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-cyan-300 transition hover:text-cyan-200"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
