# Valck Studio - Project Instructions

## Werkwijze voor Claude (lees dit eerst)

- Stuur altijd eerst een samenvatting van wat je gaat doen en wacht op goedkeuring
- Nooit pushen zonder expliciete toestemming - altijd eerst vragen
- Bij elke aanpassing security checken en risico's expliciet benoemen
- Begin elke sessie met `git fetch` om te checken of er nieuwe commits zijn
- Bij portal/dashboard-werk (admin, client, of nieuwe user-facing secties): controleer ALTIJD dat backend (RLS policies, Supabase queries, DB functies) en frontend (routing, guards, contexts, components) op elkaar zijn afgestemd. Check per feature: kan de juiste user de data opvragen? Blokkeert RLS de verkeerde users? Klopt de redirect-flow? Dit voorkomt losse eindjes aan één kant.

---

## Project Identity

Valck Studio is een publieke portfolio-website voor een solo product studio, met een beveiligd klantportaal waar klanten hun projecten, berichten, documenten en facturen kunnen bekijken.

- **Doelgroep:** Zakelijke klanten (B2B) van Valck Studio
- **Stack:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Supabase
- **Routing:** react-router-dom v7 (layout routes)
- **Animaties:** Motion (Framer Motion)
- **Icons:** lucide-react
- **Deployment:** Vercel
- **Taal:** UI in het Nederlands, code/commits in het Engels

---

## Beveiligingsregels

> Deze regels zijn HARD - ze mogen NOOIT worden gebroken, ongeacht de context.
> Bij twijfel: kies de veiligere optie.

### SEC-1: Row Level Security (RLS)

Elke tabel in Supabase MOET RLS hebben. Een klant mag NOOIT data van een andere klant zien.

**Regels:**
- RLS is enabled op ELKE tabel, zonder uitzondering
- Policies gebruiken `auth.uid()` om de huidige gebruiker te identificeren
- `service_role` key wordt NOOIT in de frontend gebruikt
- Test RLS policies handmatig na elke migratie

```sql
-- FOUT - tabel zonder RLS
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id),
  name TEXT
);
-- Iedereen kan alles lezen!

-- GOED - tabel met RLS
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Klanten zien eigen documenten"
  ON documents FOR SELECT
  USING (auth.uid() = client_id);
```

### SEC-2: Client vs Server Scheiding

De React frontend draait in de browser van de klant. Alles in de frontend is **publiek zichtbaar**.

**Regels:**
- Alleen de `anon` key mag in de frontend (met `VITE_` prefix)
- De `service_role` key wordt NOOIT in frontend code gebruikt
- Secrets worden via Supabase Dashboard ingesteld, niet via `.env`
- Edge Functions (toekomstig) zijn de enige plek voor server-side secrets

```typescript
// FOUT - service role key in frontend
const supabase = createClient(url, import.meta.env.VITE_SERVICE_ROLE_KEY);

// GOED - anon key in frontend, RLS beschermt data
const supabase = createClient(url, import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### SEC-3: Environment Variables

**Regels:**
- `.env` staat ALTIJD in `.gitignore` - nooit committen
- Variabelen met `VITE_` prefix zijn zichtbaar in de frontend (publiek)
- De anon key is veilig in de frontend omdat RLS de data beschermt

```bash
# .env - NOOIT committen
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...  # Veilig in frontend dankzij RLS
```

### SEC-4: Auth Context Bescherming

**Regels:**
- NOOIT wijzigen zonder expliciete toestemming: `AuthContext.tsx`, `ProtectedRoute.tsx`, `supabase.ts`
- Alle portal routes MOETEN door `ProtectedRoute` lopen
- `signUp` stuurt NOOIT gevoelige data als metadata (alleen naam en bedrijf)
- Session tokens worden beheerd door Supabase SDK - nooit handmatig opslaan

### SEC-5: Input & Data Veiligheid

**Regels:**
- Gebruik NOOIT `dangerouslySetInnerHTML` met user content
- Valideer formulierinput aan clientzijde (required, type, minLength)
- Bedragen altijd in **centen** (integers) - nooit floats
- Vertrouw NOOIT op client-side validatie als enige security boundary

---

## Design System (Tailwind v4 tokens)

Alle tokens zijn gedefinieerd in `src/index.css` via `@theme`. Gebruik ALTIJD deze tokens, geen hardcoded kleuren.

```
Kleuren:
  bg:              #fafafa (pagina achtergrond)
  bg-white:        #ffffff (cards, surfaces)
  text:            #111111 (primair)
  text-secondary:  #555555
  text-muted:      #888888
  accent:          #111111
  accent-soft:     #f0f0f0
  border:          #e5e5e5
  border-light:    #f0f0f0
  green:           #10b981 (success, betaald)
  blue:            #3b82f6 (info, verstuurd)

