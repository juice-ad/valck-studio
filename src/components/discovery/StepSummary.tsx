import { featureCategories } from "@/lib/discovery-features";
import type { DiscoveryBrief } from "@/types/portal";

interface Props {
  data: Partial<DiscoveryBrief>;
  selectedFeatures: string[];
}

function SummaryBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[8px] bg-accent-soft/50 p-4">
      <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
        {label}
      </p>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="mb-1.5 last:mb-0">
      <span className="text-xs text-text-muted">{label}: </span>
      <span className="text-sm text-text">{value}</span>
    </div>
  );
}

export function StepSummary({ data, selectedFeatures }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-text mb-2">Samenvatting</h2>
      <p className="text-sm text-text-secondary mb-6">
        Controleer je antwoorden. Alles klopt? Klik dan op "Intake versturen".
      </p>

      <div className="flex flex-col gap-4">
        {/* Bedrijf */}
        <SummaryBlock label="Jouw bedrijf">
          <p className="text-sm font-medium text-text mb-1">
            {data.business_name || "—"}
          </p>
          {data.business_description && (
            <p className="text-sm text-text-secondary mb-1">
              {data.business_description}
            </p>
          )}
          <Field label="Teamgrootte" value={data.team_size} />
          <Field label="Jaaromzet" value={data.annual_revenue} />
          <Field label="Verdienmodel" value={data.revenue_model} />
          <Field label="Ambitie" value={data.ambition} />
        </SummaryBlock>

        {/* Werkwijze */}
        {(data.current_tools || data.time_consuming_tasks || data.admin_hours_weekly) && (
          <SummaryBlock label="Werkwijze & tools">
            <Field label="Tools" value={data.current_tools} />
            <Field label="Maandkosten" value={data.monthly_tool_costs} />
            <Field label="Tijdrovend" value={data.time_consuming_tasks} />
            <Field label="Admin-uren/week" value={data.admin_hours_weekly} />
            <Field label="Handmatige data" value={data.manual_data_transfers} />
          </SummaryBlock>
        )}

        {/* Pijnpunten */}
        {(data.top_frustrations || data.failure_under_pressure || data.should_be_automatic) && (
          <SummaryBlock label="Pijnpunten">
            <Field label="Top frustraties" value={data.top_frustrations} />
            <Field label="Valt om onder druk" value={data.failure_under_pressure} />
            <Field label="Klanten verloren" value={data.lost_clients_due_to_workflow} />
            <Field label="Moet automatisch" value={data.should_be_automatic} />
          </SummaryBlock>
        )}

        {/* Groei */}
        {(data.growth_blockers || data.breaks_at_2x_clients || data.needs_shared_platform) && (
          <SummaryBlock label="Groei">
            <Field label="Groeiblokkers" value={data.growth_blockers} />
            <Field label="Breekt bij 2x klanten" value={data.breaks_at_2x_clients} />
            <Field label="Gedeeld platform" value={data.needs_shared_platform} />
          </SummaryBlock>
        )}

        {/* Prioriteiten */}
        <SummaryBlock label="Prioriteiten">
          <Field label="#1 prioriteit" value={data.automation_priority} />
          <Field label="Tijdlijn" value={data.desired_timeline} />
          <Field label="Budget" value={data.budget_range} />
          <Field label="Dealbreakers" value={data.dealbreakers} />
        </SummaryBlock>

        {/* Inspiratie */}
        {(selectedFeatures.length > 0 || data.brand_colors || data.brand_notes || (data.inspiration_urls && data.inspiration_urls.length > 0)) && (
          <SummaryBlock label="Inspiratie & ideeën">
            {selectedFeatures.length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-text-muted">Features: </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedFeatures.map((fId) => {
                    const feat = featureCategories
                      .flatMap((c) => c.features)
                      .find((f) => f.id === fId);
                    return (
                      <span
                        key={fId}
                        className="text-xs font-medium px-2.5 py-1 rounded-full bg-bg-white border border-border-light text-text"
                      >
                        {feat?.label ?? fId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            <Field label="Kleuren" value={data.brand_colors} />
            <Field label="Stijl" value={data.brand_notes} />
            {data.inspiration_urls && data.inspiration_urls.length > 0 && (
              <Field
                label="Inspiratie"
                value={data.inspiration_urls.join(", ")}
              />
            )}
          </SummaryBlock>
        )}

        {/* Extra */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Extra opmerkingen (optioneel)
          </label>
          <p className="text-xs text-text-muted mb-2">
            Dit veld wordt niet automatisch opgeslagen — vul het in en klik op "Intake versturen".
          </p>
        </div>
      </div>
    </div>
  );
}
