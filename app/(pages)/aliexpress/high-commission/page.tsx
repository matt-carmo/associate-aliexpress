"use client";
import CuratedPage from "@/components/intelligence/CuratedPage";

const transformHighCommission = (items: any[]) => {
  return items
    .filter((p) => {
      const c = p.commissionRate ?? p.commission_rate ?? 0;
      return Number(c) >= 8;
    })
    .sort((a, b) => (b.commissionRate ?? b.commission_rate ?? 0) - (a.commissionRate ?? a.commission_rate ?? 0));
};

export default function Page() {
  return (
    <CuratedPage
      apiUrl={'/api/aliexpress?type=products&ranked=true&page_no=1'}
      title={'High Commission'}
      subtitle={'Highest affiliate commission opportunities (>= 8%)'}
      transform={transformHighCommission}
    />
  );
}
