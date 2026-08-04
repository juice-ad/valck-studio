-- library_items_seed.sql
-- Eerste vulling van de bibliotheek: CCP-modulemenu, agents uit het Ideeënbord
-- en de eerste registry-oogst. Prijzen zijn indicaties excl. btw in centen;
-- bijstellen kan via /admin/bibliotheek. Idempotent (ON CONFLICT DO NOTHING).

INSERT INTO library_items
  (slug, name, description, category, price_cents_indicative, price_note, built_for, stack, source_ref, tags, sort_order)
VALUES
  -- Modules
  ('klokken-uren', 'Klokken & uren',
   'Medewerkers klokken zelf in en uit op hun telefoon, met handtekening van de klant bij oplevering. Urenoverzicht en nette export voor de administratie.',
   'module', 175000, '±', '{ccp}', 'react18-tw3', NULL,
   '{uren,klokken,handtekening,mobiel}', 10),
  ('klanten-facturen', 'Klanten & facturen',
   'Alle klantgegevens, afspraken en documenten op één plek. Facturen rollen rechtstreeks uit de geklokte uren.',
   'module', 200000, '±', '{ccp}', 'react18-tw3', NULL,
   '{crm,facturen,documenten}', 20),
  ('planning-verschuivingen', 'Planning & verschuivingen',
   'Alle klussen in één planning. Verschuivingen worden netjes verwerkt met reden, in plaats van losse appjes en belletjes.',
   'module', 250000, '±', '{ccp}', 'react18-tw3', NULL,
   '{planning,agenda}', 30),
  ('ritten-inzicht', 'Ritten & inzicht',
   'Reistijd per klus en een dashboard met wat er in een dag past. Gekoppeld aan de klus, niet aan de persoon.',
   'module', 200000, '±', '{ccp}', 'react18-tw3', NULL,
   '{ritten,analyse,dashboard}', 40),
  ('klantportaal', 'Klantportaal',
   'Klanten loggen zelf in voor hun documenten, afspraken en facturen.',
   'module', 150000, 'vanaf', '{juice-events}', 'react19-tw4', NULL,
   '{portaal,selfservice}', 50),
  ('document-bundels', 'Documentbundels',
   'Per klant één bundel met contracten, offertes en brochures, deelbaar met de klant.',
   'module', NULL, NULL, '{juice-events,ccp}', NULL, NULL,
   '{documenten}', 60),

  -- Agents
  ('review-collector', 'Review-collector',
   'Verzamelt reviews via gepersonaliseerde mails met directe Google-reviewlink en toont nieuwe reviews in het portaal.',
   'agent', 50000, '±', '{}', NULL, NULL,
   '{reviews,marketing}', 110),
  ('whatsapp-assistent', 'WhatsApp-assistent',
   'Herkent verschuivingsberichten van klanten en zet ze klaar in de planning; stuurt bevestigingen en reminders. Verzending altijd met menselijke controle.',
   'agent', 75000, '±', '{}', NULL, NULL,
   '{whatsapp,planning,automatisering}', 120),
  ('mass-mail-agent', 'Massamail-agent',
   'Gepersonaliseerde mailings naar klanten en leads, met aandacht voor deliverability.',
   'agent', 50000, '±', '{}', NULL, NULL,
   '{email,marketing}', 130),
  ('social-post-agent', 'Social-post-agent',
   'Posts vooruit plannen vanuit het portaal, automatisch geplaatst na akkoord.',
   'agent', 40000, '±', '{}', NULL, NULL,
   '{social,marketing}', 140),

  -- Componenten (eerste registry-oogst; prijs zit in de modules)
  ('flip-clock', 'Flip Clock',
   'Live klok in vertrekbord-stijl met flip-animatie per cijfer.',
   'component', NULL, NULL, '{juice-events,ccp}', 'react18-tw3', 'valck-registry/items/flip-clock',
   '{ui,header}', 210),
  ('count-up', 'Count Up',
   'Cijfers tellen op naar hun waarde zodra ze in beeld komen.',
   'component', NULL, NULL, '{juice-events,ccp}', 'react18-tw3', 'valck-registry/items/count-up',
   '{ui,dashboard}', 220),
  ('data-table', 'Data Table',
   'Tabel met zoeken, sorteren, paginering, rij-klik en bulk-selectie.',
   'component', NULL, NULL, '{juice-events,ccp}', 'react18-tw3', 'valck-registry/items/data-table',
   '{ui,tabellen}', 230),
  ('stat-group', 'Stat Group',
   'KPI-kaart met klikbare statregels, iconen en alert-status.',
   'component', NULL, NULL, '{juice-events,ccp}', 'react18-tw3', 'valck-registry/items/stat-group',
   '{ui,dashboard}', 240),
  ('date-picker', 'Date Picker',
   'Datumprikker met Nederlandse locale op een herbruikbare datetime-basis.',
   'component', NULL, NULL, '{juice-events,ccp}', 'react18-tw3', 'valck-registry/items/date-picker',
   '{ui,formulieren}', 250)
ON CONFLICT (slug) DO NOTHING;
