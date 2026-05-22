"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { buildQualityWarnings, calculateTelegramCandidateScore } from "@/lib/intelligence/queueScoring";
import type { DiscoveryProduct } from "@/lib/intelligence/discoveryProduct";
import { clearQueue, enqueue, getQueue, type QueueItem } from "@/lib/queueStorage";

const parseNumber = (value?: string | number): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^\d.]/g, "");
  return Number.parseFloat(cleaned) || 0;
};

const mapDetailsToProduct = (details: Record<string, any>, fallback: DiscoveryProduct): DiscoveryProduct => {
  const ratingRaw = parseNumber(details.evaluate_rate);
  const rating = ratingRaw > 5 ? ratingRaw / 20 : ratingRaw;
  const price =
    parseNumber(details.target_sale_price) ||
    parseNumber(details.sale_price) ||
    parseNumber(details.app_sale_price);

  return {
    ...fallback,
    productId: details.product_id ?? fallback.productId,
    title: details.product_title || fallback.title,
    imageUrl: details.product_main_image_url || fallback.imageUrl,
    detailUrl: details.product_detail_url || fallback.detailUrl,
    categoryId: details.second_level_category_id || details.first_level_category_id || fallback.categoryId,
    categoryName: details.second_level_category_name || details.first_level_category_name || fallback.categoryName,
    shopId: details.shop_id || fallback.shopId,
    price: price || fallback.price,
    originalPrice: parseNumber(details.target_original_price) || parseNumber(details.original_price) || fallback.originalPrice,
    discountPercent: parseNumber(details.discount) || fallback.discountPercent,
    rating: rating || fallback.rating,
    salesVolume: details.lastest_volume ?? fallback.salesVolume,
    commissionRate: parseNumber(details.commission_rate) || fallback.commissionRate,
    shippingDays: parseNumber(details.ship_to_days) || fallback.shippingDays,
    hasVideo: Boolean(details.product_video_url) || fallback.hasVideo,
    promoCode: details.promo_code_info?.promo_code || fallback.promoCode,
    isHotProduct: Boolean(details.hot_product_commission_rate) || fallback.isHotProduct,
  };
};

const isPublishReady = (product: DiscoveryProduct): boolean => {
  const candidate = calculateTelegramCandidateScore(product);
  const warnings = buildQualityWarnings(product, candidate.score);
  return warnings.length === 0 || (warnings.length === 1 && warnings[0] === "No issues detected.");
};

