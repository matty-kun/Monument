import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // 1. Check if a user is logged in.
  if (!user) {
    redirect('/'); // Update to point to new login location
  }
  
  // 2. Check if the logged-in user has 'admin' or 'super_admin' role.
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Allow both 'admin' and 'super_admin' roles
  if (error || !profiles || (profiles.role !== 'admin' && profiles.role !== 'super_admin')) {
    redirect('/not-authorized');
  }

  return <>{children}</>;
}