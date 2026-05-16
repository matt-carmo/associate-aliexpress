"use client";
import CuratedPage from "@/components/intelligence/CuratedPage";

const transformGaming = (items: any[]) => items.filter(p => {
  const name = (p.categoryName || p.category_name || "").toString().toLowerCase();
  return name.includes('game') || name.includes('gaming') || (p.title || p.product_title || '').toLowerCase().includes('game');
});

export default function Page() {
  return (
    <CuratedPage
      apiUrl={'/api/aliexpress?type=products&ranked=true&page_no=1'}
      title={'Gaming Deals'}
      subtitle={'Curated gaming accessories and gadgets'}
      transform={transformGaming}
    />
  );
}
