import { createElement, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight, Boxes, Check, Clock, ExternalLink, Flag,
  FolderKanban, MessageCircle, Route, Sparkles, TrendingUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useActiveClient } from "@/contexts/ClientContext";
import { MODULE_STATUS, formatEuros, formatMonthly, moduleIcon, normalizeModuleKind } from "@/lib/modules";
import type {
  DiscoveryBrief, Module, ModuleStatus, Project, ProjectCost,
  ProjectPhase, ProjectUpdate, ReviewRound,
} from "@/types/portal";

type Tab = "overzicht" | "modules" | "voortgang";

const TABS: { key: Tab; label: string; icon: typeof Boxes }[] = [
  { key: "overzicht", label: "Overzicht", icon: FolderKanban },
  { key: "modules", label: "Modules", icon: Boxes },
  { key: "voortgang", label: "Voortgang", icon: TrendingUp },
];

const PHASES: { key: ProjectPhase; label: string; description: string }[] = [
  { key: "discovery", label: "Ontdekken", description: "We brengen jullie bedrijf en prioriteiten in kaart." },
  { key: "build", label: "Bouwen", description: "We leveren gericht op en vragen feedback waar nodig." },
  { key: "scale", label: "Uitbouwen", description: "We activeren nieuwe modules en agents." },
  { key: "completed", label: "Live", description: "Het systeem werkt; we blijven waarde zichtbaar maken." },
];

const dateFormatter = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" });

function phaseIndex(phase: ProjectPhase) {
  return PHASES.findIndex((item) => item.key === phase);
}

function statusDot(status: ModuleStatus) {
  return status === "live" ? "bg-green" : status === "building" ? "bg-blue" : status === "on_hold" ? "bg-amber" : "bg-border";
}

