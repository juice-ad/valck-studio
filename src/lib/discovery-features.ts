import {
  Globe,
  ShoppingCart,
  Users,
  Palette,
  TrendingUp,
  Search,
  Smartphone,
  Shield,
  BarChart3,
  Mail,
  Calendar,
  CreditCard,
  FileText,
  MessageSquare,
  Lock,
  Zap,
  Image,
  Video,
  MapPin,
  Star,
  type LucideIcon,
} from "lucide-react";

export interface Feature {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface FeatureCategory {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  features: Feature[];
}

export const featureCategories: FeatureCategory[] = [
  {
    id: "website",
    label: "Website",
    description:
      "Een professionele website die jouw bedrijf online presenteert.",
    icon: Globe,
    features: [
      {
        id: "responsive-design",
        label: "Responsive design",
        description: "Optimaal op elk schermformaat",
        icon: Smartphone,
      },
      {
        id: "seo",
        label: "SEO-optimalisatie",
        description: "Beter vindbaar in Google",
        icon: Search,
      },
      {
        id: "cms",
        label: "Content management",
        description: "Zelf content aanpassen",
        icon: FileText,
      },
      {
        id: "blog",
        label: "Blog / Nieuwspagina",
        description: "Artikelen publiceren",
        icon: FileText,
      },
      {
        id: "contact-form",
        label: "Contactformulier",
        description: "Bezoekers kunnen je bereiken",
        icon: Mail,
      },
      {
        id: "analytics",
        label: "Analytics dashboard",
        description: "Inzicht in bezoekersgedrag",
        icon: BarChart3,
      },
    ],
  },
  {
    id: "webshop",
    label: "Webshop",
    description: "Online verkopen met een gestroomlijnde checkout.",
    icon: ShoppingCart,
    features: [
      {
        id: "product-catalog",
        label: "Productcatalogus",
        description: "Producten overzichtelijk tonen",
        icon: Image,
      },
      {
        id: "payments",
        label: "Online betalen",
        description: "iDEAL, creditcard, Klarna",
        icon: CreditCard,
      },
      {
        id: "inventory",
        label: "Voorraadbeheer",
        description: "Automatisch bijhouden",
        icon: BarChart3,
      },
      {
        id: "shipping",
        label: "Verzendintegratie",
        description: "PostNL, DHL, etc.",
        icon: MapPin,
      },
      {
        id: "reviews",
        label: "Reviews & ratings",
        description: "Klantbeoordelingen tonen",
        icon: Star,
      },
    ],
  },
  {
    id: "portal",
    label: "Portaal / Platform",
    description: "Een beveiligd platform voor klanten of medewerkers.",
    icon: Users,
    features: [
      {
        id: "user-auth",
        label: "Gebruikers & login",
        description: "Beveiligde accounts",
        icon: Lock,
      },
      {
        id: "dashboard",
        label: "Dashboard",
        description: "Overzichtspagina met statistieken",
        icon: BarChart3,
      },
      {
        id: "messaging",
        label: "Berichtensysteem",
        description: "Communicatie binnen het platform",
        icon: MessageSquare,
      },
      {
        id: "file-sharing",
        label: "Bestanden delen",
        description: "Documenten uploaden en downloaden",
        icon: FileText,
      },
      {
        id: "scheduling",
        label: "Planning / Agenda",
        description: "Afspraken en deadlines",
        icon: Calendar,
      },
    ],
  },
  {
    id: "branding",
    label: "Branding & Design",
    description: "Een sterke visuele identiteit voor je merk.",
    icon: Palette,
    features: [
      {
        id: "logo-design",
        label: "Logo-ontwerp",
        description: "Een uniek logo voor je merk",
        icon: Image,
      },
      {
        id: "brand-identity",
        label: "Huisstijl",
        description: "Kleuren, typografie, stijlgids",
        icon: Palette,
      },
      {
        id: "photography",
        label: "Fotografie / Video",
        description: "Professioneel beeldmateriaal",
        icon: Video,
      },
      {
        id: "social-templates",
        label: "Social media templates",
        description: "Consistente uitstraling online",
        icon: Image,
      },
    ],
  },
  {
    id: "growth",
    label: "Groei & Marketing",
    description: "Meer bereik, meer klanten, meer omzet.",
    icon: TrendingUp,
    features: [
      {
        id: "email-marketing",
        label: "E-mailmarketing",
        description: "Nieuwsbrieven en campagnes",
        icon: Mail,
      },
      {
        id: "google-ads",
        label: "Google Ads",
        description: "Betaalde advertenties",
        icon: Zap,
      },
      {
        id: "social-media",
        label: "Social media beheer",
        description: "Content planning en uitvoering",
        icon: MessageSquare,
      },
      {
        id: "conversion",
        label: "Conversie-optimalisatie",
        description: "Meer bezoekers omzetten in klanten",
        icon: TrendingUp,
      },
      {
        id: "security-ssl",
        label: "SSL & Security",
        description: "Veilige verbinding en bescherming",
        icon: Shield,
      },
    ],
  },
];
