import Image from "next/image";
import Link from "next/link";
import { Button } from "@metland/ui";
import { getSession } from "@/lib/auth";

const FEATURES = [
  {
    title: "Cari dengan bahasa natural",
    body: "“Kontraktor struktur untuk high rise di Bekasi” — tanpa filter berlapis, tanpa kode vendor.",
  },
  {
    title: "Bandingkan berbasis skor",
    body: "Kecocokan kontraktor dan material dinilai otomatis dari data historis, bukan tebak-tebakan.",
  },
  {
    title: "Persetujuan yang terlacak",
    body: "Rekomendasi mengalir ke procurement lewat alur approval yang punya jejak audit.",
  },
];

const FLOW = ["Search", "Discover", "Compare", "Recommend", "Approve"];

export default async function LandingPage() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="h-16 shrink-0 border-b border-[var(--color-outline-variant)]">
        <div className="mx-auto flex h-full max-w-[1120px] items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Metland" width={104} height={18} priority className="h-[18px] w-auto" />
            <span className="text-sm text-[var(--color-on-surface-variant)]">Catalogue</span>
          </div>
          <Link href={session ? "/dashboard" : "/login"}>
            <Button size="sm" className="text-white">{session ? "Buka Dashboard" : "Masuk"}</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-[1120px] px-6 py-20 md:py-28">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-primary)]">
            Procurement Intelligence
          </p>
          <h1
            className="mt-4 max-w-[720px] text-4xl font-bold leading-tight tracking-tight md:text-5xl"
            style={{ fontFamily: "var(--font-hanken)" }}
          >
            Temukan kontraktor & material yang tepat, lebih cepat.
          </h1>
          <p className="mt-5 max-w-[560px] text-base leading-relaxed text-[var(--color-on-surface-variant)]">
            Satu katalog untuk mencari, membandingkan, dan mengajukan persetujuan procurement di seluruh
            proyek Metland.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3 text-white">
            <Link href={session ? "/dashboard" : "/login"}>
              <Button size="lg">{session ? "Buka Dashboard" : "Mulai sekarang"}</Button>
            </Link>
            <Link href="/search">
              <Button size="lg" variant="secondary">
                Lihat AI Search
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-y border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
          <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-3 gap-y-2 px-6 py-5">
            {FLOW.map((step, i) => (
              <span key={step} className="flex items-center gap-3">
                {i > 0 && <span className="text-[var(--color-outline)]">·</span>}
                <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-on-surface-variant)]">
                  {step}
                </span>
              </span>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-[1120px] gap-8 px-6 py-20 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <div className="h-1 w-8 rounded bg-[var(--color-primary)]" />
              <h2 className="mt-4 text-lg font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>
                {f.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-on-surface-variant)]">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-[var(--color-outline-variant)]">
        <div className="mx-auto max-w-[1120px] px-6 py-6 font-mono text-xs text-[var(--color-on-surface-variant)]">
          PT Metropolitan Land Tbk · 2026
        </div>
      </footer>
    </div>
  );
}
