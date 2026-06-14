"use client";

export function CopyButton({ value }: { value: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value).catch(() => {});
      }}
      className="btn-secondary px-3 py-1.5 text-xs"
    >
      Copy link
    </button>
  );
}
