import { CONTACTS, WEBSITE, type ContactKind } from "@/lib/contacts";
import { FREELANCER } from "@/lib/pricing";

const ICONS: Record<ContactKind, React.ReactNode> = {
  facebook: (
    <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9z" />
  ),
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" />
    </>
  ),
  github: (
    <path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.5.1.7-.2.7-.5v-1.7c-2.7.6-3.2-1.2-3.2-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.1-.2-4.4-1.1-4.4-4.7 0-1 .4-1.9 1-2.6-.1-.2-.4-1.2.1-2.6 0 0 .8-.3 2.6 1a9 9 0 0 1 4.8 0c1.8-1.3 2.6-1 2.6-1 .5 1.4.2 2.4.1 2.6.6.7 1 1.5 1 2.6 0 3.7-2.3 4.5-4.4 4.7.3.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A9.5 9.5 0 0 0 12 2.5z" />
  ),
  linkedin: (
    <path d="M6.9 8.8H3.9V20h3V8.8zM5.4 4a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5zM20.1 13.6c0-3-1.6-4.9-4.2-4.9-1.4 0-2.4.8-2.8 1.5V8.8h-2.9V20h3v-5.6c0-1.5.3-2.9 2.1-2.9s1.8 1.7 1.8 3V20h3v-6.4z" />
  ),
};

export default function Footer() {
  const links = CONTACTS.filter((c) => c.href);
  const site = WEBSITE.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <footer className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
      <div className="glass flex flex-col gap-6 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="font-display text-xl tracking-tight text-ink">
            Gabi-<span className="font-serif italic text-frost">comm</span>
          </p>
          <p className="mt-1 text-sm text-mist">
            {FREELANCER.name} · {FREELANCER.role}
          </p>
          <a
            href={WEBSITE}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-night/40 px-4 py-2 text-sm text-ink transition hover:border-mist hover:text-frost"
          >
            {site} <span aria-hidden>↗</span>
          </a>
        </div>

        <nav aria-label="Contacts">
          <ul className="flex flex-wrap gap-2.5">
            {links.map((c) => (
              <li key={c.kind}>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={c.label}
                  title={c.label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-line bg-night/40 text-mist transition hover:-translate-y-0.5 hover:border-mist hover:text-frost hover:shadow-[0_8px_24px_-10px_rgba(202,220,234,0.6)]"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
                    {ICONS[c.kind]}
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mt-4 text-center text-xs text-mist/70">© {new Date().getFullYear()} Gabi-comm</p>
    </footer>
  );
}
