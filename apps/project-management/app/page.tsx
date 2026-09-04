import Link from "next/link";
import { getDb } from "@/lib/turso";
import { getSession } from "@/lib/auth";

const MODULES = [
  {
    mark: "PM",
    title: "Manajemen Proyek",
    body: "Rencanakan milestone, pantau task lapangan, dan hitung kesehatan proyek secara otomatis dari satu basis data.",
    tags: ["Milestones", "Tasks"],
  },
  {
    mark: "AI",
    title: "AI Assistant",
    body: "Tanya pertanyaan tentang proyek, analisis data, identifikasi risiko, dan dapatkan rekomendasi tindakan berbasis data real-time.",
    tags: ["Insights", "Analisis"],
  },
  {
    mark: "OP",
    title: "Approval & Pelaporan",
    body: "Alur persetujuan terstruktur, notifikasi real-time, dan laporan mingguan tanpa rekap manual dari spreadsheet.",
    tags: ["Approvals", "Reports"],
  },
];

const BULLETS = [
  "Site manager mengunggah progres harian langsung dari lapangan.",
  "Sistem menghitung deviasi jadwal dan status kesehatan proyek otomatis.",
  "Proyek yang berisiko atau terlambat langsung ditandai untuk ditindaklanjuti.",
];

const STEPS = [
  { no: "01", title: "Rencanakan", body: "PM menyusun proyek, milestone, dan menugaskan task ke tim lapangan." },
  { no: "02", title: "Eksekusi", body: "Tim lapangan memperbarui progres dan status task setiap hari." },
  { no: "03", title: "Pantau", body: "Sistem menghitung ulang kesehatan proyek dan menandai risiko." },
  { no: "04", title: "Laporkan", body: "PM meninjau, menyetujui, dan membagikan laporan mingguan." },
];

async function getHeroData() {
  try {
    const db = getDb();
    const total = await db.execute("SELECT COUNT(*) as cnt FROM projects").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt));
    const onTrack = await db.execute("SELECT COUNT(*) as cnt FROM projects WHERE health_status='GREEN'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)).catch(() => 0);
    const atRisk = await db.execute("SELECT COUNT(*) as cnt FROM projects WHERE health_status='YELLOW'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)).catch(() => 0);
    const delayed = await db.execute("SELECT COUNT(*) as cnt FROM projects WHERE health_status='RED'").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)).catch(() => 0);
    const tasks = await db.execute("SELECT COUNT(*) as cnt FROM tasks").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)).catch(() => 0);
    const locations = await db.execute("SELECT COUNT(DISTINCT location_text) as cnt FROM projects WHERE location_text IS NOT NULL").then(r => Number((r.rows[0] as unknown as Record<string, number>).cnt)).catch(() => 0);
    const rows = await db
      .execute("SELECT project_code, name, progress FROM projects ORDER BY progress DESC LIMIT 4")
      .then(r => r.rows as unknown as { project_code: string; name: string; progress: number }[])
      .catch(() => []);
    return { total, onTrack, atRisk, delayed, tasks, locations, rows };
  } catch {
    return { total: 0, onTrack: 0, atRisk: 0, delayed: 0, tasks: 0, locations: 0, rows: [] };
  }
}

