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

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
```

Edite o arquivo `backend/.env` com suas credenciais:

```env
ALIEXPRESS_APP_KEY=seu_app_key
ALIEXPRESS_APP_SECRET=seu_app_secret
SHOPEE_APP_ID=seu_shopee_app_id
SHOPEE_APP_SECRET=seu_shopee_app_secret
TELEGRAM_BOT_TOKEN=token_do_bot_telegram
TELEGRAM_BOT_ID=id_do_bot
TELEGRAM_CHAT_ID=id_do_chat_telegram
WHATSAPP_CHAT_ID=id_do_chat_whatsapp
PORT=4000
CORS_ORIGIN=*
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
```

Edite o arquivo `frontend/.env`:

```env
ALIEXPRESS_APP_KEY=seu_app_key
ALIEXPRESS_APP_SECRET=seu_app_secret
SHOPEE_APP_ID=seu_shopee_app_id
SHOPEE_APP_SECRET=seu_shopee_app_secret
NEXT_PUBLIC_MESSAGING_API_URL=http://localhost:4000
TELEGRAM_CHAT_ID=id_do_chat_telegram
```

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

### Build para produção

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm start
```

## Variáveis de ambiente

### Backend (`backend/.env`)

| Variável                 | Descrição                                          | Obrigatório |
| ------------------------ | -------------------------------------------------- | ----------- |
| `ALIEXPRESS_APP_KEY`     | App Key da API de afiliados do AliExpress          | Sim         |
| `ALIEXPRESS_APP_SECRET`  | App Secret da API de afiliados do AliExpress       | Sim         |
| `SHOPEE_APP_ID`          | App ID da API de afiliados do Shopee               | Sim         |
| `SHOPEE_APP_SECRET`      | App Secret da API de afiliados do Shopee           | Sim         |
| `TELEGRAM_BOT_TOKEN`     | Token do bot do Telegram (fornecido pelo @BotFather) | Sim         |
| `TELEGRAM_BOT_ID`        | ID do bot do Telegram                              | Não         |
| `TELEGRAM_CHAT_ID`       | ID do chat/grupo do Telegram para publicação       | Sim         |
| `WHATSAPP_CHAT_ID`       | ID do chat/grupo do WhatsApp para publicação       | Não         |
| `PORT`                   | Porta do servidor (padrão: `4000`)                 | Não         |
| `CORS_ORIGIN`            | Origem permitida no CORS (padrão: `*`)             | Não         |
| `QUEUE_DATA_DIR`         | Diretório dos dados da fila (padrão: `data`)       | Não         |
| `WHATSAPP_AUTH_DIR`      | Diretório de autenticação do WhatsApp (padrão: `auth_info_baileys`) | Não |

### Frontend (`frontend/.env`)

| Variável                          | Descrição                                    | Obrigatório |
| --------------------------------- | -------------------------------------------- | ----------- |
| `ALIEXPRESS_APP_KEY`              | App Key da API de afiliados do AliExpress    | Sim         |
| `ALIEXPRESS_APP_SECRET`           | App Secret da API de afiliados do AliExpress | Sim         |
| `SHOPEE_APP_ID`                   | App ID da API de afiliados do Shopee         | Sim         |
| `SHOPEE_APP_SECRET`               | App Secret da API de afiliados do Shopee     | Sim         |
| `NEXT_PUBLIC_MESSAGING_API_URL`   | URL base da API do backend (padrão: `http://localhost:4000`) | Sim |
| `TELEGRAM_CHAT_ID`                | ID do chat do Telegram                       | Não         |

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
