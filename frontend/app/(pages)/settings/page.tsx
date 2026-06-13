"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


export default function SettingsPage() {
  const [status, setStatus] = useState<string>("disconnected");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<"" | "ok" | "error">("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messagingBaseUrl =
    process.env.NEXT_PUBLIC_MESSAGING_API_URL || "http://localhost:4000";

  useEffect(() => {
    const stored = localStorage.getItem("whatsapp_target") ?? "";
    setTarget(stored);
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${messagingBaseUrl}/whatsapp/status`);
        const data = await res.json();

        console.log("Status update:", data);
        setStatus(data.connection);
        setQrCode(data.qrCode ?? null);
        setTelegramChatId(data.telegramChatId ?? "");
      } catch {
        // polling error
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!qrCode || !canvasRef.current) return;
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current!, qrCode, { width: 256 }, (err) => {
        if (err) console.error(err);
      });
    });
  }, [qrCode]);

  function saveTarget() {
    localStorage.setItem("whatsapp_target", target);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function sendTestMessage() {
    if (!target || sendingTest) return;

    setSendingTest(true);
    setTestStatus("");

    try {
      const res = await fetch(`${messagingBaseUrl}/whatsapp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: target, text: "Oi" }),
      });

      setTestStatus(res.ok ? "ok" : "error");
    } catch {
      setTestStatus("error");
    } finally {
      setSendingTest(false);
      setTimeout(() => setTestStatus(""), 3000);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <span
              className={`inline-flex items-center gap-1.5 text-sm ${
                status === "connected"
                  ? "text-green-600"
                  : status === "connecting"
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "connected"
                    ? "bg-green-600"
                    : status === "connecting"
                      ? "bg-yellow-600"
                      : "bg-red-600"
                }`}
              />
              {status === "connected"
                ? "Connected"
                : status === "connecting"
                  ? "Connecting..."
                  : "Disconnected"}
            </span>
          </div>

          {status !== "connected" && qrCode && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Scan with WhatsApp on your phone
              </p>
              <canvas ref={canvasRef} className="border" />
            </div>
          )}

          {status !== "connected" && !qrCode && (
            <p className="text-sm text-muted-foreground">
              Initializing connection...
            </p>
          )}

          <div className="space-y-2">
            <label htmlFor="target" className="text-sm font-medium">Target number / group ID</label>
            <div className="flex gap-2">
              <Input
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="5511999999999"
              />
              <Button onClick={saveTarget} variant="outline">
                {saved ? "Saved!" : "Save"}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={sendTestMessage} disabled={!target || sendingTest}>
                {sendingTest ? "Enviando..." : "Enviar Oi"}
              </Button>
              {testStatus === "ok" && (
                <span className="text-xs text-green-600">Enviado</span>
              )}
              {testStatus === "error" && (
                <span className="text-xs text-red-600">Falhou</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Phone number with country code (digits only). Used when sending
              from the product dialog.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telegram</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Chat ID:</span>
            <span className="text-sm text-muted-foreground">
              {telegramChatId || "Not configured"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Configured via <code>TELEGRAM_CHAT_ID</code> in .env
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
