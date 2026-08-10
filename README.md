# Controle de Aquisições — UTI Neonatal

Sistema web para acompanhamento de aquisição de equipamentos hospitalares, com suporte a múltiplos perfis de acesso, cotações de fornecedores e rastreamento de etapas de entrega.

## Visão Geral

Este projeto é uma aplicação **full-stack** construída com **React 19**, **Express 4**, **tRPC 11**, **Drizzle ORM** e **Tailwind CSS 4**. Inclui autenticação OAuth, banco de dados relacional, permissões por usuário e um portal de cotações para fornecedores.

### Características Principais

- **52 equipamentos reais** pré-cadastrados do orçamento original
- **Seis etapas obrigatórias**: Aquisição, Link da Nota Fiscal, Envio, Previsão de Entrega, Entrega, Instalação
- **Três perfis de acesso**: Gerenciamento (admin), Acompanhamento (user), Fornecedor (supplier)
- **Permissões configuráveis** por usuário (painel administrativo)
- **Portal de cotações** para fornecedores informarem valores e propostas
- **Comparação de propostas** para o administrador
- **Responsividade** completa (desktop, tablet, celular)
- **19 testes automatizados** com Vitest

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18+ ([https://nodejs.org](https://nodejs.org))
- **pnpm** 10+ ([https://pnpm.io](https://pnpm.io)) ou **npm** 9+
- **MySQL 8+** ou **TiDB** ([https://www.mysql.com](https://www.mysql.com))
- **Git** (opcional, para clonar o repositório)

---

## Instalação

### 1. Clonar ou Extrair o Projeto

```bash
# Se tiver o arquivo ZIP:
unzip controle-aquisicoes-uti-neonatal.zip
cd controle-aquisicoes-uti-neonatal

# Ou clonar do repositório (se disponível):
git clone <seu_repositorio>
cd controle-aquisicoes-uti-neonatal
```

### 2. Instalar Dependências

```bash
# Com pnpm (recomendado):
pnpm install

# Ou com npm:
npm install
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e preencha com seus valores reais:

```bash
cp .env.example .env
```

Edite `.env` e configure:

- `DATABASE_URL`: Conexão com o banco de dados MySQL/TiDB
- `JWT_SECRET`: Chave secreta para cookies (use uma string aleatória forte)
- `VITE_APP_ID`: ID da aplicação OAuth
- `OAUTH_SERVER_URL`: URL do servidor OAuth
- `VITE_OAUTH_PORTAL_URL`: URL do portal de login
- `OWNER_OPEN_ID`: ID único do proprietário no OAuth
- `OWNER_NAME`: Nome do proprietário

Exemplo de `.DATABASE_URL`:
```
DATABASE_URL=mysql://usuario:senha@localhost:3306/controle_aquisicoes
```

### 4. Criar o Banco de Dados

```bash
# Criar o banco de dados MySQL:
mysql -u root -p -e "CREATE DATABASE controle_aquisicoes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 5. Executar Migrações

```bash
# Gerar e aplicar migrações Drizzle:
pnpm run db:push
```

Isso criará todas as tabelas necessárias:
- `users` — Usuários e perfis
- `equipment` — Equipamentos e itens
- `procurement_stages` — Etapas de aquisição
- `supplier_profiles` — Dados dos fornecedores
- `supplier_quotes` — Cotações por fornecedor
- `user_access_permissions` — Permissões configuráveis

---

## Execução

### Desenvolvimento

```bash
# Inicia o servidor de desenvolvimento com hot-reload:
pnpm run dev
```

O servidor estará disponível em `http://localhost:3000`.

### Build para Produção

```bash
# Compila o frontend (React) e backend (Node.js):
pnpm run build
```

Isso gera:
- `dist/public/` — Arquivos estáticos do frontend
- `dist/index.js` — Servidor Node.js compilado

### Executar em Produção

```bash
# Inicia o servidor compilado:
NODE_ENV=production pnpm run start
```

Ou diretamente com Node:
```bash
NODE_ENV=production node dist/index.js
```

---

## Testes

### Executar Testes Automatizados

```bash
# Roda a suíte de testes Vitest:
pnpm run test
```

Testes cobrem:
- Autenticação e logout
- Permissões por perfil
- Isolamento de dados entre fornecedores
- Operações CRUD de equipamentos e etapas
- Restrições financeiras (valores do orçamento exclusivos do admin)

### Verificar Tipagem

```bash
# Valida tipos TypeScript sem compilar:
pnpm run check
```

---

## Estrutura do Projeto

```
controle-aquisicoes-uti-neonatal/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas principais (Dashboard, EquipmentList, etc)
│   │   ├── components/       # Componentes reutilizáveis (UI, dialogs, etc)
│   │   ├── hooks/            # Custom hooks (useAuth, useAccess, etc)
│   │   ├── lib/              # Utilitários (tRPC client, formatação, etc)
│   │   ├── contexts/         # React contexts (theme, etc)
│   │   ├── App.tsx           # Roteamento principal
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Estilos globais e tokens Tailwind
│   ├── index.html            # Template HTML
│   └── public/               # Arquivos estáticos (favicon, robots.txt)
│
├── server/                    # Backend Express + tRPC
│   ├── routers/              # Procedimentos tRPC (procurement, suppliers, access)
│   ├── db.ts                 # Helpers de banco de dados
│   ├── permissions.ts        # Lógica de permissões
│   ├── storage.ts            # Integração com S3 (opcional)
│   ├── _core/                # Framework (OAuth, context, vite bridge)
│   └── *.test.ts             # Testes Vitest
│
├── drizzle/                   # Schema e migrações
│   ├── schema.ts             # Definição de tabelas
│   ├── relations.ts          # Relações entre tabelas
│   └── *.sql                 # Migrações SQL geradas
│
├── shared/                    # Código compartilhado frontend/backend
│   ├── const.ts              # Constantes
│   ├── types.ts              # Tipos TypeScript
│   └── procurement.ts        # Tipos de aquisição
│
├── docs/                      # Documentação do projeto
│   ├── product-spec.md       # Especificação do produto
│   ├── access-and-quotations.md  # Permissões e cotações
│   └── visual-review.md      # Revisão visual
│
├── package.json              # Dependências e scripts
├── tsconfig.json             # Configuração TypeScript
├── vite.config.ts            # Configuração Vite (frontend)
├── vitest.config.ts          # Configuração Vitest (testes)
├── drizzle.config.ts         # Configuração Drizzle ORM
├── .env.example              # Variáveis de exemplo
└── README.md                 # Este arquivo
```

---

## Banco de Dados

### Modelo Relacional

O projeto usa **MySQL 8+** com as seguintes tabelas:

#### `users`
Armazena usuários e seus perfis de acesso.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT | Chave primária |
| `openId` | VARCHAR(64) | ID único do OAuth |
| `name` | TEXT | Nome do usuário |
| `email` | VARCHAR(320) | E-mail |
| `role` | ENUM | `admin`, `user`, `supplier` |
| `isActive` | BOOLEAN | Ativação do usuário |
| `createdAt` | TIMESTAMP | Data de criação |
| `updatedAt` | TIMESTAMP | Data de atualização |

#### `equipment`
Lista dos 52 equipamentos com valores do orçamento.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT | Chave primária |
| `itemNumber` | INT | Número do item no orçamento |
| `name` | TEXT | Nome do equipamento |
| `brand` | VARCHAR(255) | Marca (editável) |
| `model` | VARCHAR(255) | Modelo (editável) |
| `quantity` | INT | Quantidade de unidades |
| `unitValueCents` | BIGINT | Valor unitário em centavos (apenas admin) |
| `totalValueCents` | BIGINT | Valor total em centavos (apenas admin) |
| `invoiceUrl` | TEXT | Link da nota fiscal |
| `createdBy` | INT | Usuário que criou |
| `createdAt` | TIMESTAMP | Data de criação |
| `updatedAt` | TIMESTAMP | Data de atualização |

#### `procurement_stages`
Seis etapas obrigatórias por equipamento.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT | Chave primária |
| `equipmentId` | INT | FK para `equipment` |
| `stageKey` | VARCHAR(50) | `acquisition`, `invoice_link`, `shipping`, `expected_delivery`, `delivery`, `installation` |
| `status` | ENUM | `pending`, `in_progress`, `completed` |
| `stageDate` | BIGINT | Data da etapa (Unix ms) |
| `notes` | TEXT | Observações |
| `updatedBy` | INT | Último usuário que atualizou |
| `createdAt` | TIMESTAMP | Data de criação |
| `updatedAt` | TIMESTAMP | Data de atualização |

#### `supplier_profiles`
Dados complementares dos fornecedores.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `userId` | INT | FK para `users` |
| `companyName` | VARCHAR(255) | Nome da empresa |
| `cnpj` | VARCHAR(18) | CNPJ (opcional) |
| `contactPhone` | VARCHAR(20) | Telefone (opcional) |
| `updatedAt` | TIMESTAMP | Data de atualização |

#### `supplier_quotes`
Cotações enviadas pelos fornecedores.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT | Chave primária |
| `supplierUserId` | INT | FK para `users` (fornecedor) |
| `equipmentId` | INT | FK para `equipment` |
| `unitValueCents` | BIGINT | Valor unitário proposto |
| `offeredBrand` | VARCHAR(255) | Marca proposta |
| `offeredModel` | VARCHAR(255) | Modelo proposto |
| `leadTimeDays` | INT | Prazo em dias |
| `notes` | TEXT | Observações |
| `status` | ENUM | `draft`, `submitted` |
| `createdAt` | TIMESTAMP | Data de criação |
| `updatedAt` | TIMESTAMP | Data de atualização |

#### `user_access_permissions`
Permissões configuráveis por usuário.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `userId` | INT | FK para `users` |
| `canViewDashboard` | BOOLEAN | Acesso ao painel |
| `canViewItems` | BOOLEAN | Visualizar equipamentos |
| `canEditItems` | BOOLEAN | Editar equipamentos |
| `canViewStages` | BOOLEAN | Visualizar etapas |
| `canEditStages` | BOOLEAN | Editar etapas |
| `canViewInvoices` | BOOLEAN | Visualizar notas fiscais |
| `canManageInvoices` | BOOLEAN | Gerenciar notas fiscais |
| `canViewBudgetValues` | BOOLEAN | Visualizar valores (exclusivo admin) |
| `canViewSupplierQuotes` | BOOLEAN | Visualizar cotações |
| `canSubmitQuotes` | BOOLEAN | Enviar cotações |
| `updatedAt` | TIMESTAMP | Data de atualização |

---

## Autenticação e Perfis

### Fluxo de Login

1. Usuário clica em **Entrar no sistema**
2. Redirecionado para o provedor OAuth (Google, GitHub, etc)
3. Após autenticação, retorna com `openId` único
4. Sistema cria ou atualiza o usuário no banco
5. Cookie de sessão é gerado e armazenado
6. Usuário é redirecionado ao painel

### Perfis de Acesso

| Perfil | Permissões | Casos de Uso |
|--------|-----------|-------------|
| **Gerenciamento** (admin) | Todas as permissões | Gestor do projeto, criação/edição de itens, definição de permissões |
| **Acompanhamento** (user) | Somente leitura, sem valores | Coordenador hospitalar, acompanhamento de etapas |
| **Fornecedor** (supplier) | Enviar cotações, ver itens | Fornecedores, informar valores e propostas |

### Restrições Financeiras

- **Valores do orçamento-base** (unitário e total) são **exclusivos do perfil Gerenciamento**
- Fornecedores **não veem** valores do orçamento, apenas seus próprios valores propostos
- Usuários de Acompanhamento **não veem** nenhum valor financeiro

---

## Integrações e Dependências Externas

### Integrações Utilizadas

| Integração | Uso | Obrigatória | Alternativa |
|-----------|-----|-----------|-----------|
| **OAuth** | Autenticação de usuários | Sim | Implementar autenticação local |
| **MySQL/TiDB** | Banco de dados | Sim | PostgreSQL, SQLite (requer adaptação) |
| **S3 (opcional)** | Armazenamento de arquivos | Não | Armazenamento local no servidor |

### Dependências Específicas do Manus

As seguintes variáveis/serviços são **específicos do Manus** e podem ser removidas ou substituídas:

- `BUILT_IN_FORGE_API_URL` — API interna do Manus
- `BUILT_IN_FORGE_API_KEY` — Chave da API interna
- `VITE_FRONTEND_FORGE_API_URL` — URL frontend da API
- `VITE_FRONTEND_FORGE_API_KEY` — Chave frontend
- `VITE_ANALYTICS_ENDPOINT` — Analytics do Manus
- `VITE_ANALYTICS_WEBSITE_ID` — ID do website no analytics
- `vite-plugin-manus-runtime` — Plugin Vite do Manus

**Para executar fora do Manus**, remova ou deixe em branco essas variáveis. O sistema funcionará normalmente sem elas.

---

## Publicação em Servidores Externos

### Opção 1: Vercel

```bash
# Instalar Vercel CLI:
npm i -g vercel

# Deploy:
vercel
```

### Opção 2: Railway

```bash
# Instalar Railway CLI:
npm i -g @railway/cli

# Login e deploy:
railway login
railway up
```

### Opção 3: Render

1. Fazer push para GitHub
2. Conectar repositório no [https://render.com](https://render.com)
3. Configurar variáveis de ambiente
4. Deploy automático

### Opção 4: Servidor Próprio (VPS/Dedicado)

```bash
# SSH para o servidor:
ssh usuario@seu_servidor

# Clonar o projeto:
git clone <seu_repositorio>
cd controle-aquisicoes-uti-neonatal

# Instalar dependências:
pnpm install

# Configurar .env:
nano .env

# Build:
pnpm run build

# Usar PM2 para manter o servidor rodando:
npm i -g pm2
pm2 start "NODE_ENV=production node dist/index.js" --name "controle-aquisicoes"
pm2 save
pm2 startup
```

---

## Variáveis de Ambiente Necessárias

Veja `.env.example` para a lista completa. As principais são:

```bash
# Obrigatórias:
DATABASE_URL=mysql://...
JWT_SECRET=...
VITE_APP_ID=...
OAUTH_SERVER_URL=...
VITE_OAUTH_PORTAL_URL=...
OWNER_OPEN_ID=...
OWNER_NAME=...

# Opcionais (remova se não usar):
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

---

## Troubleshooting

### Erro: `DATABASE_URL is required`
Verifique se `.env` contém `DATABASE_URL` válida e o banco está acessível.

### Erro: `[permission_denied] insufficient permissions`
Isso ocorre apenas na plataforma Manus. Ao executar localmente ou em outro servidor, esse erro não aparece.

### Erro: `Cannot find module 'vite-plugin-manus-runtime'`
Remova a linha `vite-plugin-manus-runtime` de `package.json` e reinstale:
```bash
pnpm install
```

### Porta 3000 já em uso
Use outra porta:
```bash
PORT=3001 pnpm run dev
```

---

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `pnpm run dev` | Inicia servidor de desenvolvimento |
| `pnpm run build` | Compila para produção |
| `pnpm run start` | Executa a versão compilada |
| `pnpm run test` | Roda testes Vitest |
| `pnpm run check` | Valida tipagem TypeScript |
| `pnpm run format` | Formata código com Prettier |
| `pnpm run db:push` | Gera e aplica migrações |

---

## Licença

MIT

---

## Suporte

Para dúvidas ou problemas:
1. Verifique a documentação em `docs/`
2. Consulte os testes em `server/*.test.ts` para exemplos de uso
3. Abra uma issue no repositório (se disponível)

---

**Desenvolvido com ❤️ por Manus AI**
