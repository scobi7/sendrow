"use client";

import { useRef } from "react";

export function DeleteClientButton({
  action,
  companyName,
}: {
  action: (formData: FormData) => Promise<void>;
  companyName: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Permanently delete ${companyName}? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="px-2 py-1 text-xs transition-opacity hover:opacity-70"
        style={{ color: "var(--danger)" }}
      >
        Delete
      </button>
    </form>
  );
}
