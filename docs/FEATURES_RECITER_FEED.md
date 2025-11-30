# Features Produit : Reciter, Likes, Feed

Ce document décrit les nouvelles fonctionnalités produit ajoutées au backend Tilawa.

## 🎯 Vue d'ensemble

**3 features ajoutées** :
1. ✅ Profils réciteurs publics
2. ✅ Système de likes
3. ✅ Feed des récitations approuvées

---

## 📦 BLOC 1 : RECITER (Profils publics)

### Modèle Prisma

Ajout de champs au modèle `Reciter` :
- `displayName` (String, requis)
- `avatarUrl` (String, optionnel)

### Domaine créé

**Package** : `@tilawa/domain-reciter`

**Services** :
- `ReciterService.getReciterById(reciterId)` - Récupérer un profil par ID
- `ReciterService.getReciterByUserId(userId)` - Récupérer le profil d'un utilisateur

**Repository** :
- `ReciterRepository` avec CRUD basique

### Endpoints API

#### `GET /api/v1/reciters/:id` (Public)

Récupère un profil réciteur public.

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": "reciter-123",
    "displayName": "Sheikh Ahmed",
    "bio": "Réciteur professionnel...",
    "avatarUrl": "https://...",
    "country": "MA",
    "verified": true,
    "stats": {
      "totalRecitations": 42,
      "totalLikes": 1250,
      "totalFollowers": 350
    },
    "createdAt": "2024-11-30T..."
  }
}
```

#### `GET /api/v1/reciters/me` (Authentifié)

Récupère le profil du réciteur connecté.

**Headers** : `Authorization: Bearer <token>`

**Réponse** : Même format que ci-dessus

---

## 💙 BLOC 2 : ENGAGEMENT (Likes)

### Modèle Prisma

Table `Like` (déjà existante) :
- `userId` + `recitationId` (contrainte d'unicité)
- `createdAt`

### Domaine créé

**Package** : `@tilawa/domain-engagement`

**Services** :
- `EngagementService.likeRecitation(userId, recitationId)` - Liker
- `EngagementService.unlikeRecitation(userId, recitationId)` - Déliker
- `EngagementService.getLikesCount(recitationId)` - Compter les likes
- `EngagementService.getEngagementStats(recitationId)` - Stats complètes

**Repository** :
- `EngagementRepository` avec gestion des likes

### Endpoints API

#### `POST /api/v1/recitations/:id/like` (Authentifié)

Like une récitation.

**Headers** : `Authorization: Bearer <token>`

**Réponse** :
```json
{
  "success": true,
  "message": "Recitation liked successfully"
}
```

**Erreurs** :
- `409 CONFLICT` : Déjà liké

#### `DELETE /api/v1/recitations/:id/like` (Authentifié)

Unlike une récitation.

**Headers** : `Authorization: Bearer <token>`

**Réponse** :
```json
{
  "success": true,
  "message": "Recitation unliked successfully"
}
```

**Erreurs** :
- `404 NOT_FOUND` : Like inexistant

#### `GET /api/v1/recitations/:id/engagement` (Public)

Récupère les stats d'engagement.

**Réponse** :
```json
{
  "success": true,
  "data": {
    "likesCount": 42
  }
}
```

---

## 📰 BLOC 3 : FEED (Récitations approuvées)

### Domaine créé

**Package** : `@tilawa/domain-feed`

**Services** :
- `FeedService.getFeed({ page, pageSize })` - Récupère le feed paginé

**Repository** :
- `FeedRepository.findApprovedRecitations()` - Query optimisée avec réciteur et likes

### Endpoint API

#### `GET /api/v1/feed` (Public)

Récupère le feed des récitations approuvées.

**Query params** :
- `page` (optionnel, default: 1)
- `pageSize` (optionnel, default: 20, max: 100)

**Réponse** :
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "recitation-123",
        "title": "Sourate Al-Fatiha",
        "description": "Belle récitation...",
        "surah": "1",
        "verses": "1-7",
        "language": "ar",
        "audioUrl": "https://...",
        "duration": 180,
        "status": "APPROVED",
        "createdAt": "2024-11-30T...",
        "reciter": {
          "id": "reciter-123",
          "displayName": "Sheikh Ahmed",
          "avatarUrl": "https://...",
          "verified": true
        },
        "engagement": {
          "likesCount": 42
        }
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

**Tri** : Par `createdAt DESC` (plus récentes en premier)

**Filtrage** : Seulement les récitations avec `status = APPROVED`

---

## 🚀 Scénario complet

### 1. Créer un utilisateur

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "reciter@example.com",
    "password": "password123",
    "name": "Sheikh Ahmed"
  }'
```

