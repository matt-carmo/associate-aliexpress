"use client";

import { Button } from "@/components/ui/button";
import type { DiscoveryProduct } from "@/lib/intelligence/marketplaceDiscovery";
import { buildMarketplaceBadges } from "@/lib/intelligence/telegramPublishing";
import { ArrowUpRight, BadgeCheck, Flame, PackageOpen, Sparkles, Star } from "lucide-react";
import { TelegramPublishDialog } from "./TelegramPublishDialog";

const toneStyles: Record<string, string> = {
  emerald: "border-emerald-500/30 bg-emerald-500/15 text-emerald-100",
  violet: "border-violet-500/30 bg-violet-500/15 text-violet-100",
  amber: "border-amber-500/30 bg-amber-500/15 text-amber-100",
  sky: "border-sky-500/30 bg-sky-500/15 text-sky-100",
  indigo: "border-indigo-500/30 bg-indigo-500/15 text-indigo-100",
  rose: "border-rose-500/30 bg-rose-500/15 text-rose-100",
  cyan: "border-cyan-500/30 bg-cyan-500/15 text-cyan-100",
  lime: "border-lime-500/30 bg-lime-500/15 text-lime-100",
};

const formatMoney = (value?: number): string => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return `$${value.toFixed(2)}`;
};

const formatCount = (value?: number): string => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return value.toLocaleString();
};

const metricPill = (label: string, value: string, icon: React.ReactNode) => (
  <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80 backdrop-blur">
    {icon}
    <span>{label}</span>
    <span className="font-semibold text-white">{value}</span>
  </div>
);

export const MarketplaceCard = ({ product }: { product: DiscoveryProduct }): JSX.Element => {
  const marketplaceBadges = product.marketplaceBadges ?? buildMarketplaceBadges(product);
  const score = typeof product.score === "number" ? product.score : 0;
  const candidateScore = typeof product.candidateScore === "number" ? product.candidateScore : 0;
  const price = formatMoney(product.price);
  const originalPrice = formatMoney(product.originalPrice);
  const discount = typeof product.discountPercent === "number" ? `${product.discountPercent.toFixed(0)}%` : "—";
  const rating = typeof product.rating === "number" ? product.rating.toFixed(1) : "—";
  const sales = formatCount(product.salesVolume);
  const commission = typeof product.commissionRate === "number" ? `${product.commissionRate.toFixed(1)}%` : "—";
  const category = product.categoryName || product.discoveryPoolName || "Tech discovery";
  const title = product.title || "Untitled product";
  const imageUrl = product.imageUrl || "";

  return (
    <article className="group overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/80 shadow-[0_12px_50px_rgba(15,23,42,0.35)] transition-transform duration-200 hover:-translate-y-1 hover:border-white/20">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No product image
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90">
            {product.discoverySourceLabel || "Marketplace"}
          </span>
          <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90">
            {category}
          </span>
        </div>

        <div className="absolute right-4 top-4 rounded-2xl border border-white/10 bg-black/45 px-3 py-2 text-right text-white backdrop-blur-md">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">Telegram Score</p>
          <p className="text-2xl font-semibold leading-none">{candidateScore}</p>
          <p className="text-[11px] text-white/60">AliExpress score {score}</p>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-50 backdrop-blur">
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" />
              <span>{rating}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-sky-400/20 bg-sky-500/15 px-3 py-2 text-xs text-sky-50 backdrop-blur">
            <div className="flex items-center gap-1.5">
              <PackageOpen className="h-3.5 w-3.5" />
              <span>{sales} sold</span>
            </div>
          </div>
          <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/15 px-3 py-2 text-xs text-fuchsia-50 backdrop-blur">
            <div className="flex items-center gap-1.5">
              <BadgeCheck className="h-3.5 w-3.5" />
              <span>{discount} off</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5 text-slate-100">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-white">{title}</h3>
          <p className="line-clamp-2 text-sm text-slate-300">
            {product.candidateReasons?.length
              ? product.candidateReasons.slice(0, 2).join(" • ")
              : "Visual-first tech discovery optimized for impulse clicks."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {marketplaceBadges.map((badge) => (
            <span
              key={badge.label}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneStyles[badge.tone] || "border-white/10 bg-white/5 text-white/80"}`}
              title={badge.detail}
            >
              {badge.label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Price</p>
            <p className="mt-1 text-lg font-semibold text-white">{price}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Original</p>
            <p className="mt-1 text-lg font-semibold text-white line-through decoration-white/20">{originalPrice}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Commission</p>
            <p className="mt-1 text-lg font-semibold text-white">{commission}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Rating</p>
            <p className="mt-1 text-lg font-semibold text-white">{rating}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {metricPill("Sales", sales, <Flame className="h-3.5 w-3.5 text-orange-300" />)}
          {metricPill("Score", String(score), <Sparkles className="h-3.5 w-3.5 text-cyan-300" />)}
          {metricPill("Telegram", String(candidateScore), <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" />)}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10">
            <a href={product.detailUrl || "#"} target="_blank" rel="noreferrer">
              Open product
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>
          <TelegramPublishDialog product={product} />
        </div>
      </div>
    </article>
  );
};

export default MarketplaceCard;
