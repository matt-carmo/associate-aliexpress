# Associate Affiliate

Platform for managing and automatically publishing affiliate products from AliExpress and Shopee to **Telegram** and **WhatsApp**.

## Architecture

The project is a monorepo containing two applications:

| Folder     | Description                                                | Stack                                                 |
| ---------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| `frontend` | Web dashboard (CMS) to manage the product publishing queue | Next.js 15, React 19, Tailwind CSS, shadcn/ui         |
| `backend`  | Messaging API that publishes to Telegram and WhatsApp      | Express, Baileys (WhatsApp), Telegram Bot API, SQLite |

## Prerequisites

* **Node.js** >= 20
* **npm** >= 10
* Affiliate account on AliExpress Portals (to obtain App Key and App Secret)
* Affiliate account on Shopee (to obtain App ID and App Secret)
* Telegram Bot (create via @BotFather)
* WhatsApp account for connection through Baileys (QR Code)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd associate-affiliate
```

### 2. Setup environment variables

```bash
cp .env.example .env
# Edit .env with your credentials, then run:
make env
npm install
```

The `make env` command propagates `.env` to `backend/`, `frontend/`, and `scraper/`,
and generates `frontend/.env.development` / `frontend/.env.production`.

## Running the Project

### Backend

```bash
cd backend
npm run dev
```

The server will start at `http://localhost:4000`.

### Frontend

```bash
cd frontend
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

### Scraper (Shopee PDP)

```bash
cd scraper
npm install
npm run dev
```

The scraper will start at `http://localhost:4001`.

> **Important**: the scraper reuses your system's real Chrome profile directly
> (`~/.config/google-chrome` on Linux) so it shares your logged-in Shopee session —
> it does **not** copy the profile. Therefore, **close your normal Chrome before running
> the scraper**; otherwise Chrome will refuse to launch (profile already in use). If you
> need to run with Chrome open, set `PROFILE_DIR` in `.env` to a dedicated profile
> directory (and log into Shopee once in that profile).

### Production Build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm start
```

## Environment Variables

All variables are defined in the root `.env` file and propagated via `make env`.

| Variable                        | Used by         | Description                                                         | Required |
| ------------------------------- | --------------- | ------------------------------------------------------------------- | -------- |
| `ALIEXPRESS_APP_KEY`            | Frontend        | AliExpress affiliate API App Key                                    | Yes      |
| `ALIEXPRESS_APP_SECRET`         | Frontend        | AliExpress affiliate API App Secret                                 | Yes      |
| `SHOPEE_APP_ID`                 | Frontend        | Shopee affiliate API App ID                                         | Yes      |
| `SHOPEE_APP_SECRET`             | Frontend        | Shopee affiliate API App Secret                                     | Yes      |
| `TELEGRAM_BOT_TOKEN`            | Backend         | Telegram bot token (from @BotFather)                                | Yes      |
| `TELEGRAM_BOT_ID`               | Backend         | Telegram bot ID                                                     | No       |
| `TELEGRAM_CHAT_ID`              | Backend         | Telegram chat/group ID for publishing                               | Yes      |
| `WHATSAPP_CHAT_ID`              | Backend         | WhatsApp chat/group ID for publishing                               | No       |
| `BACKEND_PORT`                  | Backend         | Server port (default: `4000`)                                       | No       |
| `CORS_ORIGIN`                   | Backend         | Allowed CORS origin (default: `*`)                                  | No       |
| `QUEUE_DATA_DIR`                | Backend         | Queue database directory (default: `data`)                          | No       |
| `WHATSAPP_AUTH_DIR`             | Backend         | WhatsApp auth directory (default: `auth_info_baileys`)              | No       |
| `NEXT_PUBLIC_MESSAGING_API_URL` | Frontend(client)| Backend API URL (default: `http://localhost:4000`)                  | Yes      |
| `SCRAPER_API_URL`               | Frontend(server)| Scraper API URL (default: `http://localhost:4001`)                  | No       |
| `SCRAPER_PORT`                  | Scraper         | Server port (default: `4001`)                                       | No       |
| `SCRAPER_CORS_ORIGIN`           | Scraper         | Allowed CORS origin (default: `http://localhost:3000`)              | No       |
| `PDP_TIMEOUT_MS`                | Scraper         | PDP capture timeout in ms (default: `30000`)                        | No       |
| `MAX_QUEUE`                     | Scraper         | Max concurrent capture queue size (default: `20`)                   | No       |
| `SHOPEE_HEADLESS`               | Scraper         | Run Chrome headless (default: `true`)                               | No       |
| `PROFILE_DIR`                   | Scraper         | Chrome profile directory. Default: OS real profile. Close Chrome before running. | No |

## Features

* **Queue Dashboard** — view and manage products in the publishing queue
* **Scheduled Publishing** — the scheduler automatically sends products to Telegram and WhatsApp
* **WhatsApp Connection** — scan the QR Code on the Settings screen to connect WhatsApp
* **Multi-channel Delivery** — each product is sent to Telegram and WhatsApp with individual retry handling per channel
* **AliExpress Affiliate API** — search products and generate affiliate links
* **Shopee Affiliate API** — search products, generate short links, and track conversions

## API Endpoints (Backend)

| Method | Route                  | Description                  |
| ------ | ---------------------- | ---------------------------- |
| GET    | `/health`              | Server and connection status |
| GET    | `/whatsapp/status`     | WhatsApp connection status   |
| POST   | `/whatsapp/send`       | Send message via WhatsApp    |
| GET    | `/queue`               | List queue items             |
| POST   | `/telegram/send-photo` | Send photo via Telegram      |

## License

Private — internal use only.
