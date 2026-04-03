import type { DiscoveryBrief } from "@/types/portal";

interface Props {
  data: Partial<DiscoveryBrief>;
  onChange: (field: string, value: string) => void;
}

export function StepPainPoints({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-text mb-2">Pijnpunten</h2>
      <p className="text-sm text-text-secondary mb-6">
        Waar loop je tegenaan? Dit helpt ons om de juiste prioriteiten te stellen.
      </p>

      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Wat zijn je top 3 frustraties in je dagelijkse werk?
          </label>
          <textarea
            value={data.top_frustrations ?? ""}
            onChange={(e) => onChange("top_frustrations", e.target.value)}
            placeholder={"1. Bijv. Ik ben uren kwijt aan handmatige offertes\n2. Bijv. Klanten vragen steeds naar de status van hun order\n3. Bijv. Ik heb geen overzicht van mijn omzet per maand"}
            rows={4}
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Wat valt als eerste om onder druk? (bijv. bij een piekperiode)
          </label>
          <textarea
            value={data.failure_under_pressure ?? ""}
            onChange={(e) => onChange("failure_under_pressure", e.target.value)}
            placeholder="Bijv. Klantenservice, planning, kwaliteitscontrole, administratie..."
            rows={2}
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Heb je weleens klanten verloren door je werkproces?
          </label>
          <textarea
            value={data.lost_clients_due_to_workflow ?? ""}
            onChange={(e) => onChange("lost_clients_due_to_workflow", e.target.value)}
            placeholder="Bijv. Ja, door trage reactietijden / Nee, maar ik merk dat het knelt / Weet ik niet..."
            rows={2}
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Wat zou er automatisch moeten gaan dat nu handmatig is?
          </label>
          <textarea
            value={data.should_be_automatic ?? ""}
            onChange={(e) => onChange("should_be_automatic", e.target.value)}
            placeholder="Bijv. Herinneringsmails naar klanten, facturen genereren, afspraken inplannen..."
            rows={2}
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
}
