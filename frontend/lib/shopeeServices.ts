import axios from "axios";
import { createShopeeAuthHeaders } from "@/lib/utils/shopeeSignRequest";
import { SHOPEE_GRAPHQL_URL } from "@/lib/utils/shopeeConfig";
import type { ShopeeProductOfferResponse, ShopeeShortLinkResponse, ShopeeConversionReportResponse, ShopeePageInfo } from "@/types/shopee";

const shopeeRequest = async <T>(query: string, variables?: Record<string, unknown>): Promise<T> => {
    const payload = JSON.stringify({ query, variables });
    const headers = createShopeeAuthHeaders(payload);
    const response = await axios.post(SHOPEE_GRAPHQL_URL, { query, variables }, { headers });
    if (response.data?.errors?.length) {
        const error = response.data.errors[0];
        throw new Error(`Shopee API error [${error.extensions?.code}]: ${error.message}`);
    }
    return response.data as T;
};

const fetchAllPages = async <T>(
    queryFn: (scrollId?: string) => Promise<{ nodes: T[]; pageInfo: ShopeePageInfo }>,
    maxPages = 20
): Promise<T[]> => {
    const allNodes: T[] = [];
    let scrollId: string | null = null;
    let pageCount = 0;

    while (pageCount < maxPages) {
        const result = await queryFn(scrollId ?? undefined);
        allNodes.push(...result.nodes);
        pageCount++;
        if (!result.pageInfo.hasNextPage || !result.pageInfo.scrollId) break;
        scrollId = result.pageInfo.scrollId;
    }
    return allNodes;
};

export const getProductOffers = async (params: {
    keyword?: string;
    sortType?: number;
    page?: number;
    limit?: number;
    productCatId?: number;
    itemId?: number;
    listType?: number;
    matchId?: number;
}): Promise<ShopeeProductOfferResponse> => {
    const args = Object.entries({
        ...(params.keyword ? { keyword: `"${params.keyword}"` } : {}),
        ...(params.sortType != null ? { sortType: params.sortType } : { sortType: 1 }),
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        ...(params.productCatId != null ? { productCatId: params.productCatId } : {}),
        ...(params.itemId != null ? { itemId: params.itemId } : {}),
        ...(params.listType != null ? { listType: params.listType } : {}),
        ...(params.matchId != null ? { matchId: params.matchId } : {}),
    }).map(([k, v]) => `${k}: ${v}`).join(", ");

    const query = `{
        productOfferV2(${args}) {
            nodes {
                itemId commissionRate appExistRate appNewRate webExistRate webNewRate
                commission price sales imageUrl productName shopName productLink offerLink
                periodEndTime periodStartTime priceMin priceMax productCatIds ratingStar
                priceDiscountRate shopId shopType sellerCommissionRate shopeeCommissionRate
            }
            pageInfo { page limit hasNextPage scrollId }
        }
    }`;
    return shopeeRequest<ShopeeProductOfferResponse>(query);
};

export const getProductOffersAllPages = async (params: {
    keyword?: string;
    sortType?: number;
    limit?: number;
    maxPages?: number;
}): Promise<ShopeeProductOfferResponse['data']['productOfferV2']['nodes']> => {
    return fetchAllPages(
        async (scrollId) => {
            const args = Object.entries({
                ...(params.keyword ? { keyword: `"${params.keyword}"` } : {}),
                sortType: params.sortType ?? 2,
                limit: params.limit ?? 20,
                ...(scrollId ? { page: 2 } : { page: 1 }),
            }).map(([k, v]) => `${k}: ${v}`).join(", ");

            const scrollArg = scrollId ? `, scrollId: "${scrollId}"` : "";
            const query = `{
                productOfferV2(${args}${scrollArg}) {
                    nodes {
                        itemId commissionRate price sales imageUrl productName shopName productLink offerLink
                        periodEndTime periodStartTime priceMin priceMax productCatIds ratingStar
                        priceDiscountRate shopId shopType sellerCommissionRate shopeeCommissionRate
                    }
                    pageInfo { page limit hasNextPage scrollId }
                }
            }`;
            const result = await shopeeRequest<ShopeeProductOfferResponse>(query);
            return result.data.productOfferV2;
        },
        params.maxPages ?? 20
    );
};

export const generateShortLink = async (input: {
    originUrl: string;
    subIds?: string[];
}): Promise<string> => {
    const subIdsStr = input.subIds?.length
        ? `["${input.subIds.join('","')}"]`
        : "[]";

    const query = `mutation {
        generateShortLink(input: { originUrl: "${input.originUrl}", subIds: ${subIdsStr} }) {
            shortLink
            longLink
        }
    }`;
    const result = await shopeeRequest<ShopeeShortLinkResponse>(query);
    return result.data.generateShortLink.shortLink;
};

export const getConversionReport = async (params: {
    purchaseTimeStart?: number;
    purchaseTimeEnd?: number;
    completeTimeStart?: number;
    completeTimeEnd?: number;
    limit?: number;
    scrollId?: string;
    orderStatus?: string;
    buyerType?: string;
    device?: string;
    productType?: string;
}): Promise<ShopeeConversionReportResponse> => {
    const args = Object.entries({
        ...(params.purchaseTimeStart ? { purchaseTimeStart: params.purchaseTimeStart } : {}),
        ...(params.purchaseTimeEnd ? { purchaseTimeEnd: params.purchaseTimeEnd } : {}),
        ...(params.completeTimeStart ? { completeTimeStart: params.completeTimeStart } : {}),
        ...(params.completeTimeEnd ? { completeTimeEnd: params.completeTimeEnd } : {}),
        limit: params.limit ?? 20,
        orderStatus: params.orderStatus ?? "ALL",
        buyerType: params.buyerType ?? "ALL",
        device: params.device ?? "ALL",
        productType: params.productType ?? "ALL",
    }).map(([k, v]) => `${k}: ${typeof v === 'string' ? v : v}`).join(", ");

    const scrollArg = params.scrollId ? `, scrollId: "${params.scrollId}"` : "";

    const query = `{
        conversionReport(${args}${scrollArg}) {
            nodes {
                clickTime purchaseTime totalCommission netCommission
                orders {
                    orderId orderStatus
                    items {
                        itemId itemName itemPrice qty imageUrl itemTotalCommission
                        shopId shopName completeTime
                        globalCategoryLv1Name globalCategoryLv2Name globalCategoryLv3Name
                        fraudStatus
                    }
                }
            }
            pageInfo { page limit hasNextPage scrollId }
        }
    }`;
    return shopeeRequest<ShopeeConversionReportResponse>(query);
};
