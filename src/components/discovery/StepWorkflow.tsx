import type { DiscoveryBrief } from "@/types/portal";

const adminHoursOptions = ["< 2 uur", "2-5 uur", "5-10 uur", "10-20 uur", "20+ uur"];
const monthlyToolCostsOptions = ["< €50", "€50 - €200", "€200 - €500", "€500+", "Geen idee"];

interface Props {
  data: Partial<DiscoveryBrief>;
  onChange: (field: string, value: string) => void;
}

export function StepWorkflow({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-text mb-2">Werkwijze & tools</h2>
      <p className="text-sm text-text-secondary mb-6">
        Hoe werk je nu? Welke tools gebruik je en waar gaat je tijd naartoe?
      </p>

      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Welke tools en software gebruik je dagelijks?
          </label>
          <textarea
            value={data.current_tools ?? ""}
            onChange={(e) => onChange("current_tools", e.target.value)}
            placeholder="Bijv. Excel, Gmail, Notion, WhatsApp, een boekhoudsysteem, CRM..."
            rows={3}
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Wat geef je maandelijks uit aan tools en software?
          </label>
          <div className="flex flex-wrap gap-2">
            {monthlyToolCostsOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange("monthly_tool_costs", option)}
                className={`text-sm px-3 py-2 rounded-[8px] border transition-colors ${
                  data.monthly_tool_costs === option
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
            Welke taken kosten je het meeste tijd?
          </label>
          <textarea
            value={data.time_consuming_tasks ?? ""}
            onChange={(e) => onChange("time_consuming_tasks", e.target.value)}
            placeholder="Bijv. Offertes maken, facturen sturen, klantcommunicatie, planning..."
            rows={3}
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Hoeveel uur per week besteed je aan administratie?
          </label>
          <div className="flex flex-wrap gap-2">
            {adminHoursOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange("admin_hours_weekly", option)}
                className={`text-sm px-3 py-2 rounded-[8px] border transition-colors ${
                  data.admin_hours_weekly === option
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
            Welke data kopieer/plak je handmatig tussen systemen?
          </label>
          <textarea
            value={data.manual_data_transfers ?? ""}
            onChange={(e) => onChange("manual_data_transfers", e.target.value)}
            placeholder="Bijv. Klantgegevens van mail naar Excel, orders van WhatsApp naar boekhouding..."
            rows={2}
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
}
