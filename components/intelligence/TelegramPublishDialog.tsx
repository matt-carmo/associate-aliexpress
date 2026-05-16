"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DiscoveryProduct } from "@/lib/intelligence/marketplaceDiscovery";
import {
  buildQualityWarnings,
  calculateTelegramCandidateScore,
  generateTelegramCaption,
} from "@/lib/intelligence/telegramPublishing";

const DEFAULT_CHAT_ID = "-1002399025968";

export const TelegramPublishDialog = ({ product }: { product: DiscoveryProduct }): JSX.Element => {
  const [open, setOpen] = useState(false);
  const [affiliateLink, setAffiliateLink] = useState("");
  const [caption, setCaption] = useState("");
  const [chatId, setChatId] = useState(DEFAULT_CHAT_ID);
  const [status, setStatus] = useState<"idle" | "loading-link" | "ready" | "sending" | "sent" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const candidate = useMemo(() => calculateTelegramCandidateScore(product), [product]);
  const warnings = useMemo(() => buildQualityWarnings(product, candidate.score), [candidate.score, product]);

  const buildCaption = (link: string): string => {
    return generateTelegramCaption(product, link || product.detailUrl || "", candidate.score);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const loadLink = async () => {
      setStatus("loading-link");
      setStatusMessage("");

      try {
        const detailUrl = product.detailUrl || "";
        if (!detailUrl) {
          const fallbackCaption = buildCaption("");
          setCaption(fallbackCaption);
          setStatus("ready");
          setStatusMessage("Using fallback preview because no product detail URL was found.");
          return;
        }

        const response = await fetch(
          `/api/aliexpress?type=affiliate-link&product_detail_url=${encodeURIComponent(detailUrl)}`
        );

        if (!response.ok) {
          throw new Error("Failed to generate affiliate link");
        }

        const payload = await response.json();
        const promotionLink = payload.promotionLink;
        setAffiliateLink(promotionLink);
        setCaption(buildCaption(promotionLink));
        setStatus("ready");
      } catch (error) {
        const fallbackCaption = buildCaption(product.detailUrl || "");
        setAffiliateLink(product.detailUrl || "");
        setCaption(fallbackCaption);
        setStatus("error");
        setStatusMessage(error instanceof Error ? error.message : "Failed to generate affiliate link");
      }
    };

    void loadLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product.detailUrl, product.productId]);

  const handleSend = async () => {
    setStatus("sending");
    setStatusMessage("");

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: Number(chatId),
          photoUrl: product.imageUrl || "",
          caption,
          product,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Failed to send Telegram post");
      }

      setStatus("sent");
      setStatusMessage("Sent to Telegram successfully.");
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Failed to send Telegram post");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="w-full sm:w-auto">
          Quick publish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Quick publish to Telegram</DialogTitle>
          <DialogDescription>
            Preview the caption, inspect the warnings, and publish only when the product feels channel-ready.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Telegram Candidate Score</p>
                  <p className="text-3xl font-semibold">{candidate.score}/100</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{product.discoveryPoolName || product.discoverySourceLabel || "Marketplace feed"}</p>
                  <p>{product.discoverySourceWeight ? `Priority ${product.discoverySourceWeight}` : "Priority feed"}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {candidate.reasons.slice(0, 5).map((reason) => (
                  <span key={reason} className="rounded-full bg-background px-3 py-1 text-foreground/80">
                    {reason}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Caption preview</label>
              <Textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                className="min-h-[260px] font-mono text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  setStatus("loading-link");
                  try {
                    const response = await fetch(
                      `/api/aliexpress?type=affiliate-link&product_detail_url=${encodeURIComponent(product.detailUrl || "")}`
                    );

                    if (!response.ok) {
                      throw new Error("Failed to generate affiliate link");
                    }

                    const payload = await response.json();
                    const promotionLink = payload.promotionLink || product.detailUrl || "";
                    setAffiliateLink(promotionLink);
                    setCaption(buildCaption(promotionLink));
                    setStatus("ready");
                  } catch (error) {
                    setStatus("error");
                    setStatusMessage(error instanceof Error ? error.message : "Failed to generate affiliate link");
                  }
                }}
              >
                Generate affiliate link
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(caption);
                  setStatusMessage("Caption copied to clipboard.");
                  setStatus("ready");
                }}
              >
                Copy caption
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const nextCaption = buildCaption(affiliateLink || product.detailUrl || "");
                  setCaption(nextCaption);
                  setStatus("ready");
                }}
              >
                Refresh preview
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Publish tips</p>
              <div className="mt-3 space-y-2 text-sm">
                {warnings.length > 0 ? (
                  warnings.map((warning) => (
                    <div key={warning} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-700">
                      {warning}
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-700">
                    No issues detected.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Telegram channel</p>
                <Input value={chatId} onChange={(event) => setChatId(event.target.value)} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Affiliate link</p>
                <Input value={affiliateLink} onChange={(event) => setAffiliateLink(event.target.value)} placeholder="Generate or paste link" />
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Preview status: {status}</p>
                {statusMessage ? <p>{statusMessage}</p> : null}
              </div>
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={handleSend}
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending…" : "Send to Telegram"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TelegramPublishDialog;