function EmptyState({ icon: Icon, title, body }: { icon: typeof Boxes; title: string; body: string }) {
  return <div className="rounded-[12px] bg-bg-white border border-border-light px-6 py-10 text-center">
    <Icon size={25} className="mx-auto text-text-muted mb-3" aria-hidden="true" />
    <p className="text-sm font-semibold text-text">{title}</p>
    <p className="text-sm text-text-muted mt-1 max-w-md mx-auto text-pretty">{body}</p>
  </div>;
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { activeClientId } = useActiveClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") as Tab | null;
  const tab = TABS.some((item) => item.key === requestedTab) ? requestedTab! : "overzicht";

  const [project, setProject] = useState<Project | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [reviews, setReviews] = useState<ReviewRound[]>([]);
  const [costs, setCosts] = useState<ProjectCost[]>([]);
  const [brief, setBrief] = useState<DiscoveryBrief | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !activeClientId) return;
    let active = true;
    async function load() {
      const [projectResult, moduleResult, updateResult, reviewResult, costResult, briefResult] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).eq("client_id", activeClientId).single(),
        supabase.from("modules").select("*").eq("project_id", id).order("sequence_order"),
        supabase.from("project_updates").select("*").eq("project_id", id).order("created_at", { ascending: false }),
        supabase.from("review_rounds").select("*").eq("project_id", id).order("week_number", { ascending: false }),
        supabase.from("project_costs").select("*").eq("project_id", id).order("sequence_order"),
        supabase.from("discovery_briefs").select("*").eq("client_id", activeClientId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (!active) return;
      setProject(projectResult.data as Project | null);
      setModules((moduleResult.data as Module[]) ?? []);
      setUpdates((updateResult.data as ProjectUpdate[]) ?? []);
      setReviews((reviewResult.data as ReviewRound[]) ?? []);
      setCosts((costResult.data as ProjectCost[]) ?? []);
      setBrief(briefResult.data as DiscoveryBrief | null);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [activeClientId, id]);

  const agents = useMemo(() => modules.filter((item) => normalizeModuleKind(item.kind) === "agent"), [modules]);
  const activeReview = reviews.find((item) => item.status === "active" || item.status === "pending");
  const latestDrop = updates.find((item) => item.kind === "drop");
  const currentPhase = project ? phaseIndex(project.phase) : 0;
  const setupTotal = costs.reduce((sum, item) => sum + item.amount_cents, 0);
  const monthlyTotal = agents.reduce((sum, item) => sum + (item.monthly_price_cents ?? 0), 0);

  if (loading) return <div className="flex justify-center py-20"><div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" /></div>;
  if (!project) return <EmptyState icon={FolderKanban} title="Project niet gevonden" body="Dit project is niet beschikbaar voor jullie organisatie." />;

  return <div className="max-w-[1120px] mx-auto">
    <header className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-text-muted mb-2">Stap {Math.max(currentPhase + 1, 1)} van {PHASES.length}</p>
          <h1 className="text-2xl font-bold text-text text-balance">{project.title}</h1>
          <p className="text-sm text-text-secondary mt-1.5 text-pretty">{PHASES[currentPhase]?.description}</p>
        </div>
        {project.live_url ? <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-[8px] border border-border-light bg-bg-white px-3.5 py-2 text-sm font-medium text-text-secondary no-underline hover:text-text hover:border-border focus-visible:ring-2 focus-visible:ring-text/30">Open jullie systeem <ExternalLink size={14} aria-hidden="true" /></a> : null}
      </div>
      <div className="grid grid-cols-4 gap-2 mt-6" aria-label="Projectroute">
        {PHASES.map((phase, index) => <div key={phase.key}>
          <div className={`h-1 rounded-full ${index <= currentPhase ? "bg-text" : "bg-border-light"}`} />
          <p className={`text-[11px] mt-1.5 ${index === currentPhase ? "font-medium text-text" : "text-text-muted"}`}>{phase.label}</p>
        </div>)}
      </div>
    </header>

    {activeReview ? <Link to={`/portal/projecten/${id}/review/${activeReview.id}`} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[12px] bg-blue-bg border border-[#bfdbfe] p-4 mb-6 no-underline hover:shadow-sm focus-visible:ring-2 focus-visible:ring-blue/30">
      <div className="flex items-center gap-3 min-w-0"><Flag size={17} className="text-blue shrink-0" aria-hidden="true" /><div className="min-w-0"><p className="text-sm font-semibold text-text">Jouw volgende stap: {activeReview.title}</p><p className="text-xs text-text-secondary mt-0.5">Bekijk de preview en geef je feedback voor de volgende bouwstap.</p></div></div>
      <span className="shrink-0 self-stretch sm:self-auto justify-center inline-flex items-center gap-1.5 bg-text text-white rounded-[8px] px-3.5 py-2 text-sm font-semibold">Start review <ArrowRight size={14} aria-hidden="true" /></span>
    </Link> : project.phase === "discovery" ? <Link to="/portal/discovery" className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[12px] bg-blue-bg border border-[#bfdbfe] p-4 mb-6 no-underline hover:shadow-sm focus-visible:ring-2 focus-visible:ring-blue/30"><div className="flex items-center gap-3"><Flag size={17} className="text-blue shrink-0" aria-hidden="true" /><div><p className="text-sm font-semibold text-text">Jouw volgende stap: rond de intake af</p><p className="text-xs text-text-secondary mt-0.5">Daarmee vertalen we jullie werkwijze naar een concreet bouwvoorstel.</p></div></div><span className="shrink-0 self-stretch sm:self-auto justify-center inline-flex items-center gap-1.5 bg-text text-white rounded-[8px] px-3.5 py-2 text-sm font-semibold">Verder met intake <ArrowRight size={14} aria-hidden="true" /></span></Link> : null}

    <nav className="flex items-center gap-1 border-b border-border-light mb-7 overflow-x-auto" aria-label="Projectonderdelen">
      {TABS.map((item) => {
        const Icon = item.icon;
        const count = item.key === "modules" ? modules.length : item.key === "voortgang" ? reviews.length : 0;
        return <button key={item.key} type="button" onClick={() => setSearchParams(item.key === "overzicht" ? {} : { tab: item.key })}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px focus-visible:ring-2 focus-visible:ring-text/20 ${tab === item.key ? "border-text text-text" : "border-transparent text-text-muted hover:text-text"}`} aria-current={tab === item.key ? "page" : undefined}>
          <Icon size={15} aria-hidden="true" />{item.label}{count > 0 ? <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-accent-soft text-text-secondary tabular-nums">{count}</span> : null}
        </button>;
      })}
    </nav>

    {tab === "overzicht" ? <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-8">
      <main className="min-w-0 space-y-8">
        {latestDrop ? <section>
          <div className="flex items-center gap-2 text-text-muted text-xs font-semibold uppercase tracking-wide mb-2"><Sparkles size={14} aria-hidden="true" />Deze week opgeleverd</div>
          <h2 className="text-lg font-bold text-text text-balance">{latestDrop.title}</h2>
          {latestDrop.body ? <p className="text-sm text-text-secondary mt-1.5 whitespace-pre-line break-words">{latestDrop.body}</p> : null}
          <div className="flex items-center gap-4 mt-3"><span className="text-[11px] text-text-muted">{dateFormatter.format(new Date(latestDrop.created_at))}</span>{latestDrop.link ? <a href={latestDrop.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-text no-underline hover:underline focus-visible:ring-2 focus-visible:ring-text/20">Open het resultaat <ExternalLink size={14} aria-hidden="true" /></a> : null}</div>
        </section> : <section>
          <div className="flex items-center gap-2 text-text-muted text-xs font-semibold uppercase tracking-wide mb-2"><Clock size={14} aria-hidden="true" />Volgende update</div>
          <h2 className="text-lg font-bold text-text">We houden jullie hier wekelijks op de hoogte</h2>
          <p className="text-sm text-text-secondary mt-1.5">Zodra er iets tastbaars is gebouwd of getest, verschijnt het resultaat hier.</p>
        </section>}

        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-semibold text-text">Jullie systeem</h2>
            {modules.length > 5 ? <button type="button" onClick={() => setSearchParams({ tab: "modules" })} className="text-xs font-semibold text-text-secondary hover:text-text focus-visible:ring-2 focus-visible:ring-text/20">Alle modules</button> : null}
          </div>
          {modules.length ? <ul className="divide-y divide-border-light border-t border-b border-border-light">
            {modules.slice(0, 5).map((module) => <li key={module.id}>
              <Link to={`/portal/projecten/${id}/modules/${module.id}`} className="group flex items-center gap-3 py-3 no-underline focus-visible:ring-2 focus-visible:ring-text/20">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(module.status)}`} aria-hidden="true" />
                <span className="text-sm font-medium text-text truncate">{module.name}</span>
                <span className="text-xs text-text-muted ml-auto shrink-0">{MODULE_STATUS[module.status].label}</span>
                <ArrowRight size={14} className="text-text-muted shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
            </li>)}
          </ul> : <p className="text-sm text-text-muted">Zodra de oplossingsrichting staat, verschijnen de eerste modules hier.</p>}
        </section>
      </main>

      <aside className="space-y-4">
        <section className="rounded-[12px] bg-bg-white border border-border-light p-5"><h2 className="text-sm font-semibold text-text mb-4">Project in het kort</h2><dl className="space-y-3">
          <div><dt className="text-[11px] text-text-muted uppercase tracking-wide">Huidige fase</dt><dd className="text-sm font-medium text-text mt-0.5">{PHASES[currentPhase]?.label}</dd></div>
          {project.start_date ? <div><dt className="text-[11px] text-text-muted uppercase tracking-wide">Gestart</dt><dd className="text-sm text-text mt-0.5">{dateFormatter.format(new Date(project.start_date))}</dd></div> : null}
          <div><dt className="text-[11px] text-text-muted uppercase tracking-wide">Onderdelen</dt><dd className="text-sm text-text mt-0.5">{modules.length} modules · {agents.length} agents</dd></div>
          <div><dt className="text-[11px] text-text-muted uppercase tracking-wide">Intake</dt><dd className="text-sm text-text mt-0.5">{brief ? (brief.status === "draft" ? "Nog af te ronden" : "Ontvangen") : "Nog niet gestart"} · <Link to="/portal/discovery" className="font-medium text-text-secondary no-underline hover:text-text hover:underline">bekijk</Link></dd></div>
          <div><dt className="text-[11px] text-text-muted uppercase tracking-wide">Open acties</dt><dd className="text-sm text-text mt-0.5">{activeReview ? "1 review voor jullie" : "Geen actie nodig"}</dd></div>
        </dl></section>
        {(costs.length > 0 || monthlyTotal > 0) ? <section className="rounded-[12px] bg-bg-white border border-border-light p-5"><div className="flex items-center gap-2 mb-3"><Route size={15} className="text-text-muted" aria-hidden="true" /><h2 className="text-sm font-semibold text-text">Investering</h2></div>{costs.length > 0 ? <div className="flex justify-between gap-3 text-sm"><span className="text-text-muted">Eenmalige setup</span><span className="font-semibold tabular-nums">{formatEuros(setupTotal)}</span></div> : null}{monthlyTotal > 0 ? <div className="flex justify-between gap-3 text-sm mt-2 pt-2 border-t border-border-light"><span className="text-text-muted">Vanaf live</span><span className="font-semibold text-[#7c3aed] tabular-nums">{formatMonthly(monthlyTotal)}</span></div> : null}<p className="text-[11px] text-text-muted mt-3">Setup wordt bij oplevering afgerekend. Agentkosten starten pas vanaf livegang.</p></section> : null}
        <Link to="/portal/berichten" className="flex items-center justify-between gap-3 rounded-[12px] border border-border-light bg-bg-white p-4 no-underline hover:border-border focus-visible:ring-2 focus-visible:ring-text/20"><div className="flex items-center gap-2.5 min-w-0"><MessageCircle size={16} className="text-text-muted shrink-0" aria-hidden="true" /><div className="min-w-0"><p className="text-sm font-semibold text-text">Een vraag voor Valck?</p><p className="text-xs text-text-muted mt-0.5">Stuur ons direct een bericht.</p></div></div><ArrowRight size={15} className="text-text-muted shrink-0" aria-hidden="true" /></Link>
      </aside>
    </div> : null}

    {tab === "modules" ? <div>
      {modules.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{modules.map((module) => <ModuleCard key={module.id} module={module} projectId={id!} />)}</div> : <EmptyState icon={Boxes} title="De eerste modules komen eraan" body="Na de intake zetten we de onderdelen van jullie systeem hier in de juiste bouwvolgorde klaar." />}
      {project.phase === "completed" ? <div className="rounded-[12px] bg-bg-white border border-border-light p-5 mt-5 flex flex-wrap items-center gap-4"><div className="w-10 h-10 rounded-[10px] bg-accent-soft flex items-center justify-center"><Route size={19} aria-hidden="true" /></div><div className="flex-1 min-w-[220px]"><p className="text-sm font-semibold text-text">Klaar voor de volgende verbetering?</p><p className="text-xs text-text-muted mt-0.5">Breid gericht uit met een nieuwe module of agent wanneer het bedrijf daar klaar voor is.</p></div><Link to="/portal/build-requests" className="inline-flex items-center gap-1.5 text-sm font-semibold text-text no-underline hover:underline">Bespreek een volgende stap <ArrowRight size={14} aria-hidden="true" /></Link></div> : null}
    </div> : null}

    {tab === "voortgang" ? <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-8"><main className="space-y-6">
      <div className="flex items-center gap-3 rounded-[12px] bg-bg-white border border-border-light p-4">
        <Clock size={17} className="text-text-muted shrink-0" aria-hidden="true" />
        <div className="min-w-0"><p className="text-sm font-semibold text-text">Nu: {PHASES[currentPhase]?.label}</p><p className="text-xs text-text-muted mt-0.5">{PHASES[currentPhase]?.description}</p></div>
      </div>
      <section><h2 className="text-sm font-semibold text-text mb-4">Updates</h2>{updates.length ? <div className="space-y-5">{updates.map((update) => <article key={update.id} className="border-l-2 border-border-light pl-4"><div className="flex items-center gap-2"><h3 className="text-sm font-semibold text-text">{update.title}</h3>{update.kind === "drop" ? <span className="text-[10px] font-bold rounded-full bg-blue-bg text-blue px-2 py-0.5">OPLEVERING</span> : null}</div>{update.body ? <p className="text-sm text-text-secondary mt-1 whitespace-pre-line break-words">{update.body}</p> : null}<p className="text-[11px] text-text-muted mt-1">{dateFormatter.format(new Date(update.created_at))}</p></article>)}</div> : <p className="text-sm text-text-muted">De eerste update verschijnt zodra het traject start.</p>}</section>
    </main><aside><section className="rounded-[12px] bg-bg-white border border-border-light p-5"><h2 className="text-sm font-semibold text-text mb-4">Reviews</h2>{reviews.length ? <div className="space-y-3">{reviews.map((review) => <Link key={review.id} to={`/portal/projecten/${id}/review/${review.id}`} className="flex items-center gap-3 no-underline group"><div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${review.status === "completed" ? "bg-green-bg text-green" : "bg-blue-bg text-blue"}`}>{review.status === "completed" ? <Check size={14} aria-hidden="true" /> : <Flag size={14} aria-hidden="true" />}</div><div className="min-w-0"><p className="text-sm font-medium text-text group-hover:underline truncate">{review.title}</p><p className="text-xs text-text-muted">Week {review.week_number} · {review.status === "completed" ? "Afgerond" : "Feedback nodig"}</p></div></Link>)}</div> : <p className="text-sm text-text-muted">Nog geen reviewrondes gepland.</p>}</section></aside></div> : null}
  </div>;
}

function ModuleCard({ module, projectId }: { module: Module; projectId: string }) {
  const moduleKind = normalizeModuleKind(module.kind);
  const icon = moduleIcon(module.icon, moduleKind);
  const status = MODULE_STATUS[module.status];
  return <Link to={`/portal/projecten/${projectId}/modules/${module.id}`} className="group rounded-[12px] bg-bg-white border border-border-light p-4 no-underline hover:border-border hover:shadow-sm focus-visible:ring-2 focus-visible:ring-text/20 min-w-0">
    <div className="flex items-start gap-3"><div className={`w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0 ${moduleKind === "agent" ? "bg-[#f3e8ff]" : "bg-accent-soft"}`}>{createElement(icon, { size: 17, className: moduleKind === "agent" ? "text-[#7c3aed]" : "text-text", "aria-hidden": true })}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-text truncate">{module.name}</p>{module.description ? <p className="text-xs text-text-muted mt-1 line-clamp-2 break-words">{module.description}</p> : null}<div className="flex items-center justify-between gap-2 mt-3"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.badge}`}>{status.label}</span>{moduleKind === "agent" && module.monthly_price_cents != null ? <span className="text-[10px] font-semibold text-[#7c3aed]">{formatMonthly(module.monthly_price_cents)}</span> : <ArrowRight size={13} className="text-text-muted group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />}</div></div></div>
  </Link>;
}
