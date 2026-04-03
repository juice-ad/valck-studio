import { Shield, Globe, FileText } from "lucide-react";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { SectionHeader } from "@/components/ui/SectionHeader";

const trustItems = [
  {
    icon: Shield,
    iconBg: "bg-[#fef2f2]",
    iconColor: "text-[#ef4444]",
    title: "Security-first development",
    description:
      "Elke applicatie wordt gebouwd met OWASP best practices, versleutelde data-opslag, veilige authenticatie en regelmatige security reviews.",
  },
  {
    icon: Globe,
    iconBg: "bg-blue-bg",
    iconColor: "text-blue",
    title: "EU & GDPR compliant",
    description:
      "Hosting binnen de EU, GDPR-conforme dataverwerking, verwerkersovereenkomsten standaard meegeleverd. Jouw data blijft in Europa.",
  },
  {
    icon: FileText,
    iconBg: "bg-green-bg",
    iconColor: "text-green",
    title: "Volledige IP-overdracht",
    description:
      "Alle code, data en infrastructuur zijn 100% eigendom van jou. Geen vendor lock-in, geen licentiekosten. Je kunt altijd weglopen met je codebase.",
  },
];

export function Trust() {
  return (
    <section
      id="vertrouwen"
      className="py-24 px-8 bg-bg-white border-t border-b border-border-light max-md:py-16 max-md:px-5"
    >
      <div className="max-w-[1120px] mx-auto">
        <AnimatedSection>
          <SectionHeader
            label="Vertrouwen & veiligheid"
            title="Enterprise-grade, startup-prijs."
            subtitle="Elk project voldoet aan de hoogste standaarden voor veiligheid, privacy en eigendom."
          />
        </AnimatedSection>

        <div className="grid grid-cols-3 gap-6 max-md:grid-cols-1">
          {trustItems.map((item, i) => (
            <AnimatedSection key={item.title} delay={i * 0.15}>
              <div className="p-8 rounded-[12px] border border-border-light bg-bg">
                <div
                  className={`w-11 h-11 rounded-[10px] ${item.iconBg} flex items-center justify-center mb-4`}
                >
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <h3 className="text-base font-bold tracking-[-0.2px] mb-1.5">
                  {item.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {item.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
