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

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
```

Edit the `backend/.env` file with your credentials:

```env
ALIEXPRESS_APP_KEY=your_app_key
ALIEXPRESS_APP_SECRET=your_app_secret
SHOPEE_APP_ID=your_shopee_app_id
SHOPEE_APP_SECRET=your_shopee_app_secret
TELEGRAM_BOT_TOKEN=telegram_bot_token
TELEGRAM_BOT_ID=bot_id
TELEGRAM_CHAT_ID=telegram_chat_id
WHATSAPP_CHAT_ID=whatsapp_chat_id
PORT=4000
CORS_ORIGIN=*
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
```

Edit the `frontend/.env` file:

```env
ALIEXPRESS_APP_KEY=your_app_key
ALIEXPRESS_APP_SECRET=your_app_secret
SHOPEE_APP_ID=your_shopee_app_id
SHOPEE_APP_SECRET=your_shopee_app_secret
NEXT_PUBLIC_MESSAGING_API_URL=http://localhost:4000
TELEGRAM_CHAT_ID=telegram_chat_id
```

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
cp .env.example .env
npm install
npm run dev
```

The scraper will start at `http://localhost:4001`.

> **Important**: the scraper reuses your system's real Chrome profile directly
> (`~/.config/google-chrome` on Linux) so it shares your logged-in Shopee session —
> it does **not** copy the profile. Therefore, **close your normal Chrome before running
> the scraper**; otherwise Chrome will refuse to launch (profile already in use). If you
> need to run with Chrome open, set `PROFILE_DIR` in `scraper/.env` to a dedicated profile
> directory (and log into Shopee once in that profile).

### Production Build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm start
```

## Environment Variables

### Backend (`backend/.env`)

| Variable                | Description                                                      | Required |
| ----------------------- | ---------------------------------------------------------------- | -------- |
| `ALIEXPRESS_APP_KEY`    | AliExpress affiliate API App Key                                 | Yes      |
| `ALIEXPRESS_APP_SECRET` | AliExpress affiliate API App Secret                              | Yes      |
| `SHOPEE_APP_ID`         | Shopee affiliate API App ID                                      | Yes      |
| `SHOPEE_APP_SECRET`     | Shopee affiliate API App Secret                                  | Yes      |
| `TELEGRAM_BOT_TOKEN`    | Telegram bot token (provided by @BotFather)                      | Yes      |
| `TELEGRAM_BOT_ID`       | Telegram bot ID                                                  | No       |
| `TELEGRAM_CHAT_ID`      | Telegram chat/group ID for publishing                            | Yes      |
| `WHATSAPP_CHAT_ID`      | WhatsApp chat/group ID for publishing                            | No       |
| `PORT`                  | Server port (default: `4000`)                                    | No       |
| `CORS_ORIGIN`           | Allowed CORS origin (default: `*`)                               | No       |
| `QUEUE_DATA_DIR`        | Queue data directory (default: `data`)                           | No       |
| `WHATSAPP_AUTH_DIR`     | WhatsApp authentication directory (default: `auth_info_baileys`) | No       |

### Scraper (`scraper/.env`)

| Variable            | Description                                                                 | Required |
| ------------------- | --------------------------------------------------------------------------- | -------- |
| `PORT`              | Server port (default: `4001`)                                               | No       |
| `CORS_ORIGIN`       | Allowed CORS origin (default: `http://localhost:3000`)                     | No       |
| `CHROME_EXECUTABLE` | Chrome executable path (default: `google-chrome` on PATH)                  | No       |
| `CDP_PORT`          | Chrome DevTools Protocol port (default: `9222`)                             | No       |
| `PDP_TIMEOUT_MS`    | PDP capture timeout in ms (default: `30000`)                               | No       |
| `MAX_QUEUE`         | Max concurrent capture queue size (default: `20`)                           | No       |
| `PROFILE_DIR`       | Chrome profile directory. Default: OS real profile (`~/.config/google-chrome` on Linux). Close Chrome before running. | No |

### Frontend (`frontend/.env`)

| Variable                        | Description                                             | Required |
| ------------------------------- | ------------------------------------------------------- | -------- |
| `ALIEXPRESS_APP_KEY`            | AliExpress affiliate API App Key                        | Yes      |
| `ALIEXPRESS_APP_SECRET`         | AliExpress affiliate API App Secret                     | Yes      |
| `SHOPEE_APP_ID`                 | Shopee affiliate API App ID                             | Yes      |
| `SHOPEE_APP_SECRET`             | Shopee affiliate API App Secret                         | Yes      |
| `NEXT_PUBLIC_MESSAGING_API_URL` | Backend API base URL (default: `http://localhost:4000`) | Yes      |
| `TELEGRAM_CHAT_ID`              | Telegram chat ID                                        | No       |

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
