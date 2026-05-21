"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

type Step = "email" | "otp" | "password";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleSendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send code");
        return;
      }

      setCooldown(60);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];

    if (value.length > 1) {
      const digits = value.split("").filter((c) => /\d/.test(c)).slice(0, 6);
      digits.forEach((d, i) => {
        if (i + index < 6) newOtp[i + index] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(index + digits.length, 5);
      otpRefs.current[nextIdx]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code");
        return;
      }

      setStep("password");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/auth/login?registered=true");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const stepLabels: Record<Step, string> = {
    email: "Enter email",
    otp: "Verify email",
    password: "Create password",
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-indigo-600">DocTemplate</Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Create your account</h2>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2">
          {(["email", "otp", "password"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                step === s ? "bg-indigo-600 text-white" :
                (["email", "otp", "password"].indexOf(step) > i ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400")
              }`}>
                {["email", "otp", "password"].indexOf(step) > i ? (
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === s ? "text-indigo-600" : "text-gray-400"}`}>
                {stepLabels[s]}
              </span>
              {i < 2 && <div className={`h-px w-6 ${["email", "otp", "password"].indexOf(step) > i ? "bg-indigo-300" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Sending code..." : "Send Verification Code"}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  We sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>
                </p>
              </div>

              <div className="flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="h-12 w-11 rounded-lg border border-gray-300 text-center text-lg font-bold shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join("").length !== 6}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                  className="font-medium text-gray-500 hover:text-gray-700"
                >
                  Change email
                </button>
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={cooldown > 0}
                  className="font-medium text-indigo-600 hover:text-indigo-500 disabled:text-gray-400"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Password */}
          {step === "password" && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="rounded-lg bg-green-50 p-3 text-center text-sm text-green-700">
                Email verified! Now create your password.
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
