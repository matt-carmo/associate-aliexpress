import { NextResponse } from "next/server";
import {
  generateAffiliateLink,
  getFeaturedPromos,
  getFeaturedProducts,
  getHotProducts,
  getProducts,
  getProductsRanked,
  getProductsStrict,
  getHotProductsRanked,
  getHotProductsStrict,
  getFeaturedProductsRanked,
  getFeaturedProductsStrict,
} from "@/lib/services";
import { rankProductsQuick, rankProductsStrict } from "@/lib/intelligence/rankingPipeline";

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
  const ranked = searchParams.get("ranked") === "true"; // Query param to enable ranking
  const strict = searchParams.get("strict") === "true"; // optional strict mode -> use strict ranking

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
        let aggregated: any[] = [];

        for (const pno of pagesToFetch) {
          const raw = await getProducts({
            category_ids: searchParams.get("category_ids") || "",
            keywords: searchParams.get("keywords") || "",
            page_no: Number(pno),
            sort: searchParams.get("sort") || "",
          });
          const arr = Array.isArray(raw) ? raw : raw?.product ?? raw?.products ?? [];
          aggregated = aggregated.concat(arr);
        }

        const results = ranked ? (strict ? rankProductsStrict(aggregated, 200) : rankProductsQuick(aggregated, 200)) : aggregated;
        return NextResponse.json(results);
      }

      const products = ranked
        ? strict
          ? await getProductsStrict({
              category_ids: searchParams.get("category_ids") || "",
              keywords: searchParams.get("keywords") || "",
              page_no: Number(searchParams.get("page_no") || "1"),
              sort: searchParams.get("sort") || "",
            })
          : await getProductsRanked({
              category_ids: searchParams.get("category_ids") || "",
              keywords: searchParams.get("keywords") || "",
              page_no: Number(searchParams.get("page_no") || "1"),
              sort: searchParams.get("sort") || "",
            })
        : await getProducts({
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
        let aggregated: any[] = [];

        for (const pno of pagesToFetch) {
          const raw = await getHotProducts({
            category_ids: searchParams.get("category_ids") || "",
            keywords: searchParams.get("keywords") || "",
            page_no: Number(pno),
            sort: searchParams.get("sort") || "",
          });
          const arr = Array.isArray(raw) ? raw : raw?.product ?? raw?.products ?? [];
          aggregated = aggregated.concat(arr);
        }

        const results = ranked ? (strict ? rankProductsStrict(aggregated, 200) : rankProductsQuick(aggregated, 200)) : aggregated;
        return NextResponse.json(results);
      }

      const products = ranked
        ? strict
          ? await getHotProductsStrict({
              category_ids: searchParams.get("category_ids") || "",
              keywords: searchParams.get("keywords") || "",
              page_no: Number(searchParams.get("page_no") || "1"),
              sort: searchParams.get("sort") || "",
            })
          : await getHotProductsRanked({
              category_ids: searchParams.get("category_ids") || "",
              keywords: searchParams.get("keywords") || "",
              page_no: Number(searchParams.get("page_no") || "1"),
              sort: searchParams.get("sort") || "",
            })
        : await getHotProducts({
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
        let aggregated: any[] = [];

        for (const pno of pagesToFetch) {
          const raw = await getFeaturedProducts({
            category_id: searchParams.get("category_id") || "",
            keywords: searchParams.get("keywords") || "",
            promotion_name: searchParams.get("promotion_name") || "",
            page_no: Number(pno),
            sort: searchParams.get("sort") || "",
          });
          const arr = Array.isArray(raw) ? raw : raw?.product ?? raw?.products ?? [];
          aggregated = aggregated.concat(arr);
        }

        const results = ranked ? (strict ? rankProductsStrict(aggregated, 200) : rankProductsQuick(aggregated, 200)) : aggregated;
        return NextResponse.json(results);
      }

      const products = ranked
        ? strict
          ? await getFeaturedProductsStrict({
              category_id: searchParams.get("category_id") || "",
              keywords: searchParams.get("keywords") || "",
              promotion_name: searchParams.get("promotion_name") || "",
              page_no: Number(searchParams.get("page_no") || "1"),
              sort: searchParams.get("sort") || "",
            })
          : await getFeaturedProductsRanked({
              category_id: searchParams.get("category_id") || "",
              keywords: searchParams.get("keywords") || "",
              promotion_name: searchParams.get("promotion_name") || "",
              page_no: Number(searchParams.get("page_no") || "1"),
              sort: searchParams.get("sort") || "",
            })
        : await getFeaturedProducts({
            category_id: searchParams.get("category_id") || "",
            keywords: searchParams.get("keywords") || "",
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

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("AliExpress API error:", error);
    return NextResponse.json({ error: "AliExpress request failed" }, { status: 500 });
  }
}