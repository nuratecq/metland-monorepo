"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function MiniCalendar({ milestoneDates }: { milestoneDates: string[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const dateSet = new Set(milestoneDates.map((d) => d.slice(0, 10)));
  const total = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  const prev = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]">
          <ChevronLeft size={14} />
        </button>
        <span className="text-[13px] font-semibold text-[var(--color-on-surface)]">
          {pad(today.getDate())} {MONTHS[month].slice(0, 3)}, {year}
        </span>
        <button onClick={next} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]">
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-[var(--color-on-surface-variant)] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
          const hasMilestone = dateSet.has(dateStr);
          return (
            <div key={i} className="flex flex-col items-center py-0.5">
              <div
                className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] transition-colors ${
                  isToday
                    ? "bg-[var(--color-primary)] text-white font-semibold"
                    : "text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)]"
                }`}
              >
                {day}
              </div>
              {hasMilestone && (
                <div className={`w-1 h-1 rounded-full mt-0.5 ${isToday ? "bg-white/60" : "bg-[var(--color-primary)]"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
