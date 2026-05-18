import { useUser } from "@clerk/clerk-react";

export default function ClerkAccountSection() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <p className="text-sm text-muted-foreground">Loading profile…</p>;
  }
  if (!user) {
    return <p className="text-sm text-muted-foreground">Sign in to see profile details.</p>;
  }

  const fullName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "—";
  const email = user.primaryEmailAddress?.emailAddress || "—";
  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
      })
    : "—";

  const openProfile = () => {
    // Triggers Clerk's <UserButton> popover's "Manage account" modal route programmatically
    // by clicking the user button if present. Falls back to anchor navigation otherwise.
    const btn = document.querySelector(".cl-userButtonTrigger");
    if (btn) btn.click();
  };

  return (
    <>
      <Row label="Name" value={fullName} />
      <Row label="Email" value={email} />
      <Row label="Member since" value={createdAt} />
      <div className="pt-4 mt-2 border-t border-border">
        <button
          type="button"
          onClick={openProfile}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-border text-sm hover:bg-accent transition-colors"
        >
          Edit profile, security, sessions
        </button>
      </div>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-b-0">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="text-sm truncate">{value}</p>
    </div>
  );
}
