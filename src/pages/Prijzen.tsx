import { motion } from "motion/react";
import { Pricing } from "@/components/sections/Pricing";
import { CTA } from "@/components/sections/CTA";

export function Prijzen() {
  return (
    <>
      <section className="pt-40 pb-0 px-8 max-md:pt-28 max-md:px-5">
        <div className="max-w-[1120px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[13px] font-semibold tracking-[0.5px] text-text-muted mb-3">
              Prijzen
            </p>
            <h1 className="text-[clamp(32px,5vw,48px)] font-extrabold tracking-[-2px] mb-5">
              Transparante, vaste prijzen.
            </h1>
            <p className="text-lg text-text-secondary max-w-[560px] leading-[1.7]">
              Geen uurtje-factuurtje, geen verrassingen. Je weet vooraf precies
              wat je betaalt.
            </p>
          </motion.div>
        </div>
      </section>
      <Pricing hideHeader />
      <CTA />
    </>
  );
}
