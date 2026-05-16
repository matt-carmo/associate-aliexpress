"use client";
import CuratedPage from "@/components/intelligence/CuratedPage";

const transformSetup = (items: any[]) => items.filter((p) => {
  const title = (p.title || p.product_title || "").toString().toLowerCase();
  const name = (p.categoryName || p.category_name || "").toString().toLowerCase();
  return (
    name.includes("computer") ||
    name.includes("setup") ||
    name.includes("peripheral") ||
    title.includes("keyboard") ||
    title.includes("mouse") ||
    title.includes("monitor") ||
    title.includes("desk") ||
    title.includes("stand")
  );
});

export default function Page() {
  return (
    <CuratedPage
      apiUrl={"/api/aliexpress?type=products&ranked=true&page_no=1"}
      title={"Setup & Peripherals"}
      subtitle={"Desk/PC setups, peripherals and productivity gear"}
      transform={transformSetup}
    />
  );
}
