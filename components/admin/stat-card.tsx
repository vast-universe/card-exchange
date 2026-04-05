type StatCardProps = {
  label: string;
  value: number;
  tone?: "light" | "accent";
};

export function StatCard({
  label,
  value,
  tone = "light",
}: StatCardProps) {
  return (
    <div
      className={`rounded-3xl border p-5 ${
        tone === "accent"
          ? "border-amber-200 bg-amber-50/80"
          : "border-stone-200 bg-white/80"
      }`}
    >
      <p className="text-sm font-semibold tracking-[0.12em] text-stone-500">
        {label}
      </p>
      <p className="mt-3 font-[family-name:var(--font-heading)] text-4xl text-stone-950">
        {value}
      </p>
    </div>
  );
}
