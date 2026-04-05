import Link from "next/link";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-5 py-6 sm:px-6 sm:py-8">
      <header className="text-center">
        <Link href="/" className="inline-flex flex-col items-center gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
            Card Exchange
          </p>
        </Link>
      </header>

      <div className="py-6 sm:py-8">{children}</div>
    </div>
  );
}
