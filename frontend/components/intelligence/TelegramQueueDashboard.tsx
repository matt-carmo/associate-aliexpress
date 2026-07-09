"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DiscoveryProduct } from "@/lib/intelligence/discoveryProduct";
import type { BackendQueueItem } from "@/lib/queueTypes";
import {
  enqueueItem,
  removeQueueItem,
  updateQueueItem,
  clearQueue,
  getWhatsAppTarget,
} from "@/lib/backendApi";

const parseNumber = (value?: string | number): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^\d.]/g, "");
  return Number.parseFloat(cleaned) || 0;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDetailsToProduct = (
  details: Record<string, any>,
  fallback: DiscoveryProduct,
): DiscoveryProduct => {
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
    categoryId:
      details.second_level_category_id ||
      details.first_level_category_id ||
      fallback.categoryId,
    categoryName:
      details.second_level_category_name ||
      details.first_level_category_name ||
      fallback.categoryName,
    shopId: details.shop_id || fallback.shopId,
    price: price || fallback.price,
    originalPrice:
      parseNumber(details.target_original_price) ||
      parseNumber(details.original_price) ||
      fallback.originalPrice,
    discountPercent: parseNumber(details.discount) || fallback.discountPercent,
    rating: rating || fallback.rating,
    salesVolume: details.lastest_volume ?? fallback.salesVolume,
    commissionRate:
      parseNumber(details.commission_rate) || fallback.commissionRate,
    shippingDays: parseNumber(details.ship_to_days) || fallback.shippingDays,
    hasVideo: Boolean(details.product_video_url) || fallback.hasVideo,
    promoCode: details.promo_code_info?.promo_code || fallback.promoCode,
    isHotProduct:
      Boolean(details.hot_product_commission_rate) || fallback.isHotProduct,
  };
};

const MESSAGING_BASE_URL =
  process.env.NEXT_PUBLIC_MESSAGING_API_URL || "http://localhost:4000";