export default async function LandingPage() {
  const session = await getSession();
  const dashboardHref = session ? "/dashboard" : "/login";
  const hero = await getHeroData();

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="sticky top-0 z-20 bg-[var(--color-surface)]/95 backdrop-blur border-b border-[var(--color-outline-variant)]">
        <div className="max-w-[1440px] mx-auto px-8 h-[72px] flex items-center gap-10">
          <span className="font-bold tracking-tight text-lg" style={{ fontFamily: "var(--font-hanken)" }}>METLAND</span>
          <nav className="hidden md:flex items-center gap-7 ml-2">
            <a href="#modul" className="text-sm font-medium text-[var(--color-on-surface-variant)]">Modul</a>
            <a href="#kinerja" className="text-sm font-medium text-[var(--color-on-surface-variant)]">Kinerja</a>
            <a href="#alur" className="text-sm font-medium text-[var(--color-on-surface-variant)]">Alur Kerja</a>
          </nav>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <Link href="/login" className="h-10 px-4.5 flex items-center border border-[var(--color-outline-variant)] bg-white rounded text-sm font-semibold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
              Masuk
            </Link>
            <Link href={dashboardHref} className="h-10 px-5 flex items-center bg-[var(--color-primary)] rounded text-sm font-semibold text-white hover:bg-[var(--color-primary-container)]">
              Buka Dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-[1440px] mx-auto px-8 pt-16 pb-14 md:pt-[88px] md:pb-[72px] grid md:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
        <div>
          <div className="inline-flex items-center h-7 px-3 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] text-xs font-semibold tracking-wide uppercase">
            Digital Ecosystem · Internal
          </div>
          <h1 className="mt-5 text-4xl md:text-[56px] md:leading-[62px] font-bold tracking-tight text-[var(--color-on-surface)]" style={{ fontFamily: "var(--font-hanken)" }}>
            Satu ruang kendali untuk seluruh proyek konstruksi Metland.
          </h1>
          <p className="mt-6 max-w-[560px] text-lg leading-7 text-[var(--color-on-surface-variant)]">
            Progres lapangan, task tim, dan risiko jadwal — terkumpul dalam satu sistem operasional yang dipakai project manager, kontraktor, dan tim pengadaan setiap hari.
          </p>
          <div className="mt-9 flex items-center gap-3.5">
            <Link href="/login" className="h-12 px-6.5 flex items-center bg-[var(--color-primary)] rounded text-[15px] font-semibold text-white hover:bg-[var(--color-primary-container)]">
              Masuk ke Ecosystem
            </Link>
            <a href="#modul" className="h-12 px-5.5 flex items-center border border-[var(--color-outline-variant)] bg-white rounded text-[15px] font-semibold text-[var(--color-on-surface-variant)]">
              Lihat modul
            </a>
          </div>
          <div className="mt-11 flex gap-10">
            <div>
              <div className="text-3xl font-bold text-[var(--color-primary)]" style={{ fontFamily: "var(--font-hanken)" }}>{hero.total}</div>
              <div className="mt-0.5 text-[13px] text-[var(--color-on-surface-variant)]">proyek tercatat</div>
            </div>
            <div className="w-px bg-[var(--color-outline-variant)]" />
            <div>
              <div className="text-3xl font-bold text-[var(--color-primary)]" style={{ fontFamily: "var(--font-hanken)" }}>{hero.tasks}</div>
              <div className="mt-0.5 text-[13px] text-[var(--color-on-surface-variant)]">task terpantau</div>
            </div>
            <div className="w-px bg-[var(--color-outline-variant)]" />
            <div>
              <div className="text-3xl font-bold text-[var(--color-primary)]" style={{ fontFamily: "var(--font-hanken)" }}>{hero.locations}</div>
              <div className="mt-0.5 text-[13px] text-[var(--color-on-surface-variant)]">kawasan</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[var(--color-outline-variant)] rounded-lg overflow-hidden shadow-[0_18px_44px_rgba(23,29,28,0.08)]">
          <div className="h-10 px-3.5 flex items-center gap-2 bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)]">
            <div className="w-[9px] h-[9px] rounded-full bg-[var(--color-status-green)]" />
            <div className="font-mono text-xs text-[var(--color-data-mono)]">ecosystem.metland.co.id/projects</div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-[var(--color-outline-variant)] rounded p-3">
                <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-outline)]">On Track</div>
                <div className="mt-1.5 text-[28px] font-bold text-[var(--color-status-green)]" style={{ fontFamily: "var(--font-hanken)" }}>{hero.onTrack}</div>
              </div>
              <div className="border border-[var(--color-outline-variant)] rounded p-3">
                <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-outline)]">At Risk</div>
                <div className="mt-1.5 text-[28px] font-bold text-[var(--color-status-yellow)]" style={{ fontFamily: "var(--font-hanken)" }}>{hero.atRisk}</div>
              </div>
              <div className="border border-[var(--color-outline-variant)] rounded p-3">
                <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-outline)]">Delayed</div>
                <div className="mt-1.5 text-[28px] font-bold text-[var(--color-status-red)]" style={{ fontFamily: "var(--font-hanken)" }}>{hero.delayed}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2.5">
              {hero.rows.length === 0 ? (
                <div className="text-sm text-[var(--color-on-surface-variant)] py-4 text-center">Belum ada proyek tercatat.</div>
              ) : (
                hero.rows.map((r) => (
                  <div key={r.project_code} className="grid grid-cols-[84px_1fr_92px_44px] items-center gap-3 px-3 py-2.5 border border-[var(--color-surface-container-high)] rounded bg-white">
                    <div className="font-mono text-[13px] text-[var(--color-data-mono)]">{r.project_code}</div>
                    <div className="text-sm font-medium truncate">{r.name}</div>
                    <div className="h-1.5 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${r.progress}%` }} />
                    </div>
                    <div className="font-mono text-[13px] text-[var(--color-on-surface-variant)] text-right">{r.progress}%</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="modul" className="max-w-[1440px] mx-auto px-8 pt-6 pb-[88px]">
        <h2 className="text-[32px] leading-10 font-semibold text-[var(--color-on-surface)]" style={{ fontFamily: "var(--font-hanken)" }}>
          Tiga modul, satu sumber data
        </h2>
        <p className="mt-2.5 mb-8 max-w-[620px] text-base leading-6 text-[var(--color-on-surface-variant)]">
          Setiap modul menulis ke basis data yang sama, jadi laporan mingguan tidak perlu disusun ulang dari spreadsheet.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {MODULES.map((m) => (
            <div key={m.title} className="bg-white border border-[var(--color-outline-variant)] rounded-lg p-6 flex flex-col gap-3 transition-shadow hover:shadow-[0_10px_24px_rgba(23,29,28,0.07)]">
              <div className="w-10 h-10 rounded bg-[var(--color-secondary-container)] text-[var(--color-primary)] flex items-center justify-center font-bold text-lg" style={{ fontFamily: "var(--font-hanken)" }}>
                {m.mark}
              </div>
              <div className="text-xl font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>{m.title}</div>
              <div className="text-[15px] leading-6 text-[var(--color-on-surface-variant)]">{m.body}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {m.tags.map((t) => (
                  <span key={t} className="h-[22px] px-2 inline-flex items-center rounded bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] text-xs font-semibold tracking-wide text-[var(--color-primary)]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="kinerja" className="bg-white border-y border-[var(--color-outline-variant)]">
        <div className="max-w-[1440px] mx-auto px-8 py-[72px] grid md:grid-cols-[0.9fr_1.1fr] gap-16 items-center">
          <div>
            <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-primary)]">Kinerja operasional</div>
            <h2 className="mt-3 text-[32px] leading-10 font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>
              Laporan progres yang selalu terkini
            </h2>
            <div className="mt-3.5 flex flex-col gap-3.5">
              {BULLETS.map((b) => (
                <div key={b} className="flex gap-3 items-start">
                  <div className="mt-1.5 w-3.5 h-3.5 rounded-full border-4 border-[var(--color-primary)] flex-none" />
                  <div className="text-[15px] leading-6 text-[var(--color-on-surface)]">{b}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--color-surface)] border border-[var(--color-outline-variant)] rounded-lg p-5">
              <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-outline)]">Total Proyek</div>
              <div className="mt-2 text-4xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>{hero.total}</div>
            </div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-outline-variant)] rounded-lg p-5">
              <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-outline)]">Task Terpantau</div>
              <div className="mt-2 text-4xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>{hero.tasks}</div>
            </div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-outline-variant)] rounded-lg p-5">
              <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-outline)]">On Track</div>
              <div className="mt-2 text-4xl font-bold text-[var(--color-status-green)]" style={{ fontFamily: "var(--font-hanken)" }}>{hero.onTrack}</div>
            </div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-outline-variant)] rounded-lg p-5">
              <div className="text-xs font-semibold tracking-wide uppercase text-[var(--color-outline)]">Perlu Perhatian</div>
              <div className="mt-2 text-4xl font-bold text-[var(--color-status-yellow)]" style={{ fontFamily: "var(--font-hanken)" }}>{hero.atRisk + hero.delayed}</div>
            </div>
          </div>
        </div>
      </section>

      <section id="alur" className="max-w-[1440px] mx-auto px-8 py-[72px]">
        <h2 className="mb-8 text-[32px] leading-10 font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>Alur kerja mingguan</h2>
        <div className="grid md:grid-cols-4 gap-5">
          {STEPS.map((s) => (
            <div key={s.no} className="border-t-[3px] border-[var(--color-primary)] pt-4">
              <div className="font-mono text-[13px] text-[var(--color-data-mono)]">{s.no}</div>
              <div className="mt-2 text-lg font-semibold" style={{ fontFamily: "var(--font-hanken)" }}>{s.title}</div>
              <div className="mt-2 text-sm leading-[22px] text-[var(--color-on-surface-variant)]">{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-primary)]">
        <div className="max-w-[1440px] mx-auto px-8 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="text-[28px] leading-9 font-semibold text-white" style={{ fontFamily: "var(--font-hanken)" }}>
              Siap dipakai tim proyek Anda hari ini.
            </div>
            <div className="mt-2 text-[15px] text-[#c8eaea]">Akses menggunakan akun email korporat Metland.</div>
          </div>
          <Link href="/login" className="h-12 px-7 flex-none flex items-center bg-white rounded text-[15px] font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface)]">
            Masuk sekarang
          </Link>
        </div>
      </section>

      <footer className="bg-[var(--color-inverse-surface)]">
        <div className="max-w-[1440px] mx-auto px-8 py-10 flex items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="text-xl font-bold text-[var(--color-inverse-on-surface)]" style={{ fontFamily: "var(--font-hanken)" }}>Metland Ecosystem</div>
            <div className="text-[13px] text-[var(--color-outline-variant)]">PT Metropolitan Land Tbk · Sistem internal</div>
          </div>
          <div className="font-mono text-xs text-[var(--color-outline)]">v1.0 · build 2026.09</div>
        </div>
      </footer>
    </div>
  );
}
