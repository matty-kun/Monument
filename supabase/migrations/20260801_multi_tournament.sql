-- Migration: Multi-Tournament (Archive) Support
-- Creates tournaments, tournament_departments, and adds tournament_id to events, results, and schedules.

-- 1. Create Tournaments Table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  is_active boolean DEFAULT false,
  mystery_mode boolean DEFAULT false,
  start_date date,
  end_date date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Tournament Departments (Team Snapshots) Table
CREATE TABLE IF NOT EXISTS public.tournament_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  abbreviation text,
  image_url text,
  mascot_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(tournament_id, department_id)
);

-- 3. Data Migration (Create CITE FEST 2026 and link existing data)
DO $$
DECLARE
  v_tournament_id uuid;
BEGIN
  -- Insert default tournament
  INSERT INTO public.tournaments (name, slug, is_active, mystery_mode) 
  VALUES ('CITE FEST 2026', 'cite-fest-2026', true, false) 
  RETURNING id INTO v_tournament_id;

  -- Create snapshots of existing departments for this tournament
  INSERT INTO public.tournament_departments (tournament_id, department_id, name, abbreviation, image_url, mascot_url)
  SELECT v_tournament_id, id, name, abbreviation, image_url, mascot_url FROM public.departments;

  -- Add tournament_id to events
  ALTER TABLE public.events ADD COLUMN tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE;
  UPDATE public.events SET tournament_id = v_tournament_id;
  ALTER TABLE public.events ALTER COLUMN tournament_id SET NOT NULL;

  -- Add tournament_id to results
  ALTER TABLE public.results ADD COLUMN tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE;
  UPDATE public.results SET tournament_id = v_tournament_id;
  ALTER TABLE public.results ALTER COLUMN tournament_id SET NOT NULL;

  -- Add tournament_id to schedules
  ALTER TABLE public.schedules ADD COLUMN tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE;
  UPDATE public.schedules SET tournament_id = v_tournament_id;
  ALTER TABLE public.schedules ALTER COLUMN tournament_id SET NOT NULL;
END $$;

-- 4. Update Leaderboard RPC Functions

-- New function that takes a specific tournament ID
CREATE OR REPLACE FUNCTION public.get_leaderboard_by_tournament(p_tournament_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  golds bigint,
  silvers bigint,
  bronzes bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.department_id as id,
    d.name,
    COUNT(r.id) FILTER (WHERE r.medal_type = 'gold') as golds,
    COUNT(r.id) FILTER (WHERE r.medal_type = 'silver') as silvers,
    COUNT(r.id) FILTER (WHERE r.medal_type = 'bronze') as bronzes
  FROM 
    public.tournament_departments d
  LEFT JOIN 
    public.results r ON d.department_id = r.department_id AND r.tournament_id = p_tournament_id
  WHERE 
    d.tournament_id = p_tournament_id
  GROUP BY 
    d.department_id, d.name
  ORDER BY 
    golds DESC, silvers DESC, bronzes DESC;
END;
$$ LANGUAGE plpgsql;

-- Overwrite existing function to default to the active tournament so the live site doesn't break
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  id uuid,
  name text,
  golds bigint,
  silvers bigint,
  bronzes bigint
) AS $$
DECLARE
  v_active_tournament uuid;
BEGIN
  SELECT t.id INTO v_active_tournament FROM public.tournaments t WHERE is_active = true LIMIT 1;
  
  RETURN QUERY SELECT * FROM public.get_leaderboard_by_tournament(v_active_tournament);
END;
$$ LANGUAGE plpgsql;

-- 5. Enable RLS on new tables (if needed) and add simple public read policies
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Public can read tournament_departments" ON public.tournament_departments FOR SELECT USING (true);

-- Admins can do everything (Supabase Service Role handles the rest on the backend via server actions)
