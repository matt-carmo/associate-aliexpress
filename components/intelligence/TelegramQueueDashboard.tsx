"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
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
import { clearQueue, enqueue, getQueue, removeFromQueue, type QueueItem } from "@/lib/queueStorage";

const parseNumber = (value?: string | number): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^\d.]/g, "");
  return Number.parseFloat(cleaned) || 0;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

const CHAT_ID = -1002399025968;

const sendNow = async (imageUrl: string, caption: string): Promise<boolean> => {
  try {
    const response = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: CHAT_ID, photoUrl: imageUrl, caption }),
    });
    return response.ok;
  } catch {
    return false;
  }
};

const formatSchedule = (timestamp?: number): string => {
  if (!timestamp) return "Schedule: not set";
  const date = new Date(timestamp);
  return `Schedule: ${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

type TemplateKey = "padrao" | "simples" | "com_cupom" | "relampago";

const TEMPLATES: Record<TemplateKey, {
  label: string;
  generate: (product: DiscoveryProduct, link: string) => string;
}> = {
  padrao: {
    label: "Padrão",
    generate: (product, link) =>
      [
        `🔥 ${product.title}`,
        `❌ De: <s>R$ ${product.originalPrice?.toFixed(2) ?? "?"}</s>`,
        `✅ Por: R$ ${product.price?.toFixed(2) ?? "?"} 😱😱`,
        ...(product.promoCode ? [`\n🏷️ <b>Cupom</b>: <code>${product.promoCode}</code>`] : []),
        "",
        `🛒 ${link}`,
        "",
        "😎🚀 Para mais ofertas, acesse: https://t.me/top_ofertas_online"
      ].join("\n"),
  },
  simples: {
    label: "Simples",
    generate: (product, link) =>
      [
        `📦 ${product.title}`,
        `💰 R$ ${product.price?.toFixed(2) ?? "?"}`,
        `🔗 ${link}`,
      ].join("\n"),
  },
  com_cupom: {
    label: "Com Cupom",
    generate: (product, link) => {
      if (!product.promoCode) {
        return TEMPLATES.padrao.generate(product, link);
      }
      return [
        "🏷️ CUPOM ESPECIAL 🏷️",
        "",
        `🔥 ${product.title}`,
        `❌ De: <s>R$ ${product.originalPrice?.toFixed(2) ?? "?"}</s>`,
        `✅ Por: R$ ${product.price?.toFixed(2) ?? "?"}`,
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
    generate: (product, link) =>
      [
        "⚡ PROMOÇÃO RELÂMPAGO ⚡",
        "",
        `📱 ${product.title}`,
        `💥 De: <s>R$ ${product.originalPrice?.toFixed(2) ?? "?"}</s>`,
        `💥 Por: R$ ${product.price?.toFixed(2) ?? "?"}`,
        "📉 Desconto imperdível!",
        "",
        `🛒 ${link}`,
        "",
        "🚨 Corra, estoque limitado!",
      ].join("\n"),
  },
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
  const [promotionLink, setPromotionLink] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>("padrao");
  const [captionText, setCaptionText] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [sendingNow, setSendingNow] = useState(false);

  const refreshQueue = () => setQueue(getQueue<DiscoveryProduct>());

  useEffect(() => {
    refreshQueue();

    const onStorage = () => refreshQueue();
    window.addEventListener("storage", onStorage);

    const interval = setInterval(() => {
      const items = getQueue<DiscoveryProduct>();
      const now = Date.now();
      let posted = false;

      for (const item of items) {
        const schedule = item.manualScheduledAt ?? item.scheduledAt;
        if (!schedule || schedule > now) continue;
        if (!item.data.imageUrl) continue;

        sendNow(item.data.imageUrl, item.caption ?? "").then((ok) => {
          if (ok) {
            removeFromQueue(item.id);
            refreshQueue();
            setLastStatus(`Postado: ${item.data.title}`);
          } else {
            setLastStatus(`Falha ao postar: ${item.data.title}`);
          }
        });
        posted = true;
      }

      if (!posted) {
        const next = items
          .map((i) => i.manualScheduledAt ?? i.scheduledAt ?? Infinity)
          .filter((t) => t > now);
        if (next.length > 0) {
          const nextTime = Math.min(...next);
          setLastStatus(
            `Próximo post em ${Math.round((nextTime - now) / 60000)} min`
          );
        }
      }
    }, 30000);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
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

  const generateText = (template: TemplateKey, product: DiscoveryProduct, link: string) => {
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

    try {
      const productId = extractProductId(rawUrl);
      if (!productId) {
        setModalStatus("Sem product_id. Use um link de produto válido.");
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(
        `/api/aliexpress?type=product-details&product_id=${encodeURIComponent(productId)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

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
        title: "Produto sem título",
        imageUrl: "",
        detailUrl: rawUrl,
      });
      setModalPreview(hydrated);

      const linkResponse = await fetch(
        `/api/aliexpress?type=affiliate-link&product_detail_url=${encodeURIComponent(rawUrl)}`
      );

      if (linkResponse.ok) {
        const linkPayload = await linkResponse.json();
        const link = linkPayload.promotionLink || "";
        setPromotionLink(link);
        setCaptionText(generateText("padrao", hydrated, link));
      } else {
        setPromotionLink("");
        setCaptionText(generateText("padrao", hydrated, ""));
      }

      setModalStatus(linkResponse.ok ? "Detalhes carregados." : "Detalhes carregados. Link de afiliado indisponível para este produto.");
    } catch (error) {
      setModalStatus(error instanceof Error ? error.message : "Falha ao carregar detalhes");
    }
  };

  const handleTemplateChange = (value: string) => {
    const template = value as TemplateKey;
    setSelectedTemplate(template);
    if (modalPreview) {
      setCaptionText(generateText(template, modalPreview, promotionLink));
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

    let manualScheduledAt: number | undefined;
    if (scheduledDate || scheduledTime) {
      const dateStr = scheduledDate || new Date().toISOString().split("T")[0];
      const timeStr = scheduledTime || "12:00";
      const [year, month, day] = dateStr.split("-").map(Number);
      const [hours, minutes] = timeStr.split(":").map(Number);
      manualScheduledAt = new Date(year, month - 1, day, hours, minutes).getTime();
    }

    enqueue({
      id: queueId,
      data: hydrated,
      manualScheduledAt,
      caption: captionText || undefined,
    });

    refreshQueue();
    setProductUrlInput("");
    setAddStatus("Produto adicionado à fila.");
    setModalOpen(false);
  };

  const handleSendNow = async () => {
    if (!modalPreview || !captionText) return;
    setSendingNow(true);

    const ok = await sendNow(modalPreview.imageUrl, captionText);

    if (ok) {
      setAddStatus("Produto postado com sucesso!");
      setModalOpen(false);
    } else {
      setModalStatus("Erro ao postar. Tente novamente.");
    }

    setSendingNow(false);
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

          <p className="text-xs text-muted-foreground">{modalStatus || "Pronto"}</p>

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
                    {captionText ? (
                      <div
                        className="text-sm whitespace-pre-wrap break-words leading-relaxed [&_del]:text-muted-foreground"
                        dangerouslySetInnerHTML={{
                          __html: captionText
                            .replace(/<s>/g, "<del>")
                            .replace(/<\/s>/g, "</del>")
                            .replace(/<b>/g, "<strong>")
                            .replace(/<\/b>/g, "</strong>")
                            .replace(/<code>/g, "<code class='font-mono text-xs bg-muted px-1 rounded'>")
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
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
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
          <p>{formatSchedule(item.manualScheduledAt ?? item.scheduledAt)}</p>

          <p>
            {product.price
              ? `R$ ${product.price.toFixed(2)}`
              : "Price unavailable"}

            {product.salesVolume
              ? ` - ${product.salesVolume.toLocaleString()} sales`
              : ""}
          </p>
        </CardContent>
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
