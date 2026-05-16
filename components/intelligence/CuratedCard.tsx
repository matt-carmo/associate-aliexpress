import Image from "next/image";
import React from "react";
import { ScoreBadge } from "./ScoreBadge";
import { RankingReasons } from "./RankingReasons";
import { TelegramState } from "./TelegramState";
import { ViralIndicator } from "./ViralIndicator";

export const CuratedCard = ({ product }: { product: any }) => {
  const title = product.title || product.product_title || "Untitled";
  const image = product.imageUrl || product.product_main_image_url || product.productImage || "";

  const rating = product.rating ?? product.evaluate_rate ?? null;
  const sales = product.salesVolume ?? product.lastest_volume ?? null;
  const commission = product.commissionRate ?? product.commission_rate ?? product.commissionRateString ?? null;
  const discount = product.discountPercent ?? product.discount_percent ?? null;
  const shipping = product.shippingDays ?? product.ship_to_days ?? null;

  return (
    <li className="border rounded p-3 bg-white">
      <div className="flex gap-3">
        <div className="w-28 h-28 flex-shrink-0">
          {image ? (
            <Image src={image} alt={title} width={200} height={200} className="object-contain" />
          ) : (
            <div className="w-full h-full bg-gray-100" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-sm font-semibold line-clamp-2">{title}</h3>
            <ScoreBadge score={product.score} />
          </div>

          <div className="mt-1 text-xs text-gray-600 flex gap-2">
            <span>⭐ {rating ?? '—'}</span>
            <span>📊 {sales ?? '—'}</span>
            <span>💰 {commission ?? '—'}</span>
            <span>🏷️ {discount ? `${discount}%` : '—'}</span>
            <span>🚚 {shipping ?? '—'}d</span>
          </div>

          <div className="mt-2">
            <RankingReasons reasons={product.reasons} />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <TelegramState score={product.score} />
            <ViralIndicator signals={product.signals} />
            <a className="ml-auto text-xs text-blue-600" href={product.detailUrl || product.product_detail_url || '#'} target="_blank" rel="noreferrer">Open on AliExpress</a>
          </div>
        </div>
      </div>
    </li>
  );
};

export default CuratedCard;
