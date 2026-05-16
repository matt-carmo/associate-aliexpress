"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { DISCOVERY_MODE_CONFIG, buildDiscoveryUrl, getDiscoverySourcesForMode, type DiscoveryMode, type DiscoveryProduct } from "@/lib/intelligence/marketplaceDiscovery";
import { buildQualityWarnings, calculateTelegramCandidateScore, buildMarketplaceBadges, generateTelegramCaption } from "@/lib/intelligence/telegramPublishing";
import MarketplaceCard from "./MarketplaceCard";
import { ChevronDown, Clock3, Filter, Play, Search, ShieldCheck, Sparkles, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { enqueueMany, getQueue, isQueued } from "@/lib/queueStorage";

const FOCUS_FILTERS = [
  { id: "all", label: "All tech" },
  { id: "rgb", label: "RGB setup" },
  { id: "gaming", label: "Gaming accessories" },
  { id: "audio", label: "Earbuds & audio" },
  { id: "storage", label: "SSDs & RAM" },
  { id: "desk", label: "Desk setup" },
  { id: "handheld", label: "Handheld consoles" },
  { id: "smart", label: "Smart devices" },
  { id: "gadgets", label: "Gadgets" },
];

const SORT_FILTERS = [
  { id: "telegram", label: "Telegram score" },
  { id: "market", label: "Marketplace score" },
  { id: "price", label: "Lowest price" },
  { id: "sales", label: "Top selling" },
  { id: "discount", label: "Best discount" },
];

const matchesFocus = (product: DiscoveryProduct, focus: string): boolean => {
  if (focus === "all") return true;

  const text = `${product.title || ""} ${product.categoryName || ""} ${product.discoverySourceLabel || ""}`.toLowerCase();
  const focusMap: Record<string, string[]> = {
    rgb: ["rgb", "led", "lighting", "desk setup", "keyboard", "mouse", "monitor", "ambient"],
    gaming: ["gaming", "controller", "mouse", "keyboard", "headset", "mouse pad", "dock"],
    audio: ["earbud", "earbuds", "audio", "headphone", "speaker", "sound", "tws"],
    storage: ["ssd", "ram", "memory", "storage", "nvme", "external drive"],
    desk: ["desk", "setup", "monitor arm", "webcam", "keyboard", "mouse", "dock"],
    handheld: ["handheld", "console", "retro", "gaming device", "portable"],
    smart: ["smart", "iot", "sensor", "automation", "home", "watch"],
    gadgets: ["gadget", "device", "adapter", "charger", "tool", "portable"],
  };

  return (focusMap[focus] || []).some((keyword) => text.includes(keyword));
};

const matchesSearch = (product: DiscoveryProduct, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true;
  const text = `${product.title || ""} ${product.categoryName || ""} ${product.discoveryPoolName || ""}`.toLowerCase();
  return searchTerm.toLowerCase().split(/\s+/).filter(Boolean).every((term) => text.includes(term));
};

const getQueueId = (product: DiscoveryProduct): string => {
  return String(product.productId || product.detailUrl || product.title || product.categoryName || "unknown-product");
};

export const MarketplaceDiscovery = ({ mode }: { mode: DiscoveryMode }): JSX.Element => {
  const modeConfig = DISCOVERY_MODE_CONFIG[mode];
  const sources = useMemo(() => getDiscoverySourcesForMode(mode), [mode]);
  const [products, setProducts] = useState<DiscoveryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [focus, setFocus] = useState("all");
  const [sortBy, setSortBy] = useState("telegram");
  const [searchTerm, setSearchTerm] = useState("");
  const [batchPage, setBatchPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hideLowSignal, setHideLowSignal] = useState(mode === "telegram-candidates");
  const [queueMessage, setQueueMessage] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const enrichProduct = (product: any, sourceId: string, sourceLabel: string, sourceWeight: number, poolName: string, focusTags: string[]): DiscoveryProduct => {
    const candidate = calculateTelegramCandidateScore(product);
    const enriched: DiscoveryProduct = {
      ...product,
      discoverySourceId: sourceId,
      discoverySourceLabel: sourceLabel,
      discoveryPoolName: poolName,
      discoverySourceWeight: sourceWeight,
      discoveryFocusTags: focusTags,
      candidateScore: candidate.score,
      candidateReasons: candidate.reasons,
      candidateBreakdown: candidate.breakdown,
      marketplaceBadges: buildMarketplaceBadges(product),
      qualityWarnings: [],
    };

    return enriched;
  };

  const loadBatch = useCallback(async (pageNo: number, replace = false) => {
    const activeSources = sources;
    const pending = activeSources.map(async (source) => {
      const response = await fetch(buildDiscoveryUrl(source, pageNo, modeConfig.strictTelegramGate));

      if (!response.ok) {
        throw new Error(`Failed to load ${source.label}`);
      }

      const payload = await response.json();
      const rawItems = Array.isArray(payload) ? payload : payload?.product ?? payload?.products ?? [];
      return rawItems.map((item: any) => enrichProduct(item, source.id, source.label, source.weight, source.poolName, source.focusTags));
    });

    const results = await Promise.allSettled(pending);
    const nextProducts = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

    setProducts((currentProducts) => {
      const merged = replace ? nextProducts : [...currentProducts, ...nextProducts];
      return Array.from(
        new Map(
          merged.map((product) => [String(product.productId || product.sku_id || product.detailUrl || product.title), product])
        ).values()
      );
    });

    setHasMore(nextProducts.length > 0);
    setError(results.every((result) => result.status === "rejected") ? "No discovery sources could be loaded right now." : "");
  }, [modeConfig.strictTelegramGate, sources]);

  useEffect(() => {
    setLoading(true);
    setError("");
    setProducts([]);
    setBatchPage(1);
    setHasMore(true);
    setHideLowSignal(mode === "telegram-candidates");

    loadBatch(1, true)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load discovery feed");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loadBatch, mode]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || loading || loadingMore || !hasMore) {
          return;
        }

        setLoadingMore(true);
        const nextPage = batchPage + 1;
        setBatchPage(nextPage);

        loadBatch(nextPage)
          .catch((loadError) => {
            setError(loadError instanceof Error ? loadError.message : "Failed to load more products");
          })
          .finally(() => {
            setLoadingMore(false);
          });
      },
      { rootMargin: "800px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [batchPage, hasMore, loading, loadingMore, loadBatch]);

  const visibleProducts = useMemo(() => {
    const filtered = products
      .filter((product) => matchesFocus(product, focus))
      .filter((product) => matchesSearch(product, searchTerm))
      .filter((product) => (hideLowSignal ? (product.candidateScore ?? 0) >= modeConfig.candidateFloor : true));

    return filtered.sort((left, right) => {
      const leftCandidate = left.candidateScore ?? 0;
      const rightCandidate = right.candidateScore ?? 0;
      const leftScore = left.score ?? 0;
      const rightScore = right.score ?? 0;
      const leftPrice = left.price ?? Number.POSITIVE_INFINITY;
      const rightPrice = right.price ?? Number.POSITIVE_INFINITY;
      const leftSales = left.salesVolume ?? 0;
      const rightSales = right.salesVolume ?? 0;
      const leftDiscount = left.discountPercent ?? 0;
      const rightDiscount = right.discountPercent ?? 0;

      if (sortBy === "price") return leftPrice - rightPrice;
      if (sortBy === "sales") return rightSales - leftSales;
      if (sortBy === "discount") return rightDiscount - leftDiscount;
      if (sortBy === "market") return rightScore - leftScore;
      return rightCandidate - leftCandidate;
    });
  }, [focus, hideLowSignal, modeConfig.candidateFloor, products, searchTerm, sortBy]);

  const stats = useMemo(() => {
    const count = visibleProducts.length;
    const topScore = count > 0 ? Math.max(...visibleProducts.map((product) => product.candidateScore ?? 0)) : 0;
    const averageScore = count > 0 ? Math.round(visibleProducts.reduce((total, product) => total + (product.candidateScore ?? 0), 0) / count) : 0;
    const telegramReady = visibleProducts.filter((product) => (product.candidateScore ?? 0) >= 70).length;
    return { count, topScore, averageScore, telegramReady };
  }, [visibleProducts]);

  const queueReadyProducts = useMemo(() => {
    return visibleProducts.filter((product) => {
      const candidate = calculateTelegramCandidateScore(product);
      const warnings = buildQualityWarnings(product, candidate.score);
      return warnings.length === 0 || (warnings.length === 1 && warnings[0] === "No issues detected.");
    });
  }, [visibleProducts]);

  const handleQueueCurrentFeed = () => {
    const queueItems = queueReadyProducts
      .filter((product) => !isQueued(getQueueId(product)))
      .map((product) => {
        const id = getQueueId(product);
        const candidate = calculateTelegramCandidateScore(product);
        const caption = generateTelegramCaption(product, product.detailUrl || "", candidate.score);

        return {
          id,
          data: {
            ...product,
            queuedCaption: caption,
            queuedFromMode: mode,
          },
        };
      });

    if (queueItems.length === 0) {
      setQueueMessage("Nenhum produto elegível para queue nesta tela.");
      return;
    }

    enqueueMany(queueItems);
    setQueueMessage(`${queueItems.length} produto(s) adicionados à queue desta tela.`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_36%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                {modeConfig.eyebrow}
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {modeConfig.title}
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                  {modeConfig.subtitle}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">High CTR</span>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Impulse buys</span>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Telegram-ready visuals</span>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Affiliate conversion engine</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Loaded</p>
                <p className="mt-2 text-3xl font-semibold">{products.length}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Visible</p>
                <p className="mt-2 text-3xl font-semibold">{stats.count}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Top score</p>
                <p className="mt-2 text-3xl font-semibold">{stats.topScore}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Telegram-ready</p>
                <p className="mt-2 text-3xl font-semibold">{stats.telegramReady}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="sticky top-0 z-20 mt-6 rounded-[28px] border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative w-full xl:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search RGB, earbuds, SSD, RAM, handheld, smart devices..."
                  className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {FOCUS_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setFocus(filter.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${focus === filter.id ? "bg-white text-slate-950" : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleQueueCurrentFeed} className="gap-2">
                <Play className="h-4 w-4" />
                Queue desta tela
              </Button>

              <button
                type="button"
                onClick={() => setHideLowSignal((value) => !value)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${hideLowSignal ? "bg-emerald-500 text-white" : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}
              >
                <Filter className="h-4 w-4" />
                Telegram only
              </button>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                <SlidersHorizontal className="h-4 w-4" />
                Sort
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="appearance-none bg-transparent pr-5 font-medium text-white outline-none"
                  >
                    {SORT_FILTERS.map((filter) => (
                      <option key={filter.id} value={filter.id} className="bg-slate-950">
                        {filter.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              {queueReadyProducts.length} pronto(s) para queue
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <Clock3 className="h-4 w-4 text-cyan-300" />
              O feed continua puxando a próxima página automaticamente
            </span>
            {queueMessage ? <span className="text-cyan-200">{queueMessage}</span> : null}
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-100">
            {error}
          </div>
        ) : null}

        <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
          {visibleProducts.map((product, index) => (
            <MarketplaceCard key={String(product.productId || product.detailUrl || index)} product={product} />
          ))}
        </section>

        <div ref={loadMoreRef} className="mt-8 flex items-center justify-center py-10 text-sm text-slate-400">
          {loading || loadingMore ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400" />
              Loading the next discovery wave...
            </div>
          ) : hasMore ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              Scroll for more discoveries
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              You reached the end of this discovery batch.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceDiscovery;
