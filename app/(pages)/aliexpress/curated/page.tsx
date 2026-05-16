import CuratedPage from "@/components/intelligence/CuratedPage";

export default function Page() {
  return (
    <CuratedPage
      apiUrl={'/api/aliexpress?type=products&ranked=true&page_no=1'}
      title={'Curated — Best Overall'}
      subtitle={'Top-ranked products across categories (daily curated feed)'}
    />
  );
}
