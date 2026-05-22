"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {queue.length} item(s) na fila &middot; {lastStatus}
        </div>
        <Button
          variant="destructive"
          size="sm"
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

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={productUrlInput}
            onChange={(event) => setProductUrlInput(event.target.value)}
            placeholder="Link do produto (ex: https://pt.aliexpress.com/item/1005001234567890.html)"
          />
        </div>
        <Button onClick={handleAddProduct}>
          Adicionar à fila
        </Button>
      </div>
      {addStatus ? (
        <p className="text-xs text-muted-foreground">{addStatus}</p>
      ) : null}

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

      <div className="grid gap-3">
        {queue.map((item) => {
          const product = item.data;

          return (
            <Card key={item.id} className={"border-white/10 bg-white/5"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {product.detailUrl ? (
                    <a href={product.detailUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {product.title || "Untitled product"}
                    </a>
                  ) : (
                    product.title || "Untitled product"
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>{formatSchedule(item.manualScheduledAt ?? item.scheduledAt)}</p>
                <p>
                  {product.price ? `R$ ${product.price.toFixed(2)}` : "Price unavailable"}
                  {product.salesVolume ? ` - ${product.salesVolume.toLocaleString()} sales` : ""}
                </p>
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
