"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

export type PriorityItem = { name: string; value: number; fill: string };
export type ProjectStatusItem = { status: string; count: number };
export type DailyActivity = { day: string; tasks: number };
export type BoardItem = { status: string; label: string; count: number; color: string };

const PROJECT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#006767",
  PLANNED: "#3b82f6",
  ON_HOLD: "#f59e0b",
  DRAFT: "#94a3b8",
  COMPLETED: "#22c55e",
  ARCHIVED: "#64748b",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active", PLANNED: "Planned", ON_HOLD: "On Hold",
  DRAFT: "Draft", COMPLETED: "Done", ARCHIVED: "Archived",
};

function sampleActivity(): DailyActivity[] {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    const day = d.toISOString().split("T")[0];
    const tasks = Math.round(2 + 5 * Math.abs(Math.sin(i * 0.65)) + 3 * Math.abs(Math.sin(i * 1.4 + 1)));
    return { day, tasks };
  });
}

export function TaskActivityLine({ data }: { data: DailyActivity[] }) {
  const hasReal = data.length > 0 && data.some((d) => d.tasks > 0);
  const chartData = hasReal ? data : sampleActivity();
  const isDemo = !hasReal;

  return (
    <div className="relative">
      {isDemo && (
        <div className="absolute top-0 right-0 text-[10px] text-[#94a3b8] bg-[#f8fafc] px-1.5 py-0.5 rounded z-10">
          demo data
        </div>
      )}
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
          <defs>
            <linearGradient id="taskAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#006767" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#006767" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={(v: string) => {
              const d = new Date(v);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
            interval="preserveStartEnd"
            axisLine={false}
            tickLine={false}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip
            labelFormatter={(label) => new Date(String(label)).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            cursor={{ stroke: "#006767", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="tasks"
            stroke="#006767"
            strokeWidth={2}
            fill="url(#taskAreaGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#006767", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProjectStatusBar({ data }: { data: ProjectStatusItem[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-[#94a3b8]">
        Belum ada data project.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="status"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickFormatter={(v) => STATUS_LABEL[v] ?? v}
          axisLine={false}
          tickLine={false}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v, _n, props) => [v, STATUS_LABEL[props.payload?.status] ?? props.payload?.status]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((entry, i) => (
            <Cell key={i} fill={PROJECT_STATUS_COLORS[entry.status] ?? "#94a3b8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TaskBoardHorizontal({ board }: { board: BoardItem[] }) {
  if (board.every((b) => b.count === 0)) {
    return (
      <div className="flex items-center justify-center h-[160px] text-sm text-[#94a3b8]">
        Belum ada task.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart
        layout="vertical"
        data={board}
        margin={{ top: 4, right: 32, left: 0, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 12, fill: "#475569" }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={20}>
          {board.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProjectHealthPie({
  onTrack, atRisk, delayed,
}: {
  onTrack: number;
  atRisk: number;
  delayed: number;
}) {
  const total = onTrack + atRisk + delayed;
  const data = [
    { name: "On Track", value: onTrack || (total === 0 ? 1 : 0), fill: "#22c55e" },
    { name: "At Risk", value: atRisk, fill: "#f59e0b" },
    { name: "Delayed", value: delayed, fill: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
