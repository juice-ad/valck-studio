import type { DiscoveryBrief } from "@/types/portal";

const teamSizeOptions = ["Solo", "2-5", "6-15", "16-50", "50+"];
const revenueOptions = ["< €100k", "€100k - €500k", "€500k - €1M", "€1M+", "Zeg ik liever niet"];
const revenueModelOptions = ["Dienstverlening", "Producten", "Abonnementen", "Commissie", "Combinatie"];

interface Props {
  data: Partial<DiscoveryBrief>;
  onChange: (field: string, value: string) => void;
}

function PillSelect({
  options,
  value,
  onChange,
  allowCustom,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  allowCustom?: boolean;
}) {
  const isCustom = value && !options.includes(value);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`text-sm px-3 py-2 rounded-[8px] border transition-colors ${
              value === option
                ? "border-text bg-accent-soft font-medium text-text"
                : "border-border-light text-text-secondary hover:border-border"
            }`}
          >
            {option}
          </button>
        ))}
        {allowCustom && (
          <button
            type="button"
            onClick={() => onChange("__custom__")}
            className={`text-sm px-3 py-2 rounded-[8px] border transition-colors ${
              isCustom
                ? "border-text bg-accent-soft font-medium text-text"
                : "border-border-light text-text-secondary hover:border-border"
            }`}
          >
            Anders
          </button>
        )}
      </div>
      {allowCustom && isCustom && (
        <input
          type="text"
          value={value === "__custom__" ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Vul in..."
          autoFocus
          className="mt-2 w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
        />
      )}
    </div>
  );
}

export function StepBusiness({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-text mb-2">Jouw bedrijf</h2>
      <p className="text-sm text-text-secondary mb-6">
        Vertel ons over je bedrijf zodat we de context begrijpen.
      </p>

      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Bedrijfsnaam *
          </label>
          <input
            type="text"
            value={data.business_name ?? ""}
            onChange={(e) => onChange("business_name", e.target.value)}
            placeholder="Bijv. Bakkerij De Gouden Korst"
            required
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Wat doet je bedrijf?
          </label>
          <textarea
            value={data.business_description ?? ""}
            onChange={(e) => onChange("business_description", e.target.value)}
            placeholder="Beschrijf kort wat je bedrijf doet, wie je klanten zijn en wat je product of dienst is..."
            rows={3}
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Teamgrootte
          </label>
          <PillSelect
            options={teamSizeOptions}
            value={data.team_size ?? ""}
            onChange={(v) => onChange("team_size", v)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Jaaromzet (indicatie)
          </label>
          <PillSelect
            options={revenueOptions}
            value={data.annual_revenue ?? ""}
            onChange={(v) => onChange("annual_revenue", v)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Waar wil je met je bedrijf naartoe? Wat is je ambitie?
          </label>
          <textarea
            value={data.ambition ?? ""}
            onChange={(e) => onChange("ambition", e.target.value)}
            placeholder="Bijv. Binnen 2 jaar naar 50 klanten, landelijk uitbreiden, nieuwe markt betreden..."
            rows={2}
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Hoe verdien je je geld?
          </label>
          <PillSelect
            options={revenueModelOptions}
            value={data.revenue_model ?? ""}
            onChange={(v) => onChange("revenue_model", v)}
            allowCustom
          />
        </div>
      </div>
    </div>
  );
}
