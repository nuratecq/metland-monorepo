import { getDb } from "@/lib/turso";
import { Card, CardContent, CardHeader, Badge, Table, Th, Td } from "@metland/ui";
export const dynamic = "force-dynamic";

function badgeFor(status: string) {
  return status === "APPROVED" ? "success" : status === "REJECTED" ? "critical" : status === "SUBMITTED" ? "info" : "neutral";
}

export default async function ApprovalsPage() {
  const db = getDb();
  let rows: Record<string, unknown>[] = [];
  try {
    const rs = await db.execute(`
      SELECT r.*, u.name AS requester_name, c.query AS rec_query
      FROM approval_requests r
      LEFT JOIN users u ON u.id = r.requester_id
      LEFT JOIN recommendations c ON c.id = r.recommendation_id
      ORDER BY r.created_at DESC LIMIT 30`);
    rows = rs.rows as unknown as Record<string, unknown>[];
  } catch {}

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>Approvals</h1>
      <p className="text-sm text-[var(--color-on-surface-variant)]">
        Rekomendasi yang diajukan untuk persetujuan — SUBMITTED → IN_REVIEW → APPROVED / REJECTED
      </p>
      <Card>
        <CardHeader className="font-semibold">Approval Requests ({rows.length})</CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <span className="text-sm text-[var(--color-on-surface-variant)]">
              Belum ada approval — ajukan dari halaman Recommendations
            </span>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Rekomendasi</Th>
                  <Th>Alasan</Th>
                  <Th>Pemohon</Th>
                  <Th>Tanggal</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={String(a.id)}>
                    <Td>{String(a.rec_query ?? a.recommendation_id ?? "—")}</Td>
                    <Td>{String(a.reason ?? "—")}</Td>
                    <Td>{String(a.requester_name ?? a.requester_id ?? "—")}</Td>
                    <Td className="whitespace-nowrap">{String(a.created_at ?? "").slice(0, 10)}</Td>
                    <Td>
                      <Badge status={badgeFor(String(a.status))}>{String(a.status)}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
