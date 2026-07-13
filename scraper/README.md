# Shopee PDP Scraper

Scraper de PDP (Product Detail Page) da Shopee usando Playwright com `launchPersistentContext` e canal `"chrome"` (Google Chrome estável).

## Prerequisitos

- Node.js >= 20
- Google Chrome estável instalado (`google-chrome --version` deve retornar uma versão)
- Playwright >= 1.59 (instalado automaticamente via `npm install`)

## Setup

```bash
cd scraper
npm install
npx playwright install chrome
```

## Primeiro login

O scraper mantém uma sessão autenticada da Shopee em `scraper/.chrome-profile/`. Para criar essa sessão pela primeira vez (ou reautenticar quando expirar):

```bash
npm run scrape:login
```

Isso abre o Chrome em modo headed (janela visível). Faça login na Shopee normalmente, volte ao terminal e pressione Enter. A sessão será persistida automaticamente.

## Scrape contínuo

```bash
npm run dev
```

O scraper sobe em `http://localhost:4001` e expõe:

- `GET /health` — status da conexão Chrome + profundidade da fila
- `POST /pdp` — `{ "url": "https://shopee.com.br/..." }` → retorna `ShopeePdpData`

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste conforme necessário:

| Variável | Default | Descrição |
|---|---|---|
| `PORT` | `4001` | Porta do servidor Express |
| `CORS_ORIGIN` | `http://localhost:3000` | Origem permitida |
| `PDP_TIMEOUT_MS` | `30000` | Timeout para captura de PDP |
| `MAX_QUEUE` | `20` | Profundidade máxima da fila serial |
| `SHOPEE_HEADLESS` | `true` | `false` para rodar headed em debug |
| `PROFILE_DIR` | `scraper/.chrome-profile` | Diretório do perfil Chrome persistente |

## Troubleshooting

### `SHOPEE_SESSION_EXPIRED`

A sessão da Shopee expirou ou o perfil está vazio. Execute:

```bash
npm run scrape:login
```

### Chrome não encontrado

O Playwright precisa do Google Chrome estável instalado. Execute:

```bash
npx playwright install chrome
```

### Perfil corrompido

Delete o diretório `scraper/.chrome-profile/` e refaça o login:

```bash
rm -rf scraper/.chrome-profile
npm run scrape:login
```
