# Vertical Slice Demo: First Recitation Flow

Ce document explique comment tester le flux complet de création et publication d'une récitation sur Tilawa.

## Prérequis

### 1. Services requis

- **PostgreSQL** : Base de données principale
- **Redis** : Pour les queues BullMQ

### 2. Installation

```bash
# Installer les dépendances
npm install

# Générer le client Prisma
npx prisma generate --schema=./packages/infra/database/prisma/schema.prisma

# Créer la base de données et appliquer les migrations
npx prisma db push --schema=./packages/infra/database/prisma/schema.prisma
```

### 3. Configuration

Créer un fichier `.env` à la racine :

```env
NODE_ENV=development
API_PORT=3000

DATABASE_URL=postgresql://tilawa:tilawa@localhost:5432/tilawa_db
REDIS_URL=redis://localhost:6379

JWT_SECRET=dev-secret-change-in-production-2024
JWT_EXPIRES_IN=7d

S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_BUCKET=tilawa-recitations
```

## Démarrage des services

Ouvrir **3 terminaux** :

### Terminal 1 : API Server
```bash
npm run dev:api
```

### Terminal 2 : Audio Worker
```bash
npm run dev:audio-worker
```

### Terminal 3 : Moderation Worker
```bash
npm run dev:moderation-worker
```

## Flux complet

### Étape 1 : Inscription d'un utilisateur

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "reciter@tilawa.com",
    "password": "password123",
    "name": "Sheikh Ahmed"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clxxx...",
      "email": "reciter@tilawa.com",
      "name": "Sheikh Ahmed",
      "role": "USER"
    }
  }
}
```

**Sauvegarder le token** pour les prochaines requêtes.

### Étape 2 : Connexion (optionnel)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "reciter@tilawa.com",
    "password": "password123"
  }'
```

### Étape 3 : Vérifier l'utilisateur connecté

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Étape 4 : Créer une récitation (brouillon)

```bash
curl -X POST http://localhost:3000/api/v1/recitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Sourate Al-Fatiha",
    "description": "Récitation de la sourate Al-Fatiha",
    "surah": "1",
    "verses": "1-7",
    "language": "ar"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": "clyyy...",
    "title": "Sourate Al-Fatiha",
    "surah": "1",
    "verses": "1-7",
    "status": "DRAFT",
    "createdAt": "2024-11-30T..."
  }
}
```

**Sauvegarder l'ID** de la récitation.

### Étape 5 : Upload audio (simulé)

```bash
curl -X POST http://localhost:3000/api/v1/recitations/RECITATION_ID/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "audioData": "base64_encoded_audio_data_here"
  }'
```

**Ce qui se passe :**
1. Le fichier est "uploadé" vers le storage (mocké)
2. Le statut passe à `UPLOADED`
3. Un job est envoyé à la queue `audio-process`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": "clyyy...",
    "status": "UPLOADED",
    "audioUrl": "https://tilawa-storage.s3.amazonaws.com/recitations/..."
  }
}
```

### Étape 6 : Observer le traitement automatique

**Dans le terminal de l'Audio Worker**, vous devriez voir :
```
[Audio Analysis] Processing recitation: clyyy...
[Audio Analysis] Analyzing audio quality...
[Audio Analysis] Running deepfake detection...
[Audio Analysis] ✅ Completed for recitation: clyyy...
[Audio Worker] ✅ Updated DB for recitation: clyyy...
[Audio Worker] Sent to moderation queue: clyyy...
```

**Dans le terminal du Moderation Worker**, vous devriez voir :
```
[Moderation] Processing recitation: clyyy...
[Moderation] Checking deepfake score: 0.05
[Moderation] Verifying Qur'an authenticity...
[Moderation] Tagging kids-safe status...
[Moderation] ✅ Decision: APPROVED - All checks passed
[Moderation Worker] ✅ Updated DB for recitation: clyyy...
[Moderation Worker] Decision: APPROVED, Kids-safe: true
```

**⏱️ Attendre 2-3 secondes** que les workers terminent le traitement.

### Étape 7 : Vérifier le statut final (IMPORTANT)

```bash
curl -X GET http://localhost:3000/api/v1/recitations/RECITATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Réponse attendue (après traitement) :**
```json
{
  "success": true,
  "data": {
    "id": "clyyy...",
    "title": "Sourate Al-Fatiha",
    "surah": "1",
    "verses": "1-7",
    "status": "APPROVED",              ← Statut mis à jour !
    "audioUrl": "https://tilawa-storage.s3.amazonaws.com/...",
    "duration": 180,                    ← Durée persistée !
    "createdAt": "2024-11-30T...",
    "updatedAt": "2024-11-30T...",
    "user": {
      "id": "clxxx...",
      "name": "Sheikh Ahmed"
    }
  }
}
```

