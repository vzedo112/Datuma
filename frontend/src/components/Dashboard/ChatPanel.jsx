import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Send,
  Lock,
  ArrowUpRight,
  Loader2,
  Trash2,
  MessageSquare,
} from "lucide-react";
import {
  listChatMessages,
  sendChatMessage,
  clearChatThread,
} from "../../services/api";

const STARTER_SUGGESTIONS = [
  "Why is Q3 margin slipping?",
  "Which channel has the best growth?",
  "Summarize this for a CFO in two sentences.",
];

export default function ChatPanel({ dashboardId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(true);
  const [allowed, setAllowed] = useState(null);
  const [usage, setUsage] = useState(null); // { used, included, overageCents }
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!dashboardId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingThread(true);
        const data = await listChatMessages(dashboardId);
        if (cancelled) return;
        setMessages(data.messages ?? []);
        setAllowed(Boolean(data.allowed));
        setUsage(data.usage ?? null);
      } catch (err) {
        if (cancelled) return;
        // If the request 401s or fails, fall back to "not allowed" so we show
        // the locked state instead of crashing.
        setAllowed(false);
      } finally {
        if (!cancelled) setLoadingThread(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dashboardId]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, sending]);

  const send = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || sending || !dashboardId) return;
    setError(null);
    setInput("");
    setSending(true);

    // Optimistic: show the user's message immediately.
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", content: trimmed },
    ]);

    try {
      const result = await sendChatMessage(dashboardId, trimmed);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        result.userMessage,
        result.assistantMessage,
      ]);
      if (result.usage) setUsage(result.usage);
    } catch (err) {
      // Roll back the optimistic message.
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      const data = err?.response?.data;
      if (data?.code === "CHAT_REQUIRES_UPGRADE") {
        setAllowed(false);
      } else {
        setError(data?.error || err?.message || "Couldn't send. Try again.");
      }
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const clear = async () => {
    if (!dashboardId || messages.length === 0) return;
    if (!window.confirm("Clear this dashboard's chat history?")) return;
    try {
      await clearChatThread(dashboardId);
      setMessages([]);
    } catch (err) {
      setError(err?.response?.data?.error || "Couldn't clear.");
    }
  };

  if (!dashboardId) return null;

  // --- Locked state (Starter or not allowed) ---
  if (allowed === false) {
    return (
      <section
        data-export-hide="true"
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <header className="px-5 lg:px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-accent">
            <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.7} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Pro feature
            </p>
            <h2 className="font-display text-2xl lg:text-3xl tracking-tight">
              Ask Datuma
            </h2>
          </div>
        </header>
        <div className="p-8 lg:p-12 text-center">
          <div className="inline-flex p-3 rounded-xl border border-border bg-background mb-5">
            <Lock className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <p className="font-display text-2xl lg:text-3xl tracking-tight mb-3 max-w-md mx-auto">
            Ask follow-ups about this data.
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
            "Why is Q3 margin slipping?" "Who's my top customer?" — Datuma answers in
            plain English, citing the numbers in this dashboard.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-6 h-11 rounded-full text-sm font-medium group"
          >
            Upgrade to Pro
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>
        </div>
      </section>
    );
  }

  // --- Active state ---
  return (
    <section
      data-export-hide="true"
      className="rounded-xl border border-border bg-card overflow-hidden flex flex-col"
      style={{ minHeight: "32rem" }}
    >
      <header className="px-5 lg:px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="p-1.5 rounded-md bg-brand-soft">
          <Sparkles className="w-3.5 h-3.5 text-brand" strokeWidth={1.7} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Ask Datuma · Sonnet 4.6
          </p>
          <h2 className="font-display text-2xl lg:text-3xl tracking-tight">
            Chat with this data
          </h2>
        </div>
        <ChatUsagePill usage={usage} />
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Clear thread"
            title="Clear thread"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 lg:px-6 py-5">
        {loadingThread ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-12 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-mono text-xs uppercase tracking-widest">
              Loading thread…
            </span>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState onPick={(q) => send(q)} />
        ) : (
          messages.map((m) => <Message key={m.id} message={m} />)
        )}
        {sending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-3 px-1">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />
              <span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse"
                style={{ animationDelay: "300ms" }}
              />
            </span>
            Datuma is thinking…
          </div>
        )}
        {error && (
          <div className="mt-3 px-3 py-2 rounded-md bg-rose-50 border border-rose-200 text-sm text-rose-900">
            {error}
          </div>
        )}
      </div>

      <form
        className="px-5 lg:px-6 py-4 border-t border-border flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Ask anything about this dashboard…"
          disabled={sending}
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none max-h-32 focus:outline-none focus:border-foreground disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="shrink-0 h-10 w-10 rounded-lg bg-foreground text-background flex items-center justify-center disabled:opacity-40 hover:bg-foreground/90 transition-colors"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </section>
  );
}

function ChatUsagePill({ usage }) {
  if (!usage) return null;
  const { used = 0, included, overageCents } = usage;
  // Enterprise / unlimited.
  if (included === null) {
    return (
      <span className="hidden sm:inline-flex font-mono text-[10px] uppercase tracking-widest px-2 py-1 bg-accent text-foreground/70 rounded-md">
        {used} sent · unlimited
      </span>
    );
  }
  const over = used >= included;
  const cls = over
    ? "bg-brand text-brand-foreground"
    : "bg-accent text-foreground/70";
  return (
    <span
      className={`hidden sm:inline-flex font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-md ${cls}`}
      title={
        over && overageCents
          ? `Past included quota — €${(overageCents / 100).toFixed(2)} per extra message`
          : "Chat messages this month"
      }
    >
      {used} / {included}
    </span>
  );
}

function Message({ message }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`mb-4 flex ${
        isUser ? "justify-end" : "justify-start"
      } animate-fade-in`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-foreground text-background"
            : "bg-accent text-foreground"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function EmptyState({ onPick }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-muted-foreground mb-5">
        Ask anything about this dashboard. Try one of these:
      </p>
      <div className="flex flex-col items-stretch gap-2 max-w-md mx-auto">
        {STARTER_SUGGESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className="text-left text-sm text-foreground/80 hover:text-foreground hover:bg-accent transition-colors px-4 py-2.5 rounded-lg border border-border bg-background"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
