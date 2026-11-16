import { requireMember } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';
export const dynamic = 'force-dynamic';
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireMember();
  return <AppShell name={profile.display_name}>{children}</AppShell>;
}
