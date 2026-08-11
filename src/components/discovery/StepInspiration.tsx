import { useState, useRef } from "react";
import { Check, Upload, X } from "lucide-react";
import { featureCategories } from "@/lib/discovery-features";
import { DesignPreview } from "@/components/discovery/DesignPreview";
import { supabase } from "@/lib/supabase";
import type { DiscoveryBrief } from "@/types/portal";

const colorPresets = [
  "#111111",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
  "#1a365d",
  "#059669",
];

interface Props {
  data: Partial<DiscoveryBrief>;
  onChange: (field: string, value: string) => void;
  selectedFeatures: string[];
  onToggleFeature: (featureId: string) => void;
  onLogoUploaded?: (url: string | null) => void;
}

export function StepInspiration({
  data,
  onChange,
  selectedFeatures,
  onToggleFeature,
  onLogoUploaded,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accentColor = data.accent_color || "#111111";
  const logoUrl = data.logo_url || null;

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) return; // 2MB max

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `logos/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("discovery")
      .upload(path, file, { contentType: file.type });

    if (!error) {
      const { data: urlData } = supabase.storage
        .from("discovery")
        .getPublicUrl(path);
      onChange("logo_url", urlData.publicUrl);
      onLogoUploaded?.(urlData.publicUrl);
    }
    setUploading(false);
  }

  function removeLogo() {
    onChange("logo_url", "");
    onLogoUploaded?.(null);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-text mb-2">
        Inspiratie & ideeën
      </h2>
      <p className="text-sm text-text-secondary mb-6">
        Deze stap is optioneel. Heb je al ideeën over features of stijl?
        Deel ze hier. Geen ideeën? Sla deze stap gerust over.
      </p>

      {/* Design Preview Section */}
      <div className="border-b border-border-light pb-6 mb-6">
        <p className="text-sm font-semibold text-text mb-4">
          Live preview — kies een accentkleur en upload optioneel je logo
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Color + Logo controls */}
          <div className="flex flex-col gap-4">
            {/* Accent color picker */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Accentkleur
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onChange("accent_color", color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                      accentColor === color
                        ? "border-text scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {accentColor === color && (
                      <Check size={12} className="text-white" />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => onChange("accent_color", e.target.value)}
                  placeholder="#111111"
                  maxLength={7}
                  className="w-24 rounded-[8px] border border-border-light bg-bg px-2.5 py-1.5 text-sm text-text font-mono outline-none focus:border-text transition-colors"
                />
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => onChange("accent_color", e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-border-light"
                />
              </div>
            </div>

            {/* Logo upload */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Logo (optioneel)
              </label>
              {logoUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-10 w-auto object-contain rounded border border-border-light p-1"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="text-xs text-text-muted hover:text-text flex items-center gap-1 transition-colors"
                  >
                    <X size={12} />
                    Verwijder
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 text-sm text-text-secondary hover:text-text border border-border-light rounded-[8px] px-3 py-2 transition-colors disabled:opacity-50"
                >
                  <Upload size={14} />
                  {uploading ? "Uploaden..." : "Upload logo"}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <p className="text-xs text-text-muted mt-1">
                PNG, SVG of JPG. Max 2MB.
              </p>
            </div>
          </div>

          {/* Live preview */}
          <DesignPreview accentColor={accentColor} logoUrl={logoUrl} />
        </div>
      </div>

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
