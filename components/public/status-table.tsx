type StatusTableItem = {
  label: string;
  value: string;
};

export function StatusTable({
  title,
  items,
}: {
  title: string;
  items: StatusTableItem[];
}) {
  return (
    <section className="space-y-4 rounded-3xl border border-stone-200 bg-white/85 p-5">
      <div>
        <h3 className="font-[family-name:var(--font-heading)] text-xl text-stone-950">
          {title}
        </h3>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200">
        <table className="min-w-full border-collapse text-left text-sm">
          <tbody>
            {items.map((item, index) => (
              <tr
                key={`${item.label}-${index}`}
                className="odd:bg-white even:bg-stone-50/60"
              >
                <td className="w-44 border-b border-stone-100 px-4 py-3 font-medium text-stone-900">
                  {item.label}
                </td>
                <td className="border-b border-stone-100 px-4 py-3 text-stone-700">
                  {item.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
