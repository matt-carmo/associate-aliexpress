import { NextResponse } from "next/server";
import {
  generateAffiliateLink,
  getFeaturedPromos,
  getFeaturedProducts,
  getHotProducts,
  getProducts,
  getProductsInfo,
} from "@/lib/services";

// Helper: parse pages param like "1-5" or "1,2,3"
const parsePagesParam = (val: string | null): number[] => {
  if (!val) return [];
  if (val.includes("-")) {
    const [s, e] = val.split("-").map((x) => parseInt(x, 10));
    if (isNaN(s) || isNaN(e) || e < s) return [];
    const out: number[] = [];
    for (let p = s; p <= e; p++) out.push(p);
    return out;
  }
  return val
    .split(",")
    .map((x) => parseInt(x, 10))
    .filter((n) => !isNaN(n));
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  if (!process.env.ALIEXPRESS_APP_KEY || !process.env.ALIEXPRESS_APP_SECRET) {
    return NextResponse.json(
      { error: "Missing AliExpress credentials. Set ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET." },
      { status: 503 }
    );
  }

  try {
    if (type === "products") {
      const pagesParam = searchParams.get("pages");
      const pages = parsePagesParam(pagesParam);

      if (pages.length > 0) {
        // Cap pages to avoid runaway requests
        const cap = Math.min(100, pages.length);
        const pagesToFetch = pages.slice(0, cap);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let aggregated: any[] = [];

        for (const pno of pagesToFetch) {
          const raw = await getProducts({
            category_ids: searchParams.get("category_ids") || "",
            keywords: searchParams.get("keywords") || "",
            page_no: Number(pno),
            sort: searchParams.get("sort") || "",
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const arr = Array.isArray(raw) ? raw : raw?.product ?? raw?.products ?? [];
          aggregated = aggregated.concat(arr);
        }

        return NextResponse.json(aggregated);
      }

      const products = await getProducts({
        category_ids: searchParams.get("category_ids") || "",
        keywords: searchParams.get("keywords") || "",
        page_no: Number(searchParams.get("page_no") || "1"),
        sort: searchParams.get("sort") || "",
      });

      return NextResponse.json(products);
    }

    if (type === "hot-products") {
      const pagesParam = searchParams.get("pages");
      const pages = parsePagesParam(pagesParam);

      if (pages.length > 0) {
        const cap = Math.min(100, pages.length);
        const pagesToFetch = pages.slice(0, cap);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let aggregated: any[] = [];

        for (const pno of pagesToFetch) {
          const raw = await getHotProducts({
            category_ids: searchParams.get("category_ids") || "",
            keywords: searchParams.get("keywords") || "",
            page_no: Number(pno),
            sort: searchParams.get("sort") || "",
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const arr = Array.isArray(raw) ? raw : raw?.product ?? raw?.products ?? [];
          aggregated = aggregated.concat(arr);
        }

        return NextResponse.json(aggregated);
      }

      const products = await getHotProducts({
        category_ids: searchParams.get("category_ids") || "",
        keywords: searchParams.get("keywords") || "",
        page_no: Number(searchParams.get("page_no") || "1"),
        sort: searchParams.get("sort") || "",
      });

      return NextResponse.json(products);
    }

    if (type === "featured-products") {
      const pagesParam = searchParams.get("pages");
      const pages = parsePagesParam(pagesParam);

      if (pages.length > 0) {
        const cap = Math.min(100, pages.length);
        const pagesToFetch = pages.slice(0, cap);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let aggregated: any[] = [];

        for (const pno of pagesToFetch) {
          const raw = await getFeaturedProducts({
            category_id: searchParams.get("category_id") || "",
            promotion_name: searchParams.get("promotion_name") || "",
            page_no: Number(pno),
            sort: searchParams.get("sort") || "",
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const arr = Array.isArray(raw) ? raw : raw?.product ?? raw?.products ?? [];
          aggregated = aggregated.concat(arr);
        }

        return NextResponse.json(aggregated);
      }

      const products = await getFeaturedProducts({
        category_id: searchParams.get("category_id") || "",
        promotion_name: searchParams.get("promotion_name") || "",
        page_no: Number(searchParams.get("page_no") || "1"),
        sort: searchParams.get("sort") || "",
      });

      return NextResponse.json(products);
    }

    if (type === "featured-promos") {
      const promos = await getFeaturedPromos();
      return NextResponse.json(promos);
    }

    if (type === "affiliate-link") {
      const productDetailUrl = searchParams.get("product_detail_url") || "";

      if (!productDetailUrl) {
        return NextResponse.json({ error: "product_detail_url is required" }, { status: 400 });
      }

      const promotionLink = await generateAffiliateLink({ product_detail_url: productDetailUrl });
      return NextResponse.json({ promotionLink });
    }

    if (type === "product-details") {
      const productId = searchParams.get("product_id") || "";

      if (!productId) {
        return NextResponse.json({ error: "product_id is required" }, { status: 400 });
      }

      const products = await getProductsInfo({ product_ids: productId });
      const product = Array.isArray(products) ? products[0] : products;

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      return NextResponse.json({ product });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AliExpress request failed";
    console.error("AliExpress API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
