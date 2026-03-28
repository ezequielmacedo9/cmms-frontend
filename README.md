# CMMS Industrial Suite

![version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square) ![status](https://img.shields.io/badge/status-production-brightgreen?style=flat-square) ![license](https://img.shields.io/badge/license-MIT-gray?style=flat-square) ![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)

> Sistema SaaS full-stack para gestão de manutenção industrial — controle de máquinas, ordens de serviço e estoque de peças com autenticação JWT stateless e deploy em nuvem.

🚀 [Live Demo](https://cmms-frontend-sr11.vercel.app) &nbsp;·&nbsp; 📖 [API Docs](https://cmms-backend-8y7h.onrender.com/swagger-ui.html) &nbsp;·&nbsp; 🐛 [Reportar Bug](https://github.com/ezequielmacedo9/cmms-frontend/issues)

---

## Por que este projeto existe

Indústrias ainda controlam manutenção em planilhas Excel. Uma parada não planejada custa entre R$ 5.000 e R$ 50.000 dependendo do setor. O CMMS substitui esse processo por uma plataforma centralizada, acessível de qualquer dispositivo, com histórico completo por equipamento e alertas preventivos automatizados.

---

## Demo

| | |
|---|---|
| **URL** | https://cmms-frontend-sr11.vercel.app |
| **Email** | `admin@email.com` |
| **Senha** | `123456` |

> O backend roda no plano gratuito do Render — aguarde até 60s no primeiro acesso para o servidor inicializar.

---

## Funcionalidades

- **Autenticação JWT stateless** — Access Token (24h) + Refresh Token com renovação automática via interceptor Angular
- **Gestão de Máquinas** — CRUD completo com busca em tempo real, controle de status e histórico por equipamento
- **Ordens de Manutenção** — preventiva, corretiva e preditiva; vinculação por máquina; controle de status (Pendente → Em andamento → Concluída)
- **Estoque de Peças** — código, quantidade, custo unitário, vida útil em horas e alertas automáticos de reposição
- **Dashboard com KPIs** — totais em tempo real, gráfico dos últimos 6 meses e próximas manutenções vencendo em 7 dias
- **Lazy Loading** — bundle inicial reduzido de 860KB para ~594KB; módulos carregados sob demanda
- **Dark Theme Premium** — glassmorphism, animações e layout responsivo para uso em campo

---

## Arquitetura

```
Frontend (Vercel)          Backend (Render)
─────────────────          ────────────────────────
Angular 17+ SPA            Spring Boot 3.5 (Docker)
  AuthGuard          ──▶     JwtAuthFilter
  JWT Interceptor    ──▶     Spring Security
  Lazy Modules               Controllers
  RxJS Services              Services / Repositories
                                      │
                             PostgreSQL (Render DB)
```

**Fluxo de requisição:**

```
Browser → Vercel CDN → Angular SPA
        → HTTP + Bearer Token
        → Render (Docker) → JwtAuthFilter → Spring Security
        → Controller → Service → Repository → PostgreSQL
        → JSON Response → Frontend
```

---

## Stack

### Backend

| Tecnologia | Versão | Decisão técnica |
|---|---|---|
| Java | 17 | LTS com records, sealed classes e pattern matching |
| Spring Boot | 3.5.x | Auto-configuration, embedded Tomcat, production-ready |
| Spring Security | 6.x | Filtro JWT stateless — sem sessão server-side |
| Spring Data JPA | 6.x | Repositórios tipados e queries derivadas |
| JJWT | 0.11.5 | Geração, assinatura (HS256) e validação de tokens |
| PostgreSQL | 15 | Produção; H2 em memória para desenvolvimento |
| SpringDoc OpenAPI | latest | Swagger UI gerado automaticamente via anotações |
| Maven | 3.x | Gerenciamento de dependências e build lifecycle |

### Frontend

| Tecnologia | Versão | Decisão técnica |
|---|---|---|
| Angular | 17+ | Standalone components — sem NgModules desnecessários |
| TypeScript | 5.x | Tipagem estrita; interfaces para todos os modelos |
| Angular Material | 17+ | Design system consistente com theming customizado |
| RxJS | 7.x | Streams reativos para estado e chamadas HTTP |
| HTTP Interceptor | — | Injeção automática do Bearer Token em toda requisição |
| AuthGuard | — | Proteção de rotas com redirecionamento automático |

### Infraestrutura

| Serviço | Uso |
|---|---|
| Vercel | Deploy automático do frontend via Git push; CDN global |
| Render | Backend containerizado (Docker) + PostgreSQL gerenciado |
| Docker | Imagem do backend — ambiente reproduzível |
| GitHub | Controle de versão e trigger de deploy automático |

---

## Segurança

O sistema adota autenticação **stateless** baseada em JWT, eliminando sessões server-side.

```
POST /api/auth/login  →  { accessToken, refreshToken }

Requisições autenticadas:
  Authorization: Bearer <accessToken>

Expiração:
  accessToken   →  24h
  refreshToken  →  renovação automática via interceptor Angular
```

Proteções implementadas:

- BCrypt para hash de senhas (custo 10)
- CORS configurado por domínio — não wildcard
- Frame Options: `DENY` (proteção clickjacking)
- Referrer Policy: `strict-origin-when-cross-origin`
- Permissions Policy: câmera, microfone e geolocalização bloqueados
- Tokens nunca expostos em logs ou URLs
- Variáveis sensíveis via environment variables — nunca hardcoded

---

## API Reference

**Base URL:** `https://cmms-backend-8y7h.onrender.com`

```
# Autenticação (público)
POST   /api/auth/login               Body: { email, senha }
POST   /api/auth/refresh             Body: { refreshToken }
GET    /ping                         Health check

# Máquinas (requer JWT)
GET    /api/maquinas                 Lista todas as máquinas
POST   /api/maquinas                 Cadastra nova máquina
PUT    /api/maquinas/{id}            Atualiza máquina
DELETE /api/maquinas/{id}            Remove máquina

# Manutenções (requer JWT)
GET    /api/manutencoes              Lista todas as manutenções
POST   /api/manutencoes/{maquinaId}  Registra ordem de manutenção

# Estoque (requer JWT)
GET    /api/pecas                    Lista peças
POST   /api/pecas                    Cadastra peça
PUT    /api/pecas/{id}               Atualiza peça
DELETE /api/pecas/{id}               Remove peça
```

Documentação interativa: [/swagger-ui.html](https://cmms-backend-8y7h.onrender.com/swagger-ui.html)

---

## Estrutura do Projeto

### Backend

```
br.com.cmms.cmms
├── Security/
│   ├── JwtAuthFilter.java           # Intercepta e valida tokens JWT
│   ├── JwtService.java              # Geração, assinatura e extração de claims
│   ├── SecurityConfig.java          # Spring Security + CORS
│   └── UserDetailsServiceImpl.java  # Carregamento de usuário
├── controller/
│   ├── AuthController.java          # Login e refresh
│   ├── MaquinaController.java       # CRUD de máquinas
│   ├── ManutencaoController.java    # CRUD de manutenções
│   └── PecaController.java          # CRUD de estoque
├── model/
│   ├── Usuario.java
│   ├── Maquina.java
│   ├── Manutencao.java
│   └── Peca.java
├── service/                         # Regras de negócio
└── repository/                      # Interfaces JPA
```

### Frontend

```
src/app
├── guards/
│   └── auth-guard.ts                # Proteção de rotas autenticadas
├── interceptors/
│   └── auth-interceptor.ts          # Injeção automática do Bearer Token
├── models/                          # Interfaces TypeScript tipadas
├── pages/
│   ├── login/
│   ├── dashboard/
│   ├── maquinas/
│   ├── manutencoes/
│   └── estoque/
└── services/                        # Comunicação com a API
```

---

## Como rodar localmente

### Pré-requisitos

- Java 17+
- Node.js 18+
- Maven 3.x

### Backend

```bash
git clone https://github.com/ezequielmacedo9/cmms-backend
cd cmms-backend
./mvnw spring-boot:run
# API:     http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui.html
# H2:      http://localhost:8080/h2-console
```

### Frontend

```bash
git clone https://github.com/ezequielmacedo9/cmms-frontend
cd cmms-frontend
npm install --legacy-peer-deps
npx ng serve
# http://localhost:4200
```

### Variáveis de ambiente (produção)

```properties
SERVER_PORT=10000
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=jdbc:postgresql://<host>/<db>
SPRING_DATASOURCE_USERNAME=<user>
SPRING_DATASOURCE_PASSWORD=<password>
JWT_SECRET=<chave-minimo-256bits>
```

---

## Performance

| Métrica | Valor |
|---|---|
| Bundle inicial | ~594KB (otimizado de 860KB) |
| Lazy chunks | 4 módulos sob demanda |
| Build Vercel | ~25s |
| Conexão PostgreSQL | < 1s |
| Cold start Render Free | ~60s |

---

## Roadmap

- [x] Autenticação JWT stateless com refresh token
- [x] CRUD completo — máquinas, manutenções e peças
- [x] Dashboard com KPIs em tempo real
- [x] Lazy loading por módulo
- [x] Deploy automatizado via Git
- [ ] Paginação server-side nas listagens
- [ ] Notificações por email para manutenções vencendo
- [ ] Exportação de relatórios em PDF
- [ ] Multi-tenant (múltiplas empresas por instância)
- [ ] QR Code por máquina para acesso rápido em campo
- [ ] App mobile (Angular + Capacitor)
- [ ] Integração com sensores IoT
- [ ] Predição de falhas com ML

---

## Contribuindo

```bash
# 1. Fork o repositório
# 2. Crie sua branch
git checkout -b feature/minha-feature

# 3. Commit com mensagem semântica
git commit -m "feat: adiciona exportação de relatório em PDF"

# 4. Push e abra um Pull Request
git push origin feature/minha-feature
```

---

## Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

Desenvolvido por [Ezequiel Macedo](https://github.com/ezequielmacedo9) &nbsp;·&nbsp; CMMS Industrial Suite v1.0.0
