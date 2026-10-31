-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- Shows the profile photo (profiles.avatar_url) on a business's public page.
-- Run supabase/settings.sql (or its photo section) first so the avatar_url column and photo storage exist.
-- It is safe to run more than once, and it changes nothing else in the function.

do $$
declare
  def text;
  old_line constant text := '''phone'', b.public_phone,';
  new_line constant text := '''avatar_url'', (select p.avatar_url from public.profiles p where p.id = b.owner_id),'
                            || chr(10) || '    ''phone'', b.public_phone,';
begin
  -- Reads the function exactly as it is now, so its settings and permissions are kept.
  def := pg_get_functiondef('public.business_public(text)'::regprocedure);

  if position('''avatar_url''' in def) > 0 then
    raise notice 'business_public already returns avatar_url. Nothing to do.';
    return;
  end if;

  if position(old_line in def) = 0 then
    raise exception 'Could not find the phone line in business_public. Nothing was changed.';
  end if;

  execute replace(def, old_line, new_line);
end;
$$;