Sauvegarder le `accessToken`.

### 2. Créer un profil réciteur (manuel en DB pour l'instant)

```sql
INSERT INTO reciters (id, "userId", "displayName", bio, verified)
VALUES (
  'reciter-123',
  '<userId from step 1>',
  'Sheikh Ahmed',
  'Réciteur professionnel depuis 10 ans',
  true
);
```

### 3. Créer une récitation

```bash
TOKEN="<your_token>"

curl -X POST http://localhost:3000/api/v1/recitations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sourate Al-Fatiha",
    "description": "Belle récitation",
    "surah": "1",
    "verses": "1-7",
    "language": "ar"
  }'
```

Sauvegarder le `recitationId`.

### 4. Upload audio

```bash
curl -X POST http://localhost:3000/api/v1/recitations/<recitationId>/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"audioData": "mock-audio"}'
```

### 5. Attendre le traitement (2-3 secondes)

Les workers vont :
- Analyser l'audio
- Modérer
- Passer le statut à `APPROVED` (90% des cas)

### 6. Liker la récitation

```bash
curl -X POST http://localhost:3000/api/v1/recitations/<recitationId>/like \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Voir les stats d'engagement

```bash
curl http://localhost:3000/api/v1/recitations/<recitationId>/engagement
```

### 8. Voir la récitation dans le feed

```bash
curl http://localhost:3000/api/v1/feed?page=1&pageSize=20
```

La récitation devrait apparaître avec :
- Les infos du réciteur
- Le nombre de likes (1)
- Le statut APPROVED

---

## 📊 Architecture

### Nouveaux domaines

```
packages/domain/
├── reciter/          # Profils réciteurs
├── engagement/       # Likes, comments (futur)
└── feed/             # Feed des récitations
```

### Nouveaux repositories

```
packages/infra/database/src/repositories/
├── ReciterRepository.ts
├── EngagementRepository.ts
└── FeedRepository.ts
```

### Nouvelles routes API

```
apps/api/src/modules/
├── reciter/
│   ├── reciter.routes.ts
│   └── validation.ts
├── feed/
│   ├── feed.routes.ts
│   └── validation.ts
└── recitation/
    └── recitation.routes.ts  # Enrichi avec likes
```

---

## 🗄️ Migrations Prisma

### Mettre à jour le schema

Le schema Prisma a été modifié :
- Ajout de `displayName` et `avatarUrl` au modèle `Reciter`

### Appliquer les migrations

```bash
# Générer et appliquer
npx prisma db push --schema=./packages/infra/database/prisma/schema.prisma

# Ou créer une migration
npx prisma migrate dev --name add_reciter_display_fields \
  --schema=./packages/infra/database/prisma/schema.prisma
```

---

## ✅ Checklist d'installation

- [ ] Compiler les nouveaux packages : `npm run build:packages`
- [ ] Appliquer les migrations Prisma
- [ ] Redémarrer l'API : `npm run dev:api`
- [ ] Tester les endpoints avec curl
- [ ] Vérifier le feed avec des récitations APPROVED

---

## 🎯 Prochaines étapes (optionnel)

- [ ] Endpoint pour créer/modifier un profil réciteur
- [ ] Système de followers
- [ ] Comments sur les récitations
- [ ] Feed personnalisé (based on follows)
- [ ] Notifications
- [ ] Search & filters dans le feed

---

## 📚 Documentation API complète

Tous les endpoints sont documentés dans :
- `GET /api/v1` - Liste des endpoints disponibles
- `GET /health` - Health check
- `GET /metrics` - Métriques Prometheus

**Le backend Tilawa dispose maintenant de features produit visibles ! 🎉**
