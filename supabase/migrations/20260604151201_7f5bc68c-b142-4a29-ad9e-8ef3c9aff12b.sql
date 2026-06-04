ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
CREATE INDEX IF NOT EXISTS profiles_roll_idx ON public.profiles (roll);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles (status);