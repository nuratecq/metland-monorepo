import * as React from "react";

export function Table({ className = "", ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-auto border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] bg-white">
      <table className={`w-full text-sm ${className}`} {...props} />
    </div>
  );
}

export function Th({ className = "", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`text-left font-semibold px-3 py-2 bg-[var(--color-surface-container-low)] border-b text-xs tracking-widest uppercase ${className}`} {...props} />;
}
export function Td({ className = "", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-3 py-2 border-b border-[var(--color-outline-variant)] h-10 ${className}`} {...props} />;
}
