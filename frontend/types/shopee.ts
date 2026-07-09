export interface ShopeeProductOffer {
    itemId: number;
    commissionRate: string;
    appExistRate: string;
    appNewRate: string;
    webExistRate: string;
    webNewRate: string;
    commission: string;
    price: string;
    sales: number;
    imageUrl: string;
    productName: string;
    shopName: string;
    productLink: string;
    offerLink: string;
    periodEndTime: number;
    periodStartTime: number;
    priceMin: string;
    priceMax: string;
    productCatIds: number[];
    ratingStar: string;
    priceDiscountRate: number;
    shopId: number;
    shopType: number[];
    sellerCommissionRate: string;
    shopeeCommissionRate: string;
}

export interface ShopeePageInfo {
    page: number;
    limit: number;
    hasNextPage: boolean;
    scrollId: string | null;
}

export interface ShopeeProductOfferResponse {
    data: {
        productOfferV2: {
            nodes: ShopeeProductOffer[];
            pageInfo: ShopeePageInfo;
        };
    };
    errors?: Array<{ message: string; extensions: { code: number } }>;
}

export interface ShopeeShortLinkInput {
    originUrl: string;
    subIds?: string[];
}

export interface ShopeeShortLinkResponse {
    data: {
        generateShortLink: {
            shortLink: string;
            longLink: string;
        };
    };
}

export interface ShopeeConversionReport {
    clickTime: number;
    purchaseTime: number;
    conversionId: number;
    totalCommission: string;
    netCommission: string;
    orders: Array<{
        orderId: string;
        orderStatus: string;
        items: Array<{
            itemId: number;
            itemName: string;
            itemPrice: string;
            qty: number;
            imageUrl: string;
            itemTotalCommission: string;
            shopId: number;
            shopName: string;
            completeTime: number;
            globalCategoryLv1Name: string;
            globalCategoryLv2Name: string;
            globalCategoryLv3Name: string;
            fraudStatus: string;
        }>;
    }>;
}

export interface ShopeePdpData {
  itemId: number;
  shopId: number;
  title: string;
  currency: string;
  price: number;
  priceMax?: number;
  priceBeforeDiscount: number;
  priceBeforeDiscountMax?: number;
  discountPercent: number;
  discounts: Array<{
    type: number;
    amount: number;
    source: string;
  }>;
  hasStock: boolean;
  installmentMonths?: number;
  installmentMonthly?: number;
  ratingStar?: number;
  sourceUrl: string;
  capturedAt: number;
}

export interface ShopeeConversionReportResponse {
    data: {
        conversionReport: {
            nodes: ShopeeConversionReport[];
            pageInfo: ShopeePageInfo;
        };
    };
}
