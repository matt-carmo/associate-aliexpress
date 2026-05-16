import CuratedPage from "@/components/intelligence/CuratedPage";

export default function Page() {
  return (
    <CuratedPage
      apiUrl={'/api/aliexpress?type=hot-products&ranked=true&page_no=1'}
      title={'Trending Tech'}
      subtitle={'High-sales products with strong engagement signals'}
    />
  );
}
