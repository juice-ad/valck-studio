import { motion } from "motion/react";
import { Check } from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeader } from "@/components/ui/SectionHeader";

const tiers = [
  {
    name: "Discovery",
    price: "Gratis",
    priceSuffix: "",
    period: "Vrijblijvend · 1-2 weken",
    features: [
      "Procesanalyse & pijnpunten",
      "Klikbaar prototype",
      "Technische architectuur",
      "Vaste-prijs offerte voor build",
      "Geen verplichting om door te gaan",
    ],
    cta: "Plan een discovery call →",
    featured: false,
  },
  {
    name: "Build",
    price: "Op maat",
    priceSuffix: "",
    period: "Vaste prijs · 6-10 weken",
    features: [
      "Alles uit Discovery",
      "Volledig werkend platform",
      "Wekelijkse demo's",
      "100% IP-overdracht",
      "30 dagen support na oplevering",
    ],
    cta: "Plan een gesprek →",
    featured: true,
  },
  {
    name: "Scale",
    price: "Op maat",
    priceSuffix: "",
    period: "Per maand · doorlopend",
    features: [
      "Doorontwikkeling & nieuwe features",
      "Bug fixes & onderhoud",
      "Performance monitoring",
      "Prioriteit support",
      "Maandelijks opzegbaar",
    ],
    cta: "Meer info →",
    featured: false,
  },
];

interface PricingProps {
  hideHeader?: boolean;
}

export function Pricing({ hideHeader = false }: PricingProps) {
  return (
    <section id="prijzen" className="py-24 px-8 max-md:py-16 max-md:px-5">
      <div className="max-w-[1120px] mx-auto">
        {!hideHeader && (
          <AnimatedSection>
            <SectionHeader
              label="Prijzen"
              title="Transparante, vaste prijzen."
              subtitle="Geen uurtje-factuurtje, geen verrassingen. Je weet vooraf precies wat je betaalt."
            />
          </AnimatedSection>
        )}

        <div className="grid grid-cols-3 gap-6 max-md:grid-cols-1">
          {tiers.map((tier, i) => (
            <AnimatedSection key={tier.name} delay={i * 0.15}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className={`p-9 rounded-[12px] bg-bg-white relative ${
                  tier.featured
                    ? "border-2 border-text"
                    : "border border-border"
                }`}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-text text-white px-3.5 py-0.5 rounded-full text-xs font-semibold">
                    Meest gekozen
                  </span>
                )}

                <div className="text-sm font-semibold text-text-muted tracking-[0.3px] mb-2">
                  {tier.name}
                </div>
                <div className="text-4xl font-extrabold tracking-[-1.5px] mb-1">
                  {tier.price}
                  <span className="text-lg font-normal text-text-muted">
                    {tier.priceSuffix}
                  </span>
                </div>
                <div className="text-[13px] text-text-muted mb-6">
                  {tier.period}
                </div>

                <ul className="list-none mb-7 space-y-2">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="text-sm text-text-secondary flex items-start gap-2.5"
                    >
                      <Check className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href="#contact"
                  className={`block text-center py-3 px-6 rounded-lg text-sm font-semibold no-underline transition-all ${
                    tier.featured
                      ? "bg-text text-white hover:bg-[#333]"
                      : "bg-accent-soft text-text border border-border hover:bg-[#e8e8e8]"
                  }`}
                >
                  {tier.cta}
                </a>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        <p className="text-center text-[13px] text-text-muted mt-6">
          Prijzen worden bepaald na de discovery fase. Altijd vaste prijs, geen verrassingen.
        </p>
      </div>
    </section>
  );
}
