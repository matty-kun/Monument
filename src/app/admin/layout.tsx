import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/utils/supabase/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Check if a user is logged in.
  if (!user) {
    redirect('/login'); // Updated redirect path
  }
  
  // 2. Check if the logged-in user has the 'admin' role.
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // If there was an error, the profile doesn't exist, or the role is not 'admin',
  // redirect them to the homepage.
  if (error || !profile || profile.role !== 'admin') {
    redirect('/');
  }

  return <>{children}</>;
}