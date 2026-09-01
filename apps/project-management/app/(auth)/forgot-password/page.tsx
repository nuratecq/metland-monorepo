"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Email tidak valid.");
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link href="/login" className="text-sm font-medium text-[var(--color-primary)]">← Kembali ke halaman masuk</Link>
      <h1 className="mt-5 text-[32px] leading-10 font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>Lupa password</h1>

      {!sent ? (
        <div>
          <p className="mt-2.5 mb-8 text-[15px] leading-6 text-[var(--color-on-surface-variant)]">
            Masukkan email korporat Anda. Kami kirimkan tautan pengaturan ulang yang berlaku 30 menit.
          </p>
          <form onSubmit={submit}>
            <label className="block text-xs font-semibold tracking-widest uppercase text-[var(--color-on-surface-variant)]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@metland.co.id"
              className="mt-1.5 w-full h-11 px-3.5 border border-[#cbd5e1] rounded text-[15px] focus:outline-none focus:border-[var(--color-primary)]"
            />
            {error ? <div className="mt-2.5 text-[13px] text-[#93000a]">{error}</div> : null}
            <button
              type="submit"
              disabled={loading}
              className="mt-[26px] w-full h-12 rounded bg-[var(--color-primary)] text-white text-[15px] font-semibold hover:bg-[var(--color-primary-container)] disabled:opacity-70"
            >
              {loading ? "Mengirim…" : "Kirim tautan reset"}
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-6 p-5 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
          <div className="w-9 h-9 rounded-full bg-[var(--color-status-green)] text-white flex items-center justify-center text-lg font-bold">✓</div>
          <div className="mt-3.5 text-xl font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>Tautan terkirim</div>
          <div className="mt-2 text-[15px] leading-6 text-[var(--color-on-surface-variant)]">
            Kami mengirim tautan pengaturan ulang ke <strong>{email}</strong>. Periksa juga folder spam bila belum masuk dalam 5 menit.
          </div>
          <Link
            href="/login"
            className="mt-5 inline-flex h-11 items-center px-5 rounded border border-[var(--color-outline-variant)] bg-white text-sm font-semibold text-[var(--color-on-surface-variant)]"
          >
            Kembali ke halaman masuk
          </Link>
        </div>
      )}
    </div>
  );
}
