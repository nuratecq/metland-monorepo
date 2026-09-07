"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass, remember }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Email atau password salah.");
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-[32px] leading-10 font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>Masuk</h1>
      <p className="mt-2.5 mb-8 text-[15px] text-[var(--color-on-surface-variant)]">Gunakan email korporat Anda.</p>

      {error ? (
        <div className="mb-4.5 mb-[18px] px-3.5 py-3 rounded bg-[var(--color-error-container)] border border-[#f5b8b3] text-[#93000a] text-sm">
          {error}
        </div>
      ) : null}

      <form onSubmit={submit}>
        <label className="block text-xs font-semibold tracking-widest uppercase text-[var(--color-on-surface-variant)]">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@company.com"
          className="mt-1.5 w-full h-11 px-3.5 border border-[#cbd5e1] rounded bg-white text-[15px] focus:outline-none focus:border-[var(--color-primary)]"
        />

        <div className="mt-4.5 mt-[18px] flex items-baseline justify-between">
          <label className="text-xs font-semibold tracking-widest uppercase text-[var(--color-on-surface-variant)]">Password</label>
          <Link href="/forgot-password" className="text-[13px] font-medium text-[var(--color-primary)]">Lupa password?</Link>
        </div>
        <input
          type="password"
          required
          minLength={8}
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="••••••••"
          className="mt-1.5 w-full h-11 px-3.5 border border-[#cbd5e1] rounded bg-white text-[15px] focus:outline-none focus:border-[var(--color-primary)]"
        />

        <label className="mt-[18px] flex items-center gap-2.5 text-sm text-[var(--color-on-surface-variant)] cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer"
          />
          Ingat perangkat ini selama 30 hari
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-[26px] w-full h-12 rounded bg-[var(--color-primary)] text-white text-[15px] font-semibold hover:bg-[var(--color-primary-container)] disabled:opacity-70"
        >
          {loading ? "Memproses…" : "Masuk"}
        </button>

        <div className="mt-6 text-center text-sm text-[var(--color-on-surface-variant)]">
          Belum punya akses? <Link href="/" className="text-[var(--color-primary)] font-medium">Hubungi admin IT</Link>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
