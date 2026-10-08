export default function Hero() {
  return (
    <section className="hero-sky relative flex min-h-[86svh] flex-col overflow-hidden">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <span className="font-display text-lg font-semibold tracking-tight text-night">
          Gabi-<span className="font-serif text-xl font-normal italic">comm</span>
        </span>
        <a
          href="#calculator"
          className="rounded-full bg-night px-4 py-2 text-sm font-medium text-frost transition hover:bg-deep"
        >
          Build a quote
        </a>
      </nav>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5 sm:gap-10">
          <p className="text-right font-display text-xl text-frost sm:text-3xl">Clear scope.</p>
          <div className="[--capsule-w:42px] sm:[--capsule-w:64px]">
            <div className="capsule" aria-hidden />
          </div>
          <p className="font-display text-xl text-frost sm:text-3xl">Fair price.</p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl items-end justify-between gap-4 px-4 pb-8 text-xs text-mist sm:px-6">
        <span>Project cost calculator · Rates in ₱</span>
        <a href="#calculator" className="flex items-center gap-2 transition hover:text-frost">
          Start
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full border border-line">
            ↓
          </span>
        </a>
      </div>
    </section>
  );
}
