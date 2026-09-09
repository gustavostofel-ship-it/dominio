"use client";

import { useFormStatus } from "react-dom";
import clsx from "clsx";

export function SubmitButton({
  children,
  className,
  variant = "primary",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(
        "rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60",
        variant === "primary" && "bg-verde-600 text-white hover:bg-verde-700",
        variant === "secondary" && "border border-border text-foreground hover:bg-surface-muted",
        variant === "danger" && "bg-vermelho-600 text-white hover:bg-vermelho-700",
        className
      )}
    >
      {pending ? "Enviando..." : children}
    </button>
  );
}
