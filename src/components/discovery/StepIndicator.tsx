import { Check } from "lucide-react";

const steps = [
  { label: "Welkom" },
  { label: "Bedrijf" },
  { label: "Werkwijze" },
  { label: "Pijnpunten" },
  { label: "Groei" },
  { label: "Prioriteiten" },
  { label: "Inspiratie" },
  { label: "Afronden" },
];

interface Props {
  currentStep: number;
}

export function StepIndicator({ currentStep }: Props) {
  return (
    <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-1 flex-1 min-w-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
              i < currentStep
                ? "bg-green text-white"
                : i === currentStep
                  ? "bg-text text-white"
                  : "bg-accent-soft text-text-muted"
            }`}
          >
            {i < currentStep ? <Check size={12} /> : i + 1}
          </div>
          <span
            className={`text-xs hidden lg:inline truncate ${
              i <= currentStep ? "text-text font-medium" : "text-text-muted"
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-px min-w-2 ${
                i < currentStep ? "bg-green" : "bg-border-light"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
