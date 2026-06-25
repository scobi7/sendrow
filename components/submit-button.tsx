"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  pendingText?: string;
  disabled?: boolean;
}

export function SubmitButton({ children, className, style, pendingText, disabled }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={className}
      style={{ ...style, opacity: pending || disabled ? 0.6 : 1, cursor: pending ? "wait" : disabled ? "not-allowed" : "pointer" }}
    >
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
