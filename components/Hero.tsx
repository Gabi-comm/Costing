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
          <p className="mt-5 max-w-md text-base text-mist">
            Websites, chatbots and GIS maps — priced up front. Pick what you need and get a quotation in a minute.
          </p>
          <a
            href="#calculator"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-frost px-5 py-3 text-sm font-semibold text-night shadow-[0_10px_30px_-10px_rgba(202,220,234,0.6)] transition hover:bg-white"
          >
            Build a quote <span aria-hidden>↓</span>
          </a>
        </div>

        <div className="relative order-1 mx-auto w-full max-w-[min(440px,78vw)] lg:order-2 lg:max-w-[560px] lg:pt-6">
          <div
            aria-hidden
            className="absolute inset-[6%] rounded-full bg-[radial-gradient(closest-side,rgba(9,21,37,0.7),rgba(9,21,37,0.25)_70%,transparent)] blur-2xl"
          />
          <DotPortrait className="relative" />
          <p className="relative mt-1 text-center text-xs text-mist/80">
            <span className="pointer-coarse:hidden">Move your cursor over the dots</span>
            <span className="hidden pointer-coarse:inline">Drag across the dots</span>
          </p>
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
