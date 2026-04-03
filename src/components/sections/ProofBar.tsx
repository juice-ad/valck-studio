import { AnimatedSection } from "@/components/ui/AnimatedSection";

const proofItems = [
  { number: "5-10x", label: "sneller door AI-augmented dev" },
  { number: "100%", label: "IP eigendom bij jou" },
  { number: "€0", label: "verborgen kosten" },
  { number: "EU", label: "GDPR-compliant hosting" },
];

export function ProofBar() {
  return (
    <div className="flex justify-center gap-12 py-12 px-8 flex-wrap max-md:gap-8">
      {proofItems.map((item, i) => (
        <AnimatedSection key={item.number} delay={i * 0.1}>
          <div className="text-center">
            <div className="text-[28px] font-extrabold tracking-[-1px] text-text">
              {item.number}
            </div>
            <div className="text-[13px] text-text-muted mt-0.5">
              {item.label}
            </div>
          </div>
        </AnimatedSection>
      ))}
    </div>
  );
}
