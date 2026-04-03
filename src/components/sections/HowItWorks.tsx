import { motion } from "motion/react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeader } from "@/components/ui/SectionHeader";

const steps = [
  {
    number: 1,
    title: "Discovery Sprint",
    description:
      "Ik breng je processen in kaart, bouw een klikbaar prototype en lever een vaste-prijs offerte. Je ziet het resultaat voordat je investeert.",
    meta: "1-2 weken · gratis & vrijblijvend",
  },
  {
    number: 2,
    title: "Build",
    description:
      "Ik bouw je platform met wekelijkse demo's. Moderne stack, schaalbare architectuur, klaar voor groei. Vaste prijs, geen scope creep.",
    meta: "6-10 weken · vaste prijs",
  },
  {
    number: 3,
    title: "Scale",
    description:
      "Doorontwikkeling op retainer-basis. Nieuwe features, optimalisaties en support. Jouw product team on demand, zonder vast personeel.",
    meta: "Doorlopend · maandelijks opzegbaar",
  },
];

export function HowItWorks() {
  return (
    <section
      id="werkwijze"
      className="py-24 px-8 bg-bg-white border-t border-b border-border-light max-md:py-16 max-md:px-5"
    >
      <div className="max-w-[1120px] mx-auto">
        <AnimatedSection>
          <SectionHeader
            label="Werkwijze"
            title="Drie fases, geen verrassingen."
            subtitle="Een bewezen proces dat risico minimaliseert en snelheid maximaliseert. Je weet altijd precies waar je aan toe bent."
          />
        </AnimatedSection>

        <div className="grid grid-cols-3 gap-8 max-md:grid-cols-1">
          {steps.map((step, i) => (
            <AnimatedSection key={step.number} delay={i * 0.15}>
              <motion.div
                whileHover={{ y: -4, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}
                transition={{ duration: 0.2 }}
                className="p-9 rounded-[12px] bg-bg border border-border-light"
              >
                <div className="w-9 h-9 rounded-[10px] bg-text text-white flex items-center justify-center text-sm font-bold mb-5">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold tracking-[-0.3px] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-text-secondary leading-[1.65]">
                  {step.description}
                </p>
                <div className="mt-4 text-[13px] text-text-muted font-medium">
                  {step.meta}
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
