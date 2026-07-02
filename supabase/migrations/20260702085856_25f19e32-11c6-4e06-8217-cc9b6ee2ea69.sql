
-- 1. Notifications: restrict INSERT (fixes SUPA_rls_policy_always_true + notifications_insert_any_user_id)
DROP POLICY IF EXISTS "auth insert notifications" ON public.notifications;
CREATE POLICY "auth insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = actor_id
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'cr'::app_role)
  );

-- 2. Profiles: restrict SELECT to authenticated (removes public phone exposure)
DROP POLICY IF EXISTS "profiles public read" ON public.profiles;
CREATE POLICY "profiles auth read"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- 3. Storage uploads: restrict path to uploader's user id (or admin/CR)
DROP POLICY IF EXISTS "auth upload" ON storage.objects;
CREATE POLICY "auth upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = ANY (ARRAY['uploads'::text, 'avatars'::text])
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'cr'::app_role)
    )
  );
