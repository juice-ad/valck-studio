import { motion } from "motion/react";
import {
  CreditCard,
  BookOpen,
  Mail,
  Shield,
  ArrowRight,
  Check,
  Puzzle,
} from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { CTA } from "@/components/sections/CTA";

const coreIntegrations = [
  {
    icon: CreditCard,
    iconBg: "bg-[#fff4e6]",
    iconColor: "text-[#f59e0b]",
    name: "Mollie",
    category: "Betalingen",
    description:
      "Online betalingen via iDEAL, creditcard, Bancontact en meer. Volledig geautomatiseerde betaalflows met webhooks voor realtime statusupdates.",
    features: [
      "iDEAL, creditcard, Bancontact, SEPA",
      "Automatische webhooks & statusupdates",
      "Terugkerende betalingen & abonnementen",
      "PCI-DSS compliant",
    ],
  },
  {
    icon: BookOpen,
    iconBg: "bg-blue-bg",
    iconColor: "text-blue",
    name: "Moneybird",
    category: "Facturatie & boekhouding",
    description:
      "Automatische facturatie en boekhouding. Facturen worden aangemaakt, verstuurd en bijgehouden vanuit je applicatie.",
    features: [
      "Automatisch facturen aanmaken & versturen",
      "Contacten synchroniseren",
      "BTW-berekening & financieel overzicht",
      "Koppeling met je boekhouder",
    ],
  },
  {
    icon: Mail,
    iconBg: "bg-green-bg",
    iconColor: "text-green",
    name: "Transactionele e-mail",
    category: "Communicatie",
    description:
      "Betrouwbare e-mail delivery via Resend of Postmark. Welkomstmails, notificaties, wachtwoord-resets en factuur-e-mails.",
    features: [
      "Transactionele e-mails (welkom, reset, notificatie)",
      "Hoge deliverability (geen spam-folder)",
      "HTML templates op maat",
      "Delivery tracking & analytics",
    ],
  },
  {
    icon: Shield,
    iconBg: "bg-[#fef2f2]",
    iconColor: "text-[#ef4444]",
    name: "Authenticatie",
    category: "Security",
    description:
      "Beveiligde gebruikersaccounts met Supabase Auth. E-mail/wachtwoord, magic links, en rolgebaseerde toegangscontrole.",
    features: [
      "E-mail/wachtwoord & magic links",
      "Rolgebaseerde toegang (RBAC)",
      "Row Level Security op database-niveau",
      "OAuth providers (Google, Microsoft) op aanvraag",
    ],
  },
];

const onRequestExamples = [
  "CRM (HubSpot, Salesforce, Pipedrive)",
  "E-commerce (Shopify, WooCommerce)",
  "Boekhouding (Exact Online, Xero)",
  "Planning (Calendly, Cal.com)",
  "Analytics (Google Analytics, PostHog)",
  "Communicatie (Slack, WhatsApp Business)",
];

export function Integraties() {
  return (
    <>
      <section className="pt-40 pb-24 px-8 max-md:pt-28 max-md:pb-16 max-md:px-5">
        <div className="max-w-[1120px] mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-20"
          >
            <p className="text-[13px] font-semibold tracking-[0.5px] text-text-muted mb-3">
              Integraties
            </p>
            <h1 className="text-[clamp(32px,5vw,48px)] font-extrabold tracking-[-2px] mb-5">
              De koppelingen die je nodig hebt.
            </h1>
            <p className="text-lg text-text-secondary max-w-[600px] leading-[1.7]">
              Elk project krijgt de integraties die passen bij jouw business.
              We beginnen met een solide basis en bouwen uit op aanvraag.
            </p>
          </motion.div>

          {/* Core integrations */}
          <div className="grid grid-cols-2 gap-6 mb-20 max-md:grid-cols-1">
            {coreIntegrations.map((integration, i) => (
              <AnimatedSection key={integration.name} delay={i * 0.1}>
                <div className="p-8 rounded-[12px] bg-bg-white border border-border-light h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-11 h-11 rounded-[10px] ${integration.iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                      <integration.icon
                        className={`w-5 h-5 ${integration.iconColor}`}
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold tracking-[-0.2px]">
                        {integration.name}
                      </h3>
                      <p className="text-xs text-text-muted">
                        {integration.category}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed mb-5">
                    {integration.description}
                  </p>
                  <ul className="space-y-2">
                    {integration.features.map((feature) => (
                      <li
                        key={feature}
                        className="text-sm text-text-secondary flex items-start gap-2.5"
                      >
                        <Check className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* On-request section */}
          <AnimatedSection>
            <div className="p-10 rounded-[12px] bg-bg-white border border-border-light max-md:p-7">
              <div className="flex items-start gap-6 max-md:flex-col">
                <div className="w-12 h-12 rounded-[12px] bg-accent-soft flex items-center justify-center flex-shrink-0">
                  <Puzzle className="w-6 h-6 text-text" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold tracking-[-0.3px] mb-2">
                    Overige integraties op aanvraag
                  </h2>
                  <p className="text-text-secondary leading-[1.7] mb-6 max-w-[640px]">
                    Heb je een koppeling nodig die hier niet bij staat? Geen
                    probleem. We bouwen elke integratie op maat, van CRM tot
                    ERP, van e-commerce tot custom API's. Bespreek je wensen
                    tijdens de discovery fase.
                  </p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 mb-8 max-md:grid-cols-1">
                    {onRequestExamples.map((example) => (
                      <div
                        key={example}
                        className="text-sm text-text-secondary flex items-center gap-2.5"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                        {example}
                      </div>
                    ))}
                  </div>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 bg-text text-white px-6 py-2.5 rounded-[8px] text-sm font-semibold hover:bg-[#333] transition-colors"
                  >
                    Bespreek je integraties <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
      <CTA />
    </>
  );
}
