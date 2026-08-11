import { motion } from "motion/react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { CTA } from "@/components/sections/CTA";

const techStack = [
  "React",
  "TypeScript",
  "Vite",
  "Tailwind CSS",
  "Supabase",
  "Stripe",
  "Vercel",
  "Google Calendar API",
  "Recharts",
  "Resend",
];

const clientScreenshots = [
  {
    src: "/portfolio/juice-events/client-dashboard.png",
    caption: "Client dashboard met financieel overzicht en omzet chart",
  },
  {
    src: "/portfolio/juice-events/client-events.png",
    caption: "Mijn Evenementen met voortgangsindicatoren",
  },
  {
    src: "/portfolio/juice-events/client-facturen.png",
    caption: "Facturen met PDF download en betalingsstatus",
  },
  {
    src: "/portfolio/juice-events/client-inzichten.png",
    caption: "Inzichten dashboard met verhuurprestatie analytics",
  },
];

const adminScreenshots = [
  {
    src: "/portfolio/juice-events/admin-dashboard.png",
    caption: "Operationeel overzicht met KPI's en omzet trend",
  },
  {
    src: "/portfolio/juice-events/admin-events.png",
    caption: "Evenementen met pipeline voortgang per event",
  },
  {
    src: "/portfolio/juice-events/admin-analytics.png",
    caption: "Cross-event analytics met KPI's en omzet trends",
  },
  {
    src: "/portfolio/juice-events/admin-agenda.png",
    caption: "Kalender met event fases en status filters",
  },
  {
    src: "/portfolio/juice-events/admin-facturatie.png",
    caption: "Self-billing en verkoopfacturen beheer",
  },
  {
    src: "/portfolio/juice-events/admin-financieel.png",
    caption: "Financieel overzicht: omzet vs. kosten breakdown",
  },
];

const partnerScreenshots = [
  {
    src: "/portfolio/juice-events/partner-dashboard.png",
    caption: "Franchise Dashboard met commissie, events en kasten",
  },
  {
    src: "/portfolio/juice-events/partner-events.png",
    caption: "Alle events met omzet en commissie per event",
  },
  {
    src: "/portfolio/juice-events/partner-financien.png",
    caption: "Commissie overzicht met maandelijkse trend",
  },
];

const features = [
  {
    icon: "🎪",
    title: "Event Management",
    description:
      "7-stappen aanvraag wizard, 8-fase event pipeline met readiness scoring en geautomatiseerde statusovergangen.",
  },
  {
    icon: "👤",
    title: "Client Portal",
    description:
      "Self-service portaal waar organisatoren events aanvragen, documenten beheren en facturen inzien.",
  },
  {
    icon: "⚡",
    title: "Admin Dashboard",
    description:
      "Operationeel zenuwcentrum met activiteitsfeed, bulk acties en real-time overzicht van alle events.",
  },
  {
    icon: "📈",
    title: "CRM & Sales",
    description:
      "Lead tracking, deal pipeline met fases, meeting planning en geïntegreerde contactbeheer.",
  },
  {
    icon: "📊",
    title: "Analytics",
    description:
      "Revenue trends, event performance, rental patronen en loss analysis met interactieve charts.",
  },
  {
    icon: "🔋",
    title: "Inventarisbeheer",
    description:
      "Powerbank stations tracking, toewijzing aan events, onderhoudsstatus en beschikbaarheidsoverzicht.",
  },
  {
    icon: "💰",
    title: "Facturatie",
    description:
      "Self-billing en verkoopfacturen, automatische BTW-berekening, betalingstracking en Stripe-integratie.",
  },
  {
    icon: "📅",
    title: "Agenda",
    description:
      "Interactieve kalender met Google Calendar sync, event fase-tracking en teamplanning.",
  },
];

const automations = [
  {
    icon: "🔗",
    title: "Stripe Payments",
    description:
      "Automatische betalingsverwerking, refunds en webhook-events voor realtime financieel overzicht.",
  },
  {
    icon: "📧",
    title: "Transactionele e-mails",
    description:
      "Bevestigingen, herinneringen en facturen via Resend, getriggerd door statuswijzigingen.",
  },
  {
    icon: "📅",
    title: "Google Calendar sync",
    description:
      "Events en deadlines automatisch gesynchroniseerd met teamkalenders.",
  },
  {
    icon: "📄",
    title: "PDF-generatie",
    description:
      "Facturen, self-billing documenten en contracten on-the-fly gegenereerd.",
  },
  {
    icon: "🔄",
    title: "Pipeline automations",
    description:
      "Automatische statusovergangen, readiness checks en notificaties per event fase.",
  },
  {
    icon: "📊",
    title: "Realtime analytics",
    description:
      "Live dashboards met omzet, commissies en performance, geen handmatige exports meer.",
  },
];

