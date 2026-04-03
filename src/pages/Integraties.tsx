import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Search, X } from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { CTA } from "@/components/sections/CTA";

type Integration = {
  icon: string;
  name: string;
  description: string;
};

type Category = {
  id: string;
  label: string;
  icon: string;
  items: Integration[];
};

const categories: Category[] = [
  {
    id: "betalingen",
    label: "Betalingen & Facturatie",
    icon: "💳",
    items: [
      { icon: "💳", name: "Stripe", description: "Betalingen, abonnementen & webhooks" },
      { icon: "🟠", name: "Mollie", description: "Nederlandse betaalprovider" },
      { icon: "🔵", name: "Adyen", description: "Enterprise payment processing" },
      { icon: "🅿️", name: "PayPal", description: "Wereldwijde betalingen" },
      { icon: "🩷", name: "Klarna", description: "Buy now, pay later" },
      { icon: "🏦", name: "iDEAL 2.0", description: "Nederlandse bankoverschrijvingen" },
      { icon: "🔶", name: "Buckaroo", description: "Payment service provider" },
      { icon: "🛡️", name: "MultiSafepay", description: "Multi-channel betalingen" },
      { icon: "🔄", name: "GoCardless", description: "Incasso & recurring payments" },
      { icon: "📊", name: "Chargebee", description: "Subscription billing" },
      { icon: "🏓", name: "Paddle", description: "SaaS billing & tax compliance" },
      { icon: "🔁", name: "Recurly", description: "Subscription management" },
    ],
  },
  {
    id: "boekhouding",
    label: "Boekhouding & Finance",
    icon: "📒",
    items: [
      { icon: "📘", name: "Exact Online", description: "Nederlandse boekhoudsoftware" },
      { icon: "🟣", name: "AFAS Software", description: "ERP & boekhouding" },
      { icon: "🔷", name: "Twinfield", description: "Cloud boekhouding (Wolters Kluwer)" },
      { icon: "🐦", name: "Moneybird", description: "Online facturatie & boekhouding" },
      { icon: "📗", name: "Yuki", description: "Automatische boekhouding" },
      { icon: "⚡", name: "SnelStart", description: "MKB boekhoudsoftware" },
      { icon: "📓", name: "e-Boekhouden.nl", description: "Online boekhouden" },
      { icon: "🔵", name: "Xero", description: "Cloud accounting platform" },
      { icon: "📒", name: "QuickBooks", description: "Boekhouding & facturatie" },
      { icon: "🍃", name: "FreshBooks", description: "Invoicing & expenses" },
      { icon: "👁️", name: "Visma eAccounting", description: "Scandinavische boekhouding" },
      { icon: "🌿", name: "Sage", description: "Enterprise accounting" },
    ],
  },
  {
    id: "crm",
    label: "CRM & Sales",
    icon: "🤝",
    items: [
      { icon: "🟠", name: "HubSpot CRM", description: "Marketing, sales & service hub" },
      { icon: "☁️", name: "Salesforce", description: "Enterprise CRM platform" },
      { icon: "🎯", name: "Pipedrive", description: "Sales pipeline management" },
      { icon: "🟦", name: "Microsoft Dynamics 365", description: "Business applications suite" },
      { icon: "🔴", name: "Zoho CRM", description: "Complete CRM suite" },
      { icon: "📋", name: "monday.com CRM", description: "Work OS met CRM" },
      { icon: "📞", name: "Close", description: "Inside sales CRM" },
      { icon: "🟢", name: "Freshsales", description: "AI-powered sales CRM" },
      { icon: "⚙️", name: "ActiveCampaign", description: "CRM & marketing automation" },
      { icon: "👥", name: "Teamleader", description: "CRM, facturatie & projecten" },
    ],
  },
  {
    id: "ecommerce",
    label: "E-commerce & Webshops",
    icon: "🛒",
    items: [
      { icon: "🛍️", name: "Shopify", description: "E-commerce platform" },
      { icon: "🟣", name: "WooCommerce", description: "WordPress webshop" },
      { icon: "🟧", name: "Magento", description: "Enterprise e-commerce" },
      { icon: "💡", name: "Lightspeed", description: "POS & e-commerce" },
      { icon: "🛒", name: "BigCommerce", description: "Schaalbaar e-commerce platform" },
      { icon: "📦", name: "Bol.com", description: "Nederlandse marketplace" },
      { icon: "📱", name: "Amazon", description: "Marketplace integratie" },
      { icon: "🔷", name: "Shopware", description: "Open-source e-commerce" },
      { icon: "🏪", name: "CCV Shop", description: "Nederlandse webshop software" },
      { icon: "🌐", name: "Mijnwebwinkel", description: "Nederlandse webshop builder" },
      { icon: "🔗", name: "Channable", description: "Feed management & PPC" },
    ],
  },
  {
    id: "communicatie",
    label: "Communicatie & E-mail",
    icon: "💬",
    items: [
      { icon: "💬", name: "Slack", description: "Team messaging & workflows" },
      { icon: "🟦", name: "Microsoft Teams", description: "Enterprise communicatie" },
      { icon: "📱", name: "Twilio", description: "SMS, voice & video APIs" },
      { icon: "📧", name: "SendGrid", description: "Transactionele e-mails" },
      { icon: "✉️", name: "Resend", description: "Developer-first email API" },
      { icon: "📮", name: "Postmark", description: "Betrouwbare e-mail delivery" },
      { icon: "💚", name: "WhatsApp Business API", description: "Zakelijke messaging" },
      { icon: "🗨️", name: "Intercom", description: "Customer messaging platform" },
      { icon: "📨", name: "Trengo", description: "Multichannel communicatie" },
      { icon: "🐦", name: "MessageBird", description: "Omnichannel messaging" },
      { icon: "🎮", name: "Discord", description: "Community & team chat" },
      { icon: "📹", name: "Zoom", description: "Video conferencing API" },
    ],
  },
  {
    id: "projectmanagement",
    label: "Projectmanagement",
    icon: "📋",
    items: [
      { icon: "🔵", name: "Jira", description: "Issue tracking & agile boards" },
      { icon: "🟠", name: "Asana", description: "Work management platform" },
      { icon: "🟣", name: "ClickUp", description: "All-in-one productiviteit" },
      { icon: "📝", name: "Notion", description: "Docs, wikis & projecten" },
      { icon: "🔷", name: "Linear", description: "Modern issue tracking" },
      { icon: "📋", name: "monday.com", description: "Work OS platform" },
      { icon: "📌", name: "Trello", description: "Kanban-style boards" },
      { icon: "🏕️", name: "Basecamp", description: "Project management & chat" },
      { icon: "📊", name: "Wrike", description: "Collaborative work management" },
      { icon: "👥", name: "Teamleader", description: "Projecten & planning" },
    ],
  },
  {
    id: "hr",
    label: "HR & Personeelszaken",
    icon: "👤",
    items: [
      { icon: "🟣", name: "AFAS Software", description: "HRM & salarisadministratie" },
      { icon: "💰", name: "Nmbrs", description: "Cloud payroll" },
      { icon: "👤", name: "Personio", description: "HR management platform" },
      { icon: "🎋", name: "BambooHR", description: "People management" },
      { icon: "🎉", name: "HoorayHR", description: "Nederlandse HR-software" },
      { icon: "🏢", name: "Workday", description: "Enterprise HR & finance" },
      { icon: "🔍", name: "Recruitee", description: "Applicant tracking system" },
      { icon: "🏠", name: "Homerun", description: "Hiring & employer branding" },
      { icon: "🔐", name: "Loket.nl", description: "Salarisverwerking" },
      { icon: "🌍", name: "Deel", description: "Global payroll & compliance" },
      { icon: "🌐", name: "Remote", description: "Remote workforce management" },
    ],
  },
  {
    id: "logistiek",
    label: "Logistiek & Voorraad",
    icon: "🚚",
    items: [
      { icon: "📦", name: "SendCloud", description: "Shipping automation" },
      { icon: "📬", name: "MyParcel", description: "Nederlandse verzendoplossing" },
      { icon: "🟠", name: "PostNL API", description: "Pakketten & post" },
      { icon: "🟡", name: "DHL API", description: "Internationale verzending" },
      { icon: "🟤", name: "UPS API", description: "Pakketbezorging worldwide" },
      { icon: "📋", name: "Picqer", description: "Warehouse management" },
      { icon: "🚢", name: "ShipStation", description: "Order fulfillment" },
      { icon: "🔵", name: "GLS", description: "Pakketdienst Europa" },
      { icon: "🔴", name: "dpd", description: "Parcel delivery service" },
      { icon: "📮", name: "Bpost", description: "Belgische post & pakketten" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing & Analytics",
    icon: "📈",
    items: [
      { icon: "📊", name: "Google Analytics 4", description: "Web & app analytics" },
      { icon: "🟢", name: "Segment", description: "Customer data platform" },
      { icon: "🟣", name: "Mixpanel", description: "Product analytics" },
      { icon: "🔵", name: "Amplitude", description: "Digital analytics platform" },
      { icon: "🔥", name: "Hotjar", description: "Heatmaps & user recordings" },
      { icon: "🐵", name: "Mailchimp", description: "Email marketing" },
      { icon: "📧", name: "Brevo", description: "Marketing automation" },
      { icon: "🎹", name: "Klaviyo", description: "E-commerce email & SMS" },
      { icon: "📢", name: "Google Ads", description: "Search & display advertising" },
      { icon: "📘", name: "Meta Ads", description: "Facebook & Instagram ads" },
      { icon: "💼", name: "LinkedIn Ads", description: "B2B advertising" },
      { icon: "🦔", name: "PostHog", description: "Open-source product analytics" },
      { icon: "📈", name: "Plausible", description: "Privacy-friendly analytics" },
      { icon: "🔗", name: "Channable", description: "Feed & PPC automation" },
    ],
  },
  {
    id: "documenten",
    label: "Document Management",
    icon: "📄",
    items: [
      { icon: "📁", name: "Google Drive", description: "Cloud opslag & docs" },
      { icon: "🟦", name: "SharePoint", description: "Enterprise document management" },
      { icon: "☁️", name: "OneDrive", description: "Microsoft cloud storage" },
      { icon: "📦", name: "Dropbox", description: "File sync & sharing" },
      { icon: "✍️", name: "DocuSign", description: "Elektronische handtekeningen" },
      { icon: "📄", name: "PandaDoc", description: "Document workflow automation" },
      { icon: "🖊️", name: "Adobe Sign", description: "E-signing oplossing" },
      { icon: "📝", name: "Notion", description: "Docs & knowledge base" },
      { icon: "📚", name: "Confluence", description: "Team wiki & documentatie" },
      { icon: "🏢", name: "Google Workspace", description: "Productiviteitssuite" },
      { icon: "🟦", name: "Microsoft 365", description: "Office & cloud services" },
    ],
  },
  {
    id: "kalenders",
    label: "Kalenders & Planning",
    icon: "📅",
    items: [
      { icon: "📅", name: "Google Calendar API", description: "Agenda-integratie" },
      { icon: "📆", name: "Microsoft Outlook Calendar", description: "Enterprise kalender" },
      { icon: "🗓️", name: "Calendly", description: "Afspraken plannen" },
      { icon: "📋", name: "Cal.com", description: "Open-source scheduling" },
      { icon: "🤝", name: "Doodle", description: "Groepsplanning" },
      { icon: "⏰", name: "Acuity Scheduling", description: "Online afspraken" },
      { icon: "🔄", name: "Cronofy", description: "Calendar API abstraction" },
    ],
  },
  {
    id: "authenticatie",
    label: "Authenticatie & Security",
    icon: "🔐",
    items: [
      { icon: "🔐", name: "Auth0", description: "Identity management platform" },
      { icon: "🟦", name: "Okta", description: "Enterprise identity" },
      { icon: "🏢", name: "Microsoft Entra ID", description: "Azure AD identity" },
      { icon: "🔑", name: "Google Identity", description: "OAuth & SSO" },
      { icon: "🟣", name: "Clerk", description: "Developer-first auth" },
      { icon: "🟢", name: "Supabase Auth", description: "Open-source authenticatie" },
      { icon: "🔥", name: "Firebase Auth", description: "Google auth service" },
      { icon: "🏛️", name: "DigiD", description: "Nederlandse overheids-ID" },
      { icon: "🏦", name: "iDIN", description: "Bankidentificatie" },
      { icon: "🔒", name: "eHerkenning", description: "Zakelijke identificatie" },
    ],
  },
  {
    id: "ai",
    label: "AI & Machine Learning",
    icon: "🤖",
    items: [
      { icon: "🤖", name: "OpenAI API", description: "GPT-modellen & DALL-E" },
      { icon: "🟤", name: "Claude API (Anthropic)", description: "Geavanceerde AI-assistent" },
      { icon: "🔷", name: "Google Gemini", description: "Multimodal AI" },
      { icon: "🟦", name: "Azure OpenAI", description: "Enterprise AI services" },
      { icon: "🤗", name: "Hugging Face", description: "Open-source ML modellen" },
      { icon: "🧠", name: "Cohere", description: "NLP & embeddings" },
      { icon: "🌲", name: "Pinecone", description: "Vector database" },
      { icon: "🔮", name: "Weaviate", description: "AI-native vector search" },
      { icon: "🔗", name: "LangChain", description: "LLM orchestration framework" },
      { icon: "🎙️", name: "ElevenLabs", description: "AI voice synthesis" },
      { icon: "🎧", name: "Deepgram", description: "Speech-to-text AI" },
    ],
  },
  {
    id: "erp",
    label: "ERP & Bedrijfsprocessen",
    icon: "🏭",
    items: [
      { icon: "🔵", name: "SAP", description: "Enterprise resource planning" },
      { icon: "🔴", name: "Oracle NetSuite", description: "Cloud ERP suite" },
      { icon: "🟦", name: "Microsoft Dynamics 365", description: "Business apps platform" },
      { icon: "📘", name: "Exact Online", description: "Nederlandse ERP" },
      { icon: "🟣", name: "AFAS Software", description: "Bedrijfssoftware" },
      { icon: "🟢", name: "Odoo", description: "Open-source ERP" },
      { icon: "🔷", name: "Unit4", description: "People-centric ERP" },
    ],
  },
  {
    id: "cloud",
    label: "Cloud & DevOps",
    icon: "☁️",
    items: [
      { icon: "🟠", name: "AWS", description: "Amazon cloud services" },
      { icon: "🟦", name: "Microsoft Azure", description: "Enterprise cloud" },
      { icon: "🔵", name: "Google Cloud", description: "GCP services" },
      { icon: "▲", name: "Vercel", description: "Frontend deployment platform" },
      { icon: "🌐", name: "Netlify", description: "Web hosting & serverless" },
      { icon: "🟠", name: "Cloudflare", description: "CDN & edge computing" },
      { icon: "🐳", name: "Docker", description: "Containerization" },
      { icon: "⚡", name: "GitHub Actions", description: "CI/CD automation" },
      { icon: "🦊", name: "GitLab CI", description: "DevOps platform" },
      { icon: "🔴", name: "Sentry", description: "Error tracking & monitoring" },
      { icon: "🐕", name: "Datadog", description: "Observability platform" },
    ],
  },
  {
    id: "databases",
    label: "Databases & Backend",
    icon: "🗄️",
    items: [
      { icon: "🟢", name: "Supabase", description: "Open-source Firebase alternatief" },
      { icon: "🔥", name: "Firebase", description: "Google app platform" },
      { icon: "🐘", name: "PostgreSQL", description: "Relationele database" },
      { icon: "🍃", name: "MongoDB", description: "Document database" },
      { icon: "🔴", name: "Redis", description: "In-memory data store" },
      { icon: "📊", name: "Airtable", description: "Spreadsheet-database hybrid" },
      { icon: "🔷", name: "Hasura", description: "Instant GraphQL API" },
      { icon: "🌍", name: "PlanetScale", description: "Serverless MySQL" },
      { icon: "🟢", name: "Neon", description: "Serverless Postgres" },
      { icon: "🔺", name: "Upstash", description: "Serverless Redis & Kafka" },
    ],
  },
  {
    id: "notificaties",
    label: "Notificaties & Real-time",
    icon: "🔔",
    items: [
      { icon: "🔔", name: "OneSignal", description: "Push notifications" },
      { icon: "🔥", name: "Firebase Cloud Messaging", description: "Cross-platform messaging" },
      { icon: "📡", name: "Pusher", description: "Realtime websockets" },
      { icon: "🟢", name: "Ably", description: "Realtime data delivery" },
      { icon: "📱", name: "Twilio", description: "SMS & voice notificaties" },
      { icon: "🔕", name: "Knock", description: "Notification infrastructure" },
      { icon: "📨", name: "Novu", description: "Open-source notification infra" },
    ],
  },
  {
    id: "automatisering",
    label: "Automatisering & iPaaS",
    icon: "⚡",
    items: [
      { icon: "⚡", name: "Zapier", description: "No-code automation" },
      { icon: "🟣", name: "Make", description: "Visual automation platform" },
      { icon: "🔧", name: "n8n", description: "Open-source workflow automation" },
      { icon: "🔵", name: "Power Automate", description: "Microsoft automation" },
      { icon: "🔗", name: "Workato", description: "Enterprise integration" },
      { icon: "🔷", name: "Tray.io", description: "General automation platform" },
      { icon: "🔴", name: "MuleSoft", description: "API & integration platform" },
    ],
  },
];

export function Integraties() {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [search, setSearch] = useState("");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const isSearching = search.trim().length > 0;

  const filteredCategories = useMemo(() => {
    if (!isSearching) return categories;
    const q = search.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [search, isSearching]);

  const totalResults = useMemo(
    () => filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0),
    [filteredCategories]
  );

  // Scroll-spy: track which category is in view (disabled during search)
  useEffect(() => {
    if (isSearching) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    for (const cat of categories) {
      const el = sectionRefs.current[cat.id];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section className="pt-40 pb-24 px-8 max-md:pt-28 max-md:pb-16 max-md:px-5">
        <div className="max-w-[1120px] mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <p className="text-[13px] font-semibold tracking-[0.5px] text-text-muted mb-3">
              Integraties
            </p>
            <h1 className="text-[clamp(32px,5vw,48px)] font-extrabold tracking-[-2px] mb-5">
              Elke API. Elke koppeling. Gebouwd.
            </h1>
            <p className="text-lg text-text-secondary max-w-[600px] leading-[1.7]">
              Van betalingen tot AI, van boekhouding tot real-time notificaties
              — wij bouwen de integraties die jouw platform naadloos laten
              samenwerken met 150+ externe services.
            </p>
          </motion.div>

          {/* Search bar */}
          <div className="relative mb-10 max-w-[480px]">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek integratie, bijv. Stripe, Slack, HubSpot..."
              className="w-full pl-11 pr-10 py-3 rounded-[10px] bg-bg-white border border-border-light text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-border transition-colors"
            />
            {isSearching && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-muted hover:text-text hover:bg-accent-soft transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Search result count */}
          {isSearching && (
            <p className="text-sm text-text-muted mb-6">
              {totalResults === 0
                ? "Geen integraties gevonden"
                : `${totalResults} integratie${totalResults !== 1 ? "s" : ""} gevonden`}
            </p>
          )}

          {/* Mobile category bar */}
          <div className="flex overflow-x-auto gap-2 pb-4 mb-8 md:hidden">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollTo(cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeCategory === cat.id
                    ? "bg-text text-white"
                    : "bg-accent-soft text-text-secondary"
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Grid: sidebar + content */}
          <div className="grid grid-cols-12 gap-8 max-md:grid-cols-1">
            {/* Sidebar */}
            <aside className="col-span-3 max-md:hidden">
              <div className="sticky top-32 rounded-[12px] bg-bg-white border border-border-light p-4">
                <nav className="space-y-0.5">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => scrollTo(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                        activeCategory === cat.id
                          ? "bg-accent-soft font-semibold text-text"
                          : "text-text-secondary hover:text-text hover:bg-accent-soft/50"
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </nav>

                {/* Sidebar CTA */}
                <div className="mt-5 pt-5 border-t border-border-light">
                  <p className="text-[13px] font-semibold text-text mb-1">
                    Staat jouw systeem er niet bij?
                  </p>
                  <p className="text-xs text-text-muted mb-3">
                    Wij bouwen elke koppeling op maat.
                  </p>
                  <a
                    href="mailto:antoine@valck.studio"
                    className="block text-center text-xs font-semibold bg-text text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Neem contact op →
                  </a>
                </div>
              </div>
            </aside>

            {/* Content */}
            <div className="col-span-9 max-md:col-span-1">
              {filteredCategories.map((cat, catIndex) => (
                <section
                  key={cat.id}
                  id={cat.id}
                  ref={(el) => {
                    sectionRefs.current[cat.id] = el;
                  }}
                  className={catIndex > 0 ? "mt-14" : ""}
                >
                  <AnimatedSection>
                    <h2 className="text-lg font-bold tracking-[-0.3px] mb-4">
                      {cat.icon} {cat.label}
                    </h2>
                    <div className="grid grid-cols-3 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
                      {cat.items.map((item) => (
                        <div
                          key={`${cat.id}-${item.name}`}
                          className="flex items-center gap-3 p-4 rounded-[10px] bg-bg-white border border-border-light"
                        >
                          <span className="text-base flex-shrink-0">
                            {item.icon}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-text-muted truncate">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AnimatedSection>
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
