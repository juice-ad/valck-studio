import { motion } from "motion/react";
import { Check } from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { CTA } from "@/components/sections/CTA";

const phases = [
  {
    number: 1,
    title: "Discovery Sprint",
    meta: "1-2 weken · gratis & vrijblijvend",
    description:
      "Ik duik in je business, breng processen in kaart en bouw een klikbaar prototype. Je ziet het resultaat voordat je investeert.",
    deliverables: [
      "Procesanalyse & pijnpunten in kaart",
      "User stories & feature prioritering",
      "Klikbaar prototype (Figma)",
      "Technische architectuur & stack keuze",
      "Vaste-prijs offerte voor de build fase",
      "Geen verplichting om door te gaan",
    ],
  },
  {
    number: 2,
    title: "Build",
    meta: "6-10 weken · vaste prijs",
    description:
      "Ik bouw je platform met wekelijkse demo's. Moderne stack, schaalbare architectuur, klaar voor groei. Vaste prijs, geen scope creep.",
    deliverables: [
      "Volledig werkend platform",
      "Wekelijkse demo's & feedback rondes",
      "Responsive design (desktop + mobiel)",
      "Authenticatie & rolgebaseerde toegang",
      "Database design & API's",
      "100% IP-overdracht bij oplevering",
      "30 dagen gratis support na launch",
    ],
  },
  {
    number: 3,
    title: "Scale",
    meta: "Doorlopend · maandelijks opzegbaar",
    description:
      "Doorontwikkeling op retainer-basis. Nieuwe features, optimalisaties en support. Jouw product team on demand, zonder vast personeel.",
    deliverables: [
      "Doorontwikkeling & nieuwe features",
      "Bug fixes & technisch onderhoud",
      "Performance monitoring & optimalisatie",
      "Prioriteit support (< 24u responstijd)",
      "Maandelijkse voortgangsrapportage",
      "Maandelijks opzegbaar, geen lock-in",
    ],
  },
];

export function Werkwijze() {
  return (
    <>
      <section className="pt-40 pb-24 px-8 max-md:pt-28 max-md:pb-16 max-md:px-5">
        <div className="max-w-[1120px] mx-auto">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-20"
          >
            <p className="text-[13px] font-semibold tracking-[0.5px] text-text-muted mb-3">
              Werkwijze
            </p>
            <h1 className="text-[clamp(32px,5vw,48px)] font-extrabold tracking-[-2px] mb-5">
              Drie fases, geen verrassingen.
            </h1>
            <p className="text-lg text-text-secondary max-w-[560px] leading-[1.7]">
              Een bewezen proces dat risico minimaliseert en snelheid
              maximaliseert. Je weet altijd precies waar je aan toe bent.
            </p>
          </motion.div>

          {/* Phases */}
          <div className="flex flex-col gap-8">
            {phases.map((phase, i) => (
              <AnimatedSection key={phase.number} delay={i * 0.15}>
                <motion.div
                  whileHover={{
                    y: -2,
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                  }}
                  transition={{ duration: 0.2 }}
                  className="p-10 rounded-[12px] bg-bg-white border border-border-light max-md:p-7"
                >
                  <div className="flex items-start gap-6 max-md:flex-col">
                    <div className="w-12 h-12 rounded-[12px] bg-text text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                      {phase.number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h2 className="text-xl font-bold tracking-[-0.3px]">
                          {phase.title}
                        </h2>
                        <span className="text-[13px] text-text-muted font-medium bg-accent-soft px-3 py-0.5 rounded-full">
                          {phase.meta}
                        </span>
                      </div>
                      <p className="text-text-secondary leading-[1.7] mb-6 max-w-[640px]">
                        {phase.description}
                      </p>
                      <ul className="grid grid-cols-2 gap-x-8 gap-y-2.5 max-md:grid-cols-1">
                        {phase.deliverables.map((item) => (
                          <li
                            key={item}
                            className="text-sm text-text-secondary flex items-start gap-2.5"
                          >
                            <Check className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
