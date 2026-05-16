"use client";
import CuratedPage from "@/components/intelligence/CuratedPage";

const transformSmartHome = (items: any[]) => items.filter(p => {
  const name = (p.categoryName || p.category_name || "").toString().toLowerCase();
  return name.includes('smart') || name.includes('home') || (p.title || p.product_title || '').toLowerCase().includes('smart');
});

export default function Page() {
  return (
    <CuratedPage
      apiUrl={'/api/aliexpress?type=products&ranked=true&page_no=1'}
      title={'Smart Home'}
      subtitle={'Smart home gadgets and automation deals'}
      transform={transformSmartHome}
    />
  );
}
