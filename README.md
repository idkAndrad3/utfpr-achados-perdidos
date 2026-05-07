# Sistema de Achados e Perdidos UTFPR

Sistema web para gerenciamento de Achados e Perdidos no campus da UTFPR. Permite o registro público de itens perdidos e encontrados, com comentários, fluxo de reivindicação, histórico de status e moderação por administradores.

Stack: Next.js 14 (App Router) + TypeScript, Prisma + SQLite, NextAuth.js v5, Tailwind CSS.

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

### Passo a passo de teste

1. Login como usuário comum (`usuario@utfpr.br` / `SenhaTeste123!`).
2. Clique em "+ Novo Registro" e crie um item Perdido (ex.: "Carteira perdida na biblioteca"). Status inicial: Perdido.
3. Crie um item Encontrado (ex.: "Pendrive encontrado no Lab 3"). Status inicial: Em verificação.
4. Abra qualquer item nos detalhes e use o botão flutuante "+ Adicionar Comentário". O comentário aparece sem recarregar a página.
5. Ainda como `usuario`, abra um item Encontrado autorado pelo admin (ex.: "Calculadora HP 12C") e clique em "Reivindicar". Preencha a descrição e (opcional) anexe uma imagem de prova.
6. Saia e entre como admin (`admin@utfpr.br` / `SenhaTeste123!`).
7. Abra o item reivindicado. Na seção "Reivindicações Pendentes", clique em Aprovar.
8. O status muda para Devolvido e a transição aparece no "Histórico de status" ao final da página. Como admin você também pode alterar status manualmente e excluir comentários.

---

## 3. Decisões de Arquitetura

### Stack escolhida

- **Next.js 14 (App Router) + TypeScript**: server components evitam round-trip de API interna e dão tipagem end-to-end com Prisma.
- **Prisma + SQLite**: execução local sem dependências externas. Para produção basta trocar `provider` em `prisma/schema.prisma` para `postgresql`/`mysql` e ajustar `DATABASE_URL`.
- **NextAuth.js v5 (Auth.js)** com Credentials Provider: sessões JWT e CSRF prontos.
- **Tailwind CSS** com classes utilitárias customizadas (`btn-primary`, `card`, `badge`).
- **Zod** para validação dos payloads no client e no server.
- **bcryptjs** com 10 rounds para hash de senhas.

### Limitações conhecidas

- SQLite não é adequado para produção com múltiplas instâncias ou alto volume de escrita concorrente. Usar PostgreSQL/MySQL nesse cenário.
- Prisma + SQLite não suporta enums nativos. Os campos `role`, `type`, `category`, `status` são `String` validados via Zod. Em PostgreSQL/MySQL basta voltar a usar `enum`.
- Uploads em `public/uploads/` não funcionam em filesystem efêmero (Vercel/Heroku). Ver [seção 4](#4-como-alternar-storage).
- Geolocalização preenche apenas coordenadas. Reverse geocoding (endereço legível) não está incluído.
- Autenticação só por Credentials. OAuth (Google, Microsoft) não está incluído.

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

A assinatura `saveUploadedImage(file: File): Promise<string>` continua a mesma. Nada mais precisa mudar.

---

## 5. Rotas da API

Todas as rotas retornam JSON. As rotas **read-only** abaixo (GET) são **públicas** (sem auth). As demais exigem sessão.

### `GET /api/items?status=&category=&page=`

Lista paginada (9 itens por página), ordenada do mais recente para o mais antigo. Filtros opcionais.

**Query params:**

- `status`: `PERDIDO`, `ENCONTRADO`, `EM_VERIFICACAO` ou `DEVOLVIDO`
- `category`: `ELETRONICOS`, `DOCUMENTOS`, `VESTUARIO` ou `OUTROS`
- `page`: número, default `1`

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
# Banco SQLite local. Para produção troque por PostgreSQL/MySQL.
DATABASE_URL="file:./dev.db"

# NextAuth: gere com "openssl rand -base64 32"
AUTH_SECRET="troque-este-valor-por-um-segredo-de-32-bytes-em-base64"
AUTH_URL="http://localhost:3000"

# Diretório local de uploads
UPLOAD_DIR="public/uploads"
```

| Variável        | Obrigatória | Descrição                                                                |
| --------------- | ----------- | ------------------------------------------------------------------------ |
| `DATABASE_URL`  | Sim         | URL de conexão do Prisma. Em SQLite: `file:./dev.db`.                    |
| `AUTH_SECRET`   | Sim         | Segredo para assinar JWTs. Como gerar abaixo.                            |
| `AUTH_URL`      | Sim         | URL pública do app (ex.: `http://localhost:3000` em dev).                |
| `UPLOAD_DIR`    | Não         | Diretório de uploads. Default: `public/uploads`.                         |

#### Gerando o `AUTH_SECRET`

- **Linux/macOS / Git Bash**: `openssl rand -base64 32`
- **PowerShell**: `[Convert]::ToBase64String((1..32 | %{ Get-Random -Maximum 256 }))`
- **Node.js**: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

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
- **Datas em UTC**: todos os timestamps (`createdAt`, `updatedAt`) são gravados em UTC pelo Prisma e formatados para o fuso local apenas na renderização.

---

## Licença

Projeto acadêmico, uso livre para fins educacionais.
