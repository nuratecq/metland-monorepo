"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts";

type Milestone = {
  id: string;
  name: string;
  completion_percentage: number;
  status: string;
  due_date: string | null;
};

const STATUS_COLOR: Record<string, string> = {
  DONE:        "#16a34a",
  IN_PROGRESS: "#006767",
  BLOCKED:     "#dc2626",
  TODO:        "#cbd5e1",
};

const STATUS_LABEL: Record<string, string> = {
  DONE: "Done", IN_PROGRESS: "In Progress", BLOCKED: "Blocked", TODO: "To Do",
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: Milestone }[] }) {
  if (!active || !payload?.length) return null;
  const m = payload[0].payload;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-[var(--color-outline-variant)] px-3 py-2.5 text-[12px] min-w-[180px]">
      <div className="font-semibold text-[var(--color-on-surface)] mb-1">{m.name}</div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-[var(--color-on-surface-variant)]">{STATUS_LABEL[m.status] ?? m.status}</span>
        <span className="font-mono font-semibold">{m.completion_percentage}%</span>
      </div>
      {m.due_date && (
        <div className="text-[var(--color-on-surface-variant)] mt-0.5">Due: {m.due_date}</div>
      )}
    </div>
  );
}

export function MilestoneChart({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) {
    return (
      <div className="py-8 text-sm text-center text-[var(--color-on-surface-variant)]">
        Belum ada milestone.
      </div>
    );
  }

  const chartHeight = Math.max(120, milestones.length * 48);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        layout="vertical"
        data={milestones}
        margin={{ top: 4, right: 48, left: 0, bottom: 4 }}
        barSize={20}
      >
        <CartesianGrid horizontal={false} stroke="var(--color-surface-container-high)" strokeDasharray="0" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickCount={6}
          tick={{ fontSize: 11, fill: "var(--color-outline)" }}
          tickFormatter={(v) => `${v}%`}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fontSize: 12, fill: "var(--color-on-surface-variant)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 17) + "…" : v}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-surface-container-low)" }} />
        <Bar dataKey="completion_percentage" radius={[0, 4, 4, 0]}>
          {milestones.map((m) => (
            <Cell key={m.id} fill={STATUS_COLOR[m.status] ?? STATUS_COLOR.TODO} />
          ))}
          <LabelList
            dataKey="completion_percentage"
            position="right"
            formatter={(v: number) => `${v}%`}
            style={{ fontSize: 11, fontFamily: "monospace", fill: "var(--color-on-surface-variant)" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
