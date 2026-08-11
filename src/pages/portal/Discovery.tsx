import { useEffect, useState, useRef, useCallback, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Loader2,
  SkipForward,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveClient } from "@/contexts/ClientContext";
import type { DiscoveryBrief } from "@/types/portal";
import { StepIndicator } from "@/components/discovery/StepIndicator";
import { StepWelcome } from "@/components/discovery/StepWelcome";
import { StepBusiness } from "@/components/discovery/StepBusiness";
import { StepWorkflow } from "@/components/discovery/StepWorkflow";
import { StepPainPoints } from "@/components/discovery/StepPainPoints";
import { StepGrowth } from "@/components/discovery/StepGrowth";
import { StepPriorities } from "@/components/discovery/StepPriorities";
import { StepInspiration } from "@/components/discovery/StepInspiration";
import { StepSummary } from "@/components/discovery/StepSummary";

const TOTAL_STEPS = 8; // 0-7
const DEBOUNCE_MS = 3000;

export function Discovery() {
  const { user } = useAuth();
  const { activeClientId } = useActiveClient();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [briefId, setBriefId] = useState<string | null>(null);

  // Submitted/reviewed brief (read-only view)
  const [submittedBrief, setSubmittedBrief] = useState<DiscoveryBrief | null>(null);

  // Form data - single object for all fields
  const [formData, setFormData] = useState<Partial<DiscoveryBrief>>({
    business_name: "",
    questionnaire_version: 2,
    current_step: 0,
  });

  // Feature selection (kept separate for toggle logic)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Additional notes (only on summary step, not auto-saved)
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing brief on mount (draft or submitted/reviewed)
  useEffect(() => {
    if (!user || !activeClientId) return;

    async function loadBrief() {
      // First check for submitted/reviewed brief
      const { data: submitted } = await supabase
        .from("discovery_briefs")
        .select("*")
        .eq("client_id", activeClientId!)
        .in("status", ["submitted", "reviewed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (submitted) {
        setSubmittedBrief(submitted as DiscoveryBrief);
        setLoading(false);
        return;
      }

      // Otherwise load draft
      const { data } = await supabase
        .from("discovery_briefs")
        .select("*")
        .eq("client_id", activeClientId!)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const brief = data as DiscoveryBrief;
        setBriefId(brief.id);
        setFormData(brief);
        setSelectedFeatures(Array.isArray(brief.selected_features) ? brief.selected_features : []);
        setAdditionalNotes(brief.additional_notes ?? "");
        // Resume at saved step
        setStep(brief.current_step ?? 0);
      }
      setLoading(false);
    }

    loadBrief();
  }, [user, activeClientId]);

  // Build the data payload for saving
  const buildPayload = useCallback(() => {
    const urls =
      typeof formData.inspiration_urls === "string"
        ? (formData.inspiration_urls as unknown as string)
            .split("\n")
            .map((u: string) => u.trim())
            .filter(Boolean)
        : formData.inspiration_urls ?? [];

    return {
      client_id: activeClientId!,
      business_name: (formData.business_name ?? "").trim() || "Untitled",
      business_description: formData.business_description?.trim() || null,
      website_url: formData.website_url?.trim() || null,
      industry: formData.industry?.trim() || null,
      team_size: formData.team_size || null,
      annual_revenue: formData.annual_revenue || null,
      ambition: formData.ambition?.trim() || null,
      revenue_model: formData.revenue_model || null,
      current_tools: formData.current_tools?.trim() || null,
      monthly_tool_costs: formData.monthly_tool_costs || null,
      time_consuming_tasks: formData.time_consuming_tasks?.trim() || null,
      admin_hours_weekly: formData.admin_hours_weekly || null,
      manual_data_transfers: formData.manual_data_transfers?.trim() || null,
      top_frustrations: formData.top_frustrations?.trim() || null,
      failure_under_pressure: formData.failure_under_pressure?.trim() || null,
      lost_clients_due_to_workflow: formData.lost_clients_due_to_workflow?.trim() || null,
      should_be_automatic: formData.should_be_automatic?.trim() || null,
      growth_blockers: formData.growth_blockers?.trim() || null,
      breaks_at_2x_clients: formData.breaks_at_2x_clients?.trim() || null,
      needs_shared_platform: formData.needs_shared_platform || null,
      automation_priority: formData.automation_priority?.trim() || null,
      desired_timeline: formData.desired_timeline || null,
      budget_range: formData.budget_range || null,
      dealbreakers: formData.dealbreakers?.trim() || null,
      selected_features: selectedFeatures,
      inspiration_urls: urls.length > 0 ? urls : null,
      brand_colors: formData.brand_colors?.trim() || null,
      brand_notes: formData.brand_notes?.trim() || null,
      additional_notes: additionalNotes.trim() || null,
      questionnaire_version: 2,
      current_step: step,
    };
  }, [formData, selectedFeatures, additionalNotes, step, activeClientId]);

  // Save draft to DB
  const saveDraft = useCallback(
    async (overrideStep?: number) => {
      if (!user) return;
      setSaving(true);

      const payload = buildPayload();
      if (overrideStep !== undefined) {
        payload.current_step = overrideStep;
      }

      if (briefId) {
        await supabase
          .from("discovery_briefs")
          .update(payload)
          .eq("id", briefId);
      } else {
        const { data } = await supabase
          .from("discovery_briefs")
          .insert(payload)
          .select("id")
          .single();
        if (data) setBriefId(data.id);
      }

      setSaving(false);
    },
    [briefId, buildPayload, user]
  );

  // Debounced auto-save on form changes (only if we have a briefId or are past step 0)
  const scheduleSave = useCallback(() => {
    if (step === 0) return; // Don't auto-save on welcome step

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveDraft();
    }, DEBOUNCE_MS);
  }, [saveDraft, step]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Field change handler
  function handleChange(field: string, value: string) {
    if (field === "inspiration_urls") {
      // Store as array from newline-separated string
      const urls = value
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);
      setFormData((prev) => ({
        ...prev,
        inspiration_urls: urls.length > 0 ? urls : null,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    scheduleSave();
  }

  function toggleFeature(featureId: string) {
    setSelectedFeatures((prev) => {
      const next = prev.includes(featureId)
        ? prev.filter((f) => f !== featureId)
        : [...prev, featureId];
      return next;
    });
    scheduleSave();
  }

  // Navigation
  async function goNext() {
    // Flush any pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const nextStep = Math.min(step + 1, TOTAL_STEPS - 1);

    // Save on step transition (skip welcome step)
    if (step >= 1) {
      await saveDraft(nextStep);
    } else if (step === 0 && !briefId) {
      // Create draft on leaving welcome
      await saveDraft(nextStep);
    }

    setDirection(1);
    setStep(nextStep);
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  // Submit
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!briefId) return;

    setSaving(true);

    // Flush debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Final save
    const payload = buildPayload();
    payload.current_step = TOTAL_STEPS - 1;
    await supabase
      .from("discovery_briefs")
      .update({
        ...payload,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", briefId);

    setSaving(false);
    navigate("/portal/project");
  }

  // Validation per step
  const canProceed = (() => {
    switch (step) {
      case 0:
        return true; // Welcome
      case 1:
        return (formData.business_name ?? "").trim().length > 0;
      default:
        return true; // All other steps are optional
    }
  })();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  // Show submitted/reviewed brief with AI summary
  if (submittedBrief) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-text mb-2">Intake</h1>
        <p className="text-sm text-text-secondary mb-6">
          Je intake is ingediend. We nemen je aanvraag door en komen snel bij je terug.
        </p>

        {/* Status */}
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-bg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">
                Intake {submittedBrief.status === "reviewed" ? "beoordeeld" : "ingediend"}
              </p>
              <p className="text-xs text-text-muted">
                {submittedBrief.submitted_at
                  ? new Date(submittedBrief.submitted_at).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : ""}
              </p>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {submittedBrief.ai_summary && (
          <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-text" />
              <h2 className="text-sm font-semibold text-text">
                Samenvatting van je intake
              </h2>
            </div>
            <div className="text-sm text-text leading-relaxed whitespace-pre-wrap">
              {submittedBrief.ai_summary}
            </div>
          </div>
        )}

        {/* Brief overview */}
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
          <h2 className="text-sm font-semibold text-text mb-4">Je antwoorden</h2>
          <div className="space-y-3 text-sm">
            <ReadOnlyField label="Bedrijfsnaam" value={submittedBrief.business_name} />
            <ReadOnlyField label="Beschrijving" value={submittedBrief.business_description} />
            <ReadOnlyField label="Teamgrootte" value={submittedBrief.team_size} />
            <ReadOnlyField label="Ambitie" value={submittedBrief.ambition} />
            <ReadOnlyField label="Top frustraties" value={submittedBrief.top_frustrations} />
            <ReadOnlyField label="Wat moet automatisch?" value={submittedBrief.should_be_automatic} />
            <ReadOnlyField label="#1 prioriteit" value={submittedBrief.automation_priority} />
            <ReadOnlyField label="Budget" value={submittedBrief.budget_range} />
            <ReadOnlyField label="Tijdlijn" value={submittedBrief.desired_timeline} />
            {submittedBrief.additional_notes && (
              <ReadOnlyField label="Extra notities" value={submittedBrief.additional_notes} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Animation variants
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
    }),
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-2">Intake</h1>
      <p className="text-sm text-text-secondary mb-6">
        Doorloop de stappen om je bedrijf en wensen te delen.
      </p>

      <StepIndicator currentStep={step} />

      {/* Step content with animation */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {step === 0 && <StepWelcome />}
            {step === 1 && (
              <StepBusiness data={formData} onChange={handleChange} />
            )}
            {step === 2 && (
              <StepWorkflow data={formData} onChange={handleChange} />
            )}
            {step === 3 && (
              <StepPainPoints data={formData} onChange={handleChange} />
            )}
            {step === 4 && (
              <StepGrowth data={formData} onChange={handleChange} />
            )}
            {step === 5 && (
              <StepPriorities data={formData} onChange={handleChange} />
            )}
            {step === 6 && (
              <StepInspiration
                data={formData}
                onChange={handleChange}
                selectedFeatures={selectedFeatures}
                onToggleFeature={toggleFeature}
              />
            )}
            {step === 7 && (
              <form onSubmit={handleSubmit}>
                <StepSummary
                  data={formData}
                  selectedFeatures={selectedFeatures}
                />

                {/* Additional notes textarea */}
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Is er nog iets wat je wilt delen? Deadlines, bijzondere wensen..."
                  rows={3}
                  className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none mb-6"
                />

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
                  Intake versturen
                </button>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      {step < TOTAL_STEPS - 1 && (
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

          <div className="flex items-center gap-3">
            {/* Skip button for optional steps (6 = Inspiratie) */}
            {step === 6 && (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
              >
                Overslaan
                <SkipForward size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={goNext}
              disabled={saving || !canProceed}
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
        </div>
      )}

      {/* Saving indicator */}
      {saving && step > 0 && step < TOTAL_STEPS - 1 && (
        <p className="text-xs text-text-muted mt-3 text-right">
          Opslaan...
        </p>
      )}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm text-text whitespace-pre-wrap">{value}</p>
    </div>
  );
}
