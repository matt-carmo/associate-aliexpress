"use client";
import CuratedPage from "@/components/intelligence/CuratedPage";

const transformAudio = (items: any[]) => items.filter(p => {
  const name = (p.categoryName || p.category_name || "").toString().toLowerCase();
  return name.includes('audio') || name.includes('headphone') || name.includes('speaker') || (p.title || p.product_title || '').toLowerCase().includes('audio') || (p.title || p.product_title || '').toLowerCase().includes('headphone');
});

export default function Page() {
  return (
    <CuratedPage
      apiUrl={'/api/aliexpress?type=products&ranked=true&page_no=1'}
      title={'Audio'}
      subtitle={'Headphones, earbuds, and audio gear curated for Telegram'}
      transform={transformAudio}
    />
  );
}
