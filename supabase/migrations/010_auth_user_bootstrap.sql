-- Migration 010: Auto-create profile row when a new auth.users row is inserted.
-- Ensures Google/email registration always has a profiles record once migrations are applied.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display TEXT;
  v_email TEXT;
BEGIN
  v_email := NEW.email;
  v_display := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    CASE WHEN v_email IS NOT NULL THEN split_part(v_email, '@', 1) ELSE NULL END,
    'Reader'
  );

  INSERT INTO public.profiles (id, display_name, role, email)
  VALUES (NEW.id, v_display, 'reader', v_email)
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();