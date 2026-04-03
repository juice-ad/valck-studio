import { Check } from "lucide-react";
import { featureCategories } from "@/lib/discovery-features";
import type { DiscoveryBrief } from "@/types/portal";

interface Props {
  data: Partial<DiscoveryBrief>;
  onChange: (field: string, value: string) => void;
  selectedFeatures: string[];
  onToggleFeature: (featureId: string) => void;
}

export function StepInspiration({
  data,
  onChange,
  selectedFeatures,
  onToggleFeature,
}: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-text mb-2">
        Inspiratie & ideeën
      </h2>
      <p className="text-sm text-text-secondary mb-6">
        Deze stap is optioneel. Heb je al ideeën over features of stijl?
        Deel ze hier. Geen ideeën? Sla deze stap gerust over.
      </p>

      {/* Feature checkboxes */}
      <div className="flex flex-col gap-6 mb-6">
        {featureCategories.map((cat) => (
          <div key={cat.id}>
            <p className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
              <cat.icon size={16} />
              {cat.label}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {cat.features.map((feat) => {
                const checked = selectedFeatures.includes(feat.id);
                return (
                  <label
                    key={feat.id}
                    className={`flex items-center gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors ${
                      checked
                        ? "border-text bg-accent-soft"
                        : "border-border-light hover:border-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleFeature(feat.id)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        checked
                          ? "bg-text border-text"
                          : "border-border bg-bg-white"
                      }`}
                    >
                      {checked && <Check size={10} className="text-white" />}
                    </div>
                    <div>
                      <p className="text-sm text-text">{feat.label}</p>
                      <p className="text-xs text-text-muted">
                        {feat.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Style preferences */}
      <div className="border-t border-border-light pt-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Inspiratie-websites (optioneel)
          </label>
          <textarea
            value={data.inspiration_urls?.join("\n") ?? ""}
            onChange={(e) => onChange("inspiration_urls", e.target.value)}
            placeholder={"Eén URL per regel, bijv.:\nhttps://stripe.com\nhttps://linear.app"}
            rows={3}
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Merkkleuren (optioneel)
          </label>
          <input
            type="text"
            value={data.brand_colors ?? ""}
            onChange={(e) => onChange("brand_colors", e.target.value)}
            placeholder="Bijv. donkerblauw (#1a365d), wit, goud"
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Stijlnotities (optioneel)
          </label>
          <textarea
            value={data.brand_notes ?? ""}
            onChange={(e) => onChange("brand_notes", e.target.value)}
            placeholder="Bijv. minimalistisch, modern, speels, zakelijk..."
            rows={2}
            className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
}