const formatSchedule = (timestamp?: number): string => {
  if (!timestamp) return "Schedule: not set";
  const date = new Date(timestamp);
  return `Schedule: ${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

type TemplateKey = "padrao" | "simples" | "com_cupom" | "relampago";

const TEMPLATES: Record<
  TemplateKey,
  {
    label: string;
    generate: (product: DiscoveryProduct, link: string) => string;
  }
> = {
  padrao: {
    label: "Padrão",
    generate: (product, link) => {
      const priceLabel =
        product.priceMax && product.priceMax > (product.price || 0)
          ? "A partir de: R$"
          : "Por: R$";
      return [
        `🔥 ${product.title}`,
        "",
        `❌ De: <s>R$ ${product.originalPrice?.toFixed(2) ?? "?"}</s>`,
        `✅ ${priceLabel} ${product.price?.toFixed(2) ?? "?"} 😱😱`,
        ...(product.promoCode
          ? [`\n🏷️ <b>Cupom</b>: <code>${product.promoCode}</code>`]
          : []),
        "",
        `🛒 ${link}`,
        "",
        "😎🚀 Para mais ofertas, acesse: https://t.me/top_ofertas_online",
      ].join("\n");
    },
  },
  simples: {
    label: "Simples",
    generate: (product, link) => {
      const priceLabel =
        product.priceMax && product.priceMax > (product.price || 0)
          ? "A partir de R$"
          : "R$";
      return [
        `📦 ${product.title}`,
        `💰 ${priceLabel} ${product.price?.toFixed(2) ?? "?"}`,
        `🔗 ${link}`,
      ].join("\n");
    },
  },
  com_cupom: {
    label: "Com Cupom",
    generate: (product, link) => {
      if (!product.promoCode) {
        return TEMPLATES.padrao.generate(product, link);
      }
      const priceLabel =
        product.priceMax && product.priceMax > (product.price || 0)
          ? "A partir de: R$"
          : "Por: R$";
      return [
        "🏷️ CUPOM ESPECIAL 🏷️",
        "",
        `🔥 ${product.title}`,
        `❌ De: <s>R$ ${product.originalPrice?.toFixed(2) ?? "?"}</s>`,
        `✅ ${priceLabel} ${product.price?.toFixed(2) ?? "?"}`,
        `🎫 Cupom: <code>${product.promoCode}</code>`,
        "",
        `🛒 ${link}`,
        "",
        "⏳ Oferta por tempo limitado!",
      ].join("\n");
    },
  },
  relampago: {
    label: "Promoção Relâmpago",
    generate: (product, link) => {
      const original = product.originalPrice ?? 0;
      const current = product.price ?? 0;

      const hasDiscount = original > current;
      const savings = hasDiscount ? original - current : 0;
      const discount = hasDiscount ? (savings / original) * 100 : 0;

      const priceLabel =
        product.priceMax && product.priceMax > current
          ? "A partir de"
          : "Por apenas";

      const formatPrice = (value: number) =>
        value.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

      return [
        "⚡ PROMOÇÃO RELÂMPAGO ⚡",
        "",
        `🛍️ ${product.title}`,
        "",
        hasDiscount ? `💥 De: ~~R$ ${formatPrice(original)}~~` : null,
        `🔥 ${priceLabel}: R$ ${formatPrice(current)}`,
        hasDiscount
          ? `💸 Economize R$ ${formatPrice(savings)} (${discount.toFixed(0)}% OFF)`
          : null,
        "",
        `🛒 ${link}`,
        "",
        "🚨 Estoque limitado! Aproveite antes que o preço mude.",
      ]
        .join("\n");
    },
  },
};

export const TelegramQueueDashboard = (): JSX.Element => {
  const [queue, setQueue] = useState<BackendQueueItem<DiscoveryProduct>[]>([]);
  const [queueStats, setQueueStats] = useState<{
    pending: number;
    failed: number;
  } | null>(null);
  const [lastStatus, setLastStatus] = useState("Queue ready.");
  const [productUrlInput, setProductUrlInput] = useState("");
  const [addStatus, setAddStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProductUrl, setModalProductUrl] = useState("");
  const [modalPreview, setModalPreview] = useState<DiscoveryProduct | null>(
    null,
  );
  const [modalStatus, setModalStatus] = useState("");
  const [promotionLink, setPromotionLink] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateKey>("padrao");
  const [captionText, setCaptionText] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [sendingNow, setSendingNow] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [fetchingPdp, setFetchingPdp] = useState(false);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`${MESSAGING_BASE_URL}/queue`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue ?? []);
        setQueueStats(data.stats ?? null);
      }
    } catch {
      // polling error
    }
  }, []);

  useEffect(() => {
    fetchQueue();

    const interval = setInterval(fetchQueue, 15_000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const extractProductId = (url: string): string => {
    const patterns = [
      /\/item\/(\d+)\.html/i,
      /product\/(\d+)\.html/i,
      /\/i\/(\d+)\.html/i,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) return match[1];
    }
    const fallbackMatch = url.match(/(\d{8,})/);
    return fallbackMatch?.[1] || "";
  };

  const isShopeeUrl = (url: string): boolean => {
    return /shopee\.\w+/.test(url) || /cf\.shopee\.\w+/.test(url);
  };

  const extractShopeeItemId = (url: string): string => {
    const patterns = [/\/product\/(\d+)\/(\d+)/i, /-i\.(\d+)\.(\d+)/i];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[2]) return match[2];
    }
    return "";
  };

  const mapShopeeProductToDiscovery = (
    shopeeProduct: Record<string, unknown>,
    fallback: DiscoveryProduct,
  ): DiscoveryProduct => {
    const priceMin = parseFloat(
      String(shopeeProduct.priceMin || shopeeProduct.price || "0"),
    );
    const priceMax = parseFloat(String(shopeeProduct.priceMax || "0"));
    const price = priceMin;
    const discountRate = Number(shopeeProduct.priceDiscountRate || 0);
    const originalPrice =
      discountRate > 0 ? priceMin / (1 - discountRate / 100) : priceMin;
    const productCatIds = Array.isArray(shopeeProduct.productCatIds)
      ? shopeeProduct.productCatIds
      : [];

    return {
      ...fallback,
      productId: String(shopeeProduct.itemId ?? fallback.productId),
      title: String(shopeeProduct.productName || fallback.title),
      imageUrl: String(shopeeProduct.imageUrl || fallback.imageUrl),
      detailUrl: String(shopeeProduct.productLink || fallback.detailUrl),
      categoryId: (productCatIds[0] as number) || fallback.categoryId,
      categoryName: "",
      shopId: (shopeeProduct.shopId as number) || fallback.shopId,
      price: price || fallback.price,
      priceMax: priceMax || undefined,
      originalPrice: originalPrice || fallback.originalPrice,
      discountPercent: discountRate || fallback.discountPercent,
      rating:
        parseFloat(String(shopeeProduct.ratingStar || "0")) || fallback.rating,
      salesVolume: Number(shopeeProduct.sales || 0) || fallback.salesVolume,
      commissionRate:
        parseFloat(String(shopeeProduct.commissionRate || "0")) * 100 ||
        fallback.commissionRate,
      shippingDays: 30,
      hasVideo: false,
      promoCode: undefined,
      isHotProduct: Number(shopeeProduct.sales || 0) >= 1000,
    };
  };

  const generateText = (
    template: TemplateKey,
    product: DiscoveryProduct,
    link: string,
  ) => {
    return TEMPLATES[template].generate(product, link);
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
    setSelectedTemplate("padrao");
    setCaptionText("");
    setScheduledDate("");
    setScheduledTime("");

    const isShopee = isShopeeUrl(rawUrl);
    const productId = isShopee
      ? extractShopeeItemId(rawUrl)
      : extractProductId(rawUrl);
    if (!productId) {
      setModalStatus("Sem product_id. Use um link de produto valido.");
      return;
    }

    let hydrated: DiscoveryProduct | null = null;
    let promotionLink = "";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const apiUrl = isShopee
        ? `/api/shopee?type=product-details&item_id=${encodeURIComponent(productId)}`
        : `/api/ali?type=product-details&product_id=${encodeURIComponent(productId)}&product_detail_url=${encodeURIComponent(rawUrl)}`;
      const response = await fetch(apiUrl, { signal: controller.signal });
      if (response.ok) {
        const payload = await response.json();
        if (payload.product) {
          hydrated = isShopee
            ? mapShopeeProductToDiscovery(payload.product, {
                productId,
                title: "Produto sem titulo",
                imageUrl: "",
                detailUrl: rawUrl,
              })
            : mapDetailsToProduct(payload.product, {
                productId,
                title: "Produto sem titulo",
                imageUrl: "",
                detailUrl: rawUrl,
              });

          if (isShopee) {
            const periodEnd = payload.product.periodEndTime
              ? payload.product.periodEndTime * 1000
              : 0;
            if (periodEnd && periodEnd <= Date.now()) {
              setModalStatus(
                "⚠️ Oferta Shopee expirada. Confirme a URL antes de continuar.",
              );
            }
          }
        }
      }
    } catch {
      // Product details not available via API — will try affiliate link
    } finally {
      clearTimeout(timeoutId);
    }

    if (isShopee && hydrated) {
      setFetchingPdp(true);
      setModalStatus("Buscando preço atualizado...");
      try {
        const pdpRes = await fetch("/api/shopee/pdp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: rawUrl }),
        });
        if (pdpRes.ok) {
          const pdpPayload = await pdpRes.json();
          if (pdpPayload.ok && pdpPayload.data) {
            const pdp = pdpPayload.data;
            hydrated = {
              ...hydrated,
              price: pdp.price,
              priceMax: pdp.priceMax,
              originalPrice: pdp.priceBeforeDiscount,
              discountPercent: pdp.discountPercent,
            };
          }
        }
      } catch {
        // Scraper failed — fall back to GraphQL prices
      } finally {
        setFetchingPdp(false);
      }
    }

    try {
      const cleanOrigin = isShopee
        ? rawUrl.split("?")[0].split("&")[0]
        : rawUrl;
      const linkApiUrl = isShopee
        ? `/api/shopee?type=short-link&origin_url=${encodeURIComponent(cleanOrigin)}`
        : `/api/ali?type=affiliate-link&product_detail_url=${encodeURIComponent(rawUrl)}`;
      const linkResponse = await fetch(linkApiUrl);
      if (linkResponse.ok) {
        const linkPayload = await linkResponse.json();
        promotionLink =
          linkPayload.promotionLink || linkPayload.shortLink || "";
      }
    } catch {
      // Affiliate link not available
    }

    if (hydrated || promotionLink) {
      if (!hydrated) {
        hydrated = {
          productId,
          title: "Produto sem titulo",
          imageUrl: "",
          detailUrl: rawUrl,
        };
      }
      setModalPreview(hydrated);
      setPromotionLink(promotionLink);
      setCaptionText(generateText("padrao", hydrated, promotionLink));
      setModalStatus(
        promotionLink
          ? "Detalhes carregados."
          : "Detalhes carregados. Link de afiliado indisponivel para este produto.",
      );
    } else {
      setModalStatus("Nao foi possivel carregar as informacoes do produto.");
    }
  };

  const handleTemplateChange = (value: string) => {
    const template = value as TemplateKey;
    setSelectedTemplate(template);
    if (modalPreview) {
      setCaptionText(generateText(template, modalPreview, promotionLink));
    }
  };

  const handleConfirmAdd = async () => {
    const productId = extractProductId(modalProductUrl);
    const baseProduct: DiscoveryProduct = {
      productId: productId || modalProductUrl,
      title: modalPreview?.title || "Produto sem título",
      imageUrl: modalPreview?.imageUrl || "",
      detailUrl: modalProductUrl,
    };

    const hydrated = modalPreview
      ? { ...modalPreview, ...baseProduct }
      : baseProduct;
    const queueId = `${productId || modalProductUrl}-${Date.now()}`;
    const whatsappTarget = (await getWhatsAppTarget()) || undefined;

    let manualScheduledAt: number | undefined;
    if (scheduledDate || scheduledTime) {
      const dateStr = scheduledDate || new Date().toISOString().split("T")[0];
      const timeStr = scheduledTime || "12:00";
      const [year, month, day] = dateStr.split("-").map(Number);
      const [hours, minutes] = timeStr.split(":").map(Number);
      manualScheduledAt = new Date(
        year,
        month - 1,
        day,
        hours,
        minutes,
      ).getTime();
    }

    try {
      await enqueueItem({
        id: queueId,
        data: hydrated,
        target: whatsappTarget,
        manualScheduledAt,
        caption: captionText || undefined,
      });

      await fetchQueue();
      setProductUrlInput("");
      setAddStatus("Produto adicionado à fila.");
      setModalOpen(false);
    } catch {
      setModalStatus("Erro ao adicionar à fila.");
    }
  };

  const handleSendNow = async () => {
    if (!modalPreview || !captionText) return;
    setSendingNow(true);

    try {
      const whatsappTarget = (await getWhatsAppTarget()) || undefined;
      const queueId = `${extractProductId(modalProductUrl)}-${Date.now()}`;
      await enqueueItem({
        id: queueId,
        data: modalPreview,
        target: whatsappTarget,
        caption: captionText,
        status: "pending",
      });

      setAddStatus("Produto enviado para processamento imediato!");
      setModalOpen(false);
    } catch {
      setModalStatus("Erro ao postar. Tente novamente.");
    }

    setSendingNow(false);
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await removeQueueItem(id);
      await fetchQueue();
      setLastStatus("Item removido da fila.");
    } catch {
      setLastStatus("Erro ao remover item.");
    }
  };

  const handleEditSchedule = (item: BackendQueueItem<DiscoveryProduct>) => {
    const schedule = item.manualScheduledAt ?? item.scheduledAt;
    if (schedule) {
      const date = new Date(schedule);
      setEditDate(date.toISOString().split("T")[0]);
      setEditTime(
        `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
      );
    } else {
      setEditDate("");
      setEditTime("");
    }
    setEditingItemId(item.id);
  };

  const handleSaveSchedule = async (
    item: BackendQueueItem<DiscoveryProduct>,
  ) => {
    const dateStr = editDate || new Date().toISOString().split("T")[0];
    const timeStr = editTime || "12:00";
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hours, minutes] = timeStr.split(":").map(Number);
    const newSchedule = new Date(
      year,
      month - 1,
      day,
      hours,
      minutes,
    ).getTime();

    try {
      await updateQueueItem(item.id, { manualScheduledAt: newSchedule });
      await fetchQueue();
      setEditingItemId(null);
      setLastStatus("Horário atualizado.");
    } catch {
      setLastStatus("Erro ao atualizar horário.");
    }
  };

  const handleClearQueue = async () => {
    try {
      await clearQueue();
      await fetchQueue();
      setLastStatus("Queue cleared.");
    } catch {
      setLastStatus("Erro ao limpar fila.");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span>
            {queue.length} item(s) na fila
            {queueStats
              ? ` · ${queueStats.pending} pendentes · ${queueStats.failed} falhas`
              : ""}
          </span>
          <span className="text-xs opacity-60">· {lastStatus}</span>
          <button
            onClick={fetchQueue}
            className="p-1 hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleClearQueue}
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
            placeholder="Link do produto (AliExpress ou Shopee: https://shopee.com.br/product/123/456)"
          />
        </div>
        <Button onClick={handleAddProduct}>Adicionar à fila</Button>
      </div>
      {addStatus ? (
        <p className="text-xs text-muted-foreground">{addStatus}</p>
      ) : null}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          {modalPreview ? (
            <>
              <div className="space-y-3">
                <label className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Template
                </label>
                <Select
                  value={selectedTemplate}
                  onValueChange={handleTemplateChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATES).map(([key, t]) => (
                      <SelectItem key={key} value={key}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Agendamento (opcional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : null}

          <p className="text-xs text-muted-foreground">
            {fetchingPdp
              ? "Buscando preço atualizado..."
              : modalStatus || "Pronto"}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Editar mensagem
              </label>
              {captionText ? (
                <Textarea
                  rows={16}
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                  className="text-xs resize-y min-h-[300px]"
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground border rounded-md">
                  Carregando...
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Preview
              </label>
              {modalPreview?.imageUrl ? (
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                  <img
                    src={modalPreview.imageUrl}
                    alt={modalPreview.title || "Produto"}
                    className="max-w-60 mx-auto aspect-square object-cover"
                  />
                  <div className="p-3 space-y-1">
                    <div className="bg-muted-foreground/20 text-card-foreground p-2 rounded-md space-y-1">
                      {modalPreview.price ? (
                        <div className="text-lg font-semibold">
                          {modalPreview.priceMax &&
                          modalPreview.priceMax > modalPreview.price
                            ? `A partir de R$ ${modalPreview.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                            : `R$ ${modalPreview.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                          {modalPreview.discountPercent ? (
                            <span className="text-sm text-green-500 ml-2">
                              −{modalPreview.discountPercent}%
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      {modalPreview.rating || modalPreview.salesVolume ? (
                        <div className="text-sm text-muted-foreground">
                          {modalPreview.rating
                            ? `⭐ ${modalPreview.rating}`
                            : ""}
                          {modalPreview.salesVolume
                            ? ` · 📦 ${modalPreview.salesVolume.toLocaleString()} vendas`
                            : ""}
                        </div>
                      ) : null}
                    </div>
                    {captionText ? (
                      <div
                        className="text-sm whitespace-pre-wrap break-words leading-relaxed [&_del]:text-muted-foreground"
                        dangerouslySetInnerHTML={{
                          __html: captionText
                            .replace(/<s>/g, "<del>")
                            .replace(/<\/s>/g, "</del>")
                            .replace(/<b>/g, "<strong>")
                            .replace(/<\/b>/g, "</strong>")
                            .replace(
                              /<code>/g,
                              "<code class='font-mono text-xs bg-muted px-1 rounded'>",
                            )
                            .replace(/\n/g, "<br />"),
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={handleSendNow}
              disabled={!modalPreview || !captionText || sendingNow}
            >
              {sendingNow ? "Enviando..." : "Postar agora"}
            </Button>
            <Button onClick={handleConfirmAdd}>Adicionar à fila</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-3">
        {queue.map((item) => {
          const product = item.data;
          const isEditing = editingItemId === item.id;

          return (
            <Card key={item.id} className="border-white/10 bg-white/5">
              <div className="flex gap-4 p-4">
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  width={140}
                  height={140}
                  className="w-[140px] h-[140px] object-cover rounded-md shrink-0"
                />

                <div className="flex flex-col justify-between flex-1">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-base leading-tight">
                      {product.detailUrl ? (
                        <a
                          href={product.detailUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {product.title || "Untitled product"}
                        </a>
                      ) : (
                        product.title || "Untitled product"
                      )}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-0 space-y-1 text-sm text-muted-foreground">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveSchedule(item)}
                        >
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingItemId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <p>
                            {formatSchedule(
                              item.manualScheduledAt ?? item.scheduledAt,
                            )}
                          </p>
                          <button
                            onClick={() => handleEditSchedule(item)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                        <p>
                          {product.price
                            ? `R$ ${product.price.toFixed(2)}`
                            : "Price unavailable"}

                          {product.salesVolume
                            ? ` - ${product.salesVolume.toLocaleString()} sales`
                            : ""}
                        </p>
                        <div className="flex gap-2 text-xs">
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              item.status === "failed"
                                ? "bg-red-500/20 text-red-400"
                                : item.status === "processing"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : item.status === "pending" ||
                                      item.status === "scheduled"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {item.status}
                          </span>
                          {item.retryCount > 0 && (
                            <span className="text-muted-foreground">
                              retry {item.retryCount}/{item.maxRetries}
                            </span>
                          )}
                          {item.lastError && (
                            <span
                              className="text-red-400 truncate max-w-[200px]"
                              title={item.lastError}
                            >
                              {item.lastError}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>

                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
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
