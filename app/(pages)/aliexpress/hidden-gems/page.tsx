"use client";
import CuratedPage from "@/components/intelligence/CuratedPage";

const transformHiddenGems = (items: any[]) => {
  return items.filter((p) => {
    const sat = p.signals?.saturationRisk ?? p.signals?.saturation_risk ?? 0;
    const uniq = p.signals?.uniqueness ?? p.signals?.uniqueness ?? 0;
    return (sat <= 3 && (uniq >= 6 || p.score >= 70));
  });
};

export default function Page() {
  return (
    <CuratedPage
      apiUrl={'/api/aliexpress?type=products&ranked=true&page_no=1'}
      title={'Hidden Gems'}
      subtitle={'Low-saturation, high-quality products worth discovering'}
      transform={transformHiddenGems}
    />
  );
}
