/**
 * Intake branching configuration.
 * Defines conditional sub-questions per business type that appear
 * within existing wizard steps based on previous answers.
 */

export type BranchType = "crew" | "events" | "inventory" | "crm";

export interface BranchQuestion {
  id: string;
  label: string;
  placeholder?: string;
  type: "text" | "textarea" | "select";
  options?: string[];
}

export interface Branch {
  type: BranchType;
  label: string;
  /** Keywords in business_description or workflow answers that trigger this branch */
  triggerKeywords: string[];
  /** Which wizard step this branch appears in (2 = workflow, 4 = growth) */
  step: number;
  questions: BranchQuestion[];
}

export const branches: Branch[] = [
  {
    type: "crew",
    label: "Crew & Personeel",
    triggerKeywords: [
      "crew",
      "personeel",
      "freelancer",
      "zzp",
      "medewerker",
      "planning",
      "rooster",
      "beschikbaarheid",
      "inhuur",
    ],
    step: 2,
    questions: [
      {
        id: "crew_size",
        label: "Hoeveel crewleden werk je gemiddeld mee?",
        type: "select",
        options: ["1-5", "6-15", "16-30", "30+"],
      },
      {
        id: "crew_scheduling",
        label: "Hoe plan je momenteel je crew in?",
        type: "text",
        placeholder: "Bijv. Excel, WhatsApp groep, planning tool...",
      },
      {
        id: "crew_availability",
        label: "Hoe checken crewleden hun beschikbaarheid?",
        type: "text",
        placeholder: "Bijv. mail, app, handmatig bellen...",
      },
      {
        id: "crew_compliance",
        label: "Zijn er certificeringen of kwalificaties die je moet bijhouden?",
        type: "textarea",
        placeholder: "Bijv. BHV, VCA, rijbewijs categorieën...",
      },
    ],
  },
  {
    type: "events",
    label: "Evenementen & Projecten",
    triggerKeywords: [
      "event",
      "evenement",
      "festival",
      "productie",
      "show",
      "opbouw",
      "afbouw",
      "locatie",
      "venue",
      "boeken",
    ],
    step: 2,
    questions: [
      {
        id: "events_per_year",
        label: "Hoeveel events/projecten doe je per jaar?",
        type: "select",
        options: ["1-10", "11-30", "31-60", "60+"],
      },
      {
        id: "event_lifecycle",
        label: "Welke fases doorloopt een event bij jullie?",
        type: "textarea",
        placeholder: "Bijv. offerte → planning → opbouw → uitvoering → afbouw → facturatie",
      },
      {
        id: "event_logistics",
        label: "Hoe manage je on-site logistiek en materialen?",
        type: "text",
        placeholder: "Bijv. Excel paklijsten, WhatsApp coördinatie...",
      },
      {
        id: "event_client_portal",
        label: "Hebben je opdrachtgevers nu inzicht in de status van hun event?",
        type: "select",
        options: ["Ja, via een portal", "Nee, alleen via mail/telefoon", "Deels, via gedeelde documenten"],
      },
    ],
  },
  {
    type: "inventory",
    label: "Materiaal & Inventaris",
    triggerKeywords: [
      "materiaal",
      "inventaris",
      "voorraad",
      "apparatuur",
      "asset",
      "verhuur",
      "magazijn",
      "depot",
      "uitgifte",
    ],
    step: 2,
    questions: [
      {
        id: "inventory_size",
        label: "Hoeveel unieke items/assets beheer je?",
        type: "select",
        options: ["< 50", "50-200", "200-1000", "1000+"],
      },
      {
        id: "inventory_tracking",
        label: "Hoe track je momenteel welke items waar zijn?",
        type: "text",
        placeholder: "Bijv. Excel, stickersysteem, geen tracking...",
      },
      {
        id: "inventory_maintenance",
        label: "Hoe houd je onderhoud en keuringen bij?",
        type: "text",
        placeholder: "Bijv. agenda herinneringen, handmatig, niet...",
      },
      {
        id: "inventory_allocation",
        label: "Moeten items gealloceerd worden aan projecten of medewerkers?",
        type: "select",
        options: ["Ja, aan projecten", "Ja, aan medewerkers", "Beide", "Nee"],
      },
    ],
  },
  {
    type: "crm",
    label: "Klantenbeheer & CRM",
    triggerKeywords: [
      "klant",
      "client",
      "account",
      "relatie",
      "crm",
      "opdrachtgever",
      "lead",
      "offerte",
      "sales",
    ],
    step: 4,
    questions: [
      {
        id: "crm_client_count",
        label: "Hoeveel actieve klanten/opdrachtgevers heb je?",
        type: "select",
        options: ["1-10", "11-30", "31-100", "100+"],
      },
      {
        id: "crm_onboarding",
        label: "Hoe verloopt je klant-onboarding nu?",
        type: "textarea",
        placeholder: "Bijv. handmatige mail, intake gesprek, formulier...",
      },
      {
        id: "crm_communication",
        label: "Via welke kanalen communiceer je met klanten?",
        type: "text",
        placeholder: "Bijv. mail, WhatsApp, telefoon, portal...",
      },
      {
        id: "crm_reporting",
        label: "Stuur je klanten rapportages of updates? Zo ja, hoe?",
        type: "text",
        placeholder: "Bijv. maandelijkse PDF, geen rapportages...",
      },
    ],
  },
];

/**
 * Detect which branches are active based on form answers
 */
export function detectActiveBranches(
  formData: Record<string, string | null | undefined>
): BranchType[] {
  const textToSearch = [
    formData.business_description,
    formData.current_tools,
    formData.time_consuming_tasks,
    formData.manual_data_transfers,
    formData.growth_blockers,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return branches
    .filter((branch) =>
      branch.triggerKeywords.some((keyword) => textToSearch.includes(keyword))
    )
    .map((b) => b.type);
}

/**
 * Get branch questions for a specific step
 */
export function getBranchQuestionsForStep(
  activeBranches: BranchType[],
  step: number
): Branch[] {
  return branches.filter(
    (b) => activeBranches.includes(b.type) && b.step === step
  );
}
