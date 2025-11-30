# Tilawa Backend

🕌 Plateforme mondiale pour la récitation du Qur'an - Backend monorepo

## Architecture

Ce projet est un monorepo TypeScript organisé selon les principes de **Domain-Driven Design (DDD)** et **Clean Architecture**.

```
tilawa-backend/
├── apps/
│   ├── api/                    # API HTTP REST
│   ├── audio-worker/           # Worker traitement audio
│   └── moderation-worker/      # Worker modération
├── packages/
│   ├── domain/                 # Domaines métier (à venir en Phase 2)
│   ├── infra/                  # Infrastructure (à venir en Phase 2)
│   └── shared/                 # Packages partagés (à venir en Phase 2)
```

## Prérequis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 14 (pour Phase 2+)
- **Redis** >= 6.0

## Installation

### 1. Cloner le projet et installer les dépendances

```bash
# Installer toutes les dépendances du monorepo
npm install
```

### 2. Configuration de l'environnement

Créer un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

Éditer `.env` avec vos valeurs :

```env
# Server
NODE_ENV=development
API_PORT=3000

# Database (Phase 2+)
DATABASE_URL=postgresql://tilawa:tilawa@localhost:5432/tilawa_db

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Storage (S3)
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_BUCKET=tilawa-recitations
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

### 3. Démarrer Redis

```bash
# Avec Docker
docker run -d -p 6379:6379 redis:7-alpine

# Ou avec Homebrew (macOS)
brew services start redis
```

## Lancement (Phase 1)

### Démarrer tous les services

Ouvrir **3 terminaux** et lancer chaque service :

#### Terminal 1 : API Server

```bash
npm run dev:api
```

L'API démarre sur `http://localhost:3000`

#### Terminal 2 : Audio Worker

```bash
npm run dev:audio-worker
```

Le worker écoute la queue `audio:process`

#### Terminal 3 : Moderation Worker

```bash
npm run dev:moderation-worker
```

Le worker écoute la queue `moderation:analyze`

## Tests

### Tester l'API

#### Health Check

```bash
curl http://localhost:3000/health
```

Réponse attendue :

```json
{
  "status": "ok",
  "timestamp": "2024-11-30T05:48:00.000Z",
  "service": "tilawa-api",
  "version": "1.0.0"
}
```

#### API Info

```bash
curl http://localhost:3000/api/v1
```

Réponse attendue :

```json
{
  "message": "Tilawa API v1",
  "endpoints": {
    "health": "/health",
    "auth": "/api/v1/auth",
    "recitations": "/api/v1/recitations"
  }
}
```

### Vérifier les workers

Les workers doivent afficher dans leurs logs :

**Audio Worker :**
```
🎵 Audio Worker started
📡 Listening to queue: audio:process
🔗 Redis: redis://localhost:6379
```

**Moderation Worker :**
```
🛡️  Moderation Worker started
📡 Listening to queue: moderation:analyze
🔗 Redis: redis://localhost:6379
```

## Structure du projet (Phase 1)

```
tilawa-backend/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── env.ts              # Configuration environnement
│   │   │   ├── middleware/
│   │   │   │   └── error-handler.ts    # Gestion erreurs
│   │   │   ├── app.ts                  # Application Express
│   │   │   └── server.ts               # Point d'entrée serveur
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── audio-worker/
│   │   ├── src/
│   │   │   ├── jobs/
│   │   │   │   └── audio-analysis.job.ts
│   │   │   ├── config.ts
│   │   │   ├── worker.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── moderation-worker/
│       ├── src/
│       │   ├── jobs/
│       │   │   └── content-moderation.job.ts
│       │   ├── config.ts
│       │   ├── worker.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── package.json
├── tsconfig.base.json
├── .env.example
├── .gitignore
└── README.md
```

## Prochaines étapes

### Phase 2 : Domaines + Infrastructure + Prisma
- Setup Prisma avec PostgreSQL
- Création des domaines métier (user, recitation, audio-processing, moderation)
- Implémentation des repositories
- Packages partagés (types, utils, config)

### Phase 3 : Vertical Slice "First Recitation Flow"
- Authentification (register, login)
- Création et upload de récitation
- Pipeline complet : Upload → Audio Worker → Moderation Worker → Publication

## Scripts disponibles

```bash
# Développement
npm run dev:api                 # Lancer l'API
npm run dev:audio-worker        # Lancer le worker audio
npm run dev:moderation-worker   # Lancer le worker modération

# Build (à venir)
npm run build                   # Build tous les packages

# Clean
npm run clean                   # Supprimer tous les node_modules
```

## Technologies

- **Runtime** : Node.js 18+
- **Langage** : TypeScript 5.3
- **API** : Express
- **Queues** : BullMQ + Redis
- **Database** : PostgreSQL + Prisma (Phase 2+)
- **Storage** : S3-compatible (Phase 2+)

## Support

Pour toute question ou problème, consulter la documentation ou créer une issue.

---

**Made with ❤️ from Saudi Arabia** 🇸🇦
