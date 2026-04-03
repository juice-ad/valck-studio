import { motion } from "motion/react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeader } from "@/components/ui/SectionHeader";

function MockDashboard() {
  return (
    <div className="w-[85%] h-[80%] bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4 relative">
      <div className="flex gap-1.5 mb-3">
        <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
        <div className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
        <div className="w-2 h-2 rounded-full bg-[#28c840]" />
      </div>
      <div className="flex gap-3 h-[calc(100%-28px)]">
        <div className="w-[30%] bg-[#f8f8f8] rounded" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-2.5 bg-[#f0f0f0] rounded-sm w-[60%]" />
          <div className="h-2.5 bg-[#f0f0f0] rounded-sm w-[85%]" />
          <div className="h-2.5 bg-[#f0f0f0] rounded-sm w-[45%]" />
          <div className="h-6 bg-text rounded w-[40%] mt-auto" />
        </div>
      </div>
    </div>
  );
}

function MockChart() {
  const bars = [45, 70, 55, 90, 65];
  return (
    <div className="w-[85%] h-[80%] bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4 relative">
      <div className="flex gap-1.5 mb-3">
        <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
        <div className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
        <div className="w-2 h-2 rounded-full bg-[#28c840]" />
      </div>
      <div className="flex flex-col h-[calc(100%-28px)]">
        <div className="h-2.5 bg-[#f0f0f0] rounded-sm w-[40%] mb-2" />
        <div className="flex-1 flex items-end gap-1.5 pt-2">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm"
              style={{
                height: `${h}%`,
                background: i % 2 === 1 ? "#111" : "#e8e8e8",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const projects = [
  {
    tag: "B2B SaaS · Crew Management",
    title: "Crew Operations Platform",
    description:
      "Centraal platform voor planning, facturatie en crew-management. Verving 6 losse tools en bespaart 10+ uur per week aan admin.",
    tech: ["Next.js", "TypeScript", "Supabase", "Moneybird API"],
    mock: <MockDashboard />,
  },
  {
    tag: "B2B SaaS · Automation",
    title: "Client Portal & Billing Engine",
    description:
      "Klantportaal met automatische facturatie, real-time dashboard en multi-tool integratie. Verlaagde toolkosten met €7.200 per jaar.",
    tech: ["React", "Node.js", "PostgreSQL", "Stripe"],
    mock: <MockChart />,
  },
];

export function Portfolio() {
  return (
    <section id="portfolio" className="py-24 px-8 max-md:py-16 max-md:px-5">
      <div className="max-w-[1120px] mx-auto">
        <AnimatedSection>
          <SectionHeader
            label="Portfolio"
            title="Gebouwd door Valck Studio."
            subtitle="Een selectie van platforms en tools gebouwd voor founders die serieus willen schalen."
          />
        </AnimatedSection>

        <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
          {projects.map((project, i) => (
            <AnimatedSection key={project.title} delay={i * 0.15}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className="bg-bg-white border border-border rounded-[12px] overflow-hidden"
              >
                {/* Mock preview */}
                <div className="w-full h-60 bg-gradient-to-br from-[#f5f5f5] to-[#e8e8e8] flex items-center justify-center">
                  {project.mock}
                </div>

                {/* Info */}
                <div className="p-7">
                  <div className="text-[11px] font-semibold tracking-[0.3px] text-text-muted mb-2">
                    {project.tag}
                  </div>
                  <h3 className="text-lg font-bold tracking-[-0.3px] mb-2">
                    {project.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {project.description}
                  </p>
                  <div className="flex gap-1.5 mt-4 flex-wrap">
                    {project.tech.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-accent-soft rounded-md text-xs font-medium text-text-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
