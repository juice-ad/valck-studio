import { Link } from "react-router-dom";
import { motion } from "motion/react";

export function Hero() {
  return (
    <section className="pt-40 pb-24 px-8 text-center max-md:pt-28 max-md:pb-16 max-md:px-5">
      <div className="max-w-[1120px] mx-auto">
        {/* Availability badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-bg text-green text-[13px] font-[550] border border-green-border mb-7"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse-dot" />
          Beschikbaar voor nieuwe projecten
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[clamp(40px,6vw,64px)] font-extrabold leading-[1.05] tracking-[-2.5px] mb-5"
        >
          Van idee naar
          <br />
          schaalbaar platform.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-text-secondary max-w-[560px] mx-auto mb-9 leading-[1.7]"
        >
          Solo product studio voor founders die een B2B SaaS willen bouwen.
          Discovery in 2 weken, MVP in 6-10 weken. Vaste prijs, volledige
          eigendom.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex gap-3 justify-center flex-wrap"
        >
          <a
            href="#contact"
            className="bg-text text-white px-8 py-3.5 rounded-[10px] text-[15px] font-semibold no-underline inline-flex items-center gap-2 hover:bg-[#333] hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            Plan een discovery call <span>→</span>
          </a>
          <Link
            to="/portfolio"
            className="bg-bg-white text-text px-8 py-3.5 rounded-[10px] text-[15px] font-semibold no-underline border border-border hover:border-[#ccc] hover:bg-accent-soft transition-all"
          >
            Bekijk portfolio
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
