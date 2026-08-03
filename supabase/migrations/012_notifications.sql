-- 012_notifications.sql
-- In-app meldingen zodat de klant nooit in het duister zit: review klaar,
-- feedback beantwoord, fase gewijzigd, meeting gepland, update geplaatst.

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, read_at);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- gebruiker ziet en beheert alleen eigen meldingen
DROP POLICY IF EXISTS "users_view_own_notifications" ON notifications;
CREATE POLICY "users_view_own_notifications" ON notifications FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
CREATE POLICY "users_update_own_notifications" ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- admin mag voor iedereen meldingen aanmaken (bij events)
DROP POLICY IF EXISTS "admin_create_notifications" ON notifications;
CREATE POLICY "admin_create_notifications" ON notifications FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'admin');
