"use client";

interface Props {
  value: number;
  onChange: (n: number) => void;
  label: string;
}

export default function QtyStepper({ value, onChange, label }: Props) {
  const set = (n: number) => onChange(Math.max(0, Math.min(999, Math.floor(n) || 0)));
  const btn =
    "grid h-8 w-8 place-items-center rounded-full border border-line bg-night/50 text-lg leading-none text-ink transition hover:border-mist hover:text-frost disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink";
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" className={btn} onClick={() => set(value - 1)} disabled={value <= 0} aria-label={`Fewer ${label}`}>
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={999}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        name={`qty-${label}`}
        aria-label={`${label} quantity`}
        className="tnum h-8 w-12 rounded-full border border-line bg-night/60 text-center text-sm text-ink outline-none [appearance:textfield] focus:border-mist [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" className={btn} onClick={() => set(value + 1)} aria-label={`More ${label}`}>
        +
      </button>
    </div>
  );
}
