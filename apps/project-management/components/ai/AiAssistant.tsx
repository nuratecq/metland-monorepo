"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bot, Send, Plus, StopCircle, Copy, ExternalLink,
  AlertTriangle, AlertCircle, Clock, Users, BarChart3,
  Target, FolderKanban, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MsgRole = "user" | "assistant";

interface KpiCard {
  type: "kpi";
  label: string;
  value: string | number;
  subtext?: string;
  color?: "primary" | "green" | "yellow" | "red" | "blue";
}

interface RiskCard {
  type: "risk";
  project: string;
  progress: number;
  due_date?: string;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  reason?: string;
}

interface InsightCard {
  type: "insight";
  variant: "risk" | "recommendation" | "deadline" | "bottleneck" | "trend";
  title: string;
  body: string;
}

interface TableCard {
  type: "table";
  headers: string[];
  rows: string[][];
}

type AiCard = KpiCard | RiskCard | InsightCard | TableCard;

interface QuickAction {
  label: string;
  href: string;
}

interface AiMessage {
  id: string;
  role: MsgRole;
  text: string;
  cards?: AiCard[];
  actions?: QuickAction[];
  meta?: string;
  isLoading?: boolean;
  isError?: boolean;
}

// ─── Suggested Prompts ────────────────────────────────────────────────────────

const PROMPTS = [
  {
    title: "Project Overview",
    prompt: "Give me an overview of all active projects.",
    icon: FolderKanban,
    desc: "Status dan progres semua proyek aktif",
  },
  {
    title: "Overdue Tasks",
    prompt: "Which tasks are currently overdue?",
    icon: AlertCircle,
    desc: "Task yang melewati due date",
  },
  {
    title: "Team Workload",
    prompt: "Who has the most assigned tasks? Show workload by team member.",
    icon: Users,
    desc: "Distribusi beban kerja per anggota tim",
  },
  {
    title: "Project Risks",
    prompt: "Which projects are at risk of missing their deadlines?",
    icon: AlertTriangle,
    desc: "Proyek berisiko terlambat",
  },
  {
    title: "Weekly Summary",
    prompt: "Summarize project progress this week.",
    icon: BarChart3,
    desc: "Ringkasan progres minggu ini",
  },
  {
    title: "Priority Actions",
    prompt: "What should I prioritize today? Give me action recommendations.",
    icon: Target,
    desc: "Rekomendasi prioritas tindakan hari ini",
  },
];

// ─── Card Sub-components ──────────────────────────────────────────────────────

function KpiCardView({ card }: { card: KpiCard }) {
  const colorMap: Record<string, string> = {
    primary: "text-[var(--color-primary)]",
    green: "text-[var(--color-status-green)]",
    yellow: "text-[var(--color-status-yellow)]",
    red: "text-[var(--color-status-red)]",
    blue: "text-[var(--color-status-blue)]",
  };
  return (
    <div className="bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] rounded-lg p-3.5 flex flex-col gap-1">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-outline)]">{card.label}</div>
      <div className={`text-2xl font-bold ${colorMap[card.color ?? "primary"]}`} style={{ fontFamily: "var(--font-hanken)" }}>
        {card.value}
      </div>
      {card.subtext && <div className="text-[11px] text-[var(--color-on-surface-variant)]">{card.subtext}</div>}
    </div>
  );
}

