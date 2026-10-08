// Portfolio entries for the Projects section. Add a project by adding an object here
// and dropping its media in public/projects/<id>/.

export interface ProjectShot {
  src: string;
  label: string;
}

export interface Project {
  id: string;
  title: string;
  /** One line under the title. */
  tagline: string;
  /** Shown on hover. */
  summary: string;
  highlights: string[];
  stack: string[];
  video: string;
  /** One screenshot per page, in flow order. */
  shots: ProjectShot[];
}

export const PROJECTS: Project[] = [
  {
    id: "nibble",
    title: "SOLIDSTRUK Nibble",
    tagline: "Floor plan → 3D model → AI renders → cinematic walkthrough",
    summary:
      "A house-design studio for SOLIDSTRUK. Draw a floor plan with snap-together room blocks (or upload a sketch), get an instant SketchUp-style 3D model, turn it into photoreal AI renders, and finish with a cinematic walkthrough film — with a client approval gate between every step.",
    highlights: [
      "Lego-style room blocks with snapping, auto doors & windows, 2 storeys",
      "3D model built from the plan: real openings, stairs, roofs, section cut",
      "AI renders from automatic exterior, cutaway and in-room cameras",
      "Design board export and Veo walkthrough with title cards",
      "Nibble, the pixel-bot helper, checks the plan for issues",
    ],
    stack: ["Next.js", "React", "Three.js", "Gemini", "Veo", "IndexedDB"],
    video: "/projects/nibble/intro.mp4",
    shots: [
      { src: "/projects/nibble/01-intro.webp", label: "Intro" },
      { src: "/projects/nibble/02-home.webp", label: "Projects home" },
      { src: "/projects/nibble/03-plan.webp", label: "1 · Floor plan" },
      { src: "/projects/nibble/04-approval.webp", label: "Client approval gate" },
      { src: "/projects/nibble/05-model.webp", label: "2 · 3D model" },
      { src: "/projects/nibble/06-visualize.webp", label: "3 · AI visualization" },
      { src: "/projects/nibble/07-board.webp", label: "4 · Design board" },
      { src: "/projects/nibble/08-walkthrough.webp", label: "5 · Walkthrough · exterior" },
      { src: "/projects/nibble/09-walkthrough-interior.webp", label: "5 · Walkthrough · interior" },
    ],
  },
];
