import { AppHeader } from "@/components/layout/app-header";
import { requireAuthContext } from "@/features/auth/get-auth-context";
import { FinancialDashboard } from "@/features/finances/financial-dashboard";
import { getFinancialDashboardData } from "@/features/finances/get-financial-dashboard-data";

type FinancePageProps = {
  searchParams: Promise<{ mes?: string }>;
};

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const [{ mes }, context] = await Promise.all([searchParams, requireAuthContext()]);
  const data = await getFinancialDashboardData(mes);

  return (
    <div>
      <AppHeader
        professional={context.professional}
        title="Dashboard financeiro"
        subtitle="Ganhos, gastos e resultado da rocheclinic em um só lugar."
      />
      <FinancialDashboard data={data} professionalSlug={context.professional.slug} />
    </div>
  );
}
