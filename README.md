# Sistema de Achados e Perdidos — UTFPR

Sistema web completo para gerenciamento de **Achados e Perdidos** da UTFPR (Universidade Tecnológica Federal do Paraná). Permite o registro público de itens perdidos e encontrados, com fluxo de reivindicação, comentários, histórico de status e moderação por administradores.

Construído com **Next.js (App Router) + TypeScript + Prisma + SQLite + NextAuth.js v5 + Tailwind CSS**.

---

## Sumário

1. [Instalação, Configuração e Execução](#1-instalação-configuração-e-execução)
2. [Dados de Teste](#2-dados-de-teste)
3. [Decisões de Arquitetura](#3-decisões-de-arquitetura)
4. [Como Alternar Storage (S3/Supabase)](#4-como-alternar-storage)
5. [Rotas da API](#5-rotas-da-api)
6. [Chaves/Configs (.env)](#6-chavesconfigs-env)
7. [Estrutura do Projeto](#7-estrutura-do-projeto)

---

## 1. Instalação, Configuração e Execução

### Requisitos

- **Node.js 20+**
- **npm 10+**

### Setup local

```bash
git clone <url-do-repo>
cd utfpr-achados-perdidos
cp .env.example .env
# Edite .env e gere um AUTH_SECRET (ver seção 6)

npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### Build de produção

```bash
npm run build
npm run start
```

### Docker Compose (opcional)

Um `docker-compose.yml` está incluído. Para executar com Docker:

```bash
cp .env.example .env
docker compose up
```

O serviço sobe um container Node.js que executa `npm install`, aplica as migrations, executa o seed e inicia o servidor em produção. Acesse [http://localhost:3000](http://localhost:3000).

---

## 2. Dados de Teste

O seed cria automaticamente os seguintes usuários:

| Perfil  | E-mail                | Senha             |
| ------- | --------------------- | ----------------- |
| Admin   | `admin@utfpr.br`      | `SenhaTeste123!`  |
| Usuário | `usuario@utfpr.br`    | `SenhaTeste123!`  |

E **8 itens de exemplo** (2 Perdido, 2 Em verificação, 2 Encontrado, 2 Devolvido), 3 comentários e 1 reivindicação pendente.

### Passo a passo de teste — fluxo completo

1. **Login como usuário comum** (`usuario@utfpr.br` / `SenhaTeste123!`).
2. Clique em **"+ Novo Registro"** e crie um item **Perdido** (ex.: "Carteira perdida na biblioteca"). Status inicial: *Perdido*.
3. Crie um item **Encontrado** (ex.: "Pendrive encontrado no Lab 3"). Status inicial: *Em verificação*.
4. Em qualquer item, abra os detalhes e clique no botão flutuante **"+ Adicionar Comentário"** — o comentário aparece sem recarregar a página.
5. **Saia** e **entre como admin** (`admin@utfpr.br` / `SenhaTeste123!`). Como admin, você pode:
   - Alterar o status de qualquer item (botão **Alterar status**).
   - Excluir qualquer comentário (ícone de lixeira).
   - Aprovar ou recusar reivindicações pendentes (seção que aparece nos detalhes do item).
6. **Saia** e **entre como outro usuário** (cadastre-se em `/register`). Acesse o item Encontrado criado e clique em **Reivindicar**, descrevendo a posse e (opcionalmente) anexando uma imagem de prova.
7. **Volte como admin** e abra o item — verá a seção **"Reivindicações Pendentes"**. Clique em **Aprovar**.
8. Verifique que o status mudou para **Devolvido** e que esta mudança aparece no **Histórico de status** ao final da página.

---

## 3. Decisões de Arquitetura

### Stack escolhida

- **Next.js 14 (App Router) + TypeScript** — server components reduzem JS no cliente, permitem busca de dados direto no servidor (sem REST interna), e tipagem end-to-end com Prisma. App Router permite separar facilmente código de servidor e cliente.
- **Prisma + SQLite** — execução local sem dependências externas. Migration e seed reproduzíveis. Para produção, basta trocar o `provider` em `prisma/schema.prisma` para `postgresql` ou `mysql` e ajustar o `DATABASE_URL`.
- **NextAuth.js v5 (Auth.js)** com Credentials Provider — sessões JWT, CSRF e cookies seguros prontos. Custo zero para integrar.
- **Tailwind CSS** + componentes utilitários (`btn-primary`, `card`, `badge`, etc.) — produtividade sem dependência de runtime de design system. shadcn/ui-style sem precisar do CLI.
- **Zod** — validação dos payloads tanto no client quanto no server.
- **bcryptjs** — hash de senhas (10 rounds).

### Limitações conhecidas

- **SQLite** não é adequado para produção com múltiplas instâncias ou alto volume de escrita concorrente. Usar PostgreSQL/MySQL nesse cenário.
- **SQLite + Prisma** não suporta **enums nativos**: os campos enum-like (`role`, `type`, `category`, `status`) são armazenados como `String` e validados no app via Zod e tipos TS. Em PostgreSQL/MySQL, basta voltar a usar `enum`.
- **Armazenamento local de uploads** em `public/uploads/` é simples mas **não funciona em ambientes com filesystem efêmero** (Vercel, Heroku, containers sem volume). Para produção, ver [seção 4](#4-como-alternar-storage).
- **Geolocalização** preenche apenas coordenadas (lat/lng). Reverse geocoding requer integração com Google Maps/OpenStreetMap (não incluída).
- **Autenticação por OAuth** (Google, Microsoft) não está incluída — apenas Credentials.

### Trade-offs

| Trade-off                                | Escolha feita                                  |
| ---------------------------------------- | ---------------------------------------------- |
| Armazenamento local vs S3                | Local (simplicidade); migração documentada     |
| SQLite vs PostgreSQL                     | SQLite (zero dependências em dev)              |
| Server actions vs API routes             | API routes (interoperabilidade com clients)    |
| Componente UI custom vs shadcn/ui CLI    | Estilos custom em CSS Tailwind (sem CLI extra) |

---

## 4. Como Alternar Storage

O upload local fica em `src/lib/upload.ts`. Para migrar para **S3/Supabase Storage**:

### S3 (AWS)

1. Adicionar dependências:
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```
2. Variáveis de ambiente em `.env`:
   ```env
   STORAGE_DRIVER="s3"
   S3_BUCKET="utfpr-achados"
   S3_REGION="us-east-1"
   S3_ACCESS_KEY_ID="..."
   S3_SECRET_ACCESS_KEY="..."
   ```
3. Substituir o conteúdo de `saveUploadedImage` em `src/lib/upload.ts`:

   ```ts
   import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
   import crypto from "crypto";

   const s3 = new S3Client({
     region: process.env.S3_REGION!,
     credentials: {
       accessKeyId: process.env.S3_ACCESS_KEY_ID!,
       secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
     },
   });

   export async function saveUploadedImage(file: File): Promise<string> {
     // ... validações de mimetype/size iguais às atuais ...
     const ext = file.type === "image/png" ? "png" : "jpg";
     const key = `${crypto.randomUUID()}.${ext}`;
     await s3.send(
       new PutObjectCommand({
         Bucket: process.env.S3_BUCKET!,
         Key: key,
         Body: Buffer.from(await file.arrayBuffer()),
         ContentType: file.type,
       })
     );
     return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
   }
   ```

### Supabase Storage

1. Adicionar dependência:
   ```bash
   npm install @supabase/supabase-js
   ```
2. Variáveis de ambiente:
   ```env
   STORAGE_DRIVER="supabase"
   SUPABASE_URL="https://<project>.supabase.co"
   SUPABASE_SERVICE_KEY="..."
   SUPABASE_BUCKET="achados"
   ```
3. Em `src/lib/upload.ts`:

   ```ts
   import { createClient } from "@supabase/supabase-js";
   import crypto from "crypto";

   const supabase = createClient(
     process.env.SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_KEY!
   );

   export async function saveUploadedImage(file: File): Promise<string> {
     // ... validações iguais ...
     const ext = file.type === "image/png" ? "png" : "jpg";
     const key = `${crypto.randomUUID()}.${ext}`;
     const { error } = await supabase.storage
       .from(process.env.SUPABASE_BUCKET!)
       .upload(key, Buffer.from(await file.arrayBuffer()), {
         contentType: file.type,
       });
     if (error) throw new UploadError("Falha ao enviar imagem.");
     const { data } = supabase.storage
       .from(process.env.SUPABASE_BUCKET!)
       .getPublicUrl(key);
     return data.publicUrl;
   }
   ```

A interface `saveUploadedImage(file: File): Promise<string>` é a mesma — basta trocar a implementação. Nada mais no código precisa mudar.

---

## 5. Rotas da API

Todas as rotas retornam JSON. As rotas **read-only** abaixo (GET) são **públicas** (sem auth). As demais exigem sessão.

### `GET /api/items?status=&category=&page=`

Lista paginada (9 itens por página), ordenada do mais recente para o mais antigo. Filtros opcionais.

**Query params:**

- `status` — `PERDIDO` | `ENCONTRADO` | `EM_VERIFICACAO` | `DEVOLVIDO`
- `category` — `ELETRONICOS` | `DOCUMENTOS` | `VESTUARIO` | `OUTROS`
- `page` — número (default `1`)

**Exemplo de request:**

```bash
curl "http://localhost:3000/api/items?status=PERDIDO&page=1"
```

**Exemplo de response (200):**

```json
{
  "page": 1,
  "pageSize": 9,
  "total": 2,
  "totalPages": 1,
  "items": [
    {
      "id": "cmoulf5nv00073qu0hoitwe4j",
      "title": "Mochila azul desaparecida",
      "description": "Mochila azul-marinho da marca Nike...",
      "type": "PERDIDO",
      "category": "OUTROS",
      "location": "Bloco F — Sala F-12",
      "photoUrl": "/uploads/placeholder.svg",
      "status": "PERDIDO",
      "authorId": "cmoulf5n70000...",
      "createdAt": "2026-05-06T21:52:30.638Z",
      "updatedAt": "2026-05-06T21:52:30.638Z",
      "author": { "id": "cmoulf5n70000...", "name": "Aluno Teste" }
    }
  ]
}
```

### `GET /api/items/[id]`

Retorna o item completo, incluindo comentários, reivindicações e histórico de status.

**Exemplo:**

```bash
curl "http://localhost:3000/api/items/cmoulf5pq000v3qu0v50w0vg9"
```

**Response (200):**

```json
{
  "item": {
    "id": "cmoulf5pq000v3qu0v50w0vg9",
    "title": "Calculadora HP 12C esquecida em prova",
    "description": "...",
    "type": "ENCONTRADO",
    "category": "ELETRONICOS",
    "location": "Bloco B — Sala B-21",
    "photoUrl": "/uploads/placeholder.svg",
    "status": "ENCONTRADO",
    "createdAt": "2026-05-06T21:52:30.638Z",
    "updatedAt": "2026-05-06T21:52:30.638Z",
    "author": { "id": "...", "name": "Administrador UTFPR" },
    "comments": [
      {
        "id": "...",
        "text": "Acho que vi essa carteira na recepção...",
        "createdAt": "2026-05-06T21:52:30.700Z",
        "author": { "id": "...", "name": "Administrador UTFPR" }
      }
    ],
    "claims": [],
    "statusLogs": [
      {
        "id": "...",
        "previousStatus": null,
        "newStatus": "ENCONTRADO",
        "createdAt": "2026-05-06T21:52:30.638Z",
        "changedBy": { "id": "...", "name": "Administrador UTFPR" }
      }
    ]
  }
}
```

### Demais rotas (autenticadas)

| Método | Rota                                | Quem pode usar                  | Descrição                                  |
| ------ | ----------------------------------- | ------------------------------- | ------------------------------------------ |
| POST   | `/api/auth/register`                | Público                         | Cria usuário (USER)                        |
| POST   | `/api/items`                        | Autenticado                     | Cria item (multipart/form-data com `photo`) |
| PUT    | `/api/items/[id]`                   | Autor ou Admin                  | Atualiza item (multipart/form-data)        |
| DELETE | `/api/items/[id]`                   | Autor ou Admin                  | Exclui item                                |
| POST   | `/api/items/[id]/comments`          | Autenticado                     | Adiciona comentário                        |
| DELETE | `/api/comments/[id]`                | Admin                           | Remove comentário (moderação)              |
| POST   | `/api/items/[id]/claims`            | Autenticado (não-autor)         | Cria reivindicação                         |
| PATCH  | `/api/claims/[id]`                  | Admin                           | `{ "action": "APROVAR"\|"RECUSAR" }`        |
| PATCH  | `/api/items/[id]/status`            | Admin                           | `{ "status": "<novo>" }`                   |

---

## 6. Chaves/Configs (.env)

Conteúdo do `.env.example`:

```env
# Banco de dados (SQLite local — para produção, troque por PostgreSQL/MySQL)
DATABASE_URL="file:./dev.db"

# NextAuth.js — gere com: openssl rand -base64 32
AUTH_SECRET="troque-este-valor-por-um-segredo-de-32-bytes-em-base64"
AUTH_URL="http://localhost:3000"

# Diretório local de uploads (relativo ao projeto)
UPLOAD_DIR="public/uploads"
```

| Variável        | Obrigatória | Descrição                                                                |
| --------------- | ----------- | ------------------------------------------------------------------------ |
| `DATABASE_URL`  | Sim         | URL de conexão do Prisma. Em SQLite: `file:./dev.db`.                    |
| `AUTH_SECRET`   | Sim         | Segredo para assinar JWTs. Gere com `openssl rand -base64 32`.           |
| `AUTH_URL`      | Sim         | URL pública do app (ex.: `http://localhost:3000` em dev).                |
| `UPLOAD_DIR`    | Não         | Diretório de uploads. Default: `public/uploads`.                         |

Para produção/S3, ver [seção 4](#4-como-alternar-storage).

---

## 7. Estrutura do Projeto

```
.
├── prisma/
│   ├── schema.prisma          # Modelo de dados
│   ├── seed.ts                # Dados iniciais (usuários, itens, comentários, claim)
│   └── migrations/            # Histórico de migrations
├── public/
│   └── uploads/               # Arquivos estáticos servidos em /uploads/*
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Layout raiz (header + footer + toasts)
│   │   ├── page.tsx           # Home (lista pública + filtros + paginação)
│   │   ├── login/             # Tela de login
│   │   ├── register/          # Cadastro
│   │   ├── items/
│   │   │   ├── new/           # Novo registro
│   │   │   ├── [id]/          # Detalhes do item
│   │   │   │   ├── page.tsx
│   │   │   │   ├── ItemActions.tsx
│   │   │   │   ├── CommentsSection.tsx
│   │   │   │   ├── ClaimSection.tsx
│   │   │   │   ├── ClaimDecisionButtons.tsx
│   │   │   │   ├── StatusTimeline.tsx
│   │   │   │   └── edit/      # Edição do item
│   │   │   └── ...
│   │   └── api/
│   │       ├── auth/[...nextauth]/  # NextAuth.js handlers
│   │       ├── auth/register/
│   │       ├── items/                # GET/POST
│   │       │   └── [id]/             # GET/PUT/DELETE
│   │       │       ├── comments/
│   │       │       ├── claims/
│   │       │       └── status/
│   │       ├── claims/[id]/          # PATCH (admin)
│   │       └── comments/[id]/        # DELETE (admin)
│   ├── components/            # Header, Footer, Dialog, ToastProvider, Badge, HomeFilters
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config (Credentials + JWT)
│   │   ├── prisma.ts          # Prisma singleton
│   │   ├── upload.ts          # Validação + persistência de uploads
│   │   └── utils.ts           # cn(), formatDateTime(), labels, sanitizeText, escapeHtml
│   └── middleware.ts          # Proteção de rotas /items/new e /items/[id]/edit
├── .env.example
├── .gitignore
├── docker-compose.yml
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Segurança e Boas Práticas

- Senhas armazenadas com **bcrypt** (10 rounds).
- **CSRF + sessão segura** via NextAuth.js (cookies HTTP-only).
- **Sanitização** de inputs textuais (`sanitizeText`) para evitar tags HTML/script no conteúdo persistido.
- **Validação dupla** (client + server) com Zod em todos os endpoints.
- **Validação de upload**: mimetype (`image/jpeg` | `image/png`) e tamanho máximo de 5 MB no backend, mesmo se o frontend for contornado.
- **Mensagens em português** sem expor detalhes internos. Logs de erro vão para `console.error` no servidor.
- **Middleware** (`src/middleware.ts`) protege rotas que exigem login antes mesmo de chegar nas pages.

---

## Licença

Projeto acadêmico — uso livre para fins educacionais.