const formatSchedule = (timestamp?: number): string => {
  if (!timestamp) return "Schedule: not set";
  const date = new Date(timestamp);
  return `Schedule: ${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

export const TelegramQueueDashboard = (): JSX.Element => {
  const [queue, setQueue] = useState<QueueItem<DiscoveryProduct>[]>([]);
  const [lastStatus, setLastStatus] = useState("Queue ready.");
  const [productUrlInput, setProductUrlInput] = useState("");
  const [addStatus, setAddStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProductUrl, setModalProductUrl] = useState("");
  const [modalPreview, setModalPreview] = useState<DiscoveryProduct | null>(null);
  const [modalStatus, setModalStatus] = useState("");

  const refreshQueue = () => setQueue(getQueue<DiscoveryProduct>());

  useEffect(() => {
    refreshQueue();

    const onStorage = () => refreshQueue();
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const extractProductId = (url: string): string => {
    const patterns = [/\/item\/(\d+)\.html/i, /product\/(\d+)\.html/i, /\/i\/(\d+)\.html/i];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) return match[1];
    }
    const fallbackMatch = url.match(/(\d{8,})/);
    return fallbackMatch?.[1] || "";
  };

  const handleAddProduct = async () => {
    const rawUrl = productUrlInput.trim();
    if (!rawUrl) {
      setAddStatus("Informe o link do produto.");
      return;
    }

    setModalOpen(true);
    setModalProductUrl(rawUrl);
    setModalPreview(null);
    setModalStatus("Buscando detalhes do produto...");

    try {
      const productId = extractProductId(rawUrl);
      if (!productId) {
        setModalStatus("Sem product_id. Use um link de produto válido.");
        return;
      }

      const response = await fetch(
        `/api/aliexpress?type=product-details&product_id=${encodeURIComponent(productId)}`
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Falha ao carregar detalhes do produto");
      }

      const payload = await response.json();
      if (!payload.product) {
        throw new Error("Produto não encontrado");
      }

      const hydrated = mapDetailsToProduct(payload.product, {
        productId,
        title: "Produto sem título",
        imageUrl: "",
        detailUrl: rawUrl,
      });
      setModalPreview(hydrated);
      setModalStatus("Detalhes carregados.");
    } catch (error) {
      setModalStatus(error instanceof Error ? error.message : "Falha ao carregar detalhes");
    }
  };

  const handleConfirmAdd = () => {
    const productId = extractProductId(modalProductUrl);
    const baseProduct: DiscoveryProduct = {
      productId: productId || modalProductUrl,
      title: modalPreview?.title || "Produto sem título",
      imageUrl: modalPreview?.imageUrl || "",
      detailUrl: modalProductUrl,
    };

    const hydrated = modalPreview ? { ...modalPreview, ...baseProduct } : baseProduct;
    const queueId = `${productId || modalProductUrl}-${Date.now()}`;

    enqueue({
      id: queueId,
      data: hydrated,
    });

    refreshQueue();
    setProductUrlInput("");
    setAddStatus("Produto adicionado à fila.");
    setModalOpen(false);
  };

  const eligibleQueue = useMemo(() => queue.filter((item) => isPublishReady(item.data)), [queue]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Telegram Queue</CardTitle>
          <CardDescription>Itens aguardando envio.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{queue.length} item(s) na fila</p>
            <p>{eligibleQueue.length} item(s) prontos para enviar</p>
            <p>{lastStatus}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                clearQueue();
                refreshQueue();
                setLastStatus("Queue cleared.");
              }}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear queue
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar produto</CardTitle>
          <CardDescription>Informe o link do produto.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Link do produto</label>
            <Input
              value={productUrlInput}
              onChange={(event) => setProductUrlInput(event.target.value)}
              placeholder="https://pt.aliexpress.com/item/1005001234567890.html"
            />
          </div>
          <Button onClick={handleAddProduct} className="gap-2">
            Adicionar à fila
          </Button>
        </CardContent>
        {addStatus ? (
          <CardContent className="pt-0 text-sm text-muted-foreground">
            {addStatus}
          </CardContent>
        ) : null}
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirmar item da fila</DialogTitle>
            <DialogDescription>Confira o link do produto antes de adicionar.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Link do produto</label>
            <Input value={modalProductUrl} onChange={(event) => setModalProductUrl(event.target.value)} />
            <p className="text-xs text-muted-foreground">{modalStatus || "Pronto"}</p>
            {modalPreview?.imageUrl ? (
              <img
                src={modalPreview.imageUrl}
                alt={modalPreview.title || "Produto"}
                className="h-48 w-full rounded-lg object-cover"
              />
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmAdd}>Adicionar à fila</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {queue.map((item) => {
          const product = item.data;
          const candidate = calculateTelegramCandidateScore(product);
          const warnings = buildQualityWarnings(product, candidate.score);
          const ready = warnings.length === 0 || (warnings.length === 1 && warnings[0] === "No issues detected.");

          return (
            <Card key={item.id} className={ready ? "border-emerald-500/40" : "border-amber-500/40"}>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>{product.title || "Untitled product"}</CardTitle>
                    <CardDescription>
                      {ready ? "Ready to publish" : "Needs review before publishing"} • Score {candidate.score}/100
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{formatSchedule(item.manualScheduledAt ?? item.scheduledAt)}</p>
                <p>{product.price ? `Price: R$ ${product.price.toFixed(2)}` : "Price unavailable"}</p>
                <p>{product.salesVolume ? `Sales: ${product.salesVolume.toLocaleString()}` : "Sales unavailable"}</p>
                {warnings.length > 0 ? (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-amber-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      {warnings.map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-emerald-700">
                    No issues detected.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {queue.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Your queue is empty. Add eligible products to start.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default TelegramQueueDashboard;
