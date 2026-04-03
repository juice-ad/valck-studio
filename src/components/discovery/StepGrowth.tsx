import type { DiscoveryBrief } from "@/types/portal";

const sharedPlatformOptions = ["Ja, absoluut", "Misschien", "Nee, niet nodig", "Weet ik niet"];

interface Props {
  data: Partial<DiscoveryBrief>;
  onChange: (field: string, value: string) => void;
}

export function StepGrowth({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-text mb-2">Groei</h2>
      <p className="text-sm text-text-secondary mb-6">
        Waar wil je naartoe en wat staat je in de weg?
      </p>

      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Wat zijn je grootste groeiblokkers?
          </label>
          <textarea
            value={data.growth_blockers ?? ""}
            onChange={(e) => onChange("growth_blockers", e.target.value)}
            placeholder="Bijv. Te weinig tijd, geen online aanwezigheid, handmatige processen, geen inzicht in data..."
            rows={3}
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Wat breekt er als je morgen 2x zoveel klanten hebt?
          </label>
          <textarea
            value={data.breaks_at_2x_clients ?? ""}
            onChange={(e) => onChange("breaks_at_2x_clients", e.target.value)}
            placeholder="Bijv. Ik kan de communicatie niet aan, planning loopt vast, administratie wordt chaos..."
            rows={2}
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Heb je een gedeeld platform nodig waar klanten/partners zelf dingen kunnen doen?
          </label>
          <div className="flex flex-wrap gap-2">
            {sharedPlatformOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange("needs_shared_platform", option)}
                className={`text-sm px-3 py-2 rounded-[8px] border transition-colors ${
                  data.needs_shared_platform === option
                    ? "border-text bg-accent-soft font-medium text-text"
                    : "border-border-light text-text-secondary hover:border-border"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
