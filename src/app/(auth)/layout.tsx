import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-surface-muted px-4 py-12">
      <Link href="/" className="mb-8 text-xl font-bold text-verde-700">
        Domínio
      </Link>
      <div className="w-full max-w-sm card p-8">{children}</div>
    </div>
  );
}
