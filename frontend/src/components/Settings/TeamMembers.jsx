import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Mail,
  Send,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  Clock,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import {
  listTeamMembers,
  inviteTeammate,
  revokeTeamInvite,
} from "../../services/api";

function StatusBadge({ status }) {
  if (status === "accepted") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
        <Check className="w-2.5 h-2.5" /> Active
      </span>
    );
  }
  if (status === "revoked") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-accent text-muted-foreground">
        Revoked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-amber-50 text-amber-800">
      <Clock className="w-2.5 h-2.5" /> Pending
    </span>
  );
}

export default function TeamMembers() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await listTeamMembers();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.error || err?.message || "Couldn't load team.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    try {
      const result = await inviteTeammate(trimmed);
      setData((prev) =>
        prev
          ? { ...prev, invites: [result.invite, ...prev.invites] }
          : { invites: [result.invite], allowed: true, seatLimit: null, planKey: null }
      );
      setEmail("");
    } catch (err) {
      setError(
        err?.response?.data?.error || err?.message || "Couldn't send invite."
      );
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (id) => {
    if (
      !window.confirm(
        "Revoke this invite? The recipient won't be able to use the link."
      )
    )
      return;
    try {
      await revokeTeamInvite(id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              invites: prev.invites.map((i) =>
                i.id === id ? { ...i, status: "revoked" } : i
              ),
            }
          : prev
      );
    } catch (err) {
      setError(
        err?.response?.data?.error || err?.message || "Couldn't revoke."
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading team…
      </div>
    );
  }

  // Locked state — not on Team / Enterprise plan.
  if (data && data.allowed === false) {
    return (
      <div className="text-center py-2">
        <div className="inline-flex p-2.5 rounded-xl border border-border bg-background mb-4">
          <Lock className="w-4 h-4" strokeWidth={1.6} />
        </div>
        <p className="font-display text-xl tracking-tight mb-2">
          Invites unlock on Team.
        </p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5 leading-relaxed">
          Share a workspace with up to 5 teammates on Team (€99/mo), or
          unlimited on Enterprise. Invites are coming as soon as Team launches —
          you can pre-register interest now.
        </p>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-5 h-10 rounded-full text-sm font-medium group"
        >
          See Team plan
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </Link>
      </div>
    );
  }

  const invites = data?.invites ?? [];
  const pending = invites.filter((i) => i.status === "pending").length;
  const accepted = invites.filter((i) => i.status === "accepted").length;
  const occupied = 1 + pending + accepted; // owner + active invites
  const limit = data?.seatLimit ?? null;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium">
            {occupied}
            {limit ? ` of ${limit}` : ""} seat
            {occupied === 1 ? "" : "s"} used
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pending} pending · {accepted} active · 1 owner (you)
          </p>
        </div>
      </div>

      <form
        onSubmit={handleInvite}
        className="flex items-stretch gap-2 mb-5 max-w-md"
      >
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            disabled={sending}
            className="w-full bg-background border border-border rounded-md pl-9 pr-3 h-10 text-sm focus:outline-none focus:border-foreground disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={sending || !email.trim()}
          className="inline-flex items-center gap-1.5 bg-foreground hover:bg-foreground/90 text-background px-4 h-10 rounded-md text-sm font-medium disabled:opacity-50"
        >
          {sending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          Invite
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 flex items-start gap-2 text-sm text-rose-900">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {invites.length === 0 ? (
        <div className="rounded-lg border border-dashed border-foreground/15 bg-card/40 p-6 text-center">
          <div className="inline-flex p-2 rounded-lg border border-border bg-background mb-3">
            <Users className="w-4 h-4 text-muted-foreground" strokeWidth={1.6} />
          </div>
          <p className="text-sm text-muted-foreground">
            No teammates yet. Invite someone above.
          </p>
        </div>
      ) : (
        <ul className="rounded-lg border border-border bg-background overflow-hidden divide-y divide-border">
          {invites.map((invite) => (
            <li
              key={invite.id}
              className="flex items-center gap-3 px-4 py-3 text-sm"
            >
              <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate flex-1">{invite.email}</span>
              <StatusBadge status={invite.status} />
              {invite.status === "pending" && (
                <button
                  type="button"
                  onClick={() => handleRevoke(invite.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-rose-700 hover:bg-rose-50 transition-colors"
                  aria-label="Revoke invite"
                  title="Revoke"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
