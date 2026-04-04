export const dynamic = "force-dynamic";

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

import AdminSidebar from '@/components/AdminSidebar';

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

  return (
    <div className="flex flex-col md:flex-row md:h-screen md:overflow-hidden bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <div className="flex-1 min-w-0 px-4 sm:px-8 py-4 sm:py-8 md:overflow-y-auto custom-scrollbar flex flex-col relative">
        {children}
      </div>
    </div>
  );
}