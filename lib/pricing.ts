// Rate card. Edit prices here — everything else reads from this file.

export type Unit = "flat" | "qty";

export type Category = "core" | "build" | "ai-gis" | "launch" | "support";

export interface PriceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: Unit;
  /** Label for one unit, shown next to qty items ("feature", "page"). */
  unitLabel?: string;
  category: Category;
  /** Billed monthly; kept out of the one-time total. */
  recurring?: boolean;
  /** Only counts when this other item is also selected. */
  requires?: string;
}

export const CATEGORIES: { id: Category; title: string; blurb: string }[] = [
  { id: "core", title: "Core services", blurb: "The base of most projects." },
  { id: "build", title: "Build add-ons", blurb: "Functionality on top of the website." },
  { id: "ai-gis", title: "AI & mapping upgrades", blurb: "Extends the chatbot and GIS services." },
  { id: "launch", title: "Design & launch", blurb: "Branding, content and going live." },
  { id: "support", title: "Revisions & support", blurb: "After-delivery work." },
];

export const ITEMS: PriceItem[] = [
  // Core
  { id: "website", name: "Website", description: "Responsive site, up to 5 pages.", price: 4000, unit: "flat", category: "core" },
  { id: "feature", name: "Feature", description: "Each custom feature added (forms, booking, search, etc.).", price: 1500, unit: "qty", unitLabel: "feature", category: "core" },
  { id: "chatbot", name: "Chatbot", description: "FAQ / guided chatbot embedded on the site.", price: 2000, unit: "flat", category: "core" },
  { id: "gis", name: "GIS mapping", description: "Interactive map with markers and location data.", price: 3000, unit: "flat", category: "core" },

  // Build add-ons
  { id: "extra-page", name: "Extra page", description: "Each page beyond the 5 included.", price: 500, unit: "qty", unitLabel: "page", category: "build" },
  { id: "auth", name: "User login / authentication", description: "Sign up, log in, password reset, roles.", price: 2000, unit: "flat", category: "build" },
  { id: "database", name: "Database setup & integration", description: "Schema, storage and data wiring.", price: 2500, unit: "flat", category: "build" },
  { id: "admin", name: "Admin dashboard / CMS", description: "Manage content and records without code.", price: 3000, unit: "flat", category: "build" },
  { id: "analytics", name: "Data dashboard", description: "Charts and analytics views.", price: 2500, unit: "flat", category: "build" },
  { id: "api", name: "Third-party API integration", description: "Each external service connected.", price: 1500, unit: "qty", unitLabel: "API", category: "build" },
  { id: "payment", name: "Payment gateway", description: "GCash / card payments via PayMongo or similar.", price: 3000, unit: "flat", category: "build" },
  { id: "ecommerce", name: "E-commerce module", description: "Products, cart, checkout and orders.", price: 5000, unit: "flat", category: "build" },
  { id: "notifications", name: "Email / SMS notifications", description: "Automated messages on key events.", price: 1000, unit: "flat", category: "build" },
  { id: "i18n", name: "Multi-language support", description: "e.g. English + Filipino.", price: 1500, unit: "flat", category: "build" },

  // AI & GIS upgrades
  { id: "ai-upgrade", name: "AI chatbot upgrade", description: "Answers from the client's own documents (RAG). Requires Chatbot.", price: 2500, unit: "flat", category: "ai-gis", requires: "chatbot" },
  { id: "gis-layer", name: "GIS extra layer", description: "Heatmap, boundaries, routing, etc. Requires GIS mapping.", price: 1000, unit: "qty", unitLabel: "layer", category: "ai-gis", requires: "gis" },

  // Design & launch
  { id: "uiux", name: "UI/UX design mockup", description: "Figma screens before development.", price: 2000, unit: "flat", category: "launch" },
  { id: "branding", name: "Logo / basic branding", description: "Logo, colors and type.", price: 1500, unit: "flat", category: "launch" },
  { id: "seo", name: "SEO setup", description: "Meta tags, sitemap, analytics.", price: 1000, unit: "flat", category: "launch" },
  { id: "hosting", name: "Domain & hosting setup", description: "Setup only — domain/hosting fees billed at cost.", price: 1000, unit: "flat", category: "launch" },
  { id: "content", name: "Content upload", description: "Per batch of 10 items (products, posts, entries).", price: 300, unit: "qty", unitLabel: "batch of 10", category: "launch" },

  // Support
  { id: "revision", name: "Extra revision round", description: "2 rounds included; each extra round.", price: 500, unit: "qty", unitLabel: "round", category: "support" },
  { id: "maintenance", name: "Monthly maintenance", description: "Updates, fixes and backups. Billed monthly.", price: 1000, unit: "flat", category: "support", recurring: true },
];

export const ITEM_BY_ID: Record<string, PriceItem> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export type Complexity = "simple" | "standard" | "complex";

export const COMPLEXITY: Record<Complexity, { label: string; multiplier: number; hint: string }> = {
  simple: { label: "Simple", multiplier: 1, hint: "Clear scope, standard layouts" },
  standard: { label: "Standard", multiplier: 1.2, hint: "Some custom logic or design" },
  complex: { label: "Complex", multiplier: 1.5, hint: "Heavy custom logic, tight specs" },
};

export const RUSH_RATE = 0.25;

export type DiscountKind = "none" | "student" | "returning" | "custom";

export const DISCOUNTS: Record<Exclude<DiscountKind, "custom">, { label: string; rate: number }> = {
  none: { label: "No discount", rate: 0 },
  student: { label: "Student / thesis (−10%)", rate: 0.1 },
  returning: { label: "Returning client (−5%)", rate: 0.05 },
};

export const DOWN_PAYMENT_RATE = 0.5;
export const QUOTE_VALID_DAYS = 15;
export const ROUND_TO = 50;

export const FREELANCER = {
  name: "Gabriel John Solomon",
  role: "Software Engineer & UI Designer",
  email: "gabrieljohnsolomon@gmail.com",
};
