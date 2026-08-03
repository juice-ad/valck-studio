import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Send,
  Loader2,
  Star,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveClient } from "@/contexts/ClientContext";
import type {
  ReviewRound,
  PreviewFeedback,
  FeedbackCategory,
} from "@/types/portal";

const categories: { key: FeedbackCategory; label: string }[] = [
  { key: "design", label: "Design" },
  { key: "functionaliteit", label: "Functionaliteit" },
  { key: "content", label: "Content" },
  { key: "technisch", label: "Technisch" },
  { key: "algemeen", label: "Algemeen" },
];

export function ReviewDetail() {
  const { id: projectId, reviewId } = useParams<{
    id: string;
    reviewId: string;
  }>();
  const { user } = useAuth();
  const { activeClientId } = useActiveClient();

  const [round, setRound] = useState<ReviewRound | null>(null);
  const [feedback, setFeedback] = useState<PreviewFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  // Feedback form state
  const [feedbackBody, setFeedbackBody] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState<FeedbackCategory>("algemeen");
  const [sending, setSending] = useState(false);

  // Completing the review
  const [completing, setCompleting] = useState(false);

  // Load review round + feedback
  useEffect(() => {
    if (!reviewId) return;

    async function load() {
      const [roundRes, fbRes] = await Promise.all([
        supabase
          .from("review_rounds")
          .select("*")
          .eq("id", reviewId)
          .single(),
        supabase
          .from("preview_feedback")
          .select("*")
          .eq("review_round_id", reviewId)
          .order("created_at", { ascending: true }),
      ]);

      if (roundRes.data) {
        const r = roundRes.data as ReviewRound;
        setRound(r);
        // Mark as opened if first time
        if (!r.opened_at) {
          await supabase
            .from("review_rounds")
            .update({ opened_at: new Date().toISOString(), status: "active" })
            .eq("id", reviewId);
        }
      }
      setFeedback((fbRes.data as PreviewFeedback[]) ?? []);
      setLoading(false);
    }

    load();
  }, [reviewId]);

  // Submit feedback
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!feedbackBody.trim() || !user || !projectId || !reviewId || !round)
      return;

    setSending(true);
    const { data, error } = await supabase
      .from("preview_feedback")
      .insert({
        project_id: projectId,
        client_id: activeClientId,
        deployment_url: round.deployment_url,
        review_round_id: reviewId,
        body: feedbackBody.trim(),
        rating: rating > 0 ? rating : null,
        category,
        status: "open",
      })
      .select()
      .single();

    if (!error && data) {
      setFeedback((prev) => [...prev, data as PreviewFeedback]);
      setFeedbackBody("");
      setRating(0);
      setCategory("algemeen");
    }
    setSending(false);
  }

  // Complete review round
  async function handleComplete() {
    if (!reviewId) return;
    setCompleting(true);
    await supabase
      .from("review_rounds")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", reviewId);
    setRound((prev) => (prev ? { ...prev, status: "completed" } : prev));
    setCompleting(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  if (!round) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-sm">Review niet gevonden.</p>
        <Link
          to={`/portal/projecten/${projectId}`}
          className="text-sm text-text mt-2 inline-block no-underline hover:underline"
        >
          Terug naar project
        </Link>
      </div>
    );
  }

  const focusAreas = (round.focus_areas ?? []) as string[];
  const isCompleted = round.status === "completed";

  return (
    <div>
      <Link
        to={`/portal/projecten/${projectId}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text no-underline mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Terug naar project
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent-soft text-text-muted">
                Week {round.week_number}
              </span>
              {isCompleted && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-bg text-green">
                  Afgerond
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-text">{round.title}</h1>
            {round.description && (
              <p className="text-sm text-text-secondary mt-1">
                {round.description}
              </p>
            )}
          </div>
        </div>

        {/* Focus areas */}
        {focusAreas.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-xs text-text-muted">Let op:</span>
            {focusAreas.map((area) => (
              <span
                key={area}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-bg text-blue"
              >
                {area}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Preview iframe */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text">Preview</h2>
          <a
            href={round.deployment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-text font-medium no-underline hover:underline"
          >
            <ExternalLink size={14} />
            Open in nieuw tabblad
          </a>
        </div>
        <div className="rounded-[8px] border border-border-light overflow-hidden">
          <iframe
            src={round.deployment_url}
            title="Preview"
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-[500px] border-0"
          />
        </div>
      </div>

      {/* Feedback form */}
      {!isCompleted && (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
          <h2 className="text-sm font-semibold text-text mb-4">
            Feedback geven
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Category pills */}
            <div className="mb-4">
              <label className="block text-xs text-text-muted mb-2">
                Categorie
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`text-sm px-3 py-1.5 rounded-[8px] border transition-colors ${
                      category === cat.key
                        ? "border-text bg-accent-soft font-medium text-text"
                        : "border-border-light text-text-secondary hover:border-border"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Star rating */}
            <div className="mb-4">
              <label className="block text-xs text-text-muted mb-2">
                Beoordeling (optioneel)
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s === rating ? 0 : s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5 transition-colors"
                  >
                    <Star
                      size={20}
                      className={
                        s <= (hoverRating || rating)
                          ? "text-[#f59e0b] fill-[#f59e0b]"
                          : "text-border"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback text */}
            <textarea
              value={feedbackBody}
              onChange={(e) => setFeedbackBody(e.target.value)}
              placeholder="Beschrijf je feedback zo specifiek mogelijk..."
              rows={3}
              className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors resize-none mb-4"
            />

            <button
              type="submit"
              disabled={sending || !feedbackBody.trim()}
              className="bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Feedback versturen
            </button>
          </form>
        </div>
      )}

      {/* Previous feedback */}
      <div className="rounded-[12px] bg-bg-white border border-border-light p-6 mb-6">
        <h2 className="text-sm font-semibold text-text mb-4">
          Feedback ({feedback.length})
        </h2>

        {feedback.length === 0 ? (
          <p className="text-sm text-text-muted">
            Nog geen feedback voor deze review ronde.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {feedback.map((fb) => (
              <div
                key={fb.id}
                className="border-l-2 border-border-light pl-4 py-1"
              >
                <div className="flex items-center gap-2 mb-1">
                  {fb.category && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-soft text-text-muted">
                      {categories.find((c) => c.key === fb.category)?.label ??
                        fb.category}
                    </span>
                  )}
                  {fb.rating && (
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: fb.rating }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className="text-[#f59e0b] fill-[#f59e0b]"
                        />
                      ))}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text">{fb.body}</p>
                <p className="text-xs text-text-muted mt-1">
                  {new Date(fb.created_at).toLocaleString("nl-NL", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {fb.admin_response && (
                  <div className="mt-2 flex items-start gap-2 p-2.5 rounded-[8px] bg-blue-bg">
                    <MessageSquare size={14} className="text-blue mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue mb-0.5">Studio</p>
                      <p className="text-sm text-text">{fb.admin_response}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete review button */}
      {!isCompleted && feedback.length > 0 && (
        <button
          type="button"
          onClick={handleComplete}
          disabled={completing}
          className="w-full bg-green text-white rounded-[8px] px-6 py-3 text-sm font-semibold hover:bg-[#0d9668] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {completing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          Review afronden
        </button>
      )}
    </div>
  );
}
