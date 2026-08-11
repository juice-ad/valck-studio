import { motion } from "motion/react";
import { Check, ArrowRight, HelpCircle } from "lucide-react";
import { useState } from "react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Discovery",
    price: "Gratis",
    priceSuffix: "",
    period: "Vrijblijvend · 1-2 weken",
    description: "Ontdek wat er mogelijk is. Geen verplichting, wel direct inzicht.",
    features: [
      "Diepte-interview over processen & pijnpunten",
      "Klikbaar prototype van jouw oplossing",
      "Technische architectuur & stack keuze",
      "Vaste-prijs offerte voor de build fase",
      "Volledige IP blijft bij jou",
    ],
    cta: "Plan een discovery call",
    ctaLink: "#contact",
    featured: false,
  },
  {
    name: "Build",
    price: "Op maat",
    priceSuffix: "",
    period: "Vaste prijs · 6-10 weken",
    description: "Van prototype naar werkend product. Wekelijkse demo's, geen verrassingen.",
    features: [
      "Alles uit Discovery, plus:",
      "Volledig werkend platform op maat",
      "Wekelijkse demo's & feedbackrondes",
      "Klantportaal voor real-time inzicht",
      "100% broncode & IP-overdracht",
      "30 dagen support na oplevering",
    ],
    cta: "Plan een gesprek",
    ctaLink: "#contact",
    featured: true,
  },
  {
    name: "Scale",
    price: "Op maat",
    priceSuffix: "/ maand",
    period: "Maandelijks opzegbaar",
    description: "Doorontwikkeling, onderhoud & groei. Jouw platform blijft voorlopen.",
    features: [
      "Doorontwikkeling & nieuwe features",
      "Bug fixes & security updates",
      "Performance monitoring & optimalisatie",
      "Prioriteit support (< 4 uur responstijd)",
      "Maandelijks opzegbaar, geen lock-in",
    ],
    cta: "Meer info",
    ctaLink: "#contact",
    featured: false,
  },
];

const faqs = [
  {
    question: "Wat kost een project?",
    answer:
      "Elk project begint met een gratis discovery fase. Daarna ontvang je een vaste-prijs offerte op basis van scope en complexiteit. Geen uurtje-factuurtje: je weet vooraf wat je betaalt.",
  },
  {
    question: "Hoe lang duurt een build?",
    answer:
      "De meeste projecten worden opgeleverd in 6-10 weken. Bij de offerte krijg je een concrete planning met milestones en wekelijkse demo's.",
  },
  {
    question: "Wie is eigenaar van de code?",
    answer:
      "Jij. Na oplevering ontvang je 100% van de broncode, inclusief alle rechten. De code draait op jouw eigen infrastructure, geen vendor lock-in.",
  },
  {
    question: "Kan ik tussentijds opzeggen?",
    answer:
      "Bij Scale (maandelijks retainer) kun je elke maand opzeggen. Bij Build werk je met vaste milestones: je betaalt alleen voor afgerond werk.",
  },
  {
    question: "Welke technologieën gebruiken jullie?",
    answer:
      "We bouwen met moderne, bewezen technologie: React, TypeScript, Supabase, Vercel. Altijd open-source waar mogelijk, zodat je nooit vast zit aan dure licenties.",
  },
  {
    question: "Hoe zit het met onderhoud na oplevering?",
    answer:
      "De eerste 30 dagen na oplevering zijn inclusief: bug fixes en kleine aanpassingen. Daarna kun je kiezen voor een Scale-retainer of het zelf beheren.",
  },
];

interface PricingProps {
  hideHeader?: boolean;
}

export function Pricing({ hideHeader = false }: PricingProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

        {/* Pricing tiers */}
        <div className="grid grid-cols-3 gap-6 max-md:grid-cols-1">
          {tiers.map((tier, i) => (
            <AnimatedSection key={tier.name} delay={i * 0.15}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className={`p-9 rounded-[12px] bg-bg-white relative flex flex-col h-full ${
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
                  {tier.priceSuffix && (
                    <span className="text-lg font-normal text-text-muted">
                      {tier.priceSuffix}
                    </span>
                  )}
                </div>
                <div className="text-[13px] text-text-muted mb-3">
                  {tier.period}
                </div>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                  {tier.description}
                </p>

                <ul className="list-none mb-7 space-y-2.5 flex-1">
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

                <Button
                  asChild
                  variant={tier.featured ? "default" : "outline"}
                  className="w-full justify-center"
                  size="lg"
                >
                  <a href={tier.ctaLink} className="no-underline">
                    {tier.cta}
                    <ArrowRight size={16} />
                  </a>
                </Button>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        <p className="text-center text-[13px] text-text-muted mt-6">
          Prijzen worden bepaald na de discovery fase. Altijd vaste prijs, geen verrassingen.
        </p>

        {/* Comparison table */}
        <AnimatedSection>
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-text text-center mb-8">
              Wat zit er in elke fase?
            </h2>
            <div className="rounded-[12px] bg-bg-white border border-border-light overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border-light">
                      <th className="px-6 py-4 text-sm font-medium text-text-muted">Feature</th>
                      <th className="px-6 py-4 text-sm font-semibold text-text text-center">Discovery</th>
                      <th className="px-6 py-4 text-sm font-semibold text-text text-center bg-accent-soft/30">Build</th>
                      <th className="px-6 py-4 text-sm font-semibold text-text text-center">Scale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Procesanalyse", true, true, false],
                      ["Klikbaar prototype", true, true, false],
                      ["Technische architectuur", true, true, false],
                      ["Werkend platform", false, true, false],
                      ["Wekelijkse demo's", false, true, false],
                      ["Klantportaal", false, true, true],
                      ["Broncode overdracht", false, true, false],
                      ["30 dagen support", false, true, false],
                      ["Doorontwikkeling", false, false, true],
                      ["Bug fixes & updates", false, false, true],
                      ["Performance monitoring", false, false, true],
                      ["Prioriteit support", false, false, true],
                    ].map(([feature, discovery, build, scale], i) => (
                      <tr key={i} className="border-b border-border-light last:border-b-0">
                        <td className="px-6 py-3 text-sm text-text">{feature as string}</td>
                        <td className="px-6 py-3 text-center">
                          {discovery ? <Check size={16} className="text-green mx-auto" /> : <span className="text-text-muted">-</span>}
                        </td>
                        <td className="px-6 py-3 text-center bg-accent-soft/30">
                          {build ? <Check size={16} className="text-green mx-auto" /> : <span className="text-text-muted">-</span>}
                        </td>
                        <td className="px-6 py-3 text-center">
                          {scale ? <Check size={16} className="text-green mx-auto" /> : <span className="text-text-muted">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* FAQ */}
        <AnimatedSection>
          <div className="mt-20 max-w-[720px] mx-auto">
            <div className="flex items-center gap-2 justify-center mb-8">
              <HelpCircle size={20} className="text-text-muted" />
              <h2 className="text-2xl font-bold text-text">
                Veelgestelde vragen
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-[12px] border border-border-light overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left px-6 py-4 flex items-center justify-between bg-bg-white hover:bg-accent-soft/30 transition-colors"
                  >
                    <span className="text-sm font-medium text-text pr-4">
                      {faq.question}
                    </span>
                    <motion.span
                      animate={{ rotate: openFaq === i ? 45 : 0 }}
                      className="text-text-muted text-lg flex-shrink-0"
                    >
                      +
                    </motion.span>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{
                      height: openFaq === i ? "auto" : 0,
                      opacity: openFaq === i ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-4 text-sm text-text-secondary leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
