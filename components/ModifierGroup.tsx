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
      <legend className="mb-2.5 text-xs font-medium uppercase tracking-[0.18em] text-mist">{label}</legend>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(9rem, 1fr))` }}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                active
                  ? "border-mist/70 bg-steel/30 text-ink shadow-[0_10px_30px_-15px_rgba(144,176,199,0.6)]"
                  : "border-line bg-night/30 text-mist hover:border-mist/40 hover:text-ink"
              }`}
            >
              <span className="block text-sm font-semibold">{o.label}</span>
              {o.hint && <span className="mt-0.5 block text-xs text-mist/80">{o.hint}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
