import CuratedPage from "@/components/intelligence/CuratedPage";

export default function Page() {
  return (
    <CuratedPage
      apiUrl={'/api/aliexpress?type=products&ranked=true&strict=true&page_no=1'}
      title={'Telegram Ready — Strict Gate'}
      subtitle={'Products that pass strict Telegram quality gates (ready to post)'}
    />
  );
}
