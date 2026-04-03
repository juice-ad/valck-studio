import { motion } from "motion/react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

export function CTA() {
  return (
    <section id="contact" className="text-center bg-text text-white py-24 px-8 max-md:py-16 max-md:px-5">
      <AnimatedSection>
        <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold tracking-[-1.5px] mb-4">
          Klaar om te bouwen?
        </h2>
        <p className="text-[17px] text-white/70 max-w-[480px] mx-auto mb-9">
          Plan een vrijblijvend gesprek en ontdek wat Valck Studio voor jouw
          business kan betekenen.
        </p>
        <motion.a
          href="mailto:antoine@valck.studio"
          whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.3)" }}
          className="bg-white text-text px-9 py-3.5 rounded-[10px] text-[15px] font-semibold no-underline inline-block transition-all"
        >
          antoine@valck.studio →
        </motion.a>
      </AnimatedSection>
    </section>
  );
}