**✅ Le statut est maintenant `APPROVED` (ou `REJECTED` dans 10% des cas) !**

Les données suivantes sont maintenant persistées en base :
- **Table `recitations`** : `status` = APPROVED/REJECTED, `duration` = 180
- **Table `audio_analyses`** : `duration`, `quality`, `deepfakeScore`
- **Table `moderation_logs`** : `decision`, `reason`, `kidsSafe`, `moderatedAt`

## Statuts de récitation

Le cycle de vie d'une récitation (tous persistés en base PostgreSQL) :

1. **DRAFT** : Créée mais pas encore uploadée
2. **UPLOADED** : Audio uploadé, en attente de traitement
3. **PROCESSING** : En cours d'analyse audio (optionnel)
4. **PENDING_MODERATION** : ✅ Analyse terminée, en attente de modération
5. **APPROVED** : ✅ Approuvée par la modération (90% des cas)
6. **PUBLISHED** : Publiée et visible publiquement (futur)
7. **REJECTED** : ✅ Rejetée par la modération (10% des cas)

**Pipeline actuel :**
```
DRAFT → UPLOADED → PENDING_MODERATION → APPROVED/REJECTED
         ↓              ↓                    ↓
      (API)      (Audio Worker)      (Moderation Worker)
```

## Cas de rejet

Si le score deepfake est élevé (> 0.3) ou si la modération détecte un problème, le statut sera `REJECTED`.

Pour simuler un rejet, le moderation worker a 10% de chance de rejeter aléatoirement.

## Dépannage

### La base de données n'existe pas
```bash
# Créer la base de données
createdb tilawa_db

# Ou avec Docker
docker run -d \
  --name tilawa-postgres \
  -e POSTGRES_USER=tilawa \
  -e POSTGRES_PASSWORD=tilawa \
  -e POSTGRES_DB=tilawa_db \
  -p 5432:5432 \
  postgres:15-alpine
```

### Redis n'est pas démarré
```bash
# Avec Docker
docker run -d -p 6379:6379 redis:7-alpine

# Ou avec Homebrew (macOS)
brew services start redis
```

### Les workers ne traitent pas les jobs
- Vérifier que Redis est accessible
- Vérifier les logs des workers
- Vérifier que les noms de queues correspondent (`audio-process`, `moderation-analyze`)

## Architecture du flux

```
User
  ↓
[API] POST /auth/register → Crée utilisateur
  ↓                          └→ [DB] INSERT users
[API] POST /recitations → Crée récitation (DRAFT)
  ↓                        └→ [DB] INSERT recitations (status=DRAFT)
[API] POST /recitations/:id/upload → Upload audio (UPLOADED)
  ↓                                   └→ [DB] UPDATE recitations (status=UPLOADED)
[Queue] audio-process → Job envoyé
  ↓
[Audio Worker] → Analyse audio + deepfake
  ↓              └→ [DB] UPDATE recitations (status=PENDING_MODERATION, duration)
  ↓              └→ [DB] INSERT audio_analyses (quality, deepfakeScore)
[Queue] moderation-analyze → Job envoyé
  ↓
[Moderation Worker] → Modération + kids-safe
  ↓                   └→ [DB] UPDATE recitations (status=APPROVED/REJECTED)
  ↓                   └→ [DB] INSERT moderation_logs (decision, reason, kidsSafe)
[Database] → Statut final persisté ✅
```

**Toutes les étapes sont maintenant persistées en base PostgreSQL !**

## Prochaines étapes

- Implémenter le vrai upload S3
- Intégrer les vrais services d'IA (Whisper, deepfake detection)
- Ajouter la publication manuelle (APPROVED → PUBLISHED)
- Implémenter les endpoints d'engagement (likes, comments)
- Ajouter le système de tipping
