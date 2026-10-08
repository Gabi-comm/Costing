import DotPortrait from "./DotPortrait";

export default function Hero() {
  return (
    <section className="hero-sky relative flex min-h-[92svh] flex-col overflow-hidden">
      <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
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

      <div className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-6 px-4 pb-6 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <div className="order-2 lg:order-1 lg:pt-24">
          <p className="font-serif text-3xl italic text-frost sm:text-4xl">Welcome!</p>
          <h1 className="headline mt-2 font-display text-5xl font-normal leading-[0.98] tracking-tight sm:text-7xl">
            Here are <span className="whitespace-nowrap">Gabi-comm&rsquo;s</span> <span className="font-serif italic text-frost">Works</span>
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#projects"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-night/40 px-5 py-3 text-sm font-semibold text-ink transition hover:border-mist hover:text-frost"
          >
            See projects
          </a>
          <a
            href="#calculator"
            className="inline-flex items-center gap-2 rounded-full bg-frost px-5 py-3 text-sm font-semibold text-night shadow-[0_10px_30px_-10px_rgba(202,220,234,0.6)] transition hover:bg-white"
          >
            Build a quote <span aria-hidden>↓</span>
          </a>
          </div>
        </div>

        <div className="relative order-1 mx-auto w-full max-w-[min(460px,86vw)] lg:order-2 lg:max-w-[620px] lg:pt-4">
          <div
            aria-hidden
            className="absolute inset-[6%] rounded-full bg-[radial-gradient(closest-side,rgba(3,8,18,0.8),rgba(3,8,18,0.35)_70%,transparent)] blur-2xl"
          />
          <DotPortrait className="relative" />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl items-end justify-end gap-4 px-4 pb-8 text-xs text-mist sm:px-6">
        <a href="#projects" className="flex items-center gap-2 transition hover:text-frost">
          Start
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full border border-line">
            ↓
          </span>
        </a>
      </div>
    </section>
  );
}
