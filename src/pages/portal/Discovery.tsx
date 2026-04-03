import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Send,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { featureCategories } from "@/lib/discovery-features";
import type { DiscoveryBrief } from "@/types/portal";

const steps = [
  { label: "Inspiratie", description: "Ontdek de mogelijkheden" },
  { label: "Over je bedrijf", description: "Vertel ons meer" },
  { label: "Features & stijl", description: "Wat wil je?" },
  { label: "Afronden", description: "Controleer en verstuur" },
];

const budgetOptions = [
  "€ 1.000 – € 3.000",
  "€ 3.000 – € 7.500",
  "€ 7.500 – € 15.000",
  "€ 15.000+",
  "Weet ik nog niet",
];

export function Discovery() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [briefId, setBriefId] = useState<string | null>(null);

  // Step 1: selected category (for browsing)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Step 2: business info
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("");

  // Step 3: features & style
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [inspirationUrls, setInspirationUrls] = useState("");
  const [brandColors, setBrandColors] = useState("");
  const [brandNotes, setBrandNotes] = useState("");

  // Step 4: finish
  const [budgetRange, setBudgetRange] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Load existing draft on mount
  useEffect(() => {
    if (!user) return;

    async function loadDraft() {
      const { data } = await supabase
        .from("discovery_briefs")
        .select("*")
        .eq("client_id", user!.id)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const brief = data as DiscoveryBrief;
        setBriefId(brief.id);
        setBusinessName(brief.business_name);
        setBusinessDescription(brief.business_description ?? "");
        setWebsiteUrl(brief.website_url ?? "");
        setIndustry(brief.industry ?? "");
        setSelectedFeatures(brief.selected_features ?? []);
        setInspirationUrls(brief.inspiration_urls?.join("\n") ?? "");
        setBrandColors(brief.brand_colors ?? "");
        setBrandNotes(brief.brand_notes ?? "");
        setBudgetRange(brief.budget_range ?? "");
        setAdditionalNotes(brief.additional_notes ?? "");
        // Resume at step 2 minimum since we have business info
        setStep(2);
      }
      setLoading(false);
    }

    loadDraft();
  }, [user]);

  // Save draft to DB (after step 2)
  async function saveDraft() {
    if (!user) return;
    setSaving(true);

    const urls = inspirationUrls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    const briefData = {
      client_id: user.id,
      business_name: businessName.trim(),
      business_description: businessDescription.trim() || null,
      website_url: websiteUrl.trim() || null,
      industry: industry.trim() || null,
      selected_features: selectedFeatures,
      inspiration_urls: urls.length > 0 ? urls : null,
      brand_colors: brandColors.trim() || null,
      brand_notes: brandNotes.trim() || null,
      budget_range: budgetRange || null,
      additional_notes: additionalNotes.trim() || null,
    };

    if (briefId) {
      await supabase
        .from("discovery_briefs")
        .update(briefData)
        .eq("id", briefId);
    } else {
      const { data } = await supabase
        .from("discovery_briefs")
        .insert(briefData)
        .select("id")
        .single();
      if (data) setBriefId(data.id);
    }

    setSaving(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!briefId) return;

    setSaving(true);
    await saveDraft();

    await supabase
      .from("discovery_briefs")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", briefId);

    setSaving(false);
    navigate("/portal/dashboard");
  }

  function toggleFeature(featureId: string) {
    setSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((f) => f !== featureId)
        : [...prev, featureId]
    );
  }

  async function goNext() {
    if (step === 1) {
      // Save draft when leaving step 2 (business info)
      await saveDraft();
    }
    if (step === 2) {
      await saveDraft();
    }
    setStep((s) => Math.min(s + 1, 3));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  const canProceedStep1 = true; // Inspiratie is browsing only
  const canProceedStep2 = businessName.trim().length > 0;
  const canProceedStep3 = selectedFeatures.length > 0;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-2">Nieuwe brief</h1>
      <p className="text-sm text-text-secondary mb-6">
        Doorloop de stappen om je projectwensen te delen.
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                i < step
                  ? "bg-green text-white"
                  : i === step
                    ? "bg-text text-white"
                    : "bg-accent-soft text-text-muted"
              }`}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                i <= step ? "text-text font-medium" : "text-text-muted"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-px ${
                  i < step ? "bg-green" : "bg-border-light"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
        {/* Step 1: Inspiratie */}
        {step === 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-text" />
              <h2 className="text-lg font-semibold text-text">
                Wat voor project zoek je?
              </h2>
            </div>
            <p className="text-sm text-text-secondary mb-6">
              Klik op een categorie om te zien wat er mogelijk is. Je selecteert
              specifieke features in stap 3.
            </p>

            <div className="flex flex-col gap-3">
              {featureCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="border border-border-light rounded-[12px] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCategory(
                        expandedCategory === cat.id ? null : cat.id
                      )
                    }
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent-soft/50 transition-colors"
                  >
                    <cat.icon size={20} className="text-text shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text">
                        {cat.label}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {cat.description}
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className={`text-text-muted transition-transform ${
                        expandedCategory === cat.id ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {expandedCategory === cat.id && (
                    <div className="border-t border-border-light px-4 py-3 bg-accent-soft/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cat.features.map((feat) => (
                          <div
                            key={feat.id}
                            className="flex items-center gap-2 py-1.5"
                          >
                            <feat.icon
                              size={14}
                              className="text-text-muted shrink-0"
                            />
                            <div>
                              <p className="text-sm text-text">{feat.label}</p>
                              <p className="text-xs text-text-muted">
                                {feat.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Over je bedrijf */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-text mb-4">
              Over je bedrijf
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Dit helpt ons om een passend voorstel te maken.
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Bedrijfsnaam *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
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
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="Beschrijf kort wat je bedrijf doet en wie je klanten zijn..."
                  rows={3}
                  className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Huidige website (optioneel)
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Branche
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Bijv. Horeca, Tech, Retail, Zorg..."
                  className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Features & stijl */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-text mb-4">
              Features & stijl
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Selecteer de features die je nodig hebt en deel je
              stijlvoorkeuren.
            </p>

            {/* Feature checkboxes per category */}
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
                            onChange={() => toggleFeature(feat.id)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              checked
                                ? "bg-text border-text"
                                : "border-border bg-bg-white"
                            }`}
                          >
                            {checked && (
                              <Check size={10} className="text-white" />
                            )}
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
                  value={inspirationUrls}
                  onChange={(e) => setInspirationUrls(e.target.value)}
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
                  value={brandColors}
                  onChange={(e) => setBrandColors(e.target.value)}
                  placeholder="Bijv. donkerblauw (#1a365d), wit, goud"
                  className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Stijlnotities (optioneel)
                </label>
                <textarea
                  value={brandNotes}
                  onChange={(e) => setBrandNotes(e.target.value)}
                  placeholder="Bijv. minimalistisch, modern, speels, zakelijk..."
                  rows={2}
                  className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Afronden */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold text-text mb-4">
              Samenvatting
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Controleer je brief en voeg eventueel extra informatie toe.
            </p>

            {/* Summary */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="rounded-[8px] bg-accent-soft/50 p-4">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                  Bedrijf
                </p>
                <p className="text-sm font-medium text-text">{businessName}</p>
                {businessDescription && (
                  <p className="text-sm text-text-secondary mt-1">
                    {businessDescription}
                  </p>
                )}
                {industry && (
                  <p className="text-xs text-text-muted mt-1">
                    Branche: {industry}
                  </p>
                )}
                {websiteUrl && (
                  <p className="text-xs text-text-muted mt-1">
                    Website: {websiteUrl}
                  </p>
                )}
              </div>

              <div className="rounded-[8px] bg-accent-soft/50 p-4">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
                  Geselecteerde features ({selectedFeatures.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
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

              {(brandColors || brandNotes || inspirationUrls) && (
                <div className="rounded-[8px] bg-accent-soft/50 p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
                    Stijl & inspiratie
                  </p>
                  {brandColors && (
                    <p className="text-sm text-text-secondary">
                      Kleuren: {brandColors}
                    </p>
                  )}
                  {brandNotes && (
                    <p className="text-sm text-text-secondary">
                      Stijl: {brandNotes}
                    </p>
                  )}
                  {inspirationUrls && (
                    <p className="text-sm text-text-secondary">
                      Inspiratie:{" "}
                      {inspirationUrls
                        .split("\n")
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Budget */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text mb-2">
                Indicatie budget
              </label>
              <div className="flex flex-wrap gap-2">
                {budgetOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setBudgetRange(option)}
                    className={`text-sm px-3 py-2 rounded-[8px] border transition-colors ${
                      budgetRange === option
                        ? "border-text bg-accent-soft font-medium text-text"
                        : "border-border-light text-text-secondary hover:border-border"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text mb-1.5">
                Extra opmerkingen (optioneel)
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Is er nog iets wat je wilt delen? Deadlines, bijzondere wensen..."
                rows={3}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-text text-white rounded-[8px] px-6 py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Brief versturen
            </button>
          </form>
        )}
      </div>

      {/* Navigation buttons */}
      {step < 3 && (
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text disabled:opacity-30 transition-colors"
          >
            <ArrowLeft size={16} />
            Vorige
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={
              saving ||
              (step === 0 && !canProceedStep1) ||
              (step === 1 && !canProceedStep2) ||
              (step === 2 && !canProceedStep3)
            }
            className="bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Volgende
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
