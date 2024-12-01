'use client'
import { Product } from "../components/product";
import { use, useEffect, useState } from "react";


const objMockup = {
  "app_sale_price": "69.95",
  "original_price": "101.97",
  "product_detail_url": "https://www.aliexpress.com/item/1005007437454071.html?pdp_npi=4%40dis%21BRL%21650.27%21446.07%21%21%21101.97%2169.95%21%40212a72c717330793742198500d1114%2112000040752696068%21affd%21%21%21",
  "product_small_image_urls": {
      "string": [
          "https://ae-pic-a1.aliexpress-media.com/kf/S073bd413d6d84260a9fe30192aa0b98fw.jpg",
          "https://ae-pic-a1.aliexpress-media.com/kf/S1389c319b787443daf02c4d14550bdd7N.jpg",
          "https://ae-pic-a1.aliexpress-media.com/kf/S04cffb3321e84701a18ce14be200b585j.jpg",
          "https://ae-pic-a1.aliexpress-media.com/kf/S54d84659e508429b95fee9c82acab524O.jpg",
          "https://ae-pic-a1.aliexpress-media.com/kf/S7d3f059f6423420fa286a2e229564d18c.jpg",
          "https://ae-pic-a1.aliexpress-media.com/kf/S7ff5812fa09e4598bc1161658604fe55b.jpg"
      ]
  },
  "second_level_category_name": "Portable Audio & Video",
  "target_sale_price": "446.07",
  "second_level_category_id": 100000306,
  "discount": "31%",
  "product_main_image_url": "https://ae-pic-a1.aliexpress-media.com/kf/S073bd413d6d84260a9fe30192aa0b98fw.jpg",
  "first_level_category_id": 44,
  "target_sale_price_currency": "BRL",
  "target_app_sale_price_currency": "BRL",
  "tax_rate": "0.00",
  "original_price_currency": "USD",
  "shop_url": "https://www.aliexpress.com/store/900247438",
  "target_original_price_currency": "BRL",
  "product_id": 1005007437454071,
  "target_original_price": "650.27",
  "product_video_url": "",
  "first_level_category_name": "Consumer Electronics",
  "ship_to_days": "Ship to BR in 3 days",
  "promotion_link": "https://s.click.aliexpress.com/s/fwx308cRD9Eny963e3KDdYxyIpNj8TXVr7saiF9Um5rMUg1kZtJALLnfa2LNXtiVgnxdD8Og6MmvwBoxhnSYQGM6r0c08U4TfX8DFGo7vviCuu3q62Q60OAhRZcqm3G8PtwM69xY7TOEWRrvulP5ukZQ4uQbBBtaVsdr6EffAqVmp3O5GyUANU2DoA3dJufNhDfh7KOlLgKIvRVhDxRESHLmea6fTE26gLUqKEUuuizJiLENrCbax94DZHDu8WhaXM9vQ86gzlqceNPO5w3vwXm4VrBF3x2lAMEl06wgNdTSMiT7cNG4HIdW0Jxgp1c7kwCjzzRh16m96PISQi9sCJU9sqUj4ahlEkiSnokHC8EEhFaB4ROJJk8LPmVbH9u8UbR1w28n9lLKu0uspu0b709JtidSFctVxIH21ruxKkr2iId9QJcBPhWZqpfQFKMBHhzQ0M7qcTD4x3xhVP8B4Q4zXP4DmdvFDpArgNeeRPDhgVB0qLJxzl4Cc9Ntl8gopIk8aGFIqCi79OCTPG0m3aIlPuE45ot0cRmFvBRnbBhGhWN3J3sPn8eoQmn6WZ5Xe1pCVomJmZn2MyuNwAKFV8c7T6j5MiQTEc9hdIEOJmJaEwHYGtLtL2VLLmMY7BGmfJCSDRYA46r7URP78VQhq3huuAxgKb7k8SPhtBO4WZy5guyLi8u4uMEsbEmBfUCsPGgeCfeHF92GiPg5HBV0nHzaGBeI7Whdp90mAVLUbc49QOXLpR9eELCtGNLnNMBpA1myKG9DNYGHwlTb34gCkiNgqTd06zaWXcmpvWTndugw3SxTwN4TqdblmMroNU4rEREQ3sqVh5WzziELDjljcQV6cqFFsi4iyehk8FtiEmc0ecUWEmsIlp2TDGbKt3WfmGciwV8XoCa91zbdbuaOH0XpaTdkb2ISjRZqjmLtLZJBX4o1W6JO3upSNQm0Qp0B7tG8Si80cAmgNoz4d5",
  "sku_id": 12000040752696068,
  "evaluate_rate": "99.3%",
  "sale_price": "69.95",
  "product_title": "SHANLING M0S Hi-Res Audio Music Player MP3 CS43131 USB DAC AMP Two-Way Bluetooth 5.0 LDAC/aptX/AAC/SBC PCM384 DSD128",
  "hot_product_commission_rate": "0.0%",
  "shop_id": 900247438,
  "app_sale_price_currency": "USD",
  "sale_price_currency": "USD",
  "lastest_volume": 224,
  "target_app_sale_price": "446.07",
  "commission_rate": "7.0%"
}
export default function Home() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    fetch("https://api-sg.aliexpress.com/sync?min_sale_price=15&keywords=mp3&target_currency=BRL&target_language=pt_BR&delivery_days=3&page_no=1&sort=SALE_PRICE_ASC&ship_to_country=BR&platform_product_type=ALL&max_sale_price=100&category_ids=111%2C222%2C333&fields=commission_rate%2Csale_price&page_size=50&method=aliexpress.affiliate.product.query&app_key=511416&sign_method=sha256&timestamp=1733077281997&sign=01A478BF4DA0DD54FDA85F0FF31B4B83B1B1BE4484403BEBB007C49512F18F32").then(async (res) => {
      const response = res;
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
  
      const json =  await response.json();
      const { product } = json.aliexpress_affiliate_product_query_response.resp_result.result.products;
  
      console.log(product);
      setProducts(product);
    }) ;
  })
  
  return (
    <div className="p-4">
      <h1>Home</h1>
      <div className="grid grid-cols-4 gap-3 mt-3">
       
  
      </div>
      <ul className="grid grid-cols-4 gap-3 mt-3">
        {products.map((product) => (
          <li>
            <Product product={product}  />
          </li>
        ))}
      </ul>
    </div>
  );
}
