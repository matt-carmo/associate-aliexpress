import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const contexts = browser.contexts();
  const page = await contexts[0].newPage();
  
  const itemId = '22093160276';
  const shopId = '1180920205';
  
  const data = await page.evaluate(
    async ({ itemId, shopId }) => {
      const response = await fetch(
        `/api/v4/pdp/get_pc?item_id=${itemId}&shop_id=${shopId}&tz_offset_in_minutes=-180&detail_level=0&incoming_pdp_page_source=0&incoming_pdp_page_scenario=0`
      );
      return response.json();
    },
    { itemId, shopId }
  );
  
  console.log(JSON.stringify(data, null, 2));
  
  await page.close();
}

test().catch(console.error);
