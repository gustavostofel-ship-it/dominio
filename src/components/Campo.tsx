export function Campo(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, className, ...rest } = props;
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      <input
        {...rest}
        className={`rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100 ${className ?? ""}`}
      />
    </label>
  );
}
