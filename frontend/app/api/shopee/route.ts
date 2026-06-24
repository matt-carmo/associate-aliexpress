import { NextResponse } from "next/server";
import { getProductOffers, getProductOffersAllPages, generateShortLink } from "@/lib/shopeeServices";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!process.env.SHOPEE_APP_ID || !process.env.SHOPEE_APP_SECRET) {
        return NextResponse.json(
            { error: "Missing Shopee credentials. Set SHOPEE_APP_ID and SHOPEE_APP_SECRET." },
            { status: 503 }
        );
    }

    try {
        if (type === "products") {
            const products = await getProductOffersAllPages({
                keyword: searchParams.get("keyword") || undefined,
                sortType: Number(searchParams.get("sort") || "2"),
                limit: Number(searchParams.get("limit") || "20"),
                maxPages: Math.min(Number(searchParams.get("pages") || "10"), 20),
            });
            return NextResponse.json(products);
        }

        if (type === "short-link") {
            const originUrl = searchParams.get("origin_url") || "";
            if (!originUrl) {
                return NextResponse.json({ error: "origin_url is required" }, { status: 400 });
            }
            const subIds = searchParams.get("sub_ids")?.split(",") || undefined;
            const shortLink = await generateShortLink({ originUrl, subIds });
            return NextResponse.json({ shortLink });
        }

        if (type === "product-details") {
            const itemId = searchParams.get("item_id") || "";
            if (!itemId) {
                return NextResponse.json({ error: "item_id is required" }, { status: 400 });
            }
            const result = await getProductOffers({
                itemId: Number(itemId),
                limit: 1,
            });
            const product = result.data?.productOfferV2?.nodes?.[0] || null;
            if (!product) {
                return NextResponse.json({ error: "Product not found" }, { status: 404 });
            }
            return NextResponse.json({ product });
        }

        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Shopee request failed";
        console.error("Shopee API error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
