"use client";

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface Props<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}

export default function ModifierGroup<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{label}</legend>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(9rem, 1fr))` }}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`rounded-lg border px-3 py-2.5 text-left transition ${
                active ? "border-primary-hi bg-primary/15 text-ink" : "border-line bg-surface text-muted hover:border-primary/60 hover:text-ink"
              }`}
            >
              <span className="block text-sm font-semibold">{o.label}</span>
              {o.hint && <span className="mt-0.5 block text-xs text-muted">{o.hint}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
