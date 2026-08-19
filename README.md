# 📜 VOYNICH CODEX

> _A full-stack world-building and manuscript management platform._

![Header](https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,100:6366f1&height=160&section=header&text=VOYNICH%20CODEX&fontSize=50&fontColor=ffffff&animation=fadeIn&fontAlignY=40)

---

## 🧬 ABOUT · Descripción

**Voynich Codex** es una plataforma full-stack para la creación de mundos y gestión de manuscritos. Diseñada para escritores, worldbuilders y creadores de historias, combina un frontend moderno con una arquitectura backend limpia y servicios de automatización.

---

## 🔧 STACK · Stack Tecnológico

### 🖥️ Frontend
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=000)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=fff)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=fff)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=fff)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-764ABC?style=for-the-badge&logo=zustand&logoColor=fff)](https://github.com/pmndrs/zustand)

### ⚙️ Backend
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=fff)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=fff)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=fff)](https://www.prisma.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=fff)](https://www.typescriptlang.org)

### 🗄️ Datos & Servicios
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=fff)](https://www.postgresql.org)
[![Qdrant](https://img.shields.io/badge/Qdrant-CC00FF?style=for-the-badge&logo=none&logoColor=fff)](https://qdrant.tech)
[![n8n](https://img.shields.io/badge/n8n-EA4B71?style=for-the-badge&logo=n8n&logoColor=fff)](https://n8n.io)

### 🐳 DevOps
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=fff)](https://www.docker.com)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=fff)](https://docs.docker.com/compose)

---

## 🏗️ ARCHITECTURE · Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                     │
│              React + Vite + TypeScript                  │
│              Tailwind CSS · Zustand Store               │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP :5173
┌───────────────────────▼─────────────────────────────────┐
│                   GATEWAY (Ocelot)                      │
│               Rate Limit · CORS · Auth                  │
│                    HTTP :4000                           │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP :3000
┌───────────────────────▼─────────────────────────────────┐
│                 BACKEND (Express API)                   │
│              Clean Architecture · Prisma ORM            │
│                    HTTP :3000                           │
└───────┬───────────────┬───────────────┬─────────────────┘
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│  PostgreSQL  │ │   Qdrant    │ │     n8n     │
│     :5432    │ │    :6333    │ │    :5678    │
│  Relational  │ │   Vector    │ │  Workflows  │
└──────────────┘ └─────────────┘ └─────────────┘
```

---

## 📁 PROJECT · Estructura

```
voynich-codex/
├── gateway/               # API Gateway (rate limiting, CORS, proxy)
│   └── src/
├── backend/               # Express API (Clean Architecture)
│   ├── prisma/            # Database schema & migrations
│   └── src/
│       ├── domain/        # Entities, value objects, interfaces
│       ├── application/   # Use cases, DTOs
│       ├── infrastructure/# Database, external services
│       └── presentation/  # Controllers, middlewares, routes
├── frontend/              # React + Vite + TypeScript
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Route pages
│       ├── stores/        # Zustand state management
│       └── services/      # API client
├── docker/                # Docker configs & init scripts
├── docker-compose.yml     # PostgreSQL + Qdrant + n8n
└── package.json           # Root scripts (dev, build, db)
```

---

## 🚀 FEATURES · Funcionalidades

### 📖 World Building
- 🌍 **Worlds** — Crea y gestiona mundos ficticios
- 🐉 **Bestiary** — Bestiario completo por mundo con simulador de encuentros y grafo de regiones
- 👥 **Characters** — Personajes con relaciones, backstory y grafo de naciones
- 📅 **Timeline** — Línea de tiempo del mundo
- 🗺️ **Geography** — Mapas, continentes y mares con simuladores visuales interactivos
- ⚔️ **Nations** — Naciones, culturas y política
- 🔮 **Magic Systems** — Sistemas de magia con editor visual de emblemas

### 🎨 Visual Simulators
- 🌊 **SeaSimulator** — Escenas de mar animadas con 6 tonalidades (Océano, Ártico, Tropical, Volcánico, Abismo, Místico)
- 🏔️ **ContinentSimulator** — Paisajes de continentes con 6 tonalidades (Selva, Desierto, Ártico, Volcánico, Oceánico, Flotante)
- 🗺️ **MapSimulator** — Mapas con filtros de tono, capas de terreno, puntos de interés y relieves
- 🛠️ **MapCreator** — Editor interactivo de mapas con herramientas de dibujo de polígonos, colocación de POIs y relieves
- 📊 **Graph Views** — Visualización de grafos con ReactFlow para bestiario, personajes, geografía y magia

### 📝 Manuscript Management
- 📚 **Manuscripts** — Biblioteca de manuscritos
- 📄 **Chapters** — Capítulos con estado de publicación
- 📊 **Statistics** — Estadísticas de escritura
- 🔍 **Vector Search** — Búsqueda semántica con Qdrant

### 🎯 Project Management
- 📋 **Kanban Board** — Tablero de tareas estilo Kanban
- 🏃 **Sprints** — Gestión de sprints de escritura
- 🎯 **Milestones** — Hitos y objetivos

### 🎨 UI/UX
- 🌓 **Theme System** — Modos Day/Night/Sepia
- 🔐 **Auth** — Login, Registro, JWT tokens
- 📱 **Responsive** — Diseño adaptable
- ✨ **Animations** — Framer Motion transitions

---

## ⚡ QUICK_START · Inicio Rápido

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### 1. Clonar el repositorio
```bash
git clone https://github.com/uskein/voynich-codex.git
cd voynich-codex
```

### 2. Iniciar servicios Docker
```bash
docker-compose up -d
```

Esto inicia:
| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| PostgreSQL | `:5432` | Base de datos relacional |
| Qdrant | `:6333` | Vector DB para búsqueda semántica |
| n8n | `:5678` | Automatización de workflows |

### 3. Configurar variables de entorno
```bash
cp backend/.env.example backend/.env
cp gateway/.env.example gateway/.env
# Editar los archivos .env con tus valores
```

### 4. Instalar dependencias y configurar DB
```bash
npm install
cd backend && npx prisma db push && cd ..
```

### 5. Ejecutar el proyecto
```bash
npm run dev
```

Esto inicia automáticamente:
- **Gateway** → http://localhost:4000
- **Backend** → http://localhost:3000
- **Frontend** → http://localhost:5173

---

## 🛠️ SCRIPTS · Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar todos los servicios (Gateway + Backend + Frontend) |
| `npm run dev:gateway` | Iniciar solo el Gateway |
| `npm run dev:backend` | Iniciar solo el Backend |
| `npm run dev:frontend` | Iniciar solo el Frontend |
| `npm run build` | Construir para producción |
| `npm run db:push` | Push schema a la base de datos |
| `npm run db:seed` | Sembrar datos de prueba |
| `npm run docker:up` | Levantar contenedores Docker |
| `npm run docker:down` | Detener contenedores Docker |

---

## 📡 API · Endpoints

### 🔐 Authentication
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Crear cuenta |
| `POST` | `/api/auth/login` | Iniciar sesión |
| `POST` | `/api/auth/refresh` | Refrescar token |
| `GET` | `/api/auth/me` | Usuario actual |

### 🌍 Worlds
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/worlds` | Listar mundos |
| `POST` | `/api/worlds` | Crear mundo |
| `GET` | `/api/worlds/:id` | Obtener mundo |
| `PUT` | `/api/worlds/:id` | Actualizar mundo |
| `DELETE` | `/api/worlds/:id` | Eliminar mundo |

### 📚 Manuscripts
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/manuscripts` | Listar manuscritos |
| `POST` | `/api/manuscripts` | Crear manuscrito |
| `GET` | `/api/manuscripts/:id` | Obtener manuscrito |
| `PUT` | `/api/manuscripts/:id` | Actualizar manuscrito |
| `DELETE` | `/api/manuscripts/:id` | Eliminar manuscrito |

### 📄 Chapters
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/manuscripts/:id/chapters` | Listar capítulos |
| `POST` | `/api/manuscripts/:id/chapters` | Crear capítulo |
| `PUT` | `/api/manuscripts/:mId/chapters/:cId` | Actualizar capítulo |
| `POST` | `/api/manuscripts/:mId/chapters/:cId/publish` | Publicar capítulo |

---

## 🧪 DATABASE · Esquema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────<│    World    │────<│  Manuscript │
│             │     │             │     │             │
│ id          │     │ id          │     │ id          │
│ email       │     │ name        │     │ title       │
│ password    │     │ description │     │ synopsis    │
│ name        │     │ genre       │     │ status      │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┼─────────────────┐
                    │                          │                 │
               ┌────▼────┐  ┌──────────────┐  ┌▼───────────┐  ┌─▼──────────┐
               │ Chapter │  │    Task      │  │  Bestiary  │  │ Character  │
               │         │  │              │  │            │  │            │
               │ id      │  │ id           │  │ id         │  │ id         │
               │ title   │  │ title        │  │ name       │  │ name       │
               │ content │  │ status       │  │ type       │  │ role       │
               │ order   │  │ priority     │  │ description│  │ backstory  │
               └─────────┘  └──────────────┘  └────────────┘  └────────────┘
```

---

## 🔐 ENVIRONMENT · Variables de Entorno

```bash
# Backend (.env)
DATABASE_URL=postgresql://voynich_admin:CHANGE_ME@localhost:5432/voynich_codex
JWT_SECRET=CHANGE_ME
JWT_REFRESH_SECRET=CHANGE_ME
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=CHANGE_ME
N8N_WEBHOOK_URL=http://localhost:5678
PORT=3000

# Gateway (.env)
PORT=4000
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📦 DEPENDENCIES · Dependencias Principales

### Backend
- **express** — Web framework
- **prisma** — ORM para PostgreSQL
- **jsonwebtoken** — JWT authentication
- **bcrypt** — Password hashing
- **cors** — Cross-origin resource sharing
- **dotenv** — Environment variables

### Frontend
- **react** — UI library
- **react-router-dom** — Client-side routing
- **zustand** — State management
- **tailwindcss** — Utility-first CSS
- **framer-motion** — Animations
- **axios** — HTTP client

### Gateway
- **http-proxy-middleware** — Reverse proxy
- **express-rate-limit** — Rate limiting
- **cors** — CORS configuration

---

## 🤝 CONTRIBUTING · Contribuir

1. Fork el proyecto
2. Crea una branch para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit con describe claro (`git commit -m 'Add nueva funcionalidad'`)
4. Push a la branch (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 LICENSE · Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

---

```
> status  : ONLINE
> stack   : React · Express · PostgreSQL · Qdrant · n8n · Docker
> purpose : World-building & Manuscript Management
```

![Footer](https://capsule-render.vercel.app/api?type=waving&color=0:6366f1,100:0d1117&height=120&section=footer)

---

<p align="center">
  <sub>📜 Built with passion — created by <a href="https://github.com/uskein">uskein</a></sub>
</p>
