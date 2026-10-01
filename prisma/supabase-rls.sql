-- PMI Uganda Clubs · Supabase hardening
-- The app talks to Postgres only through Prisma on the server (as the `postgres` role, which bypasses RLS).
-- Supabase also exposes the public schema through its auto-generated REST/GraphQL API to the `anon` and
-- `authenticated` roles. Enabling RLS with NO policies denies that API all access to these tables.
-- Safe to re-run; run again after adding new tables (npm run db:rls).
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t.tablename);
  END LOOP;
END $$;
