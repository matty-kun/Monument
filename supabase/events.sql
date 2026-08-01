CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text,
  category uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  gender text, -- e.g. "Men", "Women", "Mixed", "N/A"
  division text, -- e.g. "Individual", "Team", "Singles", "Doubles"
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
