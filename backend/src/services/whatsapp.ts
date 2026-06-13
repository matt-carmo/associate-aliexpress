import makeWASocket, {
  Browsers,
  DisconnectReason,
  useMultiFileAuthState,
  WAMessage,
} from "@whiskeysockets/baileys";

import axios from "axios";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "loading";

const globalForWhatsApp = globalThis as typeof globalThis & {
  __whatsappSock?: ReturnType<typeof makeWASocket> | null;
  __whatsappQrCode?: string | null;
  __whatsappConnectionStatus?: ConnectionStatus;
  __whatsappIsInitializing?: boolean;
  __whatsappReconnectTimeout?: NodeJS.Timeout | null;
  __whatsappReconnectAttempts?: number;
};

let sock = globalForWhatsApp.__whatsappSock ?? null;
let qrCode = globalForWhatsApp.__whatsappQrCode ?? null;
let connectionStatus: ConnectionStatus =
  globalForWhatsApp.__whatsappConnectionStatus ?? "loading";
let isInitializing = globalForWhatsApp.__whatsappIsInitializing ?? false;
let reconnectTimeout = globalForWhatsApp.__whatsappReconnectTimeout ?? null;
let reconnectAttempts = globalForWhatsApp.__whatsappReconnectAttempts ?? 0;
let initPromise: Promise<void> | null = null;

globalForWhatsApp.__whatsappSock = sock;
globalForWhatsApp.__whatsappQrCode = qrCode;
globalForWhatsApp.__whatsappConnectionStatus = connectionStatus;
globalForWhatsApp.__whatsappIsInitializing = isInitializing;
globalForWhatsApp.__whatsappReconnectTimeout = reconnectTimeout;
globalForWhatsApp.__whatsappReconnectAttempts = reconnectAttempts;

function buildJid(target: string) {
  if (
    target.includes("@g.us") ||
    target.includes("@s.whatsapp.net")
  ) {
    return target;
  }

  const digits = target.replace(/[^0-9]/g, "");

  return `${digits}@s.whatsapp.net`;
}

function normalizeWhatsAppText(value: string) {
  return value
    .replace(/<s>(.*?)<\/s>/gi, "~$1~")
    .replace(/<b>(.*?)<\/b>/gi, "*$1*")
    .replace(/<strong>(.*?)<\/strong>/gi, "*$1*")
    .replace(/<code>(.*?)<\/code>/gi, "`$1`")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

async function init() {
  if (sock) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    isInitializing = true;
    globalForWhatsApp.__whatsappIsInitializing = true;

    try {
      const authDir = process.env.WHATSAPP_AUTH_DIR ?? "auth_info_baileys";
      const auth = await useMultiFileAuthState(authDir);

      const newSock = makeWASocket({
        auth: auth.state,
        browser: Browsers.ubuntu("AliExpress Affiliate"),
        markOnlineOnConnect: false,
        syncFullHistory: false,
      });

      sock = newSock;
      globalForWhatsApp.__whatsappSock = newSock;

      /*
       * CONNECTION
       */

      newSock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          qrCode = qr;
          globalForWhatsApp.__whatsappQrCode = qr;
        }

        if (connection === "connecting") {
          connectionStatus = "connecting";
          globalForWhatsApp.__whatsappConnectionStatus = "connecting";
          console.log("WhatsApp conectando...");
        }

        if (connection === "open") {
          console.log("WhatsApp conectado");

          connectionStatus = "connected";
          globalForWhatsApp.__whatsappConnectionStatus = "connected";

          qrCode = null;
          globalForWhatsApp.__whatsappQrCode = null;

          reconnectAttempts = 0;
          globalForWhatsApp.__whatsappReconnectAttempts = 0;

          try {
            const groups = await newSock.groupFetchAllParticipating();
            const entries = Object.values(groups).map((group) => ({
              id: group.id,
              subject: group.subject,
            }));
            console.log("Grupos disponíveis:");
            console.table(entries);
          } catch (error) {
            console.log("Erro ao buscar grupos:", error);
          }
        }

        if (connection === "close") {
          console.log("WhatsApp desconectado");

          connectionStatus = "disconnected";
          globalForWhatsApp.__whatsappConnectionStatus = "disconnected";

          const statusCode = (
            lastDisconnect?.error as { output?: { statusCode?: number } }
          )?.output?.statusCode;

          const shouldReconnect =
            statusCode !== DisconnectReason.loggedOut;

          sock = null;
          globalForWhatsApp.__whatsappSock = null;

          if (shouldReconnect) {
            if (reconnectTimeout) {
              clearTimeout(reconnectTimeout);
            }

            const delay = Math.min(
              1000 * Math.pow(2, reconnectAttempts),
              30000
            );

            reconnectAttempts++;
            globalForWhatsApp.__whatsappReconnectAttempts = reconnectAttempts;

            console.log(`Reconectando em ${delay}ms`);

            reconnectTimeout = setTimeout(() => {
              init();
            }, delay);
            globalForWhatsApp.__whatsappReconnectTimeout = reconnectTimeout;
          }
        }
      });

      /*
       * MESSAGES UPSERT
       */

      newSock.ev.on("messages.upsert", async ({ messages }) => {
        for (const message of messages as WAMessage[]) {
          const remoteJid = message.key.remoteJid;

          if (!remoteJid) continue;
        }
      });

      /*
       * CREDS
       */

      newSock.ev.on("creds.update", auth.saveCreds);
    } catch (error) {
      console.log("Erro ao inicializar WhatsApp:", error);
      sock = null;
      globalForWhatsApp.__whatsappSock = null;
    } finally {
      isInitializing = false;
      globalForWhatsApp.__whatsappIsInitializing = false;
      initPromise = null;
    }
  })();

  return initPromise;
}

export async function getSocket() {
  if (!sock) {
    await init();
  }

  if (sock && connectionStatus !== "connected") {
    const deadline = Date.now() + 30_000;
    while (
      (connectionStatus as ConnectionStatus) !== "connected" &&
      Date.now() < deadline
    ) {
      await new Promise<void>((r) => setTimeout(r, 500));
    }
  }

  return sock;
}

export async function sendImage(
  to: string,
  imageUrl: string,
  caption: string
) {
  const socket = await getSocket();

  if (!socket) {
    throw new Error(
      "WhatsApp socket not initialized"
    );
  }

  const { data } = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });

  const buffer = Buffer.from(data);

  const jid = buildJid(to);
  const normalizedCaption = normalizeWhatsAppText(caption ?? "");
  console.log("Enviando imagem para", jid, "com legenda:", normalizedCaption);
  await socket.sendMessage(jid, {
    image: buffer,
    caption: normalizedCaption,
  });
}

export async function sendText(
  to: string,
  text: string
) {
  const socket = await getSocket();

  if (!socket) {
    throw new Error(
      "WhatsApp socket not initialized"
    );
  }

  const jid = buildJid(to);
  const normalizedText = normalizeWhatsAppText(text ?? "");

  await socket.sendMessage(jid, {
    text: normalizedText,
  });
}

export function getQRCode() {
  return qrCode;
}

export function getConnectionStatus() {
  return connectionStatus;
}
