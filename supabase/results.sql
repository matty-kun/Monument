CREATE TABLE public.results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  medal_type text NOT NULL, -- e.g. 'gold', 'silver', 'bronze'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
