// Footer contacts. A link with an empty href is hidden until it's filled in.

export type ContactKind = "facebook" | "instagram" | "github" | "linkedin";

export const WEBSITE = "https://solomon-gabriel.vercel.app/";

export const CONTACTS: { kind: ContactKind; label: string; href: string }[] = [
  { kind: "facebook", label: "Facebook", href: "" },
  { kind: "instagram", label: "Instagram", href: "" },
  { kind: "github", label: "GitHub", href: "https://github.com/Gabi-comm" },
  { kind: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/gabrieljohnsolomon/" },
];
