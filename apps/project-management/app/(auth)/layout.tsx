const AUTH_POINTS = [
  "Progres lapangan real-time dari setiap proyek",
  "Alur approval terstruktur untuk setiap keputusan",
  "Laporan otomatis tanpa rekap ulang dari spreadsheet",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid md:grid-cols-[0.92fr_1.08fr] bg-white">
      <div className="hidden md:flex flex-col justify-between p-12 bg-[var(--color-primary)]">
        <div className="self-start bg-white rounded px-4 py-3">
          <span className="font-bold tracking-tight text-[var(--color-primary)]" style={{ fontFamily: "var(--font-hanken)" }}>
            METLAND
          </span>
        </div>
        <div>
          <div className="max-w-[420px] text-white font-bold text-4xl leading-tight tracking-tight" style={{ fontFamily: "var(--font-hanken)" }}>
            Kendali penuh atas progres setiap proyek.
          </div>
          <div className="mt-4 max-w-[400px] text-[#c8eaea] text-base leading-relaxed">
            Masuk untuk melihat status jadwal, serapan anggaran, dan task tim lapangan Anda.
          </div>
          <div className="mt-10 flex flex-col gap-3">
            {AUTH_POINTS.map((p) => (
              <div key={p} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-inverse-primary)]" />
                <div className="text-sm text-[#e2f5f5]">{p}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="font-mono text-xs text-[#8cc9c9]">PT Metropolitan Land Tbk · 2026</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
