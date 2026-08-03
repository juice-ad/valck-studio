import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Compass, Eye, MessageCircle, Rocket } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const STEPS = [
  {
    icon: Compass,
    title: "Welkom in jullie eigen portaal",
    body: "Dit is de plek waar we samen jullie operations-systeem bouwen. Alles op één plek, in jullie eigen stijl.",
  },
  {
    icon: Rocket,
    title: "We werken in fases",
    body: "Ontdekken, bouwen, uitbouwen, afgerond. In 'Jouw traject' zien jullie altijd waar we zijn en wat er nu speelt.",
  },
  {
    icon: Eye,
    title: "Elke week een klik-ronde",
    body: "We laten jullie de preview zien, jullie klikken erdoorheen en geven feedback. Zo groeit het systeem met jullie mee.",
  },
  {
    icon: MessageCircle,
    title: "Kort op de bal",
    body: "Vragen? Stuur een bericht of plan een gesprek. We houden de lijntjes kort en jullie op de hoogte.",
  },
];

export function WelcomeOverlay({ onDone }: { onDone: () => void }) {
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  async function finish() {
    setFinishing(true);
    const now = new Date().toISOString();
    if (user) {
      await supabase.from("profiles").update({ onboarded_at: now }).eq("id", user.id);
      updateProfile({ onboarded_at: now });
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md rounded-[16px] bg-bg-white border border-border-light p-8 shadow-lg"
      >
        <div className="w-12 h-12 rounded-full bg-text text-white flex items-center justify-center mb-5">
          <current.icon size={22} />
        </div>
        <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
          <h2 className="text-xl font-bold text-text mb-2">{current.title}</h2>
          <p className="text-sm text-text-secondary leading-relaxed">{current.body}</p>
        </motion.div>

        <div className="flex items-center gap-1.5 mt-6 mb-6">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-text" : "w-1.5 bg-border-light"}`} />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={finish} className="text-sm text-text-muted hover:text-text">
            Overslaan
          </button>
          {isLast ? (
            <button
              onClick={finish}
              disabled={finishing}
              className="inline-flex items-center gap-2 bg-text text-white rounded-[8px] px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              Aan de slag <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-2 bg-text text-white rounded-[8px] px-5 py-2.5 text-sm font-semibold"
            >
              Verder <ArrowRight size={16} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
