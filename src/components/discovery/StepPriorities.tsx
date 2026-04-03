import type { DiscoveryBrief } from "@/types/portal";

const budgetOptions = [
  "€ 1.000 – € 3.000",
  "€ 3.000 – € 7.500",
  "€ 7.500 – € 15.000",
  "€ 15.000+",
  "Weet ik nog niet",
];

const timelineOptions = [
  "Zo snel mogelijk",
  "Binnen 1 maand",
  "Binnen 3 maanden",
  "Geen haast",
];

interface Props {
  data: Partial<DiscoveryBrief>;
  onChange: (field: string, value: string) => void;
}

export function StepPriorities({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-text mb-2">Prioriteiten</h2>
      <p className="text-sm text-text-secondary mb-6">
        Wat is het allerbelangrijkste en wanneer wil je live?
      </p>

      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Als je maar één ding kunt automatiseren of verbeteren, wat wordt het dan?
          </label>
          <textarea
            value={data.automation_priority ?? ""}
            onChange={(e) => onChange("automation_priority", e.target.value)}
            placeholder="Bijv. Online boekingssysteem, klantportaal, offerte-generator, betere website..."
            rows={2}
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Wanneer wil je live?
          </label>
          <div className="flex flex-wrap gap-2">
            {timelineOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange("desired_timeline", option)}
                className={`text-sm px-3 py-2 rounded-[8px] border transition-colors ${
                  data.desired_timeline === option
                    ? "border-text bg-accent-soft font-medium text-text"
                    : "border-border-light text-text-secondary hover:border-border"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Indicatie budget
          </label>
          <div className="flex flex-wrap gap-2">
            {budgetOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange("budget_range", option)}
                className={`text-sm px-3 py-2 rounded-[8px] border transition-colors ${
                  data.budget_range === option
                    ? "border-text bg-accent-soft font-medium text-text"
                    : "border-border-light text-text-secondary hover:border-border"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Zijn er dealbreakers? Dingen die je absoluut niet wilt?
          </label>
          <textarea
            value={data.dealbreakers ?? ""}
            onChange={(e) => onChange("dealbreakers", e.target.value)}
            placeholder="Bijv. Geen maandelijkse abonnementskosten, geen WordPress, moet op mobiel werken..."
            rows={2}
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
}
