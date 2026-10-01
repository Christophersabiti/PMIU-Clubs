import { inputCls, btn } from "./ui";

type Filter = { name: string; label: string; options: { value: string; label: string }[]; value?: string };

/** GET-based filter form: works without JavaScript and produces shareable URLs. */
export function FilterBar({ filters, q, action, placeholder = "Search…" }: { filters: Filter[]; q?: string; action: string; placeholder?: string }) {
  return (
    <form action={action} method="get" role="search" className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-brand-100 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
      {q !== undefined && (
        <div className="lg:min-w-56 lg:flex-1">
          <label htmlFor="q" className="mb-1 block text-xs font-medium text-muted">Search</label>
          <input id="q" name="q" defaultValue={q} placeholder={placeholder} className={inputCls} />
        </div>
      )}
      {filters.map((f) => (
        <div key={f.name} className="lg:w-44">
          <label htmlFor={f.name} className="mb-1 block text-xs font-medium text-muted">{f.label}</label>
          <select id={f.name} name={f.name} defaultValue={f.value ?? ""} className={inputCls}>
            <option value="">All</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      ))}
      <div className="flex gap-2">
        <button className={`${btn.base} ${btn.primary}`}>Apply</button>
        <a href={action} className={`${btn.base} ${btn.ghost}`}>Reset</a>
      </div>
    </form>
  );
}
