"use client";
import CuratedPage from "@/components/intelligence/CuratedPage";

const transformBestDiscounts = (items: any[]) => items.sort((a,b) => (b.discountPercent ?? b.discount_percent ?? 0) - (a.discountPercent ?? a.discount_percent ?? 0));

export default function Page() {
  return (
    <CuratedPage
      apiUrl={'/api/aliexpress?type=products&ranked=true&page_no=1'}
      title={'Best Discounts'}
      subtitle={'Strongest real discounts detected'}
      transform={transformBestDiscounts}
    />
  );
}
