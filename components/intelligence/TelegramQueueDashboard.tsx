"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Clock3, Play, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildQualityWarnings, calculateTelegramCandidateScore, generateTelegramCaption } from "@/lib/intelligence/telegramPublishing";
import type { DiscoveryProduct } from "@/lib/intelligence/marketplaceDiscovery";
import { clearQueue, getQueue, removeFromQueue, type QueueItem } from "@/lib/queueStorage";

const DEFAULT_CHAT_ID = -1002399025968;
const FIVE_MINUTES = 0.10 * 60 * 1000;

const isPublishReady = (product: DiscoveryProduct): boolean => {
  const candidate = calculateTelegramCandidateScore(product);
  const warnings = buildQualityWarnings(product, candidate.score);

  return warnings.length === 0 || (warnings.length === 1 && warnings[0] === "No issues detected.");
};

export const TelegramQueueDashboard = (): JSX.Element => {
  const [queue, setQueue] = useState<QueueItem<DiscoveryProduct>[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastStatus, setLastStatus] = useState("Queue ready.");
  const [lastPostedId, setLastPostedId] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  const refreshQueue = () => setQueue(getQueue<DiscoveryProduct>());

  useEffect(() => {
    refreshQueue();

    const onStorage = () => refreshQueue();
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);

      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const publishNext = async () => {
    const currentQueue = getQueue<DiscoveryProduct>();
    const nextItem = currentQueue.find((item) => isPublishReady(item.data));

    if (!nextItem) {
      setLastStatus("No eligible products in queue.");
      setIsRunning(false);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const product = nextItem.data;
    const candidate = calculateTelegramCandidateScore(product);
    let affiliateLink = product.detailUrl || "";

    try {
      if (affiliateLink) {
        const linkResponse = await fetch(
          `/api/aliexpress?type=affiliate-link&product_detail_url=${encodeURIComponent(affiliateLink)}`
        );
        if (linkResponse.ok) {
          const payload = await linkResponse.json();
          if (payload.promotionLink) {
            affiliateLink = payload.promotionLink;
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch affiliate link for queue item", err);
    }

    const caption = generateTelegramCaption(product, affiliateLink, candidate.score);

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: DEFAULT_CHAT_ID,
          photoUrl: product.imageUrl || "",
          caption,
          product,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to send queued post");
      }

      removeFromQueue(nextItem.id);
      setQueue(getQueue<DiscoveryProduct>());
      setLastPostedId(nextItem.id);
      setLastStatus(`Posted ${product.title || "product"} successfully.`);
    } catch (error) {
      setLastStatus(error instanceof Error ? error.message : "Failed to publish queued item.");
    }
  };

  const handleStart = () => {
    if (intervalRef.current) {
      return;
    }

    setIsRunning(true);
    setLastStatus("Scheduler started. One item will be posted every 5 minutes.");

    intervalRef.current = window.setInterval(() => {
      void publishNext();
    }, FIVE_MINUTES);
  };

  const handleStop = () => {
    setIsRunning(false);
    setLastStatus("Scheduler stopped.");

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const eligibleQueue = useMemo(() => queue.filter((item) => isPublishReady(item.data)), [queue]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Telegram Queue</CardTitle>
          <CardDescription>View items waiting to be posted and start the 5-minute publishing scheduler.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{queue.length} item(s) in queue</p>
            <p>{eligibleQueue.length} item(s) ready to publish</p>
            <p>{lastStatus}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isRunning ? (
              <Button onClick={handleStart} className="gap-2">
                <Play className="h-4 w-4" />
                Start posting
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleStop} className="gap-2">
                <Square className="h-4 w-4" />
                Stop scheduler
              </Button>
            )}

            <Button variant="outline" onClick={refreshQueue} className="gap-2">
              <Clock3 className="h-4 w-4" />
              Refresh queue
            </Button>

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
                  {lastPostedId === item.id ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
                      Last posted
                    </span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
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
              Your queue is empty. Add eligible products and start the scheduler when ready.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
};
