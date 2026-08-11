import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Lightbulb, FolderOpen, CreditCard, ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const teasers = [
  {
    icon: Lightbulb,
    iconBg: "bg-blue-bg",
    iconColor: "text-blue",
    title: "Werkwijze",
    description:
      "Van discovery tot schaalbaar platform: een bewezen 3-fasen proces zonder verrassingen.",
    to: "/werkwijze",
  },
  {
    icon: FolderOpen,
    iconBg: "bg-green-bg",
    iconColor: "text-green",
    title: "Portfolio",
    description:
      "Bekijk hoe we een compleet B2B platform bouwden voor de evenementenbranche.",
    to: "/portfolio",
  },
  {
    icon: CreditCard,
    iconBg: "bg-[#fef2f2]",
    iconColor: "text-[#ef4444]",
    title: "Prijzen",
    description:
      "Transparante, vaste prijzen. Geen uurtje-factuurtje, geen verborgen kosten.",
    to: "/prijzen",
  },
];

export function HomeTeaser() {
  return (
    <section className="py-24 px-8 max-md:py-16 max-md:px-5">
      <div className="max-w-[1120px] mx-auto">
        <div className="grid grid-cols-3 gap-6 max-md:grid-cols-1">
          {teasers.map((teaser, i) => (
            <AnimatedSection key={teaser.title} delay={i * 0.15}>
              <Link to={teaser.to} className="block no-underline group">
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="p-8 rounded-[12px] border border-border bg-bg-white h-full"
                >
                  <div
                    className={`w-11 h-11 rounded-[10px] ${teaser.iconBg} flex items-center justify-center mb-4`}
                  >
                    <teaser.icon
                      className={`w-5 h-5 ${teaser.iconColor}`}
                    />
                  </div>
                  <h3 className="text-lg font-bold tracking-[-0.3px] mb-2 text-text">
                    {teaser.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-4">
                    {teaser.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-text">
                    Bekijk meer
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </motion.div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
