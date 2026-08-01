CREATE TABLE public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL,
  date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  departments text[], -- Array of team names or IDs participating
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
