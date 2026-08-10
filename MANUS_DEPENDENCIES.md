# Dependências do Manus — Guia de Adaptação

Este documento lista todos os recursos, serviços e integrações que são **específicos da plataforma Manus** e como adaptá-los para executar o projeto fora do Manus.

---

## Visão Geral

O projeto foi desenvolvido na plataforma Manus e utiliza alguns serviços internos. Para executar em um servidor externo, você pode:

1. **Remover** as integrações Manus (sistema funcionará sem elas)
2. **Substituir** por alternativas open-source ou comerciais
3. **Implementar** funcionalidades customizadas

---

## Recursos Específicos do Manus

### 1. Plugin Vite (`vite-plugin-manus-runtime`)

**Localização**: `package.json` (devDependencies)

**Função**: Integra o runtime do Manus ao Vite para desenvolvimento e build.

**Para remover**:
```bash
# Remova de package.json:
pnpm remove vite-plugin-manus-runtime

# Remova de vite.config.ts:
// Remova a linha: import ManusRuntime from 'vite-plugin-manus-runtime'
// Remova de plugins: ManusRuntime()
```

**Impacto**: Nenhum. O projeto funcionará normalmente sem ele.

---

### 2. API Interna do Manus (Forge API)

**Variáveis de Ambiente**:
- `BUILT_IN_FORGE_API_URL` — URL da API interna
- `BUILT_IN_FORGE_API_KEY` — Chave de autenticação

**Localização**: `server/_core/env.ts`, `server/storage.ts`

**Funções**:
- Armazenamento de arquivos (S3)
- Geração de imagens (IA)
- Transcrição de áudio
- Notificações
- Data API

**Para remover**:
```bash
# Em .env, deixe em branco:
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
```

**Para substituir**:

#### Armazenamento de Arquivos
Substitua por **AWS S3** ou compatível:

```bash
# Em .env, configure:
AWS_ACCESS_KEY_ID=sua_chave
AWS_SECRET_ACCESS_KEY=sua_chave_secreta
AWS_REGION=us-east-1
AWS_S3_BUCKET=seu_bucket
```

Adapte `server/storage.ts` para usar AWS SDK diretamente:
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

#### Geração de Imagens
Remova ou substitua por:
- **OpenAI DALL-E**: https://openai.com/dall-e
- **Replicate**: https://replicate.com
- **Stability AI**: https://stability.ai

#### Notificações
Implemente com:
- **SendGrid**: https://sendgrid.com (e-mail)
- **Twilio**: https://twilio.com (SMS)
- **Firebase Cloud Messaging**: https://firebase.google.com (push)

---

### 3. OAuth do Manus

**Variáveis de Ambiente**:
- `VITE_APP_ID` — ID da aplicação
- `OAUTH_SERVER_URL` — URL do servidor OAuth
- `VITE_OAUTH_PORTAL_URL` — URL do portal de login

**Localização**: `server/_core/oauth.ts`, `client/src/_core/hooks/useAuth.ts`

**Para substituir** por outro provedor OAuth (Google, GitHub, etc):

1. **Registre a aplicação** no provedor escolhido
2. **Obtenha** `Client ID` e `Client Secret`
3. **Configure** as variáveis de ambiente
4. **Adapte** `server/_core/oauth.ts` para o novo provedor

Exemplo com **Google OAuth**:
```typescript
// server/_core/oauth.ts
const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${process.env.APP_URL}/api/oauth/callback`,
};
```

---

### 4. Analytics do Manus

**Variáveis de Ambiente**:
- `VITE_ANALYTICS_ENDPOINT` — URL do serviço de analytics
- `VITE_ANALYTICS_WEBSITE_ID` — ID do website

**Localização**: `client/index.html` (script de analytics)

**Para remover**:
```html
<!-- Remova de client/index.html: -->
<!-- <script defer src="%VITE_ANALYTICS_ENDPOINT%/umami" data-website-id="%VITE_ANALYTICS_WEBSITE_ID%"></script> -->
```

**Para substituir** por:
- **Google Analytics**: https://analytics.google.com
- **Plausible**: https://plausible.io
- **Umami**: https://umami.is (self-hosted)
- **Matomo**: https://matomo.org

---

### 5. Título e Logo da Aplicação

**Variáveis de Ambiente**:
- `VITE_APP_TITLE` — Título da aplicação
- `VITE_APP_LOGO` — URL do logo

**Localização**: `client/index.html`, `client/src/components/DashboardLayout.tsx`

**Para customizar**:
```bash
# Em .env:
VITE_APP_TITLE=Seu Título Customizado
VITE_APP_LOGO=https://seu_dominio.com/logo.png
```

Ou edite diretamente em `client/index.html`:
```html
<title>Seu Título Customizado</title>
```

---

## Checklist de Adaptação

Para executar fora do Manus, siga este checklist:

- [ ] Remova `vite-plugin-manus-runtime` de `package.json`
- [ ] Configure um provedor OAuth (Google, GitHub, etc)
- [ ] Configure um banco de dados MySQL/TiDB
- [ ] Configure armazenamento S3 (opcional, para notas fiscais)
- [ ] Deixe em branco ou remova variáveis `BUILT_IN_FORGE_API_*`
- [ ] Remova script de analytics de `client/index.html` ou configure alternativa
- [ ] Customize `VITE_APP_TITLE` e `VITE_APP_LOGO`
- [ ] Execute `pnpm install` e `pnpm run build`
- [ ] Teste localmente com `pnpm run dev`
- [ ] Deploy em seu servidor

---

## Testes de Compatibilidade

Após adaptar, execute os testes para garantir que tudo funciona:

```bash
# Testes unitários:
pnpm run test

# Verificação de tipos:
pnpm run check

# Build de produção:
pnpm run build

# Execução local:
pnpm run dev
```

---

## Suporte Técnico

Se encontrar problemas ao adaptar:

1. Verifique as mensagens de erro no console
2. Consulte a documentação do provedor externo
3. Revise as variáveis de ambiente em `.env`
4. Teste cada integração isoladamente

---

**Nota**: O projeto foi testado e validado com as integrações do Manus. Ao substituir por alternativas externas, pode ser necessário ajustar código e testes.