function RiskCardView({ card }: { card: RiskCard }) {
  const cfg = {
    HIGH: "border-[#fecaca] bg-[#fef2f2] text-[var(--color-status-red)]",
    MEDIUM: "border-[#fde68a] bg-[#fffbeb] text-[var(--color-status-yellow)]",
    LOW: "border-[#bbf7d0] bg-[#f0fdf4] text-[var(--color-status-green)]",
  }[card.risk_level];
  return (
    <div className={`border rounded-lg p-3 ${cfg}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-[13px] font-semibold text-[var(--color-on-surface)]">{card.project}</div>
        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-current">
          {card.risk_level}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/60 overflow-hidden mb-1">
        <div className="h-full rounded-full bg-current opacity-50" style={{ width: `${card.progress}%` }} />
      </div>
      <div className="flex justify-between text-[11px] opacity-70 mb-1">
        <span>Progress: {card.progress}%</span>
        {card.due_date && <span>Due: {card.due_date}</span>}
      </div>
      {card.reason && <div className="text-[12px] text-[var(--color-on-surface-variant)] mt-1">{card.reason}</div>}
    </div>
  );
}

function InsightCardView({ card }: { card: InsightCard }) {
  const cfg = {
    risk: { bg: "border-[#fecaca] bg-[#fef2f2]", Icon: AlertTriangle, ic: "text-[var(--color-status-red)]" },
    recommendation: { bg: "border-[var(--color-outline-variant)] bg-[var(--color-secondary-container)]", Icon: Target, ic: "text-[var(--color-primary)]" },
    deadline: { bg: "border-[#fde68a] bg-[#fffbeb]", Icon: Clock, ic: "text-[var(--color-status-yellow)]" },
    bottleneck: { bg: "border-[#c7d2fe] bg-[#f0f0ff]", Icon: AlertCircle, ic: "text-[var(--color-status-blue)]" },
    trend: { bg: "border-[#bbf7d0] bg-[#f0fdf4]", Icon: BarChart3, ic: "text-[var(--color-status-green)]" },
  }[card.variant];
  const { bg, Icon, ic } = cfg;
  return (
    <div className={`border rounded-lg p-3.5 ${bg}`}>
      <div className="flex gap-2.5 items-start">
        <Icon size={15} className={`${ic} shrink-0 mt-0.5`} />
        <div>
          <div className="text-[13px] font-semibold text-[var(--color-on-surface)]">{card.title}</div>
          <div className="mt-0.5 text-[12px] text-[var(--color-on-surface-variant)] leading-snug">{card.body}</div>
        </div>
      </div>
    </div>
  );
}

function TableCardView({ card }: { card: TableCard }) {
  return (
    <div className="border border-[var(--color-outline-variant)] rounded-lg overflow-hidden">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)]">
            {card.headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--color-outline)]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {card.rows.map((row, ri) => (
            <tr key={ri} className="border-b border-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-low)]">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-[var(--color-on-surface)]">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Message View ─────────────────────────────────────────────────────────────

function MessageView({ msg, onRetry }: { msg: AiMessage; onRetry?: () => void }) {
  const [copied, setCopied] = useState(false);

  function copyText() {
    navigator.clipboard.writeText(msg.text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] rounded-2xl rounded-br-md px-4 py-2.5 text-[14px] leading-relaxed">
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center flex-none mt-0.5">
        <Bot size={14} />
      </div>
      <div className="flex-1 min-w-0">
        {msg.isLoading && (
          <div className="flex items-center gap-2 text-[13px] text-[var(--color-on-surface-variant)] py-1">
            <span className="flex gap-1">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </span>
            Analyzing your project data...
          </div>
        )}

        {msg.isError && !msg.isLoading && (
          <div className="text-[13px] text-[var(--color-error)] flex items-center gap-2">
            {msg.text}
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1 text-[var(--color-error)] underline hover:no-underline"
              >
                <RefreshCw size={11} /> Coba lagi
              </button>
            )}
          </div>
        )}

        {!msg.isLoading && !msg.isError && (
          <>
            <div className="text-[14px] text-[var(--color-on-surface)] leading-relaxed whitespace-pre-wrap">
              {msg.text}
            </div>

            {msg.cards && msg.cards.length > 0 && (
              <div className="mt-3 space-y-2">
                {(() => {
                  const kpis = msg.cards!.filter((c) => c.type === "kpi") as KpiCard[];
                  const rest = msg.cards!.filter((c) => c.type !== "kpi");
                  return (
                    <>
                      {kpis.length > 0 && (
                        <div
                          className={`grid gap-2 ${
                            kpis.length >= 4 ? "grid-cols-4" : kpis.length === 3 ? "grid-cols-3" : kpis.length === 2 ? "grid-cols-2" : "grid-cols-1"
                          }`}
                        >
                          {kpis.map((c, i) => <KpiCardView key={i} card={c} />)}
                        </div>
                      )}
                      {rest.map((c, i) => {
                        if (c.type === "risk") return <RiskCardView key={i} card={c as RiskCard} />;
                        if (c.type === "insight") return <InsightCardView key={i} card={c as InsightCard} />;
                        if (c.type === "table") return <TableCardView key={i} card={c as TableCard} />;
                        return null;
                      })}
                    </>
                  );
                })()}
              </div>
            )}

            {msg.meta && (
              <div className="mt-2 text-[11px] text-[var(--color-outline)] italic">{msg.meta}</div>
            )}

            {msg.actions && msg.actions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {msg.actions.map((a, i) => (
                  <Link
                    key={i}
                    href={a.href}
                    className="h-7 px-3 flex items-center gap-1.5 rounded border border-[var(--color-outline-variant)] text-[12px] font-medium text-[var(--color-on-surface-variant)] bg-white hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors"
                  >
                    <ExternalLink size={11} />
                    {a.label}
                  </Link>
                ))}
              </div>
            )}

            <button
              onClick={copyText}
              className="mt-2 flex items-center gap-1 text-[11px] text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors"
            >
              <Copy size={11} />
              {copied ? "Copied!" : "Copy"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function AiAssistant({
  initialStats,
  userName,
}: {
  initialStats?: Record<string, Record<string, number>>;
  userName?: string;
}) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [projectCtx, setProjectCtx] = useState("all");
  const [dateRange, setDateRange] = useState("30d");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMsg: AiMessage = { id: Math.random().toString(36).slice(2), role: "user", text: text.trim() };
    const loadingId = Math.random().toString(36).slice(2);
    const loadingMsg: AiMessage = { id: loadingId, role: "assistant", text: "", isLoading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setIsLoading(true);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), projectCtx, dateRange }),
        signal: abortRef.current.signal,
      });

      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                text: data.text ?? "Tidak ada respons.",
                cards: data.cards,
                actions: data.actions,
                meta: data.meta,
                isLoading: false,
              }
            : m
        )
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setMessages((prev) => prev.filter((m) => m.id !== loadingId));
        return;
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                text: "Terjadi kesalahan saat menganalisis data proyek. Periksa koneksi dan coba lagi.",
                isLoading: false,
                isError: true,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  function stopGenerating() {
    abortRef.current?.abort();
    setIsLoading(false);
  }

  function newChat() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setIsLoading(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  // ── Chat input (reused in both states) ──
  function ChatInputBox() {
    return (
      <div className="w-full">
        <div className="relative rounded-xl border border-[var(--color-outline-variant)] bg-white shadow-sm focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your projects..."
            className="w-full resize-none rounded-xl px-4 py-3.5 pr-14 text-[14px] text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] bg-transparent focus:outline-none"
            style={{ minHeight: "52px", maxHeight: "160px" }}
            rows={1}
          />
          <button
            onClick={() => (isLoading ? stopGenerating() : sendMessage(input))}
            disabled={!isLoading && !input.trim()}
            className="absolute right-2.5 bottom-2.5 h-8 w-8 flex items-center justify-center rounded-lg bg-[var(--color-primary)] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            title={isLoading ? "Stop" : "Send"}
          >
            {isLoading ? <StopCircle size={15} /> : <Send size={15} />}
          </button>
        </div>

        {/* Context selectors */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <select
            value={projectCtx}
            onChange={(e) => setProjectCtx(e.target.value)}
            className="h-6 pl-2 pr-6 rounded border border-[var(--color-outline-variant)] text-[11px] text-[var(--color-on-surface-variant)] bg-white focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
          >
            <option value="all">All Projects</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-6 pl-2 pr-6 rounded border border-[var(--color-outline-variant)] text-[11px] text-[var(--color-on-surface-variant)] bg-white focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <span className="text-[10px] text-[var(--color-outline)]">Enter to send · Shift+Enter for newline</span>
        </div>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 112px)" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-hanken)" }}>
            AI Assistant
          </h1>
          <p className="mt-0.5 text-[14px] text-[var(--color-on-surface-variant)]">
            Ask questions, analyze your projects, and get actionable insights.
          </p>
        </div>
        {hasMessages && (
          <button
            onClick={newChat}
            className="h-8 px-3 flex items-center gap-1.5 rounded border border-[var(--color-outline-variant)] text-[13px] font-medium text-[var(--color-on-surface-variant)] bg-white hover:bg-[var(--color-surface-container-low)] transition-colors"
          >
            <Plus size={13} /> New Chat
          </button>
        )}
      </div>

      {!hasMessages ? (
        /* ── WELCOME STATE ── */
        <div className="flex-1 flex flex-col items-center justify-center gap-8 pb-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-secondary-container)] flex items-center justify-center">
              <Bot size={28} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <h2
                className="text-[22px] font-semibold text-[var(--color-on-surface)]"
                style={{ fontFamily: "var(--font-hanken)" }}
              >
                Hello{userName ? `, ${userName.split(" ")[0]}` : ""}, how can I help?
              </h2>
              <p className="mt-1.5 text-[14px] text-[var(--color-on-surface-variant)] max-w-md">
                Ask me anything about your projects, tasks, progress, deadlines, or team workload.
              </p>
              {initialStats && (
                <div className="mt-3 flex items-center justify-center gap-4 text-[12px] text-[var(--color-outline)]">
                  <span>{Number(initialStats.projects?.total ?? 0)} projects</span>
                  <span>·</span>
                  <span>{Number(initialStats.tasks?.total ?? 0)} tasks</span>
                  {Number(initialStats.tasks?.overdue ?? 0) > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-[var(--color-status-red)]">
                        {Number(initialStats.tasks.overdue)} overdue
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="w-full max-w-2xl">
            <ChatInputBox />
          </div>

          {/* Suggested prompts */}
          <div className="w-full max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-outline)] mb-3">
              Suggested
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PROMPTS.map((p) => (
                <button
                  key={p.title}
                  onClick={() => sendMessage(p.prompt)}
                  className="text-left p-3.5 rounded-lg border border-[var(--color-outline-variant)] bg-white hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary-container)] transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p.icon size={13} className="text-[var(--color-primary)] shrink-0" />
                    <span className="text-[12px] font-semibold text-[var(--color-on-surface)]">{p.title}</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-on-surface-variant)] leading-snug">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── CHAT STATE ── */
        <>
          <div className="flex-1 overflow-y-auto space-y-6 pb-4 min-h-0">
            {messages.map((msg, idx) => (
              <MessageView
                key={msg.id}
                msg={msg}
                onRetry={
                  msg.isError
                    ? () => {
                        const prevUser = [...messages]
                          .slice(0, idx)
                          .reverse()
                          .find((m) => m.role === "user");
                        if (prevUser) {
                          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
                          sendMessage(prevUser.text);
                        }
                      }
                    : undefined
                }
              />
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="pt-4 border-t border-[var(--color-outline-variant)] shrink-0">
            <div className="flex items-start gap-3">
              <button
                onClick={newChat}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] bg-white hover:bg-[var(--color-surface-container-low)] shrink-0 mt-1.5"
                title="New chat"
              >
                <Plus size={14} />
              </button>
              <div className="flex-1 min-w-0">
                <ChatInputBox />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
