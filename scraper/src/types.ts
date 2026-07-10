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
  imageUrl?: string;
  sourceUrl: string;
  capturedAt: number;
}

export interface PdpRequest {
  url: string;
  timeoutMs?: number;
}

export interface PdpSuccessResponse {
  ok: true;
  data: ShopeePdpData;
  capturedAt: number;
  durationMs: number;
}

export interface PdpErrorResponse {
  ok: false;
  error: string;
  message: string;
}

export type PdpResponse = PdpSuccessResponse | PdpErrorResponse;

export interface HealthResponse {
  status: string;
  chrome: string;
  queueDepth: number;
  uptime: number;
}

export interface CapturedPdp {
  requestUrl: string;
  data: {item: ShopeePdpData};
  error_msg?: string;
  error: string | null
}
