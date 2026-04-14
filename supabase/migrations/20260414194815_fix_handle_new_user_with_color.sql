/*
  # Fix handle_new_user trigger to include color and graceful fallback

  - Updates the profile creation trigger to assign a random default color
  - Uses COALESCE to handle missing name metadata
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  colors text[] := ARRAY['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16'];
  random_color text;
BEGIN
  random_color := colors[floor(random() * array_length(colors, 1) + 1)];
  INSERT INTO public.profiles (id, name, email, color)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    random_color
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