Componenten:
  Card:      rounded-[12px] bg-bg-white border border-border-light p-6
  Input:     rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm
  Button:    bg-text text-white rounded-[8px] text-sm font-semibold hover:bg-[#333]
  Badge:     text-xs font-medium px-2.5 py-1 rounded-full
  Spinner:   w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin

Typografie:
  Font:     Inter (via Google Fonts)
  h1:       text-2xl font-bold (portal) / text-3xl+ (publiek)
  h2:       text-lg font-semibold
  Body:     text-sm
  Muted:    text-xs text-text-muted
```

### Schaduwen & Animaties
- Cards: geen schaduw standaard, `hover:shadow-md` voor interactieve kaarten
- Animaties via Motion library (niet CSS transitions voor complexe animaties)
- Publieke site: `fade-up`, `slide-in` animaties
- Portal: minimale animaties, focus op snelheid

---

## Architectuur

### Route Structuur
```
Publiek (PublicLayout: Navbar + Footer)
  /                    Home
  /werkwijze           Werkwijze
  /portfolio           Portfolio
  /integraties         Integraties
  /prijzen             Prijzen
  /voorwaarden         Algemene voorwaarden
  /privacy             Privacybeleid
  /verwerkersovereenkomst  DPA

Standalone (geen layout)
  /portal/login        Login / Registratie

Portal (PortalLayout: Sidebar + Header, achter ProtectedRoute)
  /portal/dashboard    Dashboard
  /portal/projecten    Projecten overzicht
  /portal/projecten/:id  Project detail
  /portal/berichten    Berichten (chat)
  /portal/documenten   Documenten
  /portal/facturen     Facturen
```

### Bestandsstructuur
```
src/
  components/
    layout/       # PublicLayout, PortalLayout, Navbar, Footer, ScrollToTop
    portal/       # PortalSidebar, PortalHeader
    sections/     # Hero, ProofBar, Pricing, etc. (publieke site)
    ui/           # AnimatedSection, SectionHeader
  contexts/       # AuthContext
  guards/         # ProtectedRoute
  lib/            # supabase.ts, utils.ts
  pages/
    portal/       # Dashboard, Projecten, ProjectDetail, Berichten, Documenten, Facturen, Login
    Home.tsx, Werkwijze.tsx, Portfolio.tsx, etc.
  types/          # portal.ts
  assets/
```

### Component Structuur (volgorde)
1. Imports
2. Types/Interfaces (indien lokaal)
3. Constants (indien nodig)
4. Component function
5. Hooks (useAuth, useParams, useNavigate, useState)
6. useEffect
7. Handler functions
8. Conditional renders (loading, empty states)
9. JSX return

---

## Database Schema

### Tabellen
| Tabel | Doel | RLS |
|-------|------|-----|
| `profiles` | Klantprofiel (naam, bedrijf, email) | `auth.uid() = id` |
| `projects` | Klantprojecten met fase-tracking | `auth.uid() = client_id` |
| `project_updates` | Timeline updates per project | via join op `projects.client_id` |
| `messages` | Chat tussen klant en studio | `sender_id` of `is_from_studio` |
| `documents` | Bestanden voor klanten | `auth.uid() = client_id` |
| `invoices` | Facturen met bedragen in centen | `auth.uid() = client_id` |

### Triggers
- `handle_new_user`: maakt automatisch een `profiles` record aan bij registratie

### Belangrijke velden
- **Bedragen:** altijd `amount_cents` (integer) - nooit floats
- **Project fases:** `'discovery' | 'build' | 'scale' | 'completed'`
- **Factuur status:** `'concept' | 'verstuurd' | 'betaald' | 'vervallen'`
- **Foreign keys:** altijd `ON DELETE CASCADE` voor user-gerelateerde data

---

## Naming Conventions

- **Componenten:** PascalCase (`PortalSidebar.tsx`)
- **Utilities:** camelCase (`supabase.ts`, `utils.ts`)
- **DB kolommen:** snake_case (`client_id`, `created_at`)
- **JS variabelen:** camelCase (`isLoading`, `projectCount`)
- **Handlers:** `handle` + werkwoord (`handleSubmit`, `handleSignOut`)
- **Boolean state:** `is` of `show` prefix (`loading`, `sending`, `sidebarOpen`)

---

## Anti-Patterns - NOOIT Doen

| Anti-Pattern | Waarom fout | Doe dit |
|---|---|---|
| `.env` committen | Supabase keys publiek op GitHub | `.env` in `.gitignore` |
| `service_role` key in frontend | Volledige DB-toegang voor iedereen | Gebruik `anon` key + RLS |
| RLS uitzetten "voor debugging" | Vergeten → data breach | Debug met service_role in apart script |
| `dangerouslySetInnerHTML` | XSS aanval mogelijk | Render als plain text |
| Bedragen als floats | Afrondingsfouten (€9.99 + €0.01 ≠ €10.00) | Altijd centen (integers) |
| `alert()` voor errors | Slechte UX | Inline error banners |
| Geen `ON DELETE CASCADE` | Orphaned data, GDPR-risico | Altijd CASCADE op user FKs |
| Auth bestanden wijzigen | Auth flow kapot → lockout | Alleen met expliciete toestemming |

---

## Git Workflow

- **main** = productie (Vercel auto-deploy)
- Werk op feature branches of `claude-code` branch
- Commit messages in het Engels, kort en beschrijvend
- NOOIT direct op main pushen zonder goedkeuring

### Merge Checklist
1. `npm run build` slaagt zonder errors
2. Vercel preview deployment gecontroleerd
3. `git status` clean
4. Security review bij grote wijzigingen
5. Merge naar main + push
6. Productie-site controleren

---

## Installed Skills
De volgende skills zijn geïnstalleerd en handelen general best practices af:

**Development:**
- `vercel-react-best-practices` - React performance & patterns
- `vercel-composition-patterns` - Layout & composition patterns
- `react-components` - Component architecture
- `typescript-advanced-types` - TypeScript patterns
- `tailwind-css-patterns` - Tailwind utility patterns
- `supabase-postgres-best-practices` - Database optimalisatie & RLS

**Security & Compliance:**
- `security-review` - OWASP security checklist
- `frontend-security` - XSS/CSRF/CSP audit
- `supabase-pentest` - RLS/auth security audit
- `gdpr-compliance` - AVG compliance checks
- `zod-validation` - Input validatie

**Workflow:**
- `finishing-a-development-branch` - Git merge workflow
- `web-design-guidelines` - UI consistency
- `find-skills` - Nieuwe skills zoeken en installeren

Deze skills handelen generieke patronen af. De CLAUDE.md bevat alleen wat uniek is voor Valck Studio.
