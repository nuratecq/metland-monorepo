"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

export type PriorityItem = { name: string; value: number; fill: string };
export type ProjectStatusItem = { status: string; count: number };
export type DailyActivity = { day: string; tasks: number };

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#3b82f6",
  LOW: "#94a3b8",
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#22c55e",
  PLANNED: "#3b82f6",
  ON_HOLD: "#f59e0b",
  DRAFT: "#94a3b8",
  COMPLETED: "#a855f7",
  ARCHIVED: "#64748b",
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[var(--color-outline-variant)] rounded-lg p-4">
      <div className="text-[13px] font-semibold text-[var(--color-on-surface)] mb-4">
        {title}
      </div>
      {children}
    </div>
  );
}

export function TaskPriorityDonut({ data }: { data: PriorityItem[] }) {
  if (data.every((d) => d.value === 0)) {
    return (
      <ChartCard title="Task Priority Distribution">
        <div className="flex items-center justify-center h-[200px] text-sm text-[var(--color-outline)]">
          Belum ada data task.
        </div>
      </ChartCard>
    );
  }
  return (
    <ChartCard title="Task Priority Distribution">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            label={({ name, percent }: { name?: string; percent?: number }) =>
              (percent ?? 0) > 0.05 ? `${name} ${Math.round((percent ?? 0) * 100)}%` : ""
            }
            labelLine={false}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 6,
              border: "1px solid var(--color-outline-variant)",
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ProjectStatusBar({ data }: { data: ProjectStatusItem[] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="Projects by Status">
        <div className="flex items-center justify-center h-[200px] text-sm text-[var(--color-outline)]">
          Belum ada data project.
        </div>
      </ChartCard>
    );
  }
  return (
    <ChartCard title="Projects by Status">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-container)" vertical={false} />
          <XAxis
            dataKey="status"
            tick={{ fontSize: 11, fill: "var(--color-outline)" }}
            tickFormatter={(v) =>
              v.replace("_", " ").charAt(0) + v.replace("_", " ").slice(1).toLowerCase()
            }
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--color-outline)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 6,
              border: "1px solid var(--color-outline-variant)",
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={PROJECT_STATUS_COLORS[entry.status] ?? "#94a3b8"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TaskActivityLine({ data }: { data: DailyActivity[] }) {
  const isEmpty = data.length === 0 || data.every((d) => d.tasks === 0);
  if (isEmpty) {
    return (
      <ChartCard title="Task Activity (30 hari terakhir)">
        <div className="flex items-center justify-center h-[200px] text-sm text-[var(--color-outline)]">
          Belum ada aktivitas task 30 hari terakhir.
        </div>
      </ChartCard>
    );
  }
  return (
    <ChartCard title="Task Activity (30 hari terakhir)">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-container)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "var(--color-outline)" }}
            tickFormatter={(v: string) => {
              const d = new Date(v);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
            interval="preserveStartEnd"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--color-outline)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            labelFormatter={(label) => {
              const d = new Date(String(label));
              return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
            }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 6,
              border: "1px solid var(--color-outline-variant)",
            }}
          />
          <Line
            type="monotone"
            dataKey="tasks"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
