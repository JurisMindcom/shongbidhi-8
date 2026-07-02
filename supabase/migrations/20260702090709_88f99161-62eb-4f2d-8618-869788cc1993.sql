
-- Allow public (unauthenticated) read of non-sensitive profile fields.
-- Column-level GRANTs constrain anon to safe columns only; phone and
-- registration_number remain readable only by authenticated users.

CREATE POLICY "profiles public read active"
  ON public.profiles FOR SELECT
  TO anon
  USING (status = 'active');

GRANT SELECT (
  id, name, nickname, roll, session, batch, department,
  blood_group, district, gender, profile_photo, facebook_link, status
) ON public.profiles TO anon;

-- Roles are needed to render Admin/CR/Founder badges publicly.
CREATE POLICY "user_roles public read"
  ON public.user_roles FOR SELECT
  TO anon
  USING (true);

GRANT SELECT (user_id, role) ON public.user_roles TO anon;
