import Image from "next/image";

const AUTH_POINTS = [
  "Cari vendor & produk dengan bahasa natural",
  "Skor kecocokan otomatis, bukan tebak-tebakan",
  "Alur persetujuan pengadaan yang terlacak jelas",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid md:grid-cols-[0.92fr_1.08fr] bg-white">
      <div className="hidden md:flex flex-col justify-between p-12 bg-[var(--color-primary)]">
        <div className="self-start bg-white rounded px-4 py-3">
          <Image src="/logo.png" alt="Nuratech" width={40} height={40} priority className="h-9 w-auto" />
        </div>
        <div>
          <div className="max-w-[420px] text-white font-bold text-4xl leading-tight tracking-tight" style={{ fontFamily: "var(--font-hanken)" }}>
            Temukan vendor & produk yang tepat, lebih cepat.
          </div>
          <div className="mt-4 max-w-[400px] text-[#c8eaea] text-base leading-relaxed">
            Masuk untuk mencari, membandingkan, dan mengajukan persetujuan pengadaan.
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
        <div className="font-mono text-xs text-[#8cc9c9]">Nuratech Digital Nusantara · 2026</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
