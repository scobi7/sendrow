"use client";

export function DeleteAccountButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Are you sure? This will delete your account.")) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-red-50"
        style={{ borderColor: "var(--danger-tint)", color: "var(--danger)" }}
      >
        Delete my account
      </button>
    </form>
  );
}