const results = [
  { number: "4", label: "portals" },
  { number: "15+", label: "admin pagina's" },
  { number: "60+", label: "componenten" },
  { number: "8", label: "pipeline fases" },
];

const projectMeta = [
  { label: "Klant", value: "Juice Events" },
  { label: "Type", value: "Multi-portal B2B Platform" },
  { label: "Periode", value: "8 weken" },
  { label: "Status", value: "Live in productie" },
];

export function Portfolio() {
  return (
    <>
      <section className="pt-40 pb-24 px-8 max-md:pt-28 max-md:pb-16 max-md:px-5">
        <div className="max-w-[1120px] mx-auto">
          {/* Page header - full width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-14"
          >
            <p className="text-[13px] font-semibold tracking-[0.5px] text-text-muted mb-3">
              Portfolio
            </p>
            <h1 className="text-[clamp(32px,5vw,48px)] font-extrabold tracking-[-2px] mb-5">
              Gebouwd door Valck Studio.
            </h1>
            <p className="text-lg text-text-secondary max-w-[560px] leading-[1.7]">
              Een diepgaande case study van een compleet B2B platform, van
              concept tot productie.
            </p>
          </motion.div>

          {/* 2-column layout: main + sidebar */}
          <div className="grid grid-cols-12 gap-8 max-md:grid-cols-1">
            {/* Sidebar - mobile first (above content) */}
            <aside className="col-span-4 max-md:col-span-1 order-first md:order-last">
              <div className="sticky top-32 rounded-[12px] bg-bg-white border border-border-light p-6 space-y-0">
                {/* Project meta */}
                <div className="space-y-3 pb-5">
                  {projectMeta.map((item) => (
                    <div key={item.label}>
                      <div className="text-[11px] font-semibold tracking-[0.3px] text-text-muted">
                        {item.label}
                      </div>
                      <div className="text-[14px] font-semibold text-text">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tech stack */}
                <div className="border-t border-border-light pt-5 pb-5">
                  <div className="text-[11px] font-semibold tracking-[0.3px] text-text-muted mb-3">
                    Tech stack
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 bg-accent-soft rounded-md text-xs font-medium text-text-secondary"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Resultaten */}
                <div className="border-t border-border-light pt-5">
                  <div className="text-[11px] font-semibold tracking-[0.3px] text-text-muted mb-3">
                    Resultaten
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {results.map((result) => (
                      <div key={result.label} className="text-center">
                        <div className="text-2xl font-extrabold tracking-[-1px] text-text">
                          {result.number}
                        </div>
                        <div className="text-[11px] text-text-secondary">
                          {result.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <div className="col-span-8 max-md:col-span-1">
              {/* Hero screenshot */}
              <AnimatedSection>
                <div className="rounded-[12px] border border-border overflow-hidden mb-10">
                  <img
                    src="/portfolio/juice-events/admin-dashboard.png"
                    alt="Juice Events admin dashboard"
                    className="w-full h-auto"
                  />
                </div>
              </AnimatedSection>

              {/* De uitdaging */}
              <AnimatedSection delay={0.15}>
                <div className="mb-16">
                  <h2 className="text-2xl font-extrabold tracking-[-1px] mb-4">
                    De uitdaging
                  </h2>
                  <p className="text-text-secondary leading-[1.8]">
                    Juice Events verhuurt powerbank stations op festivals en
                    evenementen in heel Nederland. Maar achter de schermen was het
                    chaos: eventaanvragen via WhatsApp, contracten per e-mail,
                    inventaris in spreadsheets, personeelsplanning op papier. De
                    sales pipeline bestond uit losse notities en de facturatie was
                    een handmatig, foutgevoelig proces. Er was geen centraal
                    overzicht van performance, laat staan analytics. Naarmate het
                    aantal evenementen groeide, werd dit onhoudbaar. Ze hadden niet
                    alleen een client portal nodig, maar een compleet operationeel
                    platform.
                  </p>
                </div>
              </AnimatedSection>

              {/* De oplossing */}
              <AnimatedSection delay={0.15}>
                <div className="mb-16">
                  <h2 className="text-2xl font-extrabold tracking-[-1px] mb-4">
                    De oplossing
                  </h2>
                  <p className="text-text-secondary leading-[1.8]">
                    Een multi-portal B2B platform met vier gescheiden omgevingen
                    voor admin, klanten, personeel en partners. Het admin dashboard
                    fungeert als operationeel zenuwcentrum: een geïntegreerd CRM met
                    lead-to-deal pipeline, realtime analytics met revenue trends en
                    performance metrics, geautomatiseerde facturatie met
                    BTW-berekening, en een interactieve kalender met Google Calendar
                    sync. Klanten beheren hun events volledig self-service via een
                    eigen portaal. Het platform verving 6 losse tools en bespaart
                    het team uren per week aan handmatig werk.
                  </p>
                </div>
              </AnimatedSection>

              {/* Wat we bouwden */}
              <AnimatedSection delay={0.15}>
                <div className="mb-16">
                  <h2 className="text-2xl font-extrabold tracking-[-1px] mb-6">
                    Wat we bouwden
                  </h2>
                  <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                    {features.map((feature) => (
                      <div
                        key={feature.title}
                        className="p-6 rounded-[12px] bg-bg-white border border-border-light"
                      >
                        <div className="flex items-start gap-4">
                          <span className="text-2xl leading-none mt-0.5">
                            {feature.icon}
                          </span>
                          <div>
                            <h3 className="text-[15px] font-bold text-text mb-1.5">
                              {feature.title}
                            </h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>

              {/* Automations & koppelingen */}
              <AnimatedSection delay={0.15}>
                <div className="mb-16">
                  <h2 className="text-2xl font-extrabold tracking-[-1px] mb-2">
                    Automations & koppelingen
                  </h2>
                  <p className="text-sm text-text-muted mb-6">
                    Van Stripe-webhooks tot automatische e-mails: alles draait
                    zonder handmatig werk.
                  </p>
                  <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                    {automations.map((item) => (
                      <div
                        key={item.title}
                        className="p-6 rounded-[12px] bg-bg-white border border-border-light"
                      >
                        <div className="flex items-start gap-4">
                          <span className="text-2xl leading-none mt-0.5">
                            {item.icon}
                          </span>
                          <div>
                            <h3 className="text-[15px] font-bold text-text mb-1.5">
                              {item.title}
                            </h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>

              {/* Client Portal screenshots */}
              <AnimatedSection delay={0.15}>
                <div className="mb-16">
                  <h2 className="text-2xl font-extrabold tracking-[-1px] mb-2">
                    Client Portal
                  </h2>
                  <p className="text-sm text-text-muted mb-6">
                    Het self-service portaal voor organisatoren
                  </p>
                  <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
                    {clientScreenshots.map((shot) => (
                      <div key={shot.src} className="group">
                        <div className="rounded-[12px] border border-border overflow-hidden mb-3">
                          <img
                            src={shot.src}
                            alt={shot.caption}
                            className="w-full h-auto"
                          />
                        </div>
                        <p className="text-[13px] text-text-muted">
                          {shot.caption}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>

              {/* Admin Dashboard screenshots */}
              {adminScreenshots.length > 0 && (
                <AnimatedSection delay={0.15}>
                  <div className="mb-16">
                    <h2 className="text-2xl font-extrabold tracking-[-1px] mb-2">
                      Admin Dashboard
                    </h2>
                    <p className="text-sm text-text-muted mb-6">
                      Het operationele zenuwcentrum voor het Juice Events team
                    </p>
                    <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
                      {adminScreenshots.map((shot) => (
                        <div key={shot.src} className="group">
                          <div className="rounded-[12px] border border-border overflow-hidden mb-3">
                            <img
                              src={shot.src}
                              alt={shot.caption}
                              className="w-full h-auto"
                            />
                          </div>
                          <p className="text-[13px] text-text-muted">
                            {shot.caption}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              )}

              {/* Partner Portal screenshots */}
              {partnerScreenshots.length > 0 && (
                <AnimatedSection delay={0.15}>
                  <div className="mb-16">
                    <h2 className="text-2xl font-extrabold tracking-[-1px] mb-2">
                      Partner Portal
                    </h2>
                    <p className="text-sm text-text-muted mb-6">
                      Franchise dashboard voor partners en hun commissie-overzicht
                    </p>
                    <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
                      {partnerScreenshots.map((shot) => (
                        <div key={shot.src} className="group">
                          <div className="rounded-[12px] border border-border overflow-hidden mb-3">
                            <img
                              src={shot.src}
                              alt={shot.caption}
                              className="w-full h-auto"
                            />
                          </div>
                          <p className="text-[13px] text-text-muted">
                            {shot.caption}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              )}
            </div>
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
