-- When schema is applied from scratch in the SQL Editor, postgres may own tables but
-- the Supabase REST service role sometimes lacks explicit privileges on new objects.
-- This prevents "permission denied for table …" while using SUPABASE_SERVICE_ROLE_KEY.
--
-- RLS stays on; service_role bypasses RLS.

GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Future tables/functions created under public (run again after DDL or replicate via defaults below)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
