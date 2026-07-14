# Associate Affiliate

Plataforma para gerenciar e publicar automaticamente produtos de afiliados do AliExpress e Shopee no **Telegram** e **WhatsApp**.

## Arquitetura

O projeto é um monorepo com duas aplicações:

| Pasta      | Descrição                                         | Stack                                |
| ---------- | ------------------------------------------------- | ------------------------------------ |
| `frontend` | Painel web (CMS) para gerenciar a fila de produtos | Next.js 15, React 19, Tailwind CSS, shadcn/ui |
| `backend`  | API de mensageria que publica no Telegram e WhatsApp | Express, Baileys (WhatsApp), Telegram Bot API, SQLite |

## Pré-requisitos

- **Node.js** >= 20
- **npm** >= 10
- Conta de afiliado no [AliExpress Portals](https://portals.aliexpress.com/) (para obter App Key e App Secret)
- Conta de afiliado no Shopee (para obter App ID e App Secret)
- Bot do Telegram (crie via [@BotFather](https://t.me/BotFather))
- WhatsApp para conexão via Baileys (QR Code)

## Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd associate-affiliate
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com suas credenciais, depois execute:
make env
npm install
```

O comando `make env` propaga `.env` para `backend/`, `frontend/` e `scraper/`,
e gera `frontend/.env.development` / `frontend/.env.production`.

## Executando o projeto

### Backend

```bash
cd backend
npm run dev
```

O servidor será iniciado em `http://localhost:4000`.

### Frontend

```bash
cd frontend
npm run dev
```

O painel será aberto em `http://localhost:3000`.

### Scraper (Shopee PDP)

```bash
cd scraper
npm install
npm run dev
```

O scraper será iniciado em `http://localhost:4001`.

> **Importante**: o scraper reutiliza diretamente o perfil do Chrome do seu sistema
> (`~/.config/google-chrome` no Linux) para compartilhar a sessão logada da Shopee —
> ele **não** copia o perfil. Por isso, **feche o Chrome normal antes de rodar o scraper**;
> caso contrário o Chrome recusa iniciar (perfil em uso). Se precisar rodar com o Chrome
> aberto, defina `PROFILE_DIR` no `.env` apontando para um diretório de perfil
> dedicado (e faça login na Shopee uma vez nesse perfil).

### Build para produção

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm start
```

## Variáveis de ambiente

Todas as variáveis são definidas no `.env` raiz e propagadas via `make env`.

| Variável                          | Usado por       | Descrição                                                         | Obrigatório |
| --------------------------------- | --------------- | ----------------------------------------------------------------- | ----------- |
| `ALIEXPRESS_APP_KEY`              | Frontend        | App Key da API de afiliados do AliExpress                         | Sim         |
| `ALIEXPRESS_APP_SECRET`           | Frontend        | App Secret da API de afiliados do AliExpress                      | Sim         |
| `SHOPEE_APP_ID`                   | Frontend        | App ID da API de afiliados do Shopee                              | Sim         |
| `SHOPEE_APP_SECRET`               | Frontend        | App Secret da API de afiliados do Shopee                          | Sim         |
| `TELEGRAM_BOT_TOKEN`              | Backend         | Token do bot do Telegram (fornecido pelo @BotFather)              | Sim         |
| `TELEGRAM_BOT_ID`                 | Backend         | ID do bot do Telegram                                             | Não         |
| `TELEGRAM_CHAT_ID`                | Backend         | ID do chat/grupo do Telegram para publicação                      | Sim         |
| `WHATSAPP_CHAT_ID`                | Backend         | ID do chat/grupo do WhatsApp para publicação                      | Não         |
| `BACKEND_PORT`                    | Backend         | Porta do servidor (padrão: `4000`)                                | Não         |
| `CORS_ORIGIN`                     | Backend         | Origem permitida no CORS (padrão: `*`)                            | Não         |
| `QUEUE_DATA_DIR`                  | Backend         | Diretório do banco da fila (padrão: `data`)                       | Não         |
| `WHATSAPP_AUTH_DIR`               | Backend         | Diretório de auth do WhatsApp (padrão: `auth_info_baileys`)       | Não         |
| `NEXT_PUBLIC_MESSAGING_API_URL`   | Frontend(client)| URL da API do backend (padrão: `http://localhost:4000`)           | Sim         |
| `SCRAPER_API_URL`                 | Frontend(server)| URL da API do scraper (padrão: `http://localhost:4001`)           | Não         |
| `SCRAPER_PORT`                    | Scraper         | Porta do servidor (padrão: `4001`)                                | Não         |
| `SCRAPER_CORS_ORIGIN`             | Scraper         | Origem permitida no CORS (padrão: `http://localhost:3000`)        | Não         |
| `PDP_TIMEOUT_MS`                  | Scraper         | Timeout da captura de PDP em ms (padrão: `30000`)                 | Não         |
| `MAX_QUEUE`                       | Scraper         | Tamanho máximo da fila de captura (padrão: `20`)                  | Não         |
| `SHOPEE_HEADLESS`                 | Scraper         | Rodar Chrome headless (padrão: `true`)                            | Não         |
| `PROFILE_DIR`                     | Scraper         | Diretório do perfil Chrome. Padrão: perfil real do OS. Feche o Chrome antes de rodar. | Não |

## Funcionalidades

- **Painel de fila** — visualize e gerencie produtos na fila de publicação
- **Publicação agendada** — o scheduler envia produtos automaticamente para Telegram e WhatsApp
- **Conexão WhatsApp** — escaneie o QR Code na tela de Settings para conectar o WhatsApp
- **Envio multi-canal** — cada produto é enviado para Telegram e WhatsApp, com retry individual por canal
- **API de afiliados AliExpress** — busca de produtos e geração de links de afiliado
- **API de afiliados Shopee** — busca de produtos, geração de short links e rastreamento de conversões

## Endpoints da API (Backend)

| Método | Rota                    | Descrição                        |
| ------ | ----------------------- | -------------------------------- |
| GET    | `/health`               | Status do servidor e conexões    |
| GET    | `/whatsapp/status`      | Status da conexão WhatsApp       |
| POST   | `/whatsapp/send`        | Enviar mensagem via WhatsApp     |
| GET    | `/queue`                | Listar itens da fila             |
| POST   | `/telegram/send-photo`  | Enviar foto via Telegram         |

## Licença

Privado — uso interno.
