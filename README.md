# Formalize

Plataforma multi-tenant para artistas e grupos musicais gerenciarem documentos profissionais (orçamentos, contratos, etc.) com templates customizáveis.

---

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **ORM**: Prisma 7
- **Banco de Dados**: PostgreSQL
- **Autenticação**: NextAuth.js (Credentials + Google OAuth)
- **UI**: Tailwind CSS
- **Storage**: Cloudflare R2 (S3-compatible)
- **PDF**: pdf-lib, pdfjs-dist, Gotenberg
- **PWA**: @ducanh2912/next-pwa
- **Outros**: bcryptjs, lucide-react, recharts

---

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 15+
- Conta Cloudflare (para R2)
- (Opcional) Gotenberg server (para conversão HTML → PDF)
- (Opcional) API WhatsApp (para envio de notificações)

---

## 🔧 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd formalize/formalize
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e preencha os valores:

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/formalize_dev?schema=public"

# NextAuth
NEXTAUTH_SECRET="seu-segredo-aqui"  # Gere com: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Cloudflare R2
R2_ENDPOINT="https://SUA_ACCOUNT_ID.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="sua_access_key"
R2_SECRET_ACCESS_KEY="sua_secret_key"
R2_BUCKET_NAME="formalize"
R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"

# WhatsApp (opcional)
WHATSAPP_API_URL="https://seu-host-da-api-whatsapp.com"
WHATSAPP_INSTANCE_USER_ID="gabriel"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_NOTIFY_WHATSAPP="5567999999999"
```

### 4. Configure o banco de dados

```bash
# Gera o cliente Prisma
npm run db:generate

# Sincroniza o schema com o banco
npm run db:push

# Cria dados de seed (usuários padrão)
npm run db:seed
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em: [http://localhost:3000](http://localhost:3000)

---

## 🔐 Credenciais Padrão

Após rodar o seed, você terá acesso a duas contas:

| Tipo          | Email                  | Senha       |
|---------------|------------------------|-------------|
| SUPER_ADMIN   | `admin@formalize.com`  | `Admin@123` |
| ARTIST_ADMIN  | `givago@formalize.com` | `Givago@123`|

---

## 📁 Estrutura do Projeto

```
formalize/
├── app/
│   ├── (admin)/              # Área do Artista Admin
│   │   └── admin/
│   │       ├── configuracoes/
│   │       ├── contrato/
│   │       ├── documentos/
│   │       ├── onboarding/
│   │       ├── orcamento/
│   │       └── templates/
│   ├── (super)/              # Área do Super Admin
│   │   └── super-admin/
│   │       ├── artistas/
│   │       ├── pdf-templates/
│   │       ├── solicitacoes/
│   │       └── templates/
│   ├── api/                  # Rotas de API
│   ├── login/
│   ├── forgot-password/
│   └── reset-password/
├── components/
│   ├── forms/                # Formulários de orçamento e contrato
│   └── ui/                   # Componentes de UI
├── lib/
│   ├── templates/            # Templates HTML/PDF
│   ├── auth.ts               # Configuração NextAuth
│   ├── prisma.ts             # Cliente Prisma
│   ├── r2.ts                 # Integração Cloudflare R2
│   └── whatsapp.ts           # Integração WhatsApp
├── prisma/
│   ├── schema.prisma         # Schema do banco
│   └── seed.ts               # Dados de seed
├── public/                   # Arquivos públicos
└── utils/                    # Helpers
```

---

## 🛠️ Scripts Disponíveis

| Script             | Ação                                           |
|--------------------|------------------------------------------------|
| `npm run dev`      | Inicia servidor de desenvolvimento            |
| `npm run build`    | Cria build de produção                        |
| `npm run start`    | Inicia servidor de produção                   |
| `npm run db:generate` | Gera cliente Prisma                        |
| `npm run db:push`  | Sincroniza schema com banco                   |
| `npm run db:migrate` | Cria e aplica migrações                     |
| `npm run db:studio` | Abre Prisma Studio (GUI do banco)            |
| `npm run db:seed`  | Executa seed do banco                         |

---

## 🗄️ Modelos do Banco de Dados

### Artist (Tenant Principal)
Representa um artista ou grupo musical. Campos principais:
- `name`: Nome do artista
- `logoUrl`, `backgroundUrl`: Imagens de identidade visual
- `primaryColor`, `secondaryColor`: Cores da marca
- `whatsapp`, `email`, `instagram`, `spotify`, `youtube`: Redes sociais
- `bankInfo`, `pixKey`: Dados de pagamento
- `orcamentoTemplate`, `contratoTemplate`: Templates padrão
- `status`: `ACTIVE` / `SUSPENDED` / `CANCELLED`

### User
Usuários do sistema. Tipos:
- `SUPER_ADMIN`: Administrador da plataforma
- `ARTIST_ADMIN`: Administrador de um artista

### Document
Documentos gerados (orçamentos, contratos, etc.)
- `type`: `BUDGET` / `CONTRACT` / `PORTFOLIO` / `STAGE_MAP` / `GENERIC_EVENT`
- `data`: Dados estruturados do formulário (JSON)
- `pdfUrl`: URL do PDF armazenado no R2

### Template
Templates HTML por artista.

### ContratoTemplate
Templates de contrato com cláusulas customizáveis.

### PdfTemplateMapping
Templates PDF customizados via canvas editor.

### ArtistRequest
Requisições de onboarding de novos artistas.

---

## 🌐 Funcionalidades Principais

### Para Artistas
- ✅ Criação de orçamentos profissionais
- ✅ Criação de contratos com cláusulas customizáveis
- ✅ Templates pré-definidos (Classic, Light, Premium, etc.)
- ✅ Upload de templates PDF personalizados
- ✅ Histórico de documentos
- ✅ Configurações de identidade visual
- ✅ Onboarding guido com tutorial

### Para Super Admin
- ✅ Gerenciamento de artistas
- ✅ Aprovação/rejeição de solicitações
- ✅ Gerenciamento de templates globais
- ✅ Estatísticas da plataforma
- ✅ Integração WhatsApp

---

## 🔧 Troubleshooting

### Erro no login (401)
Verifique se:
1. O banco está rodando e acessível
2. O `prisma generate` foi executado
3. Os dados de seed foram criados (`npm run db:seed`)
4. As credenciais estão corretas

### Erro de conexão com o banco
Verifique a `DATABASE_URL` no `.env` e se o PostgreSQL está rodando.

### Problemas com o Cloudflare R2
Verifique as credenciais do R2 e se o bucket existe e é público (ou tem URL pública configurada).

---

## 📝 Notas Importantes

- **Multi-tenant**: Cada artista é um tenant isolado
- **Pronto para PWA**: A aplicação é instalável como app nativo
- **Rate Limiting**: Proteção contra brute force no login
- **Logs**: Sistema de logging estruturado com Pino

---

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas alterações (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é privado e confidencial.

---

## 👤 Suporte

Para dúvidas ou suporte, entre em contato via WhatsApp.
