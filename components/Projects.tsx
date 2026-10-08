import { PROJECTS } from "@/lib/projects";
import ProjectCard from "./ProjectCard";

export default function Projects() {
  return (
    <section id="projects" aria-labelledby="projects-h" className="mx-auto max-w-7xl scroll-mt-4 px-4 pt-8 sm:px-6 lg:pt-12">
      <div className="mb-6 flex items-baseline gap-4 border-b border-line pb-3">
        <h2 id="projects-h" className="font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
          Projects
        </h2>
        <span className="tnum text-sm text-mist">{String(PROJECTS.length).padStart(2, "0")}</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {PROJECTS.map((p) => (
          <div key={p.id} className={`min-w-0 ${PROJECTS.length === 1 ? "mx-auto w-full max-w-3xl lg:col-span-2" : ""}`}>
            <ProjectCard project={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
