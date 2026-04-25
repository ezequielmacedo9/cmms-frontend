<div align="center">

<img src="https://img.shields.io/badge/CMMS-Industrial%20Suite-1a1a2e?style=for-the-badge&logo=angular&logoColor=e91e63" alt="CMMS" height="40"/>

# ⚙️ CMMS Frontend — Industrial Suite

**Sistema SaaS de Gestão de Manutenção Industrial**

*Angular 17+ · Standalone Components · Lazy Loading · JWT stateless · Dark Theme*

<br/>

[![Angular](https://img.shields.io/badge/Angular-17+-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Angular Material](https://img.shields.io/badge/Material-17+-757575?style=for-the-badge&logo=material-design&logoColor=white)](https://material.angular.io)
[![RxJS](https://img.shields.io/badge/RxJS-7.x-B7178C?style=for-the-badge&logo=reactivex&logoColor=white)](https://rxjs.dev)

<br/>

[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)](https://github.com/ezequielmacedo9/cmms-frontend/releases)
[![Deploy](https://img.shields.io/badge/deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://cmms-frontend-ezequielmacedo9s-projects.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-brightgreen?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-orange?style=for-the-badge)](https://github.com/ezequielmacedo9/cmms-frontend/issues)

<br/>

[![🚀 Acessar Sistema](https://img.shields.io/badge/🚀%20Acessar%20Sistema-Live%20Demo-brightgreen?style=for-the-badge)](https://cmms-frontend-ezequielmacedo9s-projects.vercel.app)
[![📖 API Docs](https://img.shields.io/badge/📖%20API%20Docs-Swagger%20UI-blue?style=for-the-badge)](https://cmms-backend-8y7h.onrender.com/swagger-ui.html)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Ezequiel%20Macedo-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ezequielmacedo444)

</div>

---

## 💡 O Problema que Resolvemos

Indústrias ainda controlam manutenção em planilhas Excel. Uma parada não planejada custa entre **R$ 5.000 e R$ 50.000** por hora, dependendo do setor. O CMMS transforma esse processo caótico numa plataforma centralizada, acessível de qualquer dispositivo.

| ❌ Antes | ✅ Com CMMS |
|:---|:---|
| Planilhas desatualizadas e propensas a erro | Dashboard digital com dados em tempo real |
| Manutenções corretivas inesperadas e caras | Ordens preventivas programadas com antecedência |
| Estoque de peças desorganizado | Inventário com alertas automáticos de reposição |
| Zero histórico rastreável por equipamento | Timeline completa de cada máquina |
| Equipe reativa — apaga incêndio | Equipe proativa — previne falhas |

---

## 🌐 Acesso Rápido

| Recurso | URL |
|:---|:---|
| 🖥️ **Frontend (Produção)** | https://cmms-frontend-ezequielmacedo9s-projects.vercel.app |
| 🔧 **Backend API** | https://cmms-backend-8y7h.onrender.com |
| 📖 **Swagger UI** | https://cmms-backend-8y7h.onrender.com/swagger-ui.html |
| 📧 **Login demo** | `admin@email.com` / `123456` |

> ⚠️ **Render Free Tier:** o backend pode demorar até 60s para inicializar após inatividade. O frontend envia pings automáticos a cada 14 minutos para manter o servidor acordado.

---

## ✨ Funcionalidades

### Módulos Principais

- 🔐 **Autenticação JWT** — Login seguro com Access Token (24h) + Refresh Token, renovação automática silenciosa via HTTP interceptor
- 🏭 **Gestão de Máquinas** — CRUD completo com busca em tempo real, controle de status (Ativa / Em manutenção / Inativa) e ficha técnica por equipamento
- 🔧 **Ordens de Manutenção** — Tipos: preventiva, corretiva e preditiva; vínculo por máquina; pipeline de status (Pendente → Em andamento → Concluída)
- 📦 **Estoque de Peças** — Código interno, quantidade em estoque, custo unitário, vida útil em horas e alertas automáticos de reposição
- 📊 **Dashboard Executivo** — KPIs em tempo real, gráfico de manutenções dos últimos 6 meses e próximas preventivas vencendo em 7 dias

### Qualidade de Código

- ⚡ **Lazy Loading** — Bundle inicial de ~594KB (reduzido de 860KB); 4 módulos carregados sob demanda
- 🔄 **HTTP Interceptor funcional** — Bearer token injetado automaticamente; retry transparente após 401
- 🛡️ **AuthGuard** — Proteção de todas as rotas privadas com redirecionamento automático
- 🧹 **Sem memory leaks** — `cancelAnimationFrame`, `clearTimeout` e `clearInterval` rastreados e limpos no `ngOnDestroy`
- 🌙 **Dark Theme Premium** — Glassmorphism, animações canvas e layout 100% responsivo

---

## 🏗️ Arquitetura do Frontend

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Angular SPA (Vercel CDN)                       │
│                                                                        │
│  ┌─────────────┐   ┌───────────────────┐   ┌──────────────────────┐  │
│  │   Routing   │   │   HTTP Layer      │   │   State / Services   │  │
│  │             │   │                   │   │                      │  │
│  │  app.routes │   │  authInterceptor  │   │  AuthService         │  │
│  │  AuthGuard  │   │  HttpClient       │   │  MaquinaService      │  │
│  │  Lazy Load  │   │  Bearer Token     │   │  ManutencaoService   │  │
│  └──────┬──────┘   └────────┬──────────┘   │  PecaService         │  │
│         │                   │              │  WakeupService        │  │
│  ┌──────▼──────────────────▼──────────────▼──────────────────────┐ │
│  │                         Pages (Standalone Components)          │ │
│  │                                                                 │ │
│  │   LoginComponent  │  DashboardComponent  │  MaquinasComponent  │ │
│  │   ManutencoesComponent              EstoqueComponent           │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS + JWT Bearer
                                    ▼
                    ┌───────────────────────────────┐
                    │  Spring Boot API (Render)      │
                    │  https://cmms-backend-8y7h     │
                    │            .onrender.com       │
                    └───────────────────────────────┘
```

### Fluxo de Autenticação

```
1. POST /api/auth/login
        │
        ▼
   { accessToken, refreshToken }
        │
        ├─── accessToken  → localStorage → authInterceptor → todas as requests
        │
        └─── refreshToken → localStorage → usado ao receber 401
                                                    │
                                                    ▼
                                    POST /api/auth/refresh
                                            │
                                            ▼
                                    { novo accessToken }
                                            │
                                            ▼
                                    retry da request original
```

---

## 🛠️ Stack Tecnológica

| Tecnologia | Versão | Papel no projeto |
|:---|:---:|:---|
| 🅰️ **Angular** | 17+ | Framework SPA com standalone components — sem NgModules |
| 📘 **TypeScript** | 5.x | Tipagem estrita; interfaces para todos os modelos de domínio |
| 🎨 **Angular Material** | 17+ | Design system com theming dark customizado |
| ⚡ **RxJS** | 7.x | Streams reativos para HTTP, estado e operações assíncronas |
| 🔗 **HttpInterceptorFn** | — | Injeção automática de Bearer Token em toda requisição autenticada |
| 🛡️ **AuthGuard** | — | Proteção declarativa de rotas com `canActivate` |
| 🌐 **Vercel** | — | Deploy automático via Git push; CDN global; rewrite SPA |
| 🐙 **GitHub Actions** | — | CI/CD — build e deploy automático a cada push na `main` |

---

## 📁 Estrutura do Projeto

```
frontend-cmms/
├── src/
│   ├── app/
│   │   ├── guards/
│   │   │   └── auth.guard.ts              # Proteção de rotas privadas
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts        # Injeção de Bearer + retry 401
│   │   ├── models/
│   │   │   ├── maquina.model.ts
│   │   │   ├── manutencao.model.ts
│   │   │   └── peca.model.ts
│   │   ├── pages/
│   │   │   ├── login/                     # Canvas animation + wakeup ping
│   │   │   ├── dashboard/                 # KPIs + chart + próximas preventivas
│   │   │   ├── maquinas/                  # CRUD + busca em tempo real
│   │   │   ├── manutencoes/               # Pipeline de ordens
│   │   │   └── estoque/                   # Inventário + alertas
│   │   ├── services/
│   │   │   ├── auth.service.ts            # Login, logout, refresh token
│   │   │   ├── maquina.service.ts
│   │   │   ├── manutencao.service.ts
│   │   │   ├── peca.service.ts
│   │   │   └── wakeup.service.ts          # Pings keep-alive ao Render
│   │   ├── app.config.ts                  # Bootstrap standalone
│   │   └── app.routes.ts                  # Lazy loading por feature
│   ├── environments/
│   │   ├── environment.ts                 # Dev → http://localhost:8080
│   │   └── environment.prod.ts            # Prod → https://cmms-backend-8y7h.onrender.com
│   └── styles.scss                        # Tema global dark + glassmorphism
├── angular.json                           # fileReplacements para troca de env
├── vercel.json                            # SPA rewrite + build config
└── package.json
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- **Node.js** 18+ com npm
- **Angular CLI** — `npm install -g @angular/cli`
- Backend rodando (veja [cmms-backend](https://github.com/ezequielmacedo9/cmms-backend))

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/ezequielmacedo9/cmms-frontend
cd cmms-frontend

# 2. Instale as dependências
npm install --legacy-peer-deps

# 3. Inicie o servidor de desenvolvimento
npx ng serve
```

Acesse **http://localhost:4200** — o projeto recarrega automaticamente a cada mudança de arquivo.

### Build de Produção

```bash
npx ng build --configuration=production
# Output em: dist/cmms-frontend/browser/
```

---

## ⚙️ Variáveis de Ambiente

O projeto usa `fileReplacements` no `angular.json` para trocar automaticamente o arquivo de environment no build de produção — **nenhuma variável de ambiente de build é necessária no Vercel**.

| Arquivo | Usado em | `apiUrl` |
|:---|:---:|:---|
| `environment.ts` | `ng serve` (dev) | `https://cmms-backend-8y7h.onrender.com` |
| `environment.prod.ts` | Vercel (build prod) | `https://cmms-backend-8y7h.onrender.com` |

Para apontar para um backend local, edite apenas `environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

---

## ☁️ Deploy (Vercel)

O deploy é **100% automático** via Git push. A cada push na branch `main`:

1. Vercel detecta o projeto Angular
2. Executa `npx ng build --configuration=production`
3. Publica o output de `dist/cmms-frontend/browser/`
4. Aplica o rewrite SPA: toda rota `/.*` → `index.html`

Configuração em `vercel.json`:

```json
{
  "buildCommand": "npx ng build --configuration=production",
  "outputDirectory": "dist/cmms-frontend/browser",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 🔐 Segurança do Frontend

| Camada | Implementação |
|:---|:---|
| **Autenticação** | JWT Bearer Token em todas as requisições autenticadas |
| **Renovação** | Interceptor captura 401, faz refresh silencioso e retenta |
| **Proteção de rotas** | `AuthGuard` em todas as rotas privadas |
| **Armazenamento** | Tokens em `localStorage` (stateless, sem cookies) |
| **Logout** | Limpa tokens e redireciona para `/login` |
| **Variáveis sensíveis** | `environment.ts` — nunca hardcoded em componentes |

---

## 📊 Performance

| Métrica | Antes | Depois | Status |
|:---|:---:|:---:|:---:|
| Bundle inicial | 860 KB | ~594 KB | ✅ −31% |
| Lazy chunks ativos | 0 | 4 módulos | ✅ |
| Time to Interactive | Bloqueado | Imediato | ✅ |
| Memory leaks | Múltiplos | Zero | ✅ |
| Build Vercel | — | ~25s | ✅ |

---

## 🗺️ Roadmap

- [x] ✅ Autenticação JWT stateless com refresh automático
- [x] ✅ CRUD completo — máquinas, manutenções e peças
- [x] ✅ Dashboard com KPIs e gráfico histórico
- [x] ✅ Lazy loading por módulo
- [x] ✅ Deploy automático no Vercel
- [x] ✅ Keep-alive automático do backend (Render free tier)
- [ ] 📄 Paginação server-side nas listagens
- [ ] 📧 Notificações por email — manutenções vencendo
- [ ] 📑 Exportação de relatórios em PDF
- [ ] 🏢 Multi-tenant — múltiplas empresas por instância
- [ ] 📱 App mobile com Angular + Capacitor
- [ ] 🤖 Predição de falhas com ML
- [ ] 📡 Integração com sensores IoT em tempo real

---

## 🤝 Contribuindo

```bash
# 1. Faça um fork do repositório

# 2. Crie uma branch descritiva
git checkout -b feature/paginacao-server-side

# 3. Implemente sua mudança e teste localmente
npx ng serve

# 4. Commit com mensagem semântica (Conventional Commits)
git commit -m "feat: adiciona paginação server-side na listagem de máquinas"

# 5. Push e abra um Pull Request
git push origin feature/paginacao-server-side
```

**Padrões do projeto:**
- Commits: [Conventional Commits](https://www.conventionalcommits.org/pt-br/)
- Componentes: standalone, sem NgModules
- Serviços: constructor injection, sem `@Autowired`
- Subscriptions: sempre destruídas no `ngOnDestroy`

---

## 📄 Licença

Distribuído sob a licença MIT. Veja [`LICENSE`](LICENSE) para mais informações.

---

<div align="center">

### 👨‍💻 Desenvolvido por Ezequiel Macedo

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Ezequiel%20Macedo-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ezequielmacedo444)
[![GitHub](https://img.shields.io/badge/GitHub-ezequielmacedo9-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ezequielmacedo9)

*CMMS Industrial Suite v1.0.0 · ⚡ Angular + ☕ Spring Boot*

⭐ **Se este projeto te ajudou, deixa uma estrela no repositório!**

</div>
