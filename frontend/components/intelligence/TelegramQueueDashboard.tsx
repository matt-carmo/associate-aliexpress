"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Trash2, RefreshCw, ChevronDown, Timer, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
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
import type { BackendQueueItem, BackendQueueScheduleSettings } from "@/lib/queueTypes";
import {
  enqueueItem,
  removeQueueItem,
  updateQueueItem,
  clearQueue,
  getWhatsAppTarget,
  saveQueueSettings,
} from "@/lib/backendApi";
import {
  hydrateProduct,
  extractProductId,
  isShopeeUrl,
  extractShopeeItemId,
} from "@/lib/intelligence/hydrateProduct";
import { TEMPLATES, type TemplateKey } from "@/lib/intelligence/templates";
import { importBatchCsv, type ImportResult } from "@/lib/intelligence/csvImport";

const MESSAGING_BASE_URL =
  process.env.NEXT_PUBLIC_MESSAGING_API_URL || "http://localhost:4000";

const formatSchedule = (timestamp?: number): string => {
  if (!timestamp) return "Schedule: not set";
  const date = new Date(timestamp);
  return `Schedule: ${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

export const TelegramQueueDashboard = (): JSX.Element => {
  const [queue, setQueue] = useState<BackendQueueItem<DiscoveryProduct>[]>([]);
  const [queueStats, setQueueStats] = useState<{
    pending: number;
    failed: number;
  } | null>(null);
  const [scheduleSettings, setScheduleSettings] = useState<BackendQueueScheduleSettings | null>(null);
  const [minInterval, setMinInterval] = useState(5);
  const [maxInterval, setMaxInterval] = useState(7);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvTemplate, setCsvTemplate] = useState<TemplateKey>("padrao");
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvProgress, setCsvProgress] = useState(0);
  const [csvTotal, setCsvTotal] = useState(0);
  const [csvResult, setCsvResult] = useState<ImportResult | null>(null);
  const [csvFailedOpen, setCsvFailedOpen] = useState(false);
  const csvAbortRef = useRef<AbortController | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`${MESSAGING_BASE_URL}/queue`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue ?? []);
        setQueueStats(data.stats ?? null);
        const s = data.settings as BackendQueueScheduleSettings | undefined;
        if (s) {
          setScheduleSettings(s);
          setMinInterval((prev) => (prev ? prev : s.minIntervalMinutes));
          setMaxInterval((prev) => (prev ? prev : s.maxIntervalMinutes));
        }
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

    const result = await hydrateProduct(rawUrl);

    if (result) {
      setModalPreview(result.hydrated);
      setPromotionLink(result.promotionLink);
      setCaptionText(TEMPLATES.padrao.generate(result.hydrated, result.promotionLink));
      setModalStatus(
        result.promotionLink
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
      setCaptionText(TEMPLATES[template].generate(modalPreview, promotionLink));
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

  const handleSaveSettings = async () => {
    const min = Math.min(minInterval, maxInterval);
    const max = Math.max(minInterval, maxInterval);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 1 || max < 1) {
      setSettingsStatus("Informe valores válidos (1–60 min).");
      return;
    }
    setSavingSettings(true);
    try {
      await saveQueueSettings({ minIntervalMinutes: min, maxIntervalMinutes: max });
      setScheduleSettings({ minIntervalMinutes: min, maxIntervalMinutes: max });
      setMinInterval(min);
      setMaxInterval(max);
      setSettingsStatus("Intervalo atualizado.");
      await fetchQueue();
    } catch {
      setSettingsStatus("Erro ao salvar intervalo.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) return;
    setCsvImporting(true);
    setCsvProgress(0);
    setCsvTotal(0);
    setCsvResult(null);
    const controller = new AbortController();
    csvAbortRef.current = controller;

    try {
      const result = await importBatchCsv({
        file: csvFile,
        template: csvTemplate,
        signal: controller.signal,
        onProgress: (current, total) => {
          setCsvProgress(current);
          setCsvTotal(total);
        },
      });
      setCsvResult(result);
      await fetchQueue();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setAddStatus("Importação cancelada.");
      } else {
        setAddStatus("Erro ao importar CSV.");
      }
    } finally {
      setCsvImporting(false);
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
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearQueue}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear queue
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCsvFailedOpen(!csvFailedOpen)}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Importar CSV
          </Button>
        </div>
      </div>

      <Collapsible
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        className="rounded-md border border-white/10 bg-white/5"
      >
        <CollapsibleTrigger className="flex w-full items-center gap-2 p-2 text-left hover:bg-white/5 transition-colors">
          <Timer className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">Intervalo Random</span>
          {scheduleSettings ? (
            <Badge variant="secondary" className="font-mono text-xs">
              {scheduleSettings.minIntervalMinutes}–{scheduleSettings.maxIntervalMinutes}min
            </Badge>
          ) : null}
          {settingsStatus ? (
            <span className="text-xs text-muted-foreground truncate ml-auto mr-1">
              {settingsStatus}
            </span>
          ) : null}
          <ChevronDown
            className="h-4 w-4 text-muted-foreground shrink-0 transition-transform data-[state=open]:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-white/10">
          <div className="space-y-3 p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs">
                  {minInterval} min
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  {maxInterval} min
                </Badge>
              </div>
              <Slider
                value={[minInterval, maxInterval]}
                min={1}
                max={60}
                step={1}
                onValueChange={(v) => {
                  setMinInterval(v[0] ?? 1);
                  setMaxInterval(v[1] ?? 60);
                }}
                aria-label="Intervalo aleatório entre postagens"
              />
            </div>
            <div className="flex items-center gap-2">
              {settingsStatus ? (
                <span className="text-xs text-muted-foreground truncate">{settingsStatus}</span>
              ) : null}
              <Button
                size="sm"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="h-8 ml-auto"
              >
                {savingSettings ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

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

      {csvFailedOpen ? (
        <div className="rounded-md border border-white/10 bg-white/5">
          <div className="space-y-3 p-3">
            <div className="flex gap-2 items-center">
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  setCsvFile(e.target.files?.[0] ?? null);
                  setCsvResult(null);
                }}
                disabled={csvImporting}
                className="flex-1"
              />
              <Select
                value={csvTemplate}
                onValueChange={(v) => setCsvTemplate(v as TemplateKey)}
                disabled={csvImporting}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Template" />
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

            {csvImporting ? (
              <div className="space-y-1">
                <div className="h-2 w-full rounded bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: csvTotal ? `${(csvProgress / csvTotal) * 100}%` : "0%" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {csvProgress} / {csvTotal}
                </p>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              {csvImporting ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => csvAbortRef.current?.abort()}
                >
                  Cancelar
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleCsvImport}
                  disabled={!csvFile}
                >
                  Importar
                </Button>
              )}
            </div>

            {csvResult ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Inseridos: {csvResult.inserted} | Falhas: {csvResult.failedUrls.length}
                </p>
                {csvResult.failedUrls.length > 0 ? (
                  <Collapsible>
                    <CollapsibleTrigger className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Ver URLs com falha ({csvResult.failedUrls.length})
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-1 max-h-32 overflow-y-auto rounded bg-black/20 p-2">
                        {csvResult.failedUrls.map((url, i) => (
                          <p key={i} className="text-xs text-red-400 truncate">
                            {url}
                          </p>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
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
            {modalStatus || "Pronto"}
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
