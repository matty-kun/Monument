CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  abbreviation text,
  image_url text,
  mascot_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
