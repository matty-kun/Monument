export const dynamic = "force-dynamic";

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { isDashboardAccessRole } from '@/utils/supabase/authorizationPolicy';

import AdminSidebar from '@/components/AdminSidebar';
import AdminTournamentProvider from '@/components/AdminTournamentProvider';

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
  
  // 2. Check if the logged-in user has a valid admin/scorer role.
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profiles || !isDashboardAccessRole(profiles.role)) {
    redirect('/not-authorized');
  }

  return (
    <div className="admin-layout flex min-h-screen flex-col bg-[#f4f6f5] text-[#171a18] selection:bg-monument-primary/20 dark:bg-[#0b0b0c] dark:text-[#f1f3f2] md:h-screen md:flex-row md:overflow-hidden">
      <AdminTournamentProvider>
        <AdminSidebar />
        <main className="relative min-w-0 flex-1 px-4 pb-8 pt-20 sm:px-6 md:overflow-y-auto md:px-8 md:py-7 lg:px-10">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </AdminTournamentProvider>
    </div>
  );
}
