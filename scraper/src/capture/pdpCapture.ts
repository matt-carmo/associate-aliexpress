import type { Page } from "playwright";
import type { CapturedPdp } from "../types.js";
import { Console } from "node:console";

const PDP_ENDPOINT = "/api/v4/pdp/get_pc";


function extractShopeeInfo(url: string) {
  // Formato 1: -i.{shopId}.{itemId}
  let match = url.match(/-i\.(\d+)\.(\d+)/);
  
  // Formato 2: /product/{shopId}/{itemId}
  if (!match) {
    match = url.match(/\/product\/(\d+)\/(\d+)/);
  }

  if (!match) {
    throw new Error("URL inválida");
  }

  const shopId = match[1];
  const itemId = match[2];

  const params = new URL(url).searchParams;

  let displayModelId: string | null = null;

  const extraParams = params.get("extraParams");
  if (extraParams) {
    try {
      const json = JSON.parse(decodeURIComponent(extraParams));
      displayModelId = json.display_model_id?.toString() ?? null;
    } catch { }
  }

  return {
    shopId,
    itemId,
    displayModelId,
  };
}


export async function capturePdp(
  page: Page,
  url: string,
  timeoutMs: number,
): Promise<CapturedPdp> {

  const { itemId, shopId } = extractShopeeInfo(url)

  const data = await page.evaluate(
    async ({ itemId, shopId }) => {
      const response = await fetch(
        `/api/v4/pdp/get_pc?item_id=${itemId}&shop_id=${shopId}&tz_offset_in_minutes=-180&detail_level=0&incoming_pdp_page_source=0&incoming_pdp_page_scenario=0`
      );

      return response.json();
    },
    { itemId, shopId }
  ).catch((err) => {
    console.error(`Error during PDP capture for itemId ${itemId} and shopId ${shopId}:`, err);
    throw new Error("PDP capture failed");
  });
  return data
}
