#!/usr/bin/env bash
#
# check-secrets.sh — Verifieer welke Supabase Edge Function secrets
# geconfigureerd zijn voor het Valck Studio project.
#
# Gebruik:
#   bash scripts/check-secrets.sh
#
# Vereisten:
#   - Supabase CLI geïnstalleerd en gelinkt aan project hbowpaixqgxnfbdftzel
#
# Exit codes:
#   0 = alle verwachte secrets aanwezig
#   1 = één of meer secrets ontbreken
#   2 = Supabase CLI niet beschikbaar of niet gelinkt
#

set -u

# --- Kleuren voor output (alleen als stdout een TTY is) ---
if [ -t 1 ]; then
  GREEN="\033[0;32m"
  RED="\033[0;31m"
  YELLOW="\033[0;33m"
  BOLD="\033[1m"
  RESET="\033[0m"
else
  GREEN=""
  RED=""
  YELLOW=""
  BOLD=""
  RESET=""
fi

# --- Verwachte secrets gegroepeerd per feature ---
#
# Formaat per regel: "GROEPNAAM|SECRET_NAAM"
# De volgorde bepaalt de weergavevolgorde.
#
EXPECTED_SECRETS=(
  "AI Summary|ANTHROPIC_API_KEY"
  "Payments (Mollie)|MOLLIE_API_KEY"
  "Accounting (Moneybird)|MONEYBIRD_TOKEN"
  "Accounting (Moneybird)|MONEYBIRD_ADMIN_ID"
  "Accounting (Moneybird)|MONEYBIRD_TAX_RATE_ID"
  "Accounting (Moneybird)|MONEYBIRD_LEDGER_ID"
  "Vercel previews|VERCEL_TOKEN"
  "Algemeen|SITE_URL"
)

# --- Controleer of Supabase CLI beschikbaar is ---
if ! command -v supabase >/dev/null 2>&1; then
  printf "%bFOUT%b: Supabase CLI is niet geïnstalleerd of niet in PATH.\n" "$RED" "$RESET" >&2
  printf "Installeer via: brew install supabase/tap/supabase\n" >&2
  exit 2
fi

# --- Haal de lijst met geconfigureerde secrets op ---
printf "%bSecrets check voor project hbowpaixqgxnfbdftzel%b\n" "$BOLD" "$RESET"
printf "Ophalen van geconfigureerde secrets...\n\n"

SECRETS_OUTPUT=$(supabase secrets list 2>&1)
SECRETS_EXIT=$?

if [ $SECRETS_EXIT -ne 0 ]; then
  printf "%bFOUT%b: kon 'supabase secrets list' niet uitvoeren.\n" "$RED" "$RESET" >&2
  printf "Output:\n%s\n" "$SECRETS_OUTPUT" >&2
  printf "\nControleer of je in een gelinkte Supabase directory staat,\n" >&2
  printf "en dat je bent ingelogd via 'supabase login'.\n" >&2
  exit 2
fi

# --- Parse de output en bouw een lijst met bestaande secret-namen ---
#
# `supabase secrets list` output ziet er zo uit:
#
#         NAME        |                DIGEST
#   -----------------|--------------------------------------
#    ANTHROPIC_API_KEY | abc123...
#    MOLLIE_API_KEY    | def456...
#
# We nemen de eerste kolom (NAME) en filteren lege regels en headers.
#
EXISTING_SECRETS=$(printf "%s\n" "$SECRETS_OUTPUT" \
  | awk -F'|' 'NR>1 && $1 !~ /^-+$/ && $1 !~ /^[[:space:]]*$/ {gsub(/[[:space:]]/,"",$1); if ($1 != "NAME") print $1}')

# --- Loop door verwachte secrets en toon status ---
TOTAL=0
OK_COUNT=0
CURRENT_GROUP=""
MISSING_SECRETS=()

for entry in "${EXPECTED_SECRETS[@]}"; do
  GROUP="${entry%%|*}"
  SECRET="${entry##*|}"
  TOTAL=$((TOTAL + 1))

  # Print groepsheader wanneer we in een nieuwe groep komen
  if [ "$GROUP" != "$CURRENT_GROUP" ]; then
    if [ -n "$CURRENT_GROUP" ]; then
      printf "\n"
    fi
    printf "%b%s%b\n" "$BOLD" "$GROUP" "$RESET"
    CURRENT_GROUP="$GROUP"
  fi

  # Check of de secret bestaat in de opgehaalde lijst
  if printf "%s\n" "$EXISTING_SECRETS" | grep -Fxq "$SECRET"; then
    printf "  %b✓ OK%b        %s\n" "$GREEN" "$RESET" "$SECRET"
    OK_COUNT=$((OK_COUNT + 1))
  else
    printf "  %b✗ ONTBREEKT%b %s\n" "$RED" "$RESET" "$SECRET"
    MISSING_SECRETS+=("$SECRET")
  fi
done

# --- Samenvatting ---
printf "\n"
printf "%b────────────────────────────────────────────%b\n" "$BOLD" "$RESET"
if [ $OK_COUNT -eq $TOTAL ]; then
  printf "%b✓ %d/%d geconfigureerd — alles klaar.%b\n" "$GREEN" "$OK_COUNT" "$TOTAL" "$RESET"
  exit 0
else
  printf "%b⚠ %d/%d geconfigureerd — %d ontbreken.%b\n" "$YELLOW" "$OK_COUNT" "$TOTAL" $((TOTAL - OK_COUNT)) "$RESET"
  printf "\nStel ontbrekende secrets in via:\n"
  printf "  supabase secrets set %s=<value>\n" "${MISSING_SECRETS[0]}"
  exit 1
fi
