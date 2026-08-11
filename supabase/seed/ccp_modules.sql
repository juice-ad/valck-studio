-- CCP: hernoem het project en zet de 4 modules klaar (gespiegeld aan de CCP-demo).
-- Toegepast op productie via de Management API. project_id/client_id zijn de CCP-waarden.

update public.projects set title = 'CCP Portaal'
where id = '385a7855-d97b-4f17-ba6b-34556707bba2';

insert into public.modules (project_id, client_id, name, description, status, sequence_order, preview_url, icon) values
 ('385a7855-d97b-4f17-ba6b-34556707bba2','ed33c3d4-3d7b-4fab-9422-9263c0dde5ba','Klokken & uren','De jongens klokken zelf in en uit, mét handtekening van de klant.','building',0,'https://valck-studio.vercel.app/uren','Clock'),
 ('385a7855-d97b-4f17-ba6b-34556707bba2','ed33c3d4-3d7b-4fab-9422-9263c0dde5ba','Klanten & facturen','Alle klantgegevens, afspraken en documenten op één plek.','planned',1,'https://valck-studio.vercel.app/klanten','Users'),
 ('385a7855-d97b-4f17-ba6b-34556707bba2','ed33c3d4-3d7b-4fab-9422-9263c0dde5ba','Planning & verschuivingen','Alle klussen in één planning, verschuivingen netjes verwerkt.','planned',2,'https://valck-studio.vercel.app/planning','CalendarDays'),
 ('385a7855-d97b-4f17-ba6b-34556707bba2','ed33c3d4-3d7b-4fab-9422-9263c0dde5ba','Ritten & inzicht','Reistijd per klus en wat er in een dag past.','planned',3,'https://valck-studio.vercel.app/ritten','Route');
